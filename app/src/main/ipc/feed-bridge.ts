import { randomUUID } from 'node:crypto'
import { ipcMain, type BrowserWindow } from 'electron'
import { startSession } from '../sdk/session-runner'
import { transform } from '../sdk/event-transformer'
import { CH, StartProbeRequest, GetFeedRequest, type FeedEvent } from '../../shared/ipc-schemas'

/**
 * Group 1 IPC bridge. Holds an in-memory feed per session (DB persistence
 * arrives in Group 2). Every payload is Zod-validated; only transformed,
 * user-safe FeedEvents cross to the renderer.
 */

const feeds = new Map<string, FeedEvent[]>()

function record(win: BrowserWindow, sessionId: string, ev: FeedEvent): void {
  const list = feeds.get(sessionId) ?? []
  list.push(ev)
  feeds.set(sessionId, list)
  if (!win.isDestroyed()) win.webContents.send(CH.feedEvent, { sessionId, event: ev })
}

export function registerFeedBridge(win: BrowserWindow): void {
  ipcMain.handle(CH.startProbe, (_e, raw: unknown) => {
    const { prompt } = StartProbeRequest.parse(raw)
    const handle = startSession(
      { prompt, allowedTools: [] }, // Group 1 probe is text-only — no execution
      {
        onMessage: (msg) => {
          for (const ev of transform(handle.id, msg)) record(win, handle.id, ev)
        },
        onError: (message) => {
          record(win, handle.id, {
            id: randomUUID(),
            sessionId: handle.id,
            kind: 'error',
            text: message,
            createdAt: Date.now(),
          })
        },
        onClose: () => {},
      },
    )
    feeds.set(handle.id, feeds.get(handle.id) ?? [])
    return { sessionId: handle.id }
  })

  ipcMain.handle(CH.getFeed, (_e, raw: unknown) => {
    const { sessionId } = GetFeedRequest.parse(raw)
    return { events: feeds.get(sessionId) ?? [] }
  })
}
