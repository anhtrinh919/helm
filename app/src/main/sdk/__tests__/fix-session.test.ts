import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { SessionCallbacks, SessionHandle, StartSessionOptions } from '../session-runner'

/**
 * Group 4 — fix-session orchestration: register a point, start a fix (or queue
 * it), approve → preview restart + queue advance, reject → same session retries.
 * Drives the real helm handlers over the hybrid-runtime transport bus, the same
 * harness as the contract-flow suite.
 */

import { bus } from '../../core/transport'

/** Bus-backed stand-in for the old electron `handlers` map (has/get/clear). */
const handlers = {
  has: (ch: string): boolean => bus.has(ch),
  get: (ch: string) => (_e: unknown, raw: unknown) => bus.invoke(ch, raw),
  clear: (): void => bus.reset(),
}

import { openDatabase, type Db } from '../../db/connection'
import { createProject } from '../../db/projects'
import { createCard, getCard } from '../../db/cards'
import { getSession } from '../../db/sessions'
import { getEvents } from '../../db/feed-events'
import { getFixComment } from '../../db/fix-comments'
import { SessionOrchestrator } from '../session-orchestrator'
import { DevServerManager, type DevServerDeps } from '../dev-server-manager'
import { PointCaptureService, type GuestView } from '../point-capture-service'
import { registerDataBridge } from '../../ipc/data-bridge'
import { registerPointsBridge } from '../../ipc/points-bridge'
import { CH } from '../../../shared/ipc-schemas'

const RECT = { x: 10, y: 20, width: 120, height: 40 }
const resultSuccess = (): SDKMessage => ({ type: 'result', subtype: 'success' }) as unknown as SDKMessage

/** Multi-session fake runner: records every started run + its options. */
function fakeRunner(): {
  runner: (o: StartSessionOptions, cb: SessionCallbacks) => SessionHandle
  runs: { opts: StartSessionOptions; cb: SessionCallbacks }[]
  last: () => { opts: StartSessionOptions; cb: SessionCallbacks }
} {
  const runs: { opts: StartSessionOptions; cb: SessionCallbacks }[] = []
  const runner = (opts: StartSessionOptions, cb: SessionCallbacks): SessionHandle => {
    runs.push({ opts, cb })
    return { id: `fake-${runs.length}`, steer: async () => {}, reply: () => {}, close: async () => {} }
  }
  return { runner, runs, last: () => runs[runs.length - 1]! }
}

function fakeDevDeps(): DevServerDeps & { restarts: string[] } {
  const restarts: string[] = []
  return {
    restarts,
    readManifest: () => ({ startCommand: 'npm run dev', port: 4444 }),
    spawnServer: (_c, m) => {
      restarts.push('spawn')
      return { pid: 7, url: `http://localhost:${m.port}`, kill: () => {}, onExit: () => {} }
    },
    probe: async () => true,
    pidAlive: () => true,
  }
}

function fakeGuest(): GuestView & { emitConsole: (line: string) => void } {
  const subs = new Set<(line: string) => void>()
  return {
    emitConsole: (line) => subs.forEach((cb) => cb(line)),
    executeJavaScript: async () => undefined,
    captureRegion: async () => 'Y3JvcA==',
    onConsole: (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
  }
}

const call = async (ch: string, payload?: unknown): Promise<any> => handlers.get(ch)!({}, payload)

let db: Db
let fr: ReturnType<typeof fakeRunner>
let devDeps: ReturnType<typeof fakeDevDeps>
let devServer: DevServerManager
let orch: SessionOrchestrator
let guest: ReturnType<typeof fakeGuest>
let capture: PointCaptureService
let captures: unknown[]
let projectId: string

beforeEach(() => {
  handlers.clear()
  db = openDatabase(':memory:')
  fr = fakeRunner()
  devDeps = fakeDevDeps()
  devServer = new DevServerManager(db, () => {}, devDeps, '/tmp/helm-fix-tests')
  orch = new SessionOrchestrator(db, () => null, fr.runner, devServer)
  guest = fakeGuest()
  captures = []
  capture = new PointCaptureService(
    {
      listGuests: () => [{ url: 'http://localhost:4444/', view: guest }],
      previewUrl: (pid) => {
        const s = devServer.getState(pid)
        return s.status === 'live' ? s.url : null
      },
    },
    (pid, g) => captures.push({ pid, g }),
    () => {},
  )
  registerDataBridge(db, () => null, { orchestrator: orch })
  registerPointsBridge(db, { capture, devServer, orchestrator: orch, getWindow: () => null })

  const p = createProject(db, 'FixProj')
  projectId = p.id
})

/** Bring the project's preview to `live` so point-and-fix is allowed. */
async function goLive(): Promise<void> {
  devServer.ensureArtifactDir(projectId)
  await devServer.start(projectId)
}

/** Make the guest report a click so main holds a pending capture (the REAL
 *  path — the selector + crop never appear in the renderer's request). */
async function clickGuest(selector = 'main > button#submit'): Promise<void> {
  capture.activate(projectId)
  const before = captures.length
  guest.emitConsole(
    '__HELM_POINT__' + JSON.stringify({ selector, rect: RECT, px: 0.42, py: 0.61 }),
  )
  await vi.waitFor(() => expect(captures.length).toBe(before + 1))
}

/** File a comment. Element-level registers (the default) first drive the real
 *  guest-click capture when the preview is live; the request itself carries
 *  GEOMETRY ONLY. Override pinX/boundingBox to undefined for page-level. */
async function register(over: Record<string, unknown> = {}): Promise<any> {
  const isElement = !('pinX' in over) || over.pinX != null
  if (isElement && devServer.getState(projectId).status === 'live') await clickGuest()
  return call(CH.pointsRegister, {
    projectId,
    boundingBox: RECT,
    pinX: 0.42,
    pinY: 0.61,
    note: 'This button looks broken',
    noteType: 'bug',
    ...over,
  })
}

describe('points:register', () => {
  it('creates a waiting fix-comment card paired with its visual context', async () => {
    await goLive()
    const res = await register()
    expect(res.card).toMatchObject({
      type: 'fix_comment',
      status: 'waiting',
      title: 'This button looks broken',
      noteType: 'bug', // the card describes itself — no pin-feed join needed
      pageLevel: false,
    })
    const fix = getFixComment(db, res.card.id)
    expect(fix.selector).toBe('main > button#submit')
    expect(fix.screenshotCrop).toBe('Y3JvcA==')
    expect(fix.pinX).toBeCloseTo(0.42)
  })

  it('rejects when the preview is not live', async () => {
    expect(await register()).toEqual({ error: 'preview_not_live' })
  })

  it('rejects an empty note as validation_failed', async () => {
    await goLive()
    const res = await register({ note: '' })
    expect(res.error).toBe('validation_failed')
  })

  it('unknown project → not_found', async () => {
    expect(await register({ projectId: 'nope' })).toEqual({ error: 'not_found' })
  })

  it('merges the pending capture when the renderer sends geometry only', async () => {
    await goLive()
    await clickGuest('nav > a:nth-of-type(2)')
    const res = await call(CH.pointsRegister, {
      projectId,
      boundingBox: RECT,
      pinX: 0.5,
      pinY: 0.25,
      note: 'This link is wrong',
      noteType: 'bug',
    })
    const fix = getFixComment(db, res.card.id)
    expect(fix.selector).toBe('nav > a:nth-of-type(2)')
    expect(fix.screenshotCrop).toBe('Y3JvcA==')
  })

  it('browser-proxy path: an explicit request selector anchors the fix without a pending capture', async () => {
    await goLive()
    // No guest click happened — there is NO main-side pending capture. The browser
    // proxy path carries the proxy-exposed selector in the request directly, and
    // the bridge anchors to it (FIX 1). The screenshot crop is still impossible to
    // supply from the renderer (no such schema field).
    const res = await call(CH.pointsRegister, {
      projectId,
      selector: 'main > button#browser',
      screenshotCrop: 'ZXZpbA==', // not a schema field — silently dropped
      boundingBox: RECT,
      pinX: 0.42,
      pinY: 0.61,
      note: 'Browser-path fix',
      noteType: 'bug',
    })
    const fix = getFixComment(db, res.card.id)
    expect(fix.selector).toBe('main > button#browser')
    expect(fix.screenshotCrop).toBeNull()
  })

  it('the request selector skips the main-side pending-capture merge', async () => {
    await goLive()
    // Even if a pending Electron capture exists, an explicit request selector
    // wins and the pending capture is NOT consumed (browser path is self-contained).
    await clickGuest('main > button#submit') // leaves a pending capture in main
    const res = await call(CH.pointsRegister, {
      projectId,
      selector: 'section > h2',
      boundingBox: RECT,
      pinX: 0.42,
      pinY: 0.61,
      note: 'Explicit selector wins',
      noteType: 'change',
    })
    const fix = getFixComment(db, res.card.id)
    expect(fix.selector).toBe('section > h2')
    // The pending capture was left untouched (no screenshot merged in).
    expect(fix.screenshotCrop).toBeNull()
  })

  it('page-level comment stores no visual context', async () => {
    await goLive()
    const res = await register({
      boundingBox: undefined,
      pinX: undefined,
      pinY: undefined,
      note: 'This page feels cramped',
      noteType: 'change',
    })
    const fix = getFixComment(db, res.card.id)
    expect(fix.selector).toBeNull()
    expect(fix.pinX).toBeNull()
  })
})

describe('fix-sessions:start', () => {
  it('starts the fix: session opens, card → building, prompt carries the visual context', async () => {
    await goLive()
    const { card } = await register()
    const res = await call(CH.fixSessionsStart, { projectId, cardId: card.id })
    expect(res.queued).toBe(false)
    expect(res.session).toBeTruthy()
    expect(getCard(db, card.id).status).toBe('building')
    expect(getSession(db, res.session.id).status).toBe('active')
    const prompt = fr.last().opts.prompt
    expect(prompt).toContain('This button looks broken')
    expect(prompt).toContain('main > button#submit')
    expect(prompt).toContain('Fix ONLY this')
    expect(fr.last().opts.permissionMode).toBe('bypassPermissions')
  })

  it('Phase 4: a second start while one runs starts in parallel immediately', async () => {
    await goLive()
    const { card: c1 } = await register()
    const { card: c2 } = await register({ note: 'Header is too dark', noteType: 'change' })
    await call(CH.fixSessionsStart, { projectId, cardId: c1.id })
    const res = await call(CH.fixSessionsStart, { projectId, cardId: c2.id })
    expect(res.queued).toBe(false)
    expect(res.session).toBeTruthy()
    // both cards building simultaneously
    expect(getCard(db, c1.id).status).toBe('building')
    expect(getCard(db, c2.id).status).toBe('building')
  })

  it('non-fix cards and unknown cards → not_found', async () => {
    await goLive()
    const feature = createCard(db, projectId, 'feature', 'X')
    expect(await call(CH.fixSessionsStart, { projectId, cardId: feature.id })).toEqual({ error: 'not_found' })
    expect(await call(CH.fixSessionsStart, { projectId, cardId: 'nope' })).toEqual({ error: 'not_found' })
  })

  it('a card without its fix record → no_visual_context', async () => {
    await goLive()
    const bare = createCard(db, projectId, 'fix_comment', 'orphan', 'user_added', 'waiting')
    expect(await call(CH.fixSessionsStart, { projectId, cardId: bare.id })).toEqual({
      error: 'no_visual_context',
    })
  })

  it('an already-finished card → not_waiting', async () => {
    await goLive()
    const { card } = await register()
    await call(CH.fixSessionsStart, { projectId, cardId: card.id })
    expect(await call(CH.fixSessionsStart, { projectId, cardId: card.id })).toEqual({
      error: 'not_waiting',
    })
  })
})

describe('checkpoint approve / reject for fix sessions', () => {
  async function startAndFinishFix(): Promise<{ cardId: string; sessionId: string }> {
    const { card } = await register()
    const res = await call(CH.fixSessionsStart, { projectId, cardId: card.id })
    fr.last().cb.onMessage(resultSuccess())
    fr.last().cb.onClose()
    return { cardId: card.id, sessionId: res.session.id }
  }

  it('the fix runs to a fix-flavored checkpoint', async () => {
    await goLive()
    const { cardId, sessionId } = await startAndFinishFix()
    const card = getCard(db, cardId)
    expect(card.checkpoint?.status).toBe('pending')
    expect(card.status).toBe('building')
    const events = getEvents(db, sessionId)
    expect(events.some((e) => e.kind === 'checkpoint' && e.text.includes('the fix'))).toBe(true)
  })

  it('approve: card → done, preview restarts', async () => {
    await goLive()
    const { cardId } = await startAndFinishFix()
    const spawnsBefore = devDeps.restarts.length

    await call(CH.cardsApproveCheckpoint, { cardId, verdict: 'approved' })
    expect(getCard(db, cardId).status).toBe('done')

    await vi.waitFor(() => {
      expect(devDeps.restarts.length).toBeGreaterThan(spawnsBefore) // preview refreshed
    })
  })

  it('reject: the session retries with the note, then reaches a new checkpoint', async () => {
    await goLive()
    const { cardId, sessionId } = await startAndFinishFix()
    const runsBefore = fr.runs.length

    await call(CH.cardsApproveCheckpoint, {
      cardId,
      verdict: 'flagged',
      flagNote: 'Still looks wrong on hover',
    })

    expect(fr.runs.length).toBe(runsBefore + 1) // fresh engine run, same session row
    expect(fr.last().opts.prompt).toContain('Still looks wrong on hover')
    expect(getSession(db, sessionId).status).toBe('active')
    expect(getCard(db, cardId).status).toBe('building')
    const events = getEvents(db, sessionId)
    expect(events.some((e) => e.kind === 'steering' && e.text.includes('Still looks wrong'))).toBe(true)

    // The retry finishes → a NEW pending checkpoint on the same card.
    fr.last().cb.onMessage(resultSuccess())
    fr.last().cb.onClose()
    expect(getCard(db, cardId).checkpoint?.status).toBe('pending')
  })

  it('Phase 4: a failed fix does not affect parallel running fixes', async () => {
    await goLive()
    const { card: c1 } = await register()
    const { card: c2 } = await register({ note: 'Second thing', noteType: 'bug' })
    await call(CH.fixSessionsStart, { projectId, cardId: c1.id })
    await call(CH.fixSessionsStart, { projectId, cardId: c2.id }) // both start immediately
    expect(getCard(db, c1.id).status).toBe('building')
    expect(getCard(db, c2.id).status).toBe('building')

    // c1 fails — c2 keeps running independently
    fr.runs[0]!.cb.onError('boom')
    expect(getCard(db, c1.id).status).toBe('failed')
    expect(getCard(db, c2.id).status).toBe('building')
  })
})

describe('points:register-text-edit (Group 5 — inline text edit)', () => {
  /** Drive the real guest so main holds a pending text-edit, then register it. */
  async function commitEdit(newText = 'New heading', oldText = 'Old heading'): Promise<void> {
    capture.activateTextEdit(projectId)
    guest.emitConsole(
      '__HELM_TEXTEDIT__' + JSON.stringify({ selector: 'main > h1', oldText, newText }),
    )
    await new Promise((r) => setTimeout(r, 5))
  }

  it('registering an edit produces a fix_comment card carrying selector + change instruction, and spawns the fix', async () => {
    await goLive()
    await commitEdit('New heading', 'Old heading')
    const res = await call(CH.pointsRegisterTextEdit, {
      projectId,
      selector: 'main > h1',
      oldText: 'Old heading',
      newText: 'New heading',
    })
    expect(res.card).toMatchObject({ type: 'fix_comment', status: 'building', noteType: 'change' })
    expect(res.card.title).toContain('Old heading')
    expect(res.card.title).toContain('New heading')
    const fix = getFixComment(db, res.card.id)
    expect(fix.selector).toBe('main > h1')
    // The fix session was actually spawned through the existing pipeline.
    const prompt = fr.last().opts.prompt
    expect(prompt).toContain('New heading')
    expect(getSession(db, res.card.sessionId!).status).toBe('active')
  })

  it('identical text → no_change (no card created)', async () => {
    await goLive()
    const res = await call(CH.pointsRegisterTextEdit, {
      projectId,
      selector: 'main > h1',
      oldText: 'Same',
      newText: 'Same',
    })
    expect(res).toEqual({ error: 'no_change' })
  })

  it('whitespace-only newText → invalid_input', async () => {
    await goLive()
    const res = await call(CH.pointsRegisterTextEdit, {
      projectId,
      selector: 'main > h1',
      oldText: 'Old',
      newText: '   ',
    })
    expect(res).toEqual({ error: 'invalid_input' })
  })

  it('preview not live → preview_not_live', async () => {
    const res = await call(CH.pointsRegisterTextEdit, {
      projectId,
      selector: 'main > h1',
      oldText: 'Old',
      newText: 'New',
    })
    expect(res).toEqual({ error: 'preview_not_live' })
  })

  it('unknown project → not_found', async () => {
    const res = await call(CH.pointsRegisterTextEdit, {
      projectId: 'nope',
      selector: 'main > h1',
      oldText: 'Old',
      newText: 'New',
    })
    expect(res).toEqual({ error: 'not_found' })
  })

  it('activate when preview not live → webview_not_ready', async () => {
    expect(await call(CH.pointsTextEditActivate, { projectId })).toEqual({
      error: 'webview_not_ready',
    })
  })

  it('a spawn failure rolls the just-created card back (no orphan) → session_error', async () => {
    // Point the orchestrator at a dev manager whose artifact dir cannot be made,
    // so startFix throws → the handler must delete the card it just created.
    const { writeFileSync, mkdtempSync } = await import('node:fs')
    const { join } = await import('node:path')
    const { tmpdir } = await import('node:os')
    const dir = mkdtempSync(join(tmpdir(), 'helm-te-'))
    const blocker = join(dir, 'not-a-dir')
    writeFileSync(blocker, 'x')
    const badDev = new DevServerManager(db, () => {}, devDeps, join(blocker, 'projects'))
    const badOrch = new SessionOrchestrator(db, () => null, fr.runner, badDev)
    handlers.clear()
    registerPointsBridge(db, { capture, devServer, orchestrator: badOrch, getWindow: () => null })
    await goLive()
    db.prepare('UPDATE projects SET artifact_dir = NULL WHERE id = ?').run(projectId)

    const cardsBefore = (db.prepare('SELECT COUNT(*) AS n FROM cards WHERE project_id = ?').get(projectId) as { n: number }).n
    const res = await call(CH.pointsRegisterTextEdit, {
      projectId,
      selector: 'main > h1',
      oldText: 'Old',
      newText: 'New',
    })
    expect(res).toEqual({ error: 'session_error' })
    const cardsAfter = (db.prepare('SELECT COUNT(*) AS n FROM cards WHERE project_id = ?').get(projectId) as { n: number }).n
    expect(cardsAfter).toBe(cardsBefore) // rolled back — no orphan
    const orphanFix = db.prepare('SELECT COUNT(*) AS n FROM fix_comments WHERE project_id = ?').get(projectId) as { n: number }
    expect(orphanFix.n).toBe(0)
  })
})

describe('remaining contract errors + push shapes (Stage 4)', () => {
  it('points:list on a missing project → not_found', async () => {
    expect(await call(CH.pointsList, { projectId: 'nope' })).toEqual({ error: 'not_found' })
  })

  it('fix-sessions:start surfaces artifact_dir_failed when the working dir cannot be created', async () => {
    const { writeFileSync, mkdtempSync } = await import('node:fs')
    const { join } = await import('node:path')
    const { tmpdir } = await import('node:os')
    // artifactRoot pointing INSIDE a regular file → mkdir fails with ENOTDIR.
    const dir = mkdtempSync(join(tmpdir(), 'helm-fix-'))
    const blocker = join(dir, 'not-a-dir')
    writeFileSync(blocker, 'x')
    const badDev = new DevServerManager(db, () => {}, devDeps, join(blocker, 'projects'))
    const badOrch = new SessionOrchestrator(db, () => null, fr.runner, badDev)
    handlers.clear()
    registerPointsBridge(db, { capture, devServer, orchestrator: badOrch, getWindow: () => null })
    await goLive()
    const { card } = await register()
    // goLive persisted a working artifact dir — clear it so badDev must mkdir
    // under the blocker file and hit ENOTDIR.
    db.prepare('UPDATE projects SET artifact_dir = NULL WHERE id = ?').run(projectId)
    const res = await call(CH.fixSessionsStart, { projectId, cardId: card.id })
    expect(res.error).toBe('artifact_dir_failed')
  })

  it('points:register pushes board:update and a full points:update pin list', async () => {
    const sends: { channel: string; payload: unknown }[] = []
    const fakeWindow = {
      isDestroyed: () => false,
      webContents: { send: (channel: string, payload: unknown) => sends.push({ channel, payload }) },
    }
    handlers.clear()
    registerPointsBridge(db, {
      capture,
      devServer,
      orchestrator: orch,
      getWindow: () => fakeWindow as never,
    })
    await goLive()
    const { card } = await register()
    const board = sends.find((s) => s.channel === CH.boardUpdate)
    expect(board?.payload).toMatchObject({ projectId, cardId: card.id })
    const pins = sends.find((s) => s.channel === CH.pointsUpdate) as
      | { payload: { pins: unknown[]; queuedCardIds: string[] } }
      | undefined
    expect(pins?.payload.pins).toHaveLength(1)
    expect(pins?.payload.pins[0]).toMatchObject({ cardId: card.id, noteType: 'bug' })
    expect(pins?.payload.queuedCardIds).toEqual([])
    expect(JSON.stringify(pins?.payload)).not.toContain('screenshot')
    expect(JSON.stringify(pins?.payload)).not.toContain('selector')
  })

  it('Phase 4: queuedCardIds is always empty (no queue — parallel starts)', async () => {
    const sends: { channel: string; payload: { projectId?: string; queuedCardIds?: string[] } }[] = []
    const fakeWindow = {
      isDestroyed: () => false,
      webContents: { send: (channel: string, payload: never) => sends.push({ channel, payload }) },
    }
    handlers.clear()
    const pushOrch = new SessionOrchestrator(db, () => fakeWindow as never, fr.runner, devServer)
    registerDataBridge(db, () => fakeWindow as never, { orchestrator: pushOrch })
    registerPointsBridge(db, { capture, devServer, orchestrator: pushOrch, getWindow: () => fakeWindow as never })
    await goLive()
    const { card: c1 } = await register()
    const { card: c2 } = await register({ note: 'Header is too dark', noteType: 'change' })
    await call(CH.fixSessionsStart, { projectId, cardId: c1.id })
    await call(CH.fixSessionsStart, { projectId, cardId: c2.id }) // starts immediately

    // All pointsUpdate pushes should have empty queuedCardIds
    const pushes = sends.filter((s) => s.channel === CH.pointsUpdate)
    for (const p of pushes) {
      expect(p.payload.queuedCardIds).toEqual([])
    }
  })
})
