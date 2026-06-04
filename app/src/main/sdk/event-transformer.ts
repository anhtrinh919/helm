import { randomUUID } from 'node:crypto'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { FeedEvent, FeedEventKind } from '../../shared/ipc-schemas'
import { splitJson } from './json-extract'

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

function friendlyError(code: string | undefined): string {
  return (code && ERROR_TEXT[code]) || 'Something went wrong while building this — let’s try again.'
}

/** The one place a renderer-facing FeedEvent is constructed. */
export function makeFeedEvent(
  sessionId: string,
  kind: FeedEventKind,
  text: string,
  refId: string | null = null,
): FeedEvent {
  return { id: randomUUID(), sessionId, kind, text, refId, createdAt: Date.now() }
}

/** Concatenate the plain text blocks of an assistant message — no hard-gate semantics.
 *  Used by the wizard, which parses the model's own JSON reply and needs it intact. */
export function assistantText(msg: SDKMessage): string {
  if (msg.type !== 'assistant') return ''
  const content = (msg.message as { content?: unknown } | undefined)?.content
  if (!Array.isArray(content)) return ''
  return (content as Block[])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
}

/**
 * Smart-pausing: the build prompt tells the engine to emit a single
 * {"decision":{"question":"..."}} object only when it hits a genuine fork a
 * non-developer would care about. We split the turn into prose (narrated) and
 * JSON objects (never narrated): a decision object surfaces a decision_prompt
 * (which pauses the build); any other JSON is dropped so raw braces can't leak.
 */
function splitTurn(text: string): {
  narration: string | null
  question: string | null
  options: string[]
} {
  const { prose, objects } = splitJson(text)
  let question: string | null = null
  let options: string[] = []
  for (const obj of objects) {
    if (!obj || typeof obj !== 'object') continue
    const d = (obj as Record<string, unknown>).decision
    if (d && typeof d === 'object') {
      const rec = d as Record<string, unknown>
      const q = rec.question
      if (typeof q === 'string' && q.trim() && !question) {
        question = q.trim()
        options = Array.isArray(rec.options)
          ? rec.options.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, 4)
          : []
      }
    }
  }
  return { narration: prose ? prose : null, question, options }
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
            const { narration, question, options } = splitTurn(raw.text)
            if (narration) out.push(makeFeedEvent(sessionId, 'narration', narration))
            if (question) {
              const ev = makeFeedEvent(sessionId, 'decision_prompt', question)
              if (options.length) ev.options = options
              out.push(ev)
            }
          } else if (raw.type === 'tool_use') {
            out.push(makeFeedEvent(sessionId, 'activity', TOOL_LABELS[raw.name ?? ''] ?? 'Working on it'))
          }
        }
      }
      return out
    }
    case 'result': {
      if (msg.subtype === 'success') return [makeFeedEvent(sessionId, 'summary', 'Done.')]
      // Surface the specific friendly copy when the SDK gives a known error code.
      const code = (msg as { error?: string; subtype?: string }).error ?? (msg as { subtype?: string }).subtype
      return [makeFeedEvent(sessionId, 'error', friendlyError(code))]
    }
    default:
      // system / partial / tool-progress / etc. — not surfaced as feed events in Phase 1
      return []
  }
}
