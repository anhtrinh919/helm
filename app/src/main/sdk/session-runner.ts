import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { query, type SDKMessage, type SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import type { SteerMode } from '../../shared/ipc-schemas'

/**
 * Wraps the Claude Agent SDK `query()` so the rest of the app never touches
 * raw SDK internals. Runs on the user's own Claude subscription via the local
 * `claude` executable — NOT the paid API. `pathToClaudeCodeExecutable` is
 * resolved on init; a missing path silently fails the SDK, so we guard it.
 */

export class SdkInitError extends Error {
  readonly code = 'sdk_init_failed' as const
}

let cachedPath: string | null = null

/** Resolve the local `claude` executable. Throws SdkInitError if absent. */
export function resolveClaudeExecutable(): string {
  if (cachedPath) return cachedPath
  try {
    const p = execSync('which claude', { encoding: 'utf8' }).trim()
    if (!p) throw new Error('empty path')
    cachedPath = p
    return p
  } catch {
    throw new SdkInitError(
      'Could not find the Claude engine on this machine — make sure Claude Code is installed and signed in.',
    )
  }
}

/**
 * A push-based async iterable of user turns. The SDK consumes this as the
 * streaming-input prompt, which keeps the session open so we can inject
 * steering messages (redirect / look-closer) mid-build.
 */
class InputChannel {
  private buffer: SDKUserMessage[] = []
  private waiting: ((v: IteratorResult<SDKUserMessage>) => void) | null = null
  private done = false

  push(text: string): void {
    if (this.done) return
    const msg: SDKUserMessage = {
      type: 'user',
      message: { role: 'user', content: text },
      parent_tool_use_id: null,
    }
    if (this.waiting) {
      const w = this.waiting
      this.waiting = null
      w({ value: msg, done: false })
    } else {
      this.buffer.push(msg)
    }
  }

  close(): void {
    this.done = true
    if (this.waiting) {
      const w = this.waiting
      this.waiting = null
      w({ value: undefined as unknown as SDKUserMessage, done: true })
    }
  }

  iterable(): AsyncIterable<SDKUserMessage> {
    const self = this
    return {
      [Symbol.asyncIterator](): AsyncIterator<SDKUserMessage> {
        return {
          next(): Promise<IteratorResult<SDKUserMessage>> {
            if (self.buffer.length) {
              return Promise.resolve({ value: self.buffer.shift() as SDKUserMessage, done: false })
            }
            if (self.done) {
              return Promise.resolve({ value: undefined as unknown as SDKUserMessage, done: true })
            }
            return new Promise((res) => {
              self.waiting = res
            })
          },
        }
      },
    }
  }
}

export type SessionPermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'

export interface StartSessionOptions {
  prompt: string
  /** Working directory for the agent. Defaults to a temp dir (sandboxed). */
  cwd?: string
  /**
   * Permission posture for the nested agent. Defaults to 'default' (prompts /
   * does not auto-run). Build sessions opt into a broader mode explicitly via
   * a wired permission handler — it is never assumed.
   */
  permissionMode?: SessionPermissionMode
  /** Restrict the toolset. Pass [] for a text-only session (e.g. the engine proof). */
  allowedTools?: string[]
}

export interface SessionCallbacks {
  onMessage: (msg: SDKMessage) => void
  onError: (message: string) => void
  onClose: () => void
}

export interface SessionHandle {
  readonly id: string
  steer(mode: SteerMode, text: string): Promise<void>
  /** Feed a plain user turn back in — used to resume after answering a decision. */
  reply(text: string): void
  close(): Promise<void>
}

/** Start a live scoped session against the Claude Agent SDK. */
export function startSession(opts: StartSessionOptions, cb: SessionCallbacks): SessionHandle {
  const id = randomUUID()
  const pathToClaudeCodeExecutable = resolveClaudeExecutable()
  const input = new InputChannel()

  const q = query({
    prompt: input.iterable(),
    options: {
      pathToClaudeCodeExecutable,
      cwd: opts.cwd ?? tmpdir(),
      permissionMode: opts.permissionMode ?? 'default',
      ...(opts.allowedTools ? { allowedTools: opts.allowedTools } : {}),
    },
  })

  // Seed the first user turn.
  input.push(opts.prompt)

  // Drain the SDK stream in the background.
  void (async () => {
    try {
      for await (const msg of q) cb.onMessage(msg)
      cb.onClose()
    } catch (err) {
      cb.onError(err instanceof Error ? err.message : 'The build engine stopped unexpectedly.')
      cb.onClose()
    }
  })()

  return {
    id,
    async steer(mode: SteerMode, text: string): Promise<void> {
      if (mode === 'interrupt') {
        try {
          await q.interrupt()
        } catch {
          /* interrupt is best-effort */
        }
        input.push(`Stop what you're doing. ${text}`.trim())
      } else if (mode === 'redirect') {
        input.push(`Change of direction — do it this way instead: ${text}`)
      } else {
        input.push(`Take a closer look at this: ${text}`)
      }
    },
    reply(text: string): void {
      input.push(text)
    },
    async close(): Promise<void> {
      try {
        await q.interrupt()
      } catch {
        /* best-effort */
      }
      input.close()
    },
  }
}
