import { contextBridge, ipcRenderer } from 'electron'
import {
  CH,
  type StartProbeResponse,
  type GetFeedResponse,
  type FeedEventPush,
} from '../shared/ipc-schemas'

/** The only surface the renderer can touch. No Node, no ipcRenderer directly. */
const api = {
  startProbe: (prompt: string): Promise<StartProbeResponse> =>
    ipcRenderer.invoke(CH.startProbe, { prompt }),
  getFeed: (sessionId: string): Promise<GetFeedResponse> =>
    ipcRenderer.invoke(CH.getFeed, { sessionId }),
  onFeedEvent: (cb: (push: FeedEventPush) => void): (() => void) => {
    const listener = (_e: unknown, push: FeedEventPush): void => cb(push)
    ipcRenderer.on(CH.feedEvent, listener)
    return () => ipcRenderer.removeListener(CH.feedEvent, listener)
  },
}

export type HelmApi = typeof api

contextBridge.exposeInMainWorld('helm', api)
