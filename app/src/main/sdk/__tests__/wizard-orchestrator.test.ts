import { describe, expect, it, beforeEach } from 'vitest'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { openDatabase, type Db } from '../../db/connection'
import { createProject } from '../../db/projects'
import {
  WizardOrchestrator,
  extractJson,
  classifyScoping,
  SCOPING_TOTAL,
} from '../wizard-orchestrator'
import type { SessionCallbacks, SessionHandle, StartSessionOptions } from '../session-runner'

describe('extractJson', () => {
  it('pulls a bare object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 })
  })
  it('tolerates prose and code fences around the object', () => {
    const t = 'Sure! Here you go:\n```json\n{"ask":{"question":"Hi?","type":"freetext"}}\n```\nLet me know.'
    expect(extractJson(t)).toEqual({ ask: { question: 'Hi?', type: 'freetext' } })
  })
  it('handles braces inside strings', () => {
    expect(extractJson('{"q":"use { and } chars"}')).toEqual({ q: 'use { and } chars' })
  })
  it('returns null when there is no object', () => {
    expect(extractJson('no json here')).toBeNull()
  })
})

describe('classifyScoping', () => {
  it('reads a button question', () => {
    const r = classifyScoping({ ask: { question: 'Who?', type: 'buttons', options: ['Me', 'Team'] } })
    expect(r).toEqual({ kind: 'question', question: { type: 'buttons', question: 'Who?', options: ['Me', 'Team'] } })
  })
  it('reads a free-text question', () => {
    const r = classifyScoping({ ask: { question: 'Why?', type: 'freetext' } })
    expect(r).toEqual({ kind: 'question', question: { type: 'freetext', question: 'Why?' } })
  })
  it('reads a batch of questions', () => {
    const r = classifyScoping({
      ask_batch: {
        questions: [
          { question: 'Who?', type: 'buttons', options: ['Me', 'Team'] },
          { question: 'Why?', type: 'freetext' },
        ],
      },
    })
    expect(r).toEqual({
      kind: 'question_batch',
      questions: [
        { type: 'buttons', question: 'Who?', options: ['Me', 'Team'] },
        { type: 'freetext', question: 'Why?' },
      ],
    })
  })
  it('rejects an empty batch', () => {
    expect(classifyScoping({ ask_batch: { questions: [{}] } })).toBeNull()
  })
  it('preserves the multi flag on a multi-select question', () => {
    const r = classifyScoping({
      ask_batch: { questions: [{ question: 'Genres?', type: 'buttons', multi: true, options: ['A', 'B'] }] },
    })
    expect(r).toEqual({
      kind: 'question_batch',
      questions: [{ type: 'buttons', question: 'Genres?', options: ['A', 'B'], multi: true }],
    })
  })
  it('reads a plan with steps and gives each an id', () => {
    const r = classifyScoping({ plan: { name: 'Helm', steps: [{ title: 'A', detail: 'x' }, { title: 'B' }] } })
    expect(r?.kind).toBe('plan')
    if (r?.kind === 'plan') {
      expect(r.name).toBe('Helm')
      expect(r.plan.map((b) => b.title)).toEqual(['A', 'B'])
      expect(r.plan.every((b) => typeof b.id === 'string' && b.id.length > 0)).toBe(true)
    }
  })
  it('rejects a plan with no usable steps', () => {
    expect(classifyScoping({ plan: { name: 'X', steps: [{}] } })).toBeNull()
  })
  it('returns null for unrelated objects', () => {
    expect(classifyScoping({ hello: 'world' })).toBeNull()
  })
})

/** Fake runner that lets the test drive the scoping session's turns. */
function fakeRunner(): {
  runner: (o: StartSessionOptions, cb: SessionCallbacks) => SessionHandle
  cb: () => SessionCallbacks
  replies: string[]
} {
  let captured: SessionCallbacks | null = null
  const replies: string[] = []
  const runner = (_o: StartSessionOptions, cb: SessionCallbacks): SessionHandle => {
    captured = cb
    return {
      id: 'fake',
      steer: async () => {},
      reply: (t) => replies.push(t),
      close: async () => {},
    }
  }
  return { runner, cb: () => captured!, replies }
}

const turn = (cb: SessionCallbacks, json: string): void => {
  cb.onMessage({ type: 'assistant', message: { content: [{ type: 'text', text: json }] } } as unknown as SDKMessage)
  cb.onMessage({ type: 'result', subtype: 'success' } as unknown as SDKMessage)
}

let db: Db
beforeEach(() => {
  db = openDatabase(':memory:')
})

describe('WizardOrchestrator', () => {
  it('returns the first question, then the plan, forwarding answers to the engine', async () => {
    const fr = fakeRunner()
    const orch = new WizardOrchestrator(db, fr.runner)
    const project = createProject(db, 'tmp')

    const startP = orch.startScoping(project.id, 'a budgeting app')
    turn(fr.cb(), '{"ask":{"question":"Who uses it?","type":"buttons","options":["Me","Team"]}}')
    const start = await startP
    expect(start.reply.kind).toBe('question')
    expect(start.asked).toBe(1)

    const ansP = orch.answerScoping(start.sessionId, 'Me')
    turn(fr.cb(), '{"plan":{"name":"Budgeteer","steps":[{"title":"Shell"},{"title":"Entries"}]}}')
    const ans = await ansP
    expect(fr.replies).toEqual(['Me'])
    expect(ans.reply.kind).toBe('plan')
    if (ans.reply.kind === 'plan') expect(ans.reply.name).toBe('Budgeteer')
  })

  it('runs multiple question batches before the plan, counting rounds', async () => {
    const fr = fakeRunner()
    const orch = new WizardOrchestrator(db, fr.runner)
    const project = createProject(db, 'tmp')

    const startP = orch.startScoping(project.id, 'a booking app')
    turn(fr.cb(), '{"ask_batch":{"questions":[{"question":"Who books?","type":"freetext"},{"question":"Paid?","type":"buttons","options":["Yes","No"]}]}}')
    const start = await startP
    expect(start.reply.kind).toBe('question_batch')
    expect(start.asked).toBe(1)

    const r2P = orch.answerScoping(start.sessionId, 'Q: Who books?\nA: clients\n\nQ: Paid?\nA: Yes')
    turn(fr.cb(), '{"ask_batch":{"questions":[{"question":"Refunds?","type":"buttons","options":["Yes","No"]}]}}')
    const r2 = await r2P
    expect(r2.reply.kind).toBe('question_batch')
    expect(r2.asked).toBe(2)

    const planP = orch.answerScoping(start.sessionId, 'Q: Refunds?\nA: No')
    turn(fr.cb(), '{"plan":{"name":"Booker","steps":[{"title":"Shell"},{"title":"Calendar"}]}}')
    const plan = await planP
    expect(plan.reply.kind).toBe('plan')
  })

  it('degrades an unparseable turn to a follow-up question, not a dead-end', async () => {
    const fr = fakeRunner()
    const orch = new WizardOrchestrator(db, fr.runner)
    const project = createProject(db, 'tmp')
    const startP = orch.startScoping(project.id, 'a thing')
    turn(fr.cb(), 'I think we should consider a few options here, friend.')
    const start = await startP
    expect(start.reply.kind).toBe('question')
  })

  it('degrades a crashed session to a default plan', async () => {
    const fr = fakeRunner()
    const orch = new WizardOrchestrator(db, fr.runner)
    const project = createProject(db, 'tmp')
    const startP = orch.startScoping(project.id, 'expense tracker thing')
    fr.cb().onError('engine died')
    const start = await startP
    expect(start.reply.kind).toBe('plan')
    if (start.reply.kind === 'plan') expect(start.reply.plan.length).toBeGreaterThan(0)
  })

  it('exposes a fixed scoping total', () => {
    expect(SCOPING_TOTAL).toBeGreaterThanOrEqual(3)
  })
})
