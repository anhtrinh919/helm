import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { SessionCallbacks, SessionHandle, StartSessionOptions } from '../../sdk/session-runner'

/**
 * Stage 4 integration: drive valid end-to-end flows through the IPC boundary and
 * assert each handler returns the exact shape requirements.md promises — success
 * payloads and the contract's reachable error codes. Complements the malformed-
 * payload fuzzing in ipc-validation.test.ts (this is the happy + typed-error path).
 */

const { handlers } = vi.hoisted(() => ({
  handlers: new Map<string, (e: unknown, raw: unknown) => unknown>(),
}))
vi.mock('electron', () => ({
  ipcMain: { handle: (ch: string, fn: (e: unknown, raw: unknown) => unknown) => handlers.set(ch, fn) },
}))

import { openDatabase, type Db } from '../../db/connection'
import { SessionOrchestrator } from '../../sdk/session-orchestrator'
import { WizardOrchestrator } from '../../sdk/wizard-orchestrator'
import { registerFeedBridge } from '../feed-bridge'
import { registerDataBridge } from '../data-bridge'
import { registerSessionBridge } from '../session-bridge'
import { registerWizardBridge } from '../wizard-bridge'
import { CH } from '../../../shared/ipc-schemas'

function fakeRunner(_o: StartSessionOptions, _cb: SessionCallbacks): SessionHandle {
  return { id: 'fake', steer: async () => {}, reply: () => {}, close: async () => {} }
}
const call = async (ch: string, payload?: unknown): Promise<any> => handlers.get(ch)!({}, payload)

let db: Db
beforeEach(() => {
  handlers.clear()
  db = openDatabase(':memory:')
  registerFeedBridge(db, () => null)
  registerDataBridge(db, () => null)
  registerSessionBridge(db, new SessionOrchestrator(db, () => null, fakeRunner))
  registerWizardBridge(db, new WizardOrchestrator(db, fakeRunner), () => null)
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

  it('sessions:start opens an active session; a second concurrent start returns session_already_active', async () => {
    const { project } = await call(CH.projectsCreate, { name: 'p' })
    const a = await call(CH.cardsCreate, { projectId: project.id, type: 'feature', title: 'A' })
    const b = await call(CH.cardsCreate, { projectId: project.id, type: 'feature', title: 'B' })

    const started = await call(CH.sessionsStart, { projectId: project.id, cardId: a.card.id })
    expect(started.session).toMatchObject({ status: 'active', projectId: project.id })

    const blocked = await call(CH.sessionsStart, { projectId: project.id, cardId: b.card.id })
    expect(blocked.error).toBe('session_already_active')
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
})
