import { describe, expect, it, beforeEach } from 'vitest'
import type { SessionCallbacks, SessionHandle, StartSessionOptions } from '../../sdk/session-runner'

/**
 * Stage 4 integration: drive valid end-to-end flows through the helm bridge and
 * assert each handler returns the exact shape requirements.md promises — success
 * payloads and the contract's reachable error codes. Complements the malformed-
 * payload fuzzing in ipc-validation.test.ts (this is the happy + typed-error path).
 * Handlers register on the hybrid-runtime transport bus.
 */

import { bus } from '../../core/transport'
import { openDatabase, type Db } from '../../db/connection'
import { SessionOrchestrator } from '../../sdk/session-orchestrator'
import { WizardOrchestrator } from '../../sdk/wizard-orchestrator'
import { DevServerManager, type DevServerDeps } from '../../sdk/dev-server-manager'
import { setArtifactDir } from '../../db/projects'
import { registerFeedBridge } from '../feed-bridge'
import { registerDataBridge } from '../data-bridge'
import { registerSessionBridge } from '../session-bridge'
import { registerWizardBridge } from '../wizard-bridge'
import { registerPreviewBridge } from '../preview-bridge'
import { CH } from '../../../shared/ipc-schemas'

function fakePreviewDeps(): DevServerDeps {
  return {
    readManifest: () => ({ startCommand: 'npm run dev', port: 3000 }),
    spawnServer: (_c, m) => ({ pid: 7, url: `http://localhost:${m.port}`, kill: () => {}, onExit: () => {} }),
    probe: async () => true,
    pidAlive: () => true,
  }
}

function fakeRunner(_o: StartSessionOptions, _cb: SessionCallbacks): SessionHandle {
  return { id: 'fake', steer: async () => {}, reply: () => {}, close: async () => {} }
}
const call = async (ch: string, payload?: unknown): Promise<any> => bus.invoke(ch, payload)

let db: Db
let previewServer: DevServerManager
beforeEach(() => {
  bus.reset()
  db = openDatabase(':memory:')
  previewServer = new DevServerManager(db, () => {}, fakePreviewDeps(), '/tmp/helm-contract')
  registerFeedBridge(db, () => null)
  registerDataBridge(db, () => null)
  registerSessionBridge(db, new SessionOrchestrator(db, () => null, fakeRunner))
  registerWizardBridge(db, new WizardOrchestrator(db, fakeRunner), () => null)
  registerPreviewBridge(db, previewServer)
})

describe('IPC contract flow (Stage 4 integration)', () => {
  it('projects: create → list (with backgroundStatus) → get', async () => {
    const created = await call(CH.projectsCreate, { name: 'Expense Capture' })
    expect(created.project).toMatchObject({ name: 'Expense Capture', status: 'planning' })
    expect(typeof created.project.id).toBe('string')

    const listed = await call(CH.projectsList)
    expect(Array.isArray(listed.projects)).toBe(true)
    expect(listed.projects[0]).toHaveProperty('backgroundStatus')

    const got = await call(CH.projectsGet, { projectId: created.project.id })
    expect(got.project.id).toBe(created.project.id)
    expect(Array.isArray(got.cards)).toBe(true)
  })

  it('projects:get on a missing id returns not_found', async () => {
    expect(await call(CH.projectsGet, { projectId: 'nope' })).toEqual({ error: 'not_found' })
  })

  it('wizard:approve-plan seeds a build-spine of planned cards with Step N of M labels', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'tmp' })
    const res = await call(CH.wizardApprove, {
      projectId: project.id,
      name: 'Expense Capture',
      plan: [
        { id: 'a', title: 'Set up the shell' },
        { id: 'b', title: 'Capture an expense' },
        { id: 'c', title: 'Export a report' },
      ],
    })
    expect(res.project.status).toBe('building')
    expect(res.cards).toHaveLength(3)
    expect(res.cards.every((c: { status: string; source: string }) => c.status === 'planned' && c.source === 'plan_seed')).toBe(true)
    expect(res.cards[0].stepLabel).toBe('Step 1 of 3: Set up the shell')
  })

  it('cards: create (user_added) then an invalid status transition is rejected', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    const { card } = await call(CH.cardsCreate, { projectId: project.id, type: 'bug', title: 'Crash on export' })
    expect(card).toMatchObject({ status: 'planned', source: 'user_added', type: 'bug' })
    // planned → done is not a legal build-spine transition
    expect(await call(CH.cardsUpdateStatus, { cardId: card.id, status: 'done' })).toMatchObject({
      error: 'invalid_transition',
    })
  })

  it('cards:approve-checkpoint with no pending checkpoint returns no_checkpoint', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    const { card } = await call(CH.cardsCreate, { projectId: project.id, type: 'feature', title: 'x' })
    expect(await call(CH.cardsApproveCheckpoint, { cardId: card.id, verdict: 'approved' })).toEqual({
      error: 'no_checkpoint',
    })
  })

  it('Phase 4: sessions:start opens sessions in parallel — a second concurrent start also succeeds', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    const a = await call(CH.cardsCreate, { projectId: project.id, type: 'feature', title: 'A' })
    const b = await call(CH.cardsCreate, { projectId: project.id, type: 'feature', title: 'B' })

    const first = await call(CH.sessionsStart, { projectId: project.id, cardId: a.card.id })
    expect(first.session).toMatchObject({ status: 'active', projectId: project.id })

    const second = await call(CH.sessionsStart, { projectId: project.id, cardId: b.card.id })
    expect(second.session).toMatchObject({ status: 'active', projectId: project.id })
  })

  it('sessions:answer-decision on an active (not paused) session returns not_awaiting_decision', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    const { card } = await call(CH.cardsCreate, { projectId: project.id, type: 'feature', title: 'A' })
    const { session } = await call(CH.sessionsStart, { projectId: project.id, cardId: card.id })
    const res = await call(CH.sessionsAnswerDecision, { sessionId: session.id, questionId: 'q', answer: 'x' })
    expect(res.error).toBe('not_awaiting_decision')
  })

  it('sessions:get-feed reads the persisted feed (backfill source of truth)', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    const { card } = await call(CH.cardsCreate, { projectId: project.id, type: 'feature', title: 'A' })
    const { session } = await call(CH.sessionsStart, { projectId: project.id, cardId: card.id })
    const feed = await call(CH.getFeed, { sessionId: session.id })
    expect(feed).toHaveProperty('events')
    expect(Array.isArray(feed.events)).toBe(true)
  })

  /* ---- Phase 2: preview / dev-server contracts ---- */

  it('preview:get-state returns none for a fresh project, not_found for a missing one', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    expect(await call(CH.previewGetState, { projectId: project.id })).toEqual({ state: { status: 'none' } })
    expect(await call(CH.previewGetState, { projectId: 'nope' })).toEqual({ error: 'not_found' })
  })

  it('devserver:start returns no_artifact before a build, the url after, already_running on a repeat', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    // No artifact yet → no_artifact
    expect(await call(CH.devserverStart, { projectId: project.id })).toEqual({ error: 'no_artifact' })
    // Simulate a completed build having produced a working dir + manifest
    setArtifactDir(db, project.id, '/work/p')
    expect(await call(CH.devserverStart, { projectId: project.id })).toEqual({ url: 'http://localhost:3000' })
    // Second start while running → already_running, carrying the existing URL
    expect(await call(CH.devserverStart, { projectId: project.id })).toEqual({
      error: 'already_running',
      url: 'http://localhost:3000',
    })
    // And the preview state is now live
    expect(await call(CH.previewGetState, { projectId: project.id })).toEqual({
      state: { status: 'live', url: 'http://localhost:3000' },
    })
  })

  it('devserver:stop returns not_running when nothing is up, then stops a running server', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    setArtifactDir(db, project.id, '/work/p')
    expect(await call(CH.devserverStop, { projectId: project.id })).toEqual({ error: 'not_running' })
    await call(CH.devserverStart, { projectId: project.id })
    expect(await call(CH.devserverStop, { projectId: project.id })).toEqual({ stopped: true })
    expect(await call(CH.previewGetState, { projectId: project.id })).toEqual({ state: { status: 'none' } })
  })

  it('devserver:start on a missing project returns not_found', async () => {
    expect(await call(CH.devserverStart, { projectId: 'nope' })).toEqual({ error: 'not_found' })
  })
})
