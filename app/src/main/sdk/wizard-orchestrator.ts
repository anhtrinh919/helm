import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { DecisionPrompt, PlanBlock } from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import { NotFoundError } from '../db/errors'
import { createSession, updateSessionStatus } from '../db/sessions'
import { assistantText } from './event-transformer'
import { extractJson } from './json-extract'
import {
  startSession,
  type SessionCallbacks,
  type SessionHandle,
  type StartSessionOptions,
} from './session-runner'

/**
 * Drives the new-project scoping conversation over a live SDK session: it asks a
 * few high-leverage questions, then proposes a named, step-by-step plan. The
 * agent is told to reply with one JSON object per turn; we parse it out of the
 * narration stream. Parsing is best-effort — any turn that can't be parsed
 * degrades to a sensible question, and a stuck session degrades to a default
 * plan, so the wizard never dead-ends.
 */

export const SCOPING_TOTAL = 4

export type ScopingReply =
  | { kind: 'question'; question: DecisionPrompt }
  | { kind: 'plan'; name: string; plan: PlanBlock[] }

type Runner = (opts: StartSessionOptions, cb: SessionCallbacks) => SessionHandle

function scopingPrompt(idea: string): string {
  return [
    `A non-technical person wants to build: "${idea}".`,
    `You are scoping it into a buildable plan. Ask up to ${SCOPING_TOTAL} short, high-leverage questions, ONE per turn.`,
    `Reply with ONLY a single JSON object — no prose, no code fences.`,
    `To ask a question: {"ask":{"question":"...","type":"buttons","options":["..",".."]}} (2-4 options),`,
    `or {"ask":{"question":"...","type":"freetext"}} when an open answer fits better.`,
    `When you have enough, reply: {"plan":{"name":"<short product name, 1-4 words>","steps":[{"title":"<short>","detail":"<one sentence>"}]}} with 4-7 steps.`,
    `Ask your first question now.`,
  ].join(' ')
}

// extractJson lives in ./json-extract (shared with the build-session transformer).
export { extractJson }

/** Classify a parsed object as a scoping question or a finished plan. */
export function classifyScoping(obj: unknown): ScopingReply | null {
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>

  if (o.ask && typeof o.ask === 'object') {
    const ask = o.ask as Record<string, unknown>
    const question = typeof ask.question === 'string' ? ask.question.trim() : ''
    if (!question) return null
    const type = ask.type === 'buttons' ? 'buttons' : 'freetext'
    const options =
      type === 'buttons' && Array.isArray(ask.options)
        ? ask.options.filter((x): x is string => typeof x === 'string').slice(0, 4)
        : undefined
    return { kind: 'question', question: { type, question, ...(options ? { options } : {}) } }
  }

  if (o.plan && typeof o.plan === 'object') {
    const plan = o.plan as Record<string, unknown>
    const name = typeof plan.name === 'string' && plan.name.trim() ? plan.name.trim() : 'New project'
    const stepsRaw = Array.isArray(plan.steps) ? plan.steps : []
    const steps: PlanBlock[] = stepsRaw
      .map((s): PlanBlock | null => {
        if (!s || typeof s !== 'object') return null
        const rec = s as Record<string, unknown>
        const title = typeof rec.title === 'string' ? rec.title.trim() : ''
        if (!title) return null
        const detail = typeof rec.detail === 'string' ? rec.detail.trim() : undefined
        return { id: randomUUID(), title, ...(detail ? { detail } : {}) }
      })
      .filter((b): b is PlanBlock => b !== null)
    if (steps.length === 0) return null
    return { kind: 'plan', name, plan: steps }
  }

  return null
}

function defaultPlan(idea: string): ScopingReply {
  const name = idea.trim().split(/\s+/).slice(0, 3).join(' ') || 'New project'
  const block = (title: string, detail: string): PlanBlock => ({ id: randomUUID(), title, detail })
  return {
    kind: 'plan',
    name,
    plan: [
      block('Set up the project shell', 'Create the app skeleton and prepare the workspace.'),
      block('Accounts and sign-in', 'Let the right people in and keep their data safe.'),
      block('The core screen', 'The main thing people came here to do.'),
      block('Save and load data', 'Everything sticks around between visits.'),
      block('Polish and review', 'Tidy the rough edges and make it feel finished.'),
    ],
  }
}

const TURN_TIMEOUT_MS = 90_000

interface WizardSession {
  handle: SessionHandle
  idea: string
  buffer: string
  asked: number
  pending: { resolve: (r: ScopingReply) => void } | null
  timer: ReturnType<typeof setTimeout> | null
  settled: boolean
}

export class WizardOrchestrator {
  private sessions = new Map<string, WizardSession>()

  constructor(
    private db: Db,
    private runner: Runner = startSession,
  ) {}

  async startScoping(
    projectId: string,
    idea: string,
  ): Promise<{ sessionId: string; reply: ScopingReply; asked: number }> {
    const session = createSession(this.db, projectId, null, 'Scoping')
    const ws: WizardSession = {
      handle: undefined as unknown as SessionHandle,
      idea,
      buffer: '',
      asked: 0,
      pending: null,
      timer: null,
      settled: false,
    }
    this.sessions.set(session.id, ws)
    const next = this.awaitTurn(session.id)
    ws.handle = this.runner(
      { prompt: scopingPrompt(idea), allowedTools: [], cwd: tmpdir() },
      {
        onMessage: (msg) => this.ingest(session.id, msg),
        onError: () => this.degrade(session.id),
        onClose: () => this.degrade(session.id),
      },
    )
    const reply = await next
    return { sessionId: session.id, reply, asked: ws.asked }
  }

  async answerScoping(
    sessionId: string,
    answer: string,
  ): Promise<{ reply: ScopingReply; asked: number }> {
    const ws = this.sessions.get(sessionId)
    if (!ws) throw new NotFoundError('scoping session not found')
    const next = this.awaitTurn(sessionId)
    ws.handle.reply(answer)
    const reply = await next
    return { reply, asked: ws.asked }
  }

  private awaitTurn(sessionId: string): Promise<ScopingReply> {
    const ws = this.sessions.get(sessionId)!
    ws.buffer = ''
    return new Promise<ScopingReply>((resolve) => {
      ws.pending = { resolve }
      // A live session that never replies must not freeze the wizard.
      ws.timer = setTimeout(() => this.degrade(sessionId), TURN_TIMEOUT_MS)
    })
  }

  private resolve(sessionId: string, reply: ScopingReply): void {
    const ws = this.sessions.get(sessionId)
    if (!ws || !ws.pending) return
    if (ws.timer) {
      clearTimeout(ws.timer)
      ws.timer = null
    }
    const { resolve } = ws.pending
    ws.pending = null
    if (reply.kind === 'question') ws.asked++
    else {
      ws.settled = true
      updateSessionStatus(this.db, sessionId, 'done')
    }
    resolve(reply)
  }

  private ingest(sessionId: string, msg: SDKMessage): void {
    const ws = this.sessions.get(sessionId)
    if (!ws) return
    const text = assistantText(msg)
    if (text) ws.buffer += `\n${text}`
    if (msg.type !== 'result') return

    const parsed = classifyScoping(extractJson(ws.buffer))
    if (parsed) {
      this.resolve(sessionId, parsed)
      return
    }
    // Unparseable turn: keep the conversation moving rather than dead-end.
    if (ws.asked >= SCOPING_TOTAL) this.resolve(sessionId, defaultPlan(ws.idea))
    else
      this.resolve(sessionId, {
        kind: 'question',
        question: {
          type: 'freetext',
          question: 'Anything else I should know about how this should work?',
        },
      })
  }

  private degrade(sessionId: string): void {
    const ws = this.sessions.get(sessionId)
    if (!ws || ws.settled || !ws.pending) return
    this.resolve(sessionId, defaultPlan(ws.idea))
  }
}
