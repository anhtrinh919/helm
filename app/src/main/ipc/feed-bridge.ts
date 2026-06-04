import { randomUUID } from 'node:crypto'
import { ipcMain, type BrowserWindow } from 'electron'
import { ZodError } from 'zod'
import { startSession, SdkInitError } from '../sdk/session-runner'
import { transform } from '../sdk/event-transformer'
import { CH, StartProbeRequest, GetFeedRequest, type FeedEvent, type IpcError } from '../../shared/ipc-schemas'

/**
 * Group 1 IPC bridge. Holds an in-memory feed per session (DB persistence
 * arrives in Group 2). Every payload is Zod-validated; only transformed,
 * user-safe FeedEvents cross to the renderer.
 */

type GetWindow = () => BrowserWindow | null

function mapError(e: unknown): IpcError {
  if (e instanceof SdkInitError) return { error: 'sdk_init_failed', message: e.message }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'session_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

const feeds = new Map<string, FeedEvent[]>()

function record(getWindow: GetWindow, sessionId: string, ev: FeedEvent): void {
  const list = feeds.get(sessionId) ?? []
  list.push(ev)
  feeds.set(sessionId, list)
  const win = getWindow()
  if (win && !win.isDestroyed()) win.webContents.send(CH.feedEvent, { sessionId, event: ev })
}

export function registerFeedBridge(getWindow: GetWindow): void {
  ipcMain.handle(CH.startProbe, (_e, raw: unknown) => {
    try {
      const { prompt } = StartProbeRequest.parse(raw)
      const handle = startSession(
        { prompt, allowedTools: [] }, // Group 1 probe is text-only — no execution
        {
          onMessage: (msg) => {
            for (const ev of transform(handle.id, msg)) record(getWindow, handle.id, ev)
          },
          onError: (message) => {
            record(getWindow, handle.id, {
              id: randomUUID(),
              sessionId: handle.id,
              kind: 'error',
              text: message,
              refId: null,
              createdAt: Date.now(),
            })
          },
          onClose: () => {},
        },
      )
      feeds.set(handle.id, feeds.get(handle.id) ?? [])
      return { sessionId: handle.id }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.getFeed, (_e, raw: unknown) => {
    try {
      const { sessionId } = GetFeedRequest.parse(raw)
      return { events: feeds.get(sessionId) ?? [] }
    } catch (e) {
      return mapError(e)
    }
  })
}
