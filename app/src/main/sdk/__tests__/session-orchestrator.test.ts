import { describe, expect, it, beforeEach } from 'vitest'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { openDatabase, type Db } from '../../db/connection'
import { createProject } from '../../db/projects'
import { createCard, getCard } from '../../db/cards'
import { getSession } from '../../db/sessions'
import { getEvents } from '../../db/feed-events'
import { createQuestion, listQuestions } from '../../db/question-queue'
import { getLatestBuildStep } from '../../db/build-steps'
import { getArtifactDir } from '../../db/projects'
import { SessionOrchestrator } from '../session-orchestrator'
import {
  DevServerManager,
  type DevServerDeps,
  type SpawnedServer,
} from '../dev-server-manager'
import type { SessionCallbacks, SessionHandle, StartSessionOptions } from '../session-runner'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** A runner stand-in: captures the orchestrator's callbacks so the test drives them. */
function fakeRunner(): {
  runner: (o: StartSessionOptions, cb: SessionCallbacks) => SessionHandle
  cb: () => SessionCallbacks
  steerCalls: [string, string][]
  replyCalls: string[]
} {
  let captured: SessionCallbacks | null = null
  const steerCalls: [string, string][] = []
  const replyCalls: string[] = []
  const runner = (_o: StartSessionOptions, cb: SessionCallbacks): SessionHandle => {
    captured = cb
    return {
      id: 'fake',
      steer: async (mode, text) => {
        steerCalls.push([mode, text])
      },
      reply: (text) => {
        replyCalls.push(text)
      },
      close: async () => {},
    }
  }
  return { runner, cb: () => captured!, steerCalls, replyCalls }
}

const assistantText = (text: string): SDKMessage =>
  ({ type: 'assistant', message: { content: [{ type: 'text', text }] } }) as unknown as SDKMessage
const assistantTool = (name: string): SDKMessage =>
  ({ type: 'assistant', message: { content: [{ type: 'tool_use', name }] } }) as unknown as SDKMessage
const resultSuccess = (): SDKMessage =>
  ({ type: 'result', subtype: 'success' }) as unknown as SDKMessage

let db: Db
beforeEach(() => {
  db = openDatabase(':memory:')
})

function setup(): { fr: ReturnType<typeof fakeRunner>; orch: SessionOrchestrator; projectId: string; cardId: string } {
  const fr = fakeRunner()
  const orch = new SessionOrchestrator(db, () => null, fr.runner)
  const project = createProject(db, 'P')
  const card = createCard(db, project.id, 'feature', 'Sign-in')
  return { fr, orch, projectId: project.id, cardId: card.id }
}

describe('SessionOrchestrator', () => {
  it('start moves the card to building and opens an active session', () => {
    const { orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    expect(getSession(db, session.id).status).toBe('active')
    expect(getCard(db, cardId).status).toBe('building')
    expect(getCard(db, cardId).sessionId).toBe(session.id)
  })

  it('enforces one Building spotlight per project — a second start throws', () => {
    const { orch, projectId, cardId } = setup()
    const second = createCard(db, projectId, 'feature', 'Reports')
    orch.start(projectId, cardId)
    expect(() => orch.start(projectId, second.id)).toThrow()
    // the second card never entered building
    expect(getCard(db, second.id).status).toBe('planned')
  })

  it('persisted feed survives the live handle (backfill source of truth)', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onMessage(assistantText('Reading the project structure.'))
    // getEvents is what the renderer backfills from on (re)open — it must hold the event.
    const persisted = getEvents(db, session.id)
    expect(persisted.some((e) => e.kind === 'narration' && e.text === 'Reading the project structure.')).toBe(true)
  })

  it('streams narration and activity as user-safe feed events', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onMessage(assistantText('Building the sign-in form.'))
    fr.cb().onMessage(assistantTool('Write'))
    const events = getEvents(db, session.id)
    expect(events.map((e) => [e.kind, e.text])).toEqual([
      ['narration', 'Building the sign-in form.'],
      ['activity', 'Writing some code'],
    ])
  })

  it('a decision marker with options queues a tap-a-button question', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onMessage(assistantText('{"decision":{"question":"CSV or PDF?","options":["CSV","PDF"]}}'))
    const q = listQuestions(db, session.id)[0]
    expect(q.prompt.type).toBe('buttons')
    expect(q.prompt.options).toEqual(['CSV', 'PDF'])
  })

  it('a user Stop ends the session calmly — stopped, not error; card returns to up_next', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onMessage(assistantText('Working on it.'))
    expect(orch.steer(session.id, 'interrupt', '')).toBe(true)
    // the engine aborts -> close (or error) fires; either way it's a clean halt
    fr.cb().onClose()
    expect(getSession(db, session.id).status).toBe('stopped')
    expect(getCard(db, cardId).status).toBe('up_next')
    const events = getEvents(db, session.id)
    expect(events.some((e) => e.kind === 'stopped')).toBe(true)
    expect(events.some((e) => e.kind === 'error')).toBe(false)
    expect(events.some((e) => e.kind === 'checkpoint')).toBe(false)
  })

  it('a Stop followed by an engine error still halts cleanly (no scary error event)', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    orch.steer(session.id, 'interrupt', '')
    fr.cb().onError('aborted')
    expect(getSession(db, session.id).status).toBe('stopped')
    expect(getEvents(db, session.id).some((e) => e.kind === 'error')).toBe(false)
  })

  it('a genuine-decision marker from the engine pauses the build and queues a question', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onMessage(assistantText('{"decision":{"question":"Should sign-in use a password or a magic link?"}}'))

    expect(getSession(db, session.id).status).toBe('paused_for_decision')
    expect(getCard(db, cardId).status).toBe('needs_you')
    const q = getEvents(db, session.id).find((e) => e.kind === 'decision_prompt')
    expect(q?.text).toBe('Should sign-in use a password or a magic link?')
    // the raw JSON never leaks as narration
    expect(getEvents(db, session.id).some((e) => e.kind === 'narration' && e.text.includes('{'))).toBe(false)
  })

  it('suppresses the raw "Done." summary in favor of the checkpoint', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onMessage(resultSuccess())
    expect(getEvents(db, session.id).some((e) => e.kind === 'summary')).toBe(false)
  })

  it('on close: session done, card gets a pending checkpoint, checkpoint event emitted', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onClose()
    expect(getSession(db, session.id).status).toBe('done')
    expect(getCard(db, cardId).checkpoint?.status).toBe('pending')
    const cp = getEvents(db, session.id).find((e) => e.kind === 'checkpoint')
    expect(cp?.refId).toBe(cardId)
  })

  it('on error: session error, card failed, error event — and a later close is ignored', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onError('The engine stopped.')
    fr.cb().onClose() // must not override the failure
    expect(getSession(db, session.id).status).toBe('error')
    expect(getCard(db, cardId).status).toBe('failed')
    const events = getEvents(db, session.id)
    expect(events.some((e) => e.kind === 'error' && e.text === 'The engine stopped.')).toBe(true)
    expect(events.some((e) => e.kind === 'checkpoint')).toBe(false)
  })

  it('steer records a steering event and forwards to the live handle', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    expect(orch.steer(session.id, 'redirect', 'use a magic link')).toBe(true)
    expect(fr.steerCalls).toEqual([['redirect', 'use a magic link']])
    expect(getEvents(db, session.id).some((e) => e.kind === 'steering')).toBe(true)
  })

  it('answerDecision records the answer, resumes the session, and replies to the engine', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    // Drive a real decision so the session is genuinely paused before we answer.
    fr.cb().onMessage(assistantText('{"decision":{"question":"CSV or PDF?"}}'))
    const q = listQuestions(db, session.id)[0]
    orch.answerDecision(session.id, q.id, 'CSV')
    expect(getSession(db, session.id).status).toBe('active')
    expect(getCard(db, cardId).status).toBe('building')
    expect(fr.replyCalls).toEqual(['CSV'])
    expect(getEvents(db, session.id).some((e) => e.text === 'You answered: CSV')).toBe(true)
  })

  it('answerDecision on a session that is not paused for a decision throws', () => {
    const { orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    const q = createQuestion(db, session.id, { type: 'freetext', question: 'CSV or PDF?' }, 0)
    expect(() => orch.answerDecision(session.id, q.id, 'CSV')).toThrow()
  })

  it('steer on an unknown session returns false', () => {
    const { orch } = setup()
    expect(orch.steer('nope', 'interrupt', 'stop')).toBe(false)
  })

  it('reopen re-blocks the build, narrates it, and nudges the engine', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    fr.cb().onMessage(assistantText('{"decision":{"question":"CSV or PDF?"}}'))
    const q = listQuestions(db, session.id)[0]
    orch.answerDecision(session.id, q.id, 'CSV')
    fr.replyCalls.length = 0

    const reopened = orch.reopen(session.id, q.id)
    expect(reopened.status).toBe('reopened')
    expect(getSession(db, session.id).status).toBe('paused_for_decision')
    expect(getCard(db, cardId).status).toBe('needs_you')
    expect(getEvents(db, session.id).some((e) => e.kind === 'narration' && /re-opened/i.test(e.text))).toBe(true)
    expect(fr.replyCalls.length).toBe(1)
  })

  it('reopen of a still-pending question throws', () => {
    const { orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    const q = createQuestion(db, session.id, { type: 'freetext', question: 'Pending?' }, 0)
    expect(() => orch.reopen(session.id, q.id)).toThrow()
  })
})

/* ---- Phase 2: real-pipeline path (DevServerManager injected) ---- */

/** A runner that captures the options it was started with (cwd, tools, mode). */
function capturingRunner(): {
  runner: Runner
  cb: () => SessionCallbacks
  lastOpts: () => StartSessionOptions
} {
  let captured: SessionCallbacks | null = null
  let opts: StartSessionOptions | null = null
  const runner = (o: StartSessionOptions, cb: SessionCallbacks): SessionHandle => {
    opts = o
    captured = cb
    return { id: 'fake', steer: async () => {}, reply: () => {}, close: async () => {} }
  }
  return { runner, cb: () => captured!, lastOpts: () => opts! }
}
type Runner = (o: StartSessionOptions, cb: SessionCallbacks) => SessionHandle

function fakeDevServerDeps(): DevServerDeps {
  return {
    readManifest: () => ({ startCommand: 'npm run dev', port: 3000 }),
    spawnServer: (_cwd, manifest): SpawnedServer => ({
      pid: 4242,
      url: `http://localhost:${manifest.port}`,
      kill: () => {},
      onExit: () => {},
    }),
    probe: async () => true,
    pidAlive: () => true,
  }
}

describe('SessionOrchestrator — real pipeline', () => {
  function setupReal() {
    const fr = capturingRunner()
    const states: string[] = []
    const root = mkdtempSync(join(tmpdir(), 'helm-test-'))
    const devServer = new DevServerManager(db, (_p, s) => states.push(s.status), fakeDevServerDeps(), root)
    const orch = new SessionOrchestrator(db, () => null, fr.runner, devServer)
    const project = createProject(db, 'P')
    const card = createCard(db, project.id, 'feature', 'Sign-in')
    return { fr, orch, devServer, states, projectId: project.id, cardId: card.id }
  }

  it('real start: creates a working dir + build step, runs with full tools, marks preview building', () => {
    const { fr, orch, states, projectId, cardId } = setupReal()
    orch.start(projectId, cardId)
    // a real working directory was created and persisted
    expect(getArtifactDir(db, projectId)).not.toBeNull()
    // the session ran with a real cwd + ALL tools (allowedTools omitted) + write permission
    const opts = fr.lastOpts()
    expect(opts.cwd).toBe(getArtifactDir(db, projectId))
    expect(opts.allowedTools).toBeUndefined()
    expect(opts.permissionMode).toBe('bypassPermissions')
    // the build prompt instructs the agent to produce a helm.json manifest
    expect(opts.prompt).toContain('helm.json')
    // a build step is recorded and the preview is building
    expect(getLatestBuildStep(db, projectId)?.status).toBe('running')
    expect(states.at(-1)).toBe('building')
  })

  it('real finish: completes the build step, brings the dev server live, THEN checkpoints', async () => {
    const { fr, orch, states, projectId, cardId } = setupReal()
    const session = orch.start(projectId, cardId)
    fr.cb().onClose()
    // restart() is async; let it resolve
    await new Promise((r) => setTimeout(r, 0))
    expect(getLatestBuildStep(db, projectId)?.status).toBe('complete')
    expect(getLatestBuildStep(db, projectId)?.devUrl).toBe('http://localhost:3000')
    expect(states.at(-1)).toBe('live')
    // checkpoint only after live
    expect(getCard(db, cardId).checkpoint?.status).toBe('pending')
    expect(getEvents(db, session.id).some((e) => e.kind === 'checkpoint')).toBe(true)
  })

  it('real fail: marks the build step failed and routes the preview through a crash', async () => {
    const { fr, orch, states, projectId, cardId } = setupReal()
    orch.start(projectId, cardId)
    fr.cb().onError('the build broke')
    await new Promise((r) => setTimeout(r, 0))
    expect(getLatestBuildStep(db, projectId)?.status).toBe('failed')
    expect(getCard(db, cardId).status).toBe('failed')
    // handleCrash drove a snag (and recovered to live, since the fake server starts fine)
    expect(states).toContain('snag')
  })

  it('surfaces artifact_dir_failed when the working directory cannot be created', () => {
    const fr = capturingRunner()
    // artifactRoot points INTO a file, so mkdir of <file>/<projectId> throws.
    const file = join(mkdtempSync(join(tmpdir(), 'helm-bad-')), 'not-a-dir')
    writeFileSync(file, 'x')
    const devServer = new DevServerManager(db, () => {}, fakeDevServerDeps(), file)
    const orch = new SessionOrchestrator(db, () => null, fr.runner, devServer)
    const project = createProject(db, 'P')
    const card = createCard(db, project.id, 'feature', 'X')
    expect(() => orch.start(project.id, card.id)).toThrow(/working directory|ENOTDIR|not a directory/i)
  })

  it('without a DevServerManager the path stays narration-only (no build steps, sandboxed)', () => {
    const fr = capturingRunner()
    const orch = new SessionOrchestrator(db, () => null, fr.runner) // no devServer
    const project = createProject(db, 'P2')
    const card = createCard(db, project.id, 'feature', 'X')
    orch.start(project.id, card.id)
    expect(getArtifactDir(db, project.id)).toBeNull()
    expect(getLatestBuildStep(db, project.id)).toBeNull()
    expect(fr.lastOpts().allowedTools).toEqual([])
    expect(fr.lastOpts().permissionMode).toBe('default')
  })
})
