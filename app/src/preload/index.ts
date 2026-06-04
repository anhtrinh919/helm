import { contextBridge, ipcRenderer } from 'electron'
import { CH } from '../shared/ipc-schemas'
import type { HelmApi } from '../shared/bridge-api'

/** The only surface the renderer can touch. No Node, no ipcRenderer directly. */
const api: HelmApi = {
  projects: {
    list: () => ipcRenderer.invoke(CH.projectsList),
    create: (name) => ipcRenderer.invoke(CH.projectsCreate, { name }),
    get: (projectId) => ipcRenderer.invoke(CH.projectsGet, { projectId }),
  },
  cards: {
    create: (projectId, type, title) => ipcRenderer.invoke(CH.cardsCreate, { projectId, type, title }),
    updateStatus: (cardId, status) => ipcRenderer.invoke(CH.cardsUpdateStatus, { cardId, status }),
    approveCheckpoint: (cardId, verdict, flagNote) =>
      ipcRenderer.invoke(CH.cardsApproveCheckpoint, { cardId, verdict, flagNote }),
  },
  sessions: {
    reopenQuestion: (sessionId, questionId) =>
      ipcRenderer.invoke(CH.sessionsReopenQuestion, { sessionId, questionId }),
  },
  events: {
    onBoardUpdate: (cb) => subscribe(CH.boardUpdate, cb),
    onBackgroundStatus: (cb) => subscribe(CH.backgroundStatus, cb),
    onFeedEvent: (cb) => subscribe(CH.feedEvent, cb),
  },
  startProbe: (prompt) => ipcRenderer.invoke(CH.startProbe, { prompt }),
  getFeed: (sessionId) => ipcRenderer.invoke(CH.getFeed, { sessionId }),
}

function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_e: unknown, payload: T): void => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('helm', api)
