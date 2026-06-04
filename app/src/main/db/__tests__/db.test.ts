import { describe, expect, it, beforeEach } from 'vitest'
import { openDatabase, type Db } from '../connection'
import { createProject, getProject, listProjects, updateProject, deriveBackgroundStatus } from '../projects'
import {
  createCard,
  listCards,
  updateCardStatus,
  seedCardsFromPlan,
  updateCheckpoint,
  setPendingCheckpoint,
  promoteNextPlanned,
} from '../cards'
import {
  createSession,
  updateSessionStatus,
  setResumedAt,
  recoverActiveSessions,
  getSession,
} from '../sessions'
import { appendEvent, getEvents } from '../feed-events'
import { createQuestion, answerQuestion, reopenQuestion, listQuestions, nextPosition } from '../question-queue'
import { InvalidTransitionError, NotFoundError, CannotReopenError, NoCheckpointError } from '../errors'
import type { FeedEvent } from '../../../shared/ipc-schemas'

let db: Db
beforeEach(() => {
  db = openDatabase(':memory:')
})

describe('projects', () => {
  it('creates, reads, and lists projects newest-first', () => {
    const a = createProject(db, 'Alpha')
    const b = createProject(db, 'Beta')
    expect(getProject(db, a.id).name).toBe('Alpha')
    const list = listProjects(db)
    expect(list.map((p) => p.id)).toEqual([b.id, a.id]) // updated_at DESC
    expect(list[0]!.status).toBe('planning')
    expect(list[0]!.backgroundStatus).toBe('idle')
  })

  it('throws NotFound for a missing project', () => {
    expect(() => getProject(db, 'nope')).toThrow(NotFoundError)
  })

  it('updates plan + status', () => {
    const p = createProject(db, 'Gamma')
    const plan = [{ id: 'b1', title: 'Sign-in' }]
    const updated = updateProject(db, p.id, { plan, status: 'building' })
    expect(updated.status).toBe('building')
    expect(updated.plan).toEqual(plan)
  })

  it('derives background status from sessions (needs_you > active > failed > idle)', () => {
    const p = createProject(db, 'Delta')
    expect(deriveBackgroundStatus(db, p.id)).toBe('idle')
    const s = createSession(db, p.id, null, 'Scoping')
    expect(deriveBackgroundStatus(db, p.id)).toBe('active')
    updateSessionStatus(db, s.id, 'paused_for_decision')
    expect(deriveBackgroundStatus(db, p.id)).toBe('needs_you')
    updateSessionStatus(db, s.id, 'failed')
    expect(deriveBackgroundStatus(db, p.id)).toBe('failed')
  })
})

describe('cards status machine', () => {
  it('creates cards with incrementing positions', () => {
    const p = createProject(db, 'P')
    const c1 = createCard(db, p.id, 'feature', 'One')
    const c2 = createCard(db, p.id, 'bug', 'Two')
    expect(c1.position).toBe(0)
    expect(c2.position).toBe(1)
    expect(listCards(db, p.id).map((c) => c.title)).toEqual(['One', 'Two'])
  })

  it('allows valid transitions and rejects invalid ones', () => {
    const p = createProject(db, 'P')
    const c = createCard(db, p.id, 'feature', 'X')
    expect(updateCardStatus(db, c.id, 'building').status).toBe('building')
    expect(updateCardStatus(db, c.id, 'done').status).toBe('done')
    expect(() => updateCardStatus(db, c.id, 'planned')).toThrow(InvalidTransitionError) // done → planned not allowed
  })

  it('rejects creating a card on a missing project', () => {
    expect(() => createCard(db, 'ghost', 'feature', 'X')).toThrow(NotFoundError)
  })

  it('seeds cards from a plan with "Step N of M" labels', () => {
    const p = createProject(db, 'P')
    const cards = seedCardsFromPlan(db, p.id, [
      { id: 'b1', title: 'Sign-in' },
      { id: 'b2', title: 'Settings' },
      { id: 'b3', title: 'Inbox' },
    ])
    expect(cards.map((c) => c.stepLabel)).toEqual([
      'Step 1 of 3: Sign-in',
      'Step 2 of 3: Settings',
      'Step 3 of 3: Inbox',
    ])
    expect(cards.every((c) => c.source === 'plan_seed' && c.status === 'planned')).toBe(true)
  })

  it('handles checkpoint approve / flag / no-checkpoint', () => {
    const p = createProject(db, 'P')
    const c = createCard(db, p.id, 'feature', 'X')
    expect(() => updateCheckpoint(db, c.id, 'approved')).toThrow(NoCheckpointError)
    setPendingCheckpoint(db, c.id, '/tmp/shot.png')
    const flagged = updateCheckpoint(db, c.id, 'flagged', 'colors are off')
    expect(flagged.checkpoint).toMatchObject({ status: 'flagged', flagNote: 'colors are off' })
  })

  it('promotes the next planned card', () => {
    const p = createProject(db, 'P')
    const a = createCard(db, p.id, 'feature', 'A')
    createCard(db, p.id, 'feature', 'B')
    updateCardStatus(db, a.id, 'building')
    const promoted = promoteNextPlanned(db, p.id)
    expect(promoted?.title).toBe('B')
    expect(promoted?.status).toBe('up_next')
  })
})

describe('sessions durability', () => {
  it('sets ended_at on terminal status', () => {
    const p = createProject(db, 'P')
    const s = createSession(db, p.id, null, 'Scoping')
    expect(getSession(db, s.id).endedAt).toBeNull()
    const done = updateSessionStatus(db, s.id, 'done')
    expect(done.endedAt).toBeTypeOf('number')
  })

  it('recovers active sessions on relaunch with resumed_at', () => {
    const p = createProject(db, 'P')
    const s = createSession(db, p.id, null, 'Build')
    const recovered = recoverActiveSessions(db, 12345)
    expect(recovered.map((r) => r.id)).toContain(s.id)
    expect(getSession(db, s.id).resumedAt).toBe(12345)
    expect(setResumedAt(db, s.id, 999).resumedAt).toBe(999)
  })
})

describe('feed events', () => {
  it('appends and reads events in order, with afterId paging', () => {
    const p = createProject(db, 'P')
    const s = createSession(db, p.id, null, 'Build')
    const mk = (i: number): FeedEvent => ({
      id: `e${i}`,
      sessionId: s.id,
      kind: 'narration',
      text: `line ${i}`,
      createdAt: 1000 + i,
    })
    appendEvent(db, mk(1))
    appendEvent(db, mk(2))
    appendEvent(db, mk(3))
    expect(getEvents(db, s.id).map((e) => e.text)).toEqual(['line 1', 'line 2', 'line 3'])
    expect(getEvents(db, s.id, 'e1').map((e) => e.text)).toEqual(['line 2', 'line 3'])
  })
})

describe('question queue state machine', () => {
  it('pending → answered → reopened, and blocks reopening a pending question', () => {
    const p = createProject(db, 'P')
    const s = createSession(db, p.id, null, 'Build')
    const q = createQuestion(db, s.id, { type: 'buttons', question: 'CSV or PDF?', options: ['CSV', 'PDF'] }, nextPosition(db, s.id))
    expect(q.status).toBe('pending')
    expect(() => reopenQuestion(db, q.id)).toThrow(CannotReopenError)
    expect(answerQuestion(db, q.id, 'CSV').status).toBe('answered')
    expect(reopenQuestion(db, q.id).status).toBe('reopened')
    expect(listQuestions(db, s.id)).toHaveLength(1)
  })
})
