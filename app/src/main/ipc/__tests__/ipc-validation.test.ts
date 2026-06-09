import { describe, expect, it, beforeEach } from 'vitest'
import type { SessionCallbacks, SessionHandle, StartSessionOptions } from '../../sdk/session-runner'

/**
 * Group 8 integration hardening: every helm handler must validate its payload at
 * the Zod boundary and return a typed { error } response — never throw across the
 * bridge. The hybrid runtime registers handlers on the shared transport bus; we
 * mount every bridge, then fire malformed payloads at every channel and assert no
 * throw and a typed error. This is the test that caught the un-try/catch'd feed
 * bridge.
 */

import { bus } from '../../core/transport'
import { openDatabase, type Db } from '../../db/connection'

/** Reach the registered handlers through the bus (replaces the old electron mock). */
const handlers = {
  has: (ch: string): boolean => bus.has(ch),
  get: (ch: string) => (_e: unknown, raw: unknown) => bus.invoke(ch, raw),
}
import { SessionOrchestrator } from '../../sdk/session-orchestrator'
import { WizardOrchestrator } from '../../sdk/wizard-orchestrator'
import { registerFeedBridge } from '../feed-bridge'
import { registerDataBridge } from '../data-bridge'
import { registerSessionBridge } from '../session-bridge'
import { registerWizardBridge } from '../wizard-bridge'
import { CH } from '../../../shared/ipc-schemas'

/** A runner stand-in so no real Claude SDK session is ever started. */
function fakeRunner(_o: StartSessionOptions, _cb: SessionCallbacks): SessionHandle {
  return { id: 'fake', steer: async () => {}, reply: () => {}, close: async () => {} }
}

const MALFORMED: unknown[] = [null, undefined, 42, 'a string', [], { wrong: 'shape' }, true]

/** Channels that parse a params object — they MUST reject malformed input. */
const PARAM_CHANNELS = [
  CH.startProbe,
  CH.getFeed,
  CH.projectsCreate,
  CH.projectsGet,
  CH.cardsCreate,
  CH.cardsUpdateStatus,
  CH.cardsApproveCheckpoint,
  CH.sessionsStart,
  CH.sessionsSteer,
  CH.sessionsAnswerDecision,
  CH.sessionsGetQuestions,
  CH.sessionsReopenQuestion,
  CH.wizardStartScoping,
  CH.wizardAnswer,
  CH.wizardApprove,
]

let db: Db
beforeEach(() => {
  bus.reset()
  db = openDatabase(':memory:')
  const sessionOrch = new SessionOrchestrator(db, () => null, fakeRunner)
  const wizardOrch = new WizardOrchestrator(db, fakeRunner)
  registerFeedBridge(db, () => null)
  registerDataBridge(db, () => null)
  registerSessionBridge(db, sessionOrch)
  registerWizardBridge(db, wizardOrch, () => null)
})

const isTypedError = (v: unknown): v is { error: string } =>
  typeof v === 'object' && v !== null && 'error' in v && typeof (v as { error: unknown }).error === 'string'

describe('IPC validation hardening', () => {
  it('registers a handler for every channel a bridge owns', () => {
    for (const ch of PARAM_CHANNELS) expect(handlers.has(ch), `missing handler: ${ch}`).toBe(true)
    expect(handlers.has(CH.projectsList)).toBe(true)
  })

  it('every param channel returns a typed error for malformed payloads — never throws', async () => {
    for (const ch of PARAM_CHANNELS) {
      const handler = handlers.get(ch)!
      for (const bad of MALFORMED) {
        let result: unknown
        await expect(
          (async () => {
            result = await handler({}, bad)
          })(),
          `${ch} threw on ${JSON.stringify(bad)}`,
        ).resolves.toBeUndefined()
        expect(isTypedError(result), `${ch} did not return a typed error for ${JSON.stringify(bad)}`).toBe(true)
      }
    }
  })

  it('a no-param channel (projects:list) tolerates a junk payload without throwing', async () => {
    const handler = handlers.get(CH.projectsList)!
    for (const bad of MALFORMED) {
      const result = await handler({}, bad)
      // It ignores params; success shape, not an error.
      expect(result).toHaveProperty('projects')
    }
  })

  it('malformed payloads never start a real session (no side effects leak past the gate)', async () => {
    // sessions:start with junk must be rejected before the orchestrator runs.
    const result = await handlers.get(CH.sessionsStart)!({}, { projectId: 123 })
    expect(isTypedError(result)).toBe(true)
  })
})
