import { randomUUID } from 'node:crypto'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { FeedEvent, FeedEventKind } from '../../shared/ipc-schemas'
import { extractJson } from './json-extract'

/**
 * Converts raw SDK messages into user-safe FeedEvents. This is a HARD GATE:
 * no code, file paths, git output, tool arguments, or raw terminal text may
 * cross into a FeedEvent. Only plain-English narration and friendly activity
 * labels survive.
 */

const TOOL_LABELS: Record<string, string> = {
  Read: 'Reading the project files',
  Write: 'Writing some code',
  Edit: 'Editing the code',
  MultiEdit: 'Editing the code',
  Bash: 'Running a command',
  Glob: 'Looking through the files',
  Grep: 'Searching the code',
  WebFetch: 'Reading something online',
  WebSearch: 'Searching the web',
  TodoWrite: 'Updating its task list',
  Task: 'Handing part of the work to a helper',
}

const ERROR_TEXT: Record<string, string> = {
  authentication_failed: 'The Claude engine isn’t signed in — open Claude Code and log in, then try again.',
  billing_error: 'There’s a billing issue with your Claude subscription.',
  rate_limit: 'The engine is busy right now — give it a moment and try again.',
  overloaded: 'The engine is overloaded right now — try again shortly.',
  model_not_found: 'The build engine couldn’t start (model unavailable).',
}

function friendlyError(code: string): string {
  return ERROR_TEXT[code] ?? 'Something went wrong while building this — let’s try again.'
}

function mk(sessionId: string, kind: FeedEventKind, text: string, refId: string | null = null): FeedEvent {
  return { id: randomUUID(), sessionId, kind, text, refId, createdAt: Date.now() }
}

/**
 * Smart-pausing: the build prompt tells the engine to emit a single
 * {"decision":{"question":"..."}} object only when it hits a genuine fork a
 * non-developer would care about (routine choices it just makes silently). If a
 * text block carries that marker, we surface it as a decision (which pauses the
 * build) instead of narrating raw JSON. Returns the question, or null.
 */
function decisionQuestion(text: string): string | null {
  if (!text.includes('"decision"')) return null
  const obj = extractJson(text)
  if (!obj || typeof obj !== 'object') return null
  const d = (obj as Record<string, unknown>).decision
  if (!d || typeof d !== 'object') return null
  const q = (d as Record<string, unknown>).question
  return typeof q === 'string' && q.trim() ? q.trim() : null
}

type Block = { type: string; text?: string; name?: string }

/** Transform one SDK message into zero or more user-safe feed events. */
export function transform(sessionId: string, msg: SDKMessage): FeedEvent[] {
  switch (msg.type) {
    case 'assistant': {
      const out: FeedEvent[] = []
      const content = (msg.message as { content?: unknown } | undefined)?.content
      if (Array.isArray(content)) {
        for (const raw of content as Block[]) {
          if (raw.type === 'text' && typeof raw.text === 'string' && raw.text.trim()) {
            const question = decisionQuestion(raw.text)
            if (question) out.push(mk(sessionId, 'decision_prompt', question))
            else out.push(mk(sessionId, 'narration', raw.text.trim()))
          } else if (raw.type === 'tool_use') {
            out.push(mk(sessionId, 'activity', TOOL_LABELS[raw.name ?? ''] ?? 'Working on it'))
          }
        }
      }
      if ('error' in msg && typeof msg.error === 'string') {
        out.push(mk(sessionId, 'error', friendlyError(msg.error)))
      }
      return out
    }
    case 'result': {
      if (msg.subtype === 'success') return [mk(sessionId, 'summary', 'Done.')]
      return [mk(sessionId, 'error', 'Something went wrong while building this — let’s try again.')]
    }
    default:
      // system / partial / tool-progress / etc. — not surfaced as feed events in Phase 1
      return []
  }
}
