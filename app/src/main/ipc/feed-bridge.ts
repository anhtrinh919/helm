import { ipcMain, type HelmWindow } from '../core/transport'
import { ZodError } from 'zod'
import { startSession, SdkInitError } from '../sdk/session-runner'
import { transform, makeFeedEvent } from '../sdk/event-transformer'
import type { Db } from '../db/connection'
import { getEvents } from '../db/feed-events'
import { CH, StartProbeRequest, GetFeedRequest, type IpcError } from '../../shared/ipc-schemas'

/**
 * Feed IPC. `sessions:get-feed` is the renderer's backfill-on-open path and
 * reads the single source of truth — the persisted feed in SQLite (the live
 * orchestrator writes there and pushes `feed:event`). `sessions:start-probe` is
 * a dev-only smoke test of the live engine; it streams via push and stores
 * nothing. Every payload is Zod-validated and every handler returns a typed error.
 */

type GetWindow = () => HelmWindow | null

function mapError(e: unknown): IpcError {
  if (e instanceof SdkInitError) return { error: 'sdk_init_failed', message: e.message }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'session_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

export function registerFeedBridge(db: Db, getWindow: GetWindow): void {
  const push = (sessionId: string, event: ReturnType<typeof makeFeedEvent>): void => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send(CH.feedEvent, { sessionId, event })
  }

  ipcMain.handle(CH.startProbe, (_e, raw: unknown) => {
    try {
      const { prompt } = StartProbeRequest.parse(raw)
      const handle = startSession(
        { prompt, allowedTools: [] }, // Group 1 probe is text-only — no execution
        {
          onMessage: (msg) => {
            for (const ev of transform(handle.id, msg)) push(handle.id, ev)
          },
          onError: (message) => push(handle.id, makeFeedEvent(handle.id, 'error', message)),
          onClose: () => {},
        },
      )
      return { sessionId: handle.id }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.getFeed, (_e, raw: unknown) => {
    try {
      const { sessionId, afterId } = GetFeedRequest.parse(raw)
      return { events: getEvents(db, sessionId, afterId) }
    } catch (e) {
      return mapError(e)
    }
  })
}
