import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { DecisionPrompt, PlanBlock, ProjectMode } from '../../shared/ipc-schemas'
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

/** Max scoping rounds (batches of questions) before we force a plan. */
export const SCOPING_TOTAL = 4
const ITERATE_ROUNDS = 2

export type ScopingReply =
  | { kind: 'question'; question: DecisionPrompt }
  | { kind: 'question_batch'; questions: DecisionPrompt[] }
  | { kind: 'plan'; name: string; plan: PlanBlock[] }

type Runner = (opts: StartSessionOptions, cb: SessionCallbacks) => SessionHandle

function scopingPrompt(idea: string, mode: ProjectMode = 'build'): string {
  const batchShape = `{"ask_batch":{"questions":[{"question":"...","type":"buttons","options":["..",".."]}, ...]}}`
  const buttonsRule = `PREFER "type":"buttons" with 2-4 short concrete options; use "type":"freetext" only when the answer genuinely needs their own words (e.g. a name).`
  const jsonRule = `Output RAW JSON only — no code fences, no prose around it. CRITICAL: never put a double-quote character inside any question or option text (don't quote words); keep every label plain so the JSON always parses.`
  if (mode === 'iterate') {
    // Iterate-from-scratch: the FIRST feature and the app scaffold are ONE step —
    // the user is never parked on an empty canvas. Plan has exactly one block.
    return [
      `A non-technical person wants to start iterating on a brand-new app. Their first feature request: "${idea}".`,
      `You are scoping JUST this first piece — not a full product plan — through a short, adaptive interview.`,
      `Ask your questions in BATCHES of 2-3 short, high-leverage questions per turn — never one at a time.`,
      `Run 1-2 batches total: read their answers to the first batch and only ask a second batch if something important is still genuinely open. Otherwise go straight to the plan.`,
      `Reply with ONLY a single JSON object per turn. For a batch of questions: ${batchShape}`,
      jsonRule,
      buttonsRule,
      `When you have enough, reply: {"plan":{"name":"<short product name, 1-4 words>","steps":[{"title":"<short — the feature itself, not 'set up'>","detail":"<one sentence: scaffold a minimal app AND deliver this feature in one pass>"}]}} with EXACTLY 1 step.`,
      `Send your first batch now.`,
    ].join(' ')
  }
  return [
    `A non-technical person wants to build: "${idea}".`,
    `You are scoping it into a buildable plan through a short, adaptive decision-tree interview.`,
    `Ask your questions in BATCHES of 4-5 short, high-leverage questions per turn — never one at a time, never all at once.`,
    `Run 2-4 batches total. After each batch, use their answers to decide the NEXT batch: drill deeper where their choices opened a real fork, skip what is already settled. Stop asking once you can write a confident plan.`,
    `Reply with ONLY a single JSON object per turn. For a batch of questions: ${batchShape}`,
    jsonRule,
    buttonsRule,
    `When you have enough, reply: {"plan":{"name":"<short product name, 1-4 words>","steps":[{"title":"<short>","detail":"<one sentence>"}]}} with 4-7 steps.`,
    `Send your first batch now.`,
  ].join(' ')
}

// extractJson lives in ./json-extract (shared with the build-session transformer).
export { extractJson }

/** Classify a parsed object as a scoping question or a finished plan. */
export function classifyScoping(obj: unknown): ScopingReply | null {
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>

  const toQuestion = (raw: unknown): DecisionPrompt | null => {
    if (!raw || typeof raw !== 'object') return null
    const ask = raw as Record<string, unknown>
    const question = typeof ask.question === 'string' ? ask.question.trim() : ''
    if (!question) return null
    const type = ask.type === 'buttons' ? 'buttons' : 'freetext'
    const options =
      type === 'buttons' && Array.isArray(ask.options)
        ? ask.options.filter((x): x is string => typeof x === 'string').slice(0, 4)
        : undefined
    return { type, question, ...(options ? { options } : {}) }
  }

  if (o.ask_batch && typeof o.ask_batch === 'object') {
    const batch = o.ask_batch as Record<string, unknown>
    const raw = Array.isArray(batch.questions) ? batch.questions : []
    const questions = raw
      .map(toQuestion)
      .filter((q): q is DecisionPrompt => q !== null)
      .slice(0, 6)
    if (questions.length === 0) return null
    return { kind: 'question_batch', questions }
  }

  if (o.ask && typeof o.ask === 'object') {
    const question = toQuestion(o.ask)
    if (!question) return null
    return { kind: 'question', question }
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

function defaultPlan(idea: string, mode: ProjectMode = 'build'): ScopingReply {
  const name = idea.trim().split(/\s+/).slice(0, 3).join(' ') || 'New project'
  const block = (title: string, detail: string): PlanBlock => ({ id: randomUUID(), title, detail })
  if (mode === 'iterate') {
    return {
      kind: 'plan',
      name,
      plan: [
        block(
          name,
          'Scaffold a minimal runnable app and deliver this first feature in one pass.',
        ),
      ],
    }
  }
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
  mode: ProjectMode
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
    mode: ProjectMode = 'build',
  ): Promise<{ sessionId: string; reply: ScopingReply; asked: number }> {
    const session = createSession(this.db, projectId, null, 'Scoping')
    const ws: WizardSession = {
      handle: undefined as unknown as SessionHandle,
      idea,
      mode,
      buffer: '',
      asked: 0,
      pending: null,
      timer: null,
      settled: false,
    }
    this.sessions.set(session.id, ws)
    const next = this.awaitTurn(session.id)
    ws.handle = this.runner(
      { prompt: scopingPrompt(idea, mode), allowedTools: [], cwd: tmpdir() },
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
    if (reply.kind === 'question' || reply.kind === 'question_batch') ws.asked++
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

    const cap = ws.mode === 'iterate' ? ITERATE_ROUNDS : SCOPING_TOTAL
    let parsed = classifyScoping(extractJson(ws.buffer))
    if (parsed) {
      // Iterate mode contract: exactly one combined scaffold+feature step.
      if (parsed.kind === 'plan' && ws.mode === 'iterate' && parsed.plan.length > 1) {
        parsed = { ...parsed, plan: [parsed.plan[0]!] }
      }
      // Cap the interview: once enough rounds are asked, force a plan instead of
      // letting the agent keep grilling.
      if ((parsed.kind === 'question' || parsed.kind === 'question_batch') && ws.asked >= cap) {
        this.resolve(sessionId, defaultPlan(ws.idea, ws.mode))
        return
      }
      this.resolve(sessionId, parsed)
      return
    }
    // Unparseable turn: keep the conversation moving rather than dead-end.
    if (ws.asked >= cap) this.resolve(sessionId, defaultPlan(ws.idea, ws.mode))
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
    this.resolve(sessionId, defaultPlan(ws.idea, ws.mode))
  }
}
