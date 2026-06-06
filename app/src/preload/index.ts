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
    start: (projectId, cardId) => ipcRenderer.invoke(CH.sessionsStart, { projectId, cardId }),
    steer: (sessionId, mode, text) => ipcRenderer.invoke(CH.sessionsSteer, { sessionId, mode, text }),
    answerDecision: (sessionId, questionId, answer) =>
      ipcRenderer.invoke(CH.sessionsAnswerDecision, { sessionId, questionId, answer }),
    getQuestions: (sessionId) => ipcRenderer.invoke(CH.sessionsGetQuestions, { sessionId }),
    reopenQuestion: (sessionId, questionId) =>
      ipcRenderer.invoke(CH.sessionsReopenQuestion, { sessionId, questionId }),
  },
  wizard: {
    startScoping: (projectId, idea) => ipcRenderer.invoke(CH.wizardStartScoping, { projectId, idea }),
    answerScoping: (sessionId, answer) => ipcRenderer.invoke(CH.wizardAnswer, { sessionId, answer }),
    approvePlan: (projectId, name, plan) =>
      ipcRenderer.invoke(CH.wizardApprove, { projectId, name, plan }),
  },
  preview: {
    getState: (projectId) => ipcRenderer.invoke(CH.previewGetState, { projectId }),
    startServer: (projectId) => ipcRenderer.invoke(CH.devserverStart, { projectId }),
    stopServer: (projectId) => ipcRenderer.invoke(CH.devserverStop, { projectId }),
  },
  points: {
    register: (req) => ipcRenderer.invoke(CH.pointsRegister, req),
    list: (projectId) => ipcRenderer.invoke(CH.pointsList, { projectId }),
    activate: (projectId) => ipcRenderer.invoke(CH.pointsActivate, { projectId }),
    deactivate: (projectId) => ipcRenderer.invoke(CH.pointsDeactivate, { projectId }),
  },
  fixSessions: {
    start: (projectId, cardId) => ipcRenderer.invoke(CH.fixSessionsStart, { projectId, cardId }),
  },
  events: {
    onBoardUpdate: (cb) => subscribe(CH.boardUpdate, cb),
    onBackgroundStatus: (cb) => subscribe(CH.backgroundStatus, cb),
    onFeedEvent: (cb) => subscribe(CH.feedEvent, cb),
    onQuestionUpdate: (cb) => subscribe(CH.questionUpdate, cb),
    onPreviewUpdate: (cb) => subscribe(CH.previewUpdate, cb),
    onPinsUpdate: (cb) => subscribe(CH.pointsUpdate, cb),
    onPointCapture: (cb) => subscribe(CH.pointCaptured, cb),
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
