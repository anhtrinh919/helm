import { describe, expect, it, beforeEach } from 'vitest'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { openDatabase, type Db } from '../../db/connection'
import { createProject } from '../../db/projects'
import { createCard, getCard } from '../../db/cards'
import { getSession } from '../../db/sessions'
import { getEvents } from '../../db/feed-events'
import { createQuestion } from '../../db/question-queue'
import { SessionOrchestrator } from '../session-orchestrator'
import type { SessionCallbacks, SessionHandle, StartSessionOptions } from '../session-runner'

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
    const q = createQuestion(db, session.id, { type: 'freetext', question: 'CSV or PDF?' }, 0)
    orch.answerDecision(session.id, q.id, 'CSV')
    expect(getSession(db, session.id).status).toBe('active')
    expect(getCard(db, cardId).status).toBe('building')
    expect(fr.replyCalls).toEqual(['CSV'])
    expect(getEvents(db, session.id).some((e) => e.text === 'You answered: CSV')).toBe(true)
  })

  it('steer on an unknown session returns false', () => {
    const { orch } = setup()
    expect(orch.steer('nope', 'interrupt', 'stop')).toBe(false)
  })

  it('reopen re-blocks the build, narrates it, and nudges the engine', () => {
    const { fr, orch, projectId, cardId } = setup()
    const session = orch.start(projectId, cardId)
    const q = createQuestion(db, session.id, { type: 'freetext', question: 'CSV or PDF?' }, 0)
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
