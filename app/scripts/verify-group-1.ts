/**
 * Group 1 engine-plumbing proof (Node level — no Electron GUI required).
 * Starts a real Claude Agent SDK session on the user's own subscription,
 * pipes it through the event transformer, and asserts at least one user-safe
 * narration/summary event arrives within the timeout. This is THE de-risk:
 * does the SDK surface streamed output outside the terminal as typed events.
 */
import { startSession, resolveClaudeExecutable } from '../src/main/sdk/session-runner.ts'
import { transform } from '../src/main/sdk/event-transformer.ts'
import type { FeedEvent } from '../src/shared/ipc-schemas.ts'

const TIMEOUT_MS = 30_000

function done(ok: boolean, msg: string): never {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${msg}`)
  process.exit(ok ? 0 : 1)
}

async function main(): Promise<void> {
  console.log(`engine: ${resolveClaudeExecutable()}`)

  const received: FeedEvent[] = []
  let settled = false

  const timer = setTimeout(() => {
    if (!settled) {
      settled = true
      done(false, `no feed event within ${TIMEOUT_MS / 1000}s`)
    }
  }, TIMEOUT_MS)

  const handle = startSession(
    {
      prompt: 'Reply with exactly this sentence and nothing else: Hello from Helm. Do not use any tools.',
      allowedTools: [], // text-only: the proof needs streaming, not execution
    },
    {
      onMessage: (sdkMsg) => {
        for (const ev of transform(handle.id, sdkMsg)) {
          received.push(ev)
          console.log(`  [${ev.kind}] ${ev.text.slice(0, 80)}`)
          if (!settled && (ev.kind === 'narration' || ev.kind === 'summary')) {
            settled = true
            clearTimeout(timer)
            void handle.close()
            done(true, `streamed a "${ev.kind}" feed event from a live SDK session`)
          }
        }
      },
      onError: (m) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          done(false, `SDK error: ${m}`)
        }
      },
      onClose: () => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          done(received.length > 0, `session closed with ${received.length} event(s) but none were narration/summary`)
        }
      },
    },
  )
}

void main()
