import { CH } from '../../shared/ipc-schemas'
import type { HelmApi } from '../../shared/bridge-api'

/**
 * The renderer's `helm` client over the hybrid runtime (Phase 1, Group 0).
 *
 * Requests are `POST /helm/<channel>` with a JSON body; server→client pushes
 * arrive on a single WebSocket at `/ws` as `{ channel, payload }` frames. Both are
 * same-origin: in dev Vite proxies them to the core, in production the core serves
 * the UI itself, and in the Electron shell the window is pointed at the core URL.
 *
 * The surface mirrors the old Electron preload exactly — every request shape is
 * identical, so `HelmApi` and every renderer consumer are untouched. Construction
 * is side-effect-free (no network until the first call/subscription) so this is
 * import-safe under Node (unit tests).
 */

async function post<T>(channel: string, body?: unknown): Promise<T> {
  const res = await fetch(`/helm/${channel}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  return (await res.json()) as T
}

type Listener = (payload: unknown) => void
const listeners = new Map<string, Set<Listener>>()
let socket: WebSocket | null = null

function ensureSocket(): void {
  if (socket || typeof window === 'undefined') return
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${proto}//${window.location.host}/ws`)
  socket = ws
  ws.onmessage = (e: MessageEvent) => {
    try {
      const { channel, payload } = JSON.parse(String(e.data)) as { channel: string; payload: unknown }
      listeners.get(channel)?.forEach((l) => l(payload))
    } catch {
      // ignore malformed frames
    }
  }
  const reconnect = (): void => {
    socket = null
    // Listeners persist in the map; a fresh socket keeps delivering to them.
    setTimeout(ensureSocket, 1000)
  }
  ws.onclose = reconnect
  ws.onerror = () => ws.close()
}

function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  ensureSocket()
  let set = listeners.get(channel)
  if (!set) {
    set = new Set()
    listeners.set(channel, set)
  }
  const listener = cb as Listener
  set.add(listener)
  return () => set?.delete(listener)
}

export function createHttpBridge(): HelmApi {
  return {
    projects: {
      list: () => post(CH.projectsList),
      create: (name) => post(CH.projectsCreate, { name }),
      get: (projectId) => post(CH.projectsGet, { projectId }),
      rename: (projectId, name) => post(CH.projectsRename, { projectId, name }),
      delete: (projectId) => post(CH.projectsDelete, { projectId }),
      setMode: (projectId, mode) => post(CH.projectsSetMode, { projectId, mode }),
      setRailStep: (projectId, step) => post(CH.projectsSetRailStep, { projectId, step }),
      reorder: (orderedIds) => post(CH.projectsReorder, { orderedIds }),
    },
    shelf: {
      list: (projectId) => post(CH.shelfList, { projectId }),
      add: (projectId, title) => post(CH.shelfAdd, { projectId, title }),
      promote: (itemId, projectId) => post(CH.shelfPromote, { itemId, projectId }),
      remove: (itemId) => post(CH.shelfRemove, { itemId }),
    },
    import: {
      scan: (folderPath) => post(CH.importScan, { folderPath }),
      start: (projectId, folderPath, startCommand, port) =>
        post(CH.importStart, { projectId, folderPath, startCommand, port }),
    },
    cards: {
      create: (projectId, type, title) => post(CH.cardsCreate, { projectId, type, title }),
      updateStatus: (cardId, status) => post(CH.cardsUpdateStatus, { cardId, status }),
      approveCheckpoint: (cardId, verdict, flagNote) =>
        post(CH.cardsApproveCheckpoint, { cardId, verdict, flagNote }),
      setOutcome: (cardId, outcome) => post(CH.cardsSetOutcome, { cardId, outcome }),
    },
    sessions: {
      start: (projectId, cardId) => post(CH.sessionsStart, { projectId, cardId }),
      steer: (sessionId, mode, text) => post(CH.sessionsSteer, { sessionId, mode, text }),
      answerDecision: (sessionId, questionId, answer) =>
        post(CH.sessionsAnswerDecision, { sessionId, questionId, answer }),
      getQuestions: (sessionId) => post(CH.sessionsGetQuestions, { sessionId }),
      reopenQuestion: (sessionId, questionId) =>
        post(CH.sessionsReopenQuestion, { sessionId, questionId }),
      stop: (sessionId) => post(CH.sessionsStop, { sessionId }),
    },
    wizard: {
      startScoping: (projectId, idea, mode) => post(CH.wizardStartScoping, { projectId, idea, mode }),
      answerScoping: (sessionId, answer) => post(CH.wizardAnswer, { sessionId, answer }),
      revisePlan: (projectId, idea, mode, name, plan, note) =>
        post(CH.wizardRevise, { projectId, idea, mode, name, plan, note }),
      approvePlan: (projectId, name, plan) => post(CH.wizardApprove, { projectId, name, plan }),
      saveState: (projectId, state) => post(CH.wizardSaveState, { projectId, state }),
      getState: (projectId) => post(CH.wizardGetState, { projectId }),
    },
    preview: {
      getState: (projectId) => post(CH.previewGetState, { projectId }),
      startServer: (projectId) => post(CH.devserverStart, { projectId }),
      stopServer: (projectId) => post(CH.devserverStop, { projectId }),
    },
    points: {
      register: (req) => post(CH.pointsRegister, req),
      list: (projectId) => post(CH.pointsList, { projectId }),
      activate: (projectId) => post(CH.pointsActivate, { projectId }),
      deactivate: (projectId) => post(CH.pointsDeactivate, { projectId }),
      activateTextEdit: (projectId) => post(CH.pointsTextEditActivate, { projectId }),
      deactivateTextEdit: (projectId) => post(CH.pointsTextEditDeactivate, { projectId }),
      registerTextEdit: (req) => post(CH.pointsRegisterTextEdit, req),
    },
    fixSessions: {
      start: (projectId, cardId) => post(CH.fixSessionsStart, { projectId, cardId }),
    },
    history: {
      decisions: (projectId) => post(CH.historyDecisions, { projectId }),
      progress: (projectId) => post(CH.historyProgress, { projectId }),
      docs: (projectId) => post(CH.historyDocs, { projectId }),
    },
    events: {
      onBoardUpdate: (cb) => subscribe(CH.boardUpdate, cb),
      onBackgroundStatus: (cb) => subscribe(CH.backgroundStatus, cb),
      onFeedEvent: (cb) => subscribe(CH.feedEvent, cb),
      onQuestionUpdate: (cb) => subscribe(CH.questionUpdate, cb),
      onPreviewUpdate: (cb) => subscribe(CH.previewUpdate, cb),
      onPinsUpdate: (cb) => subscribe(CH.pointsUpdate, cb),
      onPointCapture: (cb) => subscribe(CH.pointCaptured, cb),
      onShelfUpdate: (cb) => subscribe(CH.shelfUpdated, cb),
    },
    startProbe: (prompt) => post(CH.startProbe, { prompt }),
    getFeed: (sessionId) => post(CH.getFeed, { sessionId }),
  }
}
