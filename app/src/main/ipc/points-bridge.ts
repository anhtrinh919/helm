import { ipcMain, type BrowserWindow } from 'electron'
import { ZodError } from 'zod'
import {
  CH,
  ListPinsRequest,
  PointModeRequest,
  RegisterPointRequest,
  StartFixSessionRequest,
  type IpcError,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import {
  ArtifactDirError,
  NotFoundError,
  NotWaitingError,
  NoVisualContextError,
  PreviewNotLiveError,
} from '../db/errors'
import { getProject } from '../db/projects'
import { createCard, findBuildingCard, getCard } from '../db/cards'
import { createFixComment, listOpenPins } from '../db/fix-comments'
import { SdkInitError } from '../sdk/session-runner'
import type { PointCaptureService } from '../sdk/point-capture-service'
import type { DevServerManager } from '../sdk/dev-server-manager'
import type { SessionOrchestrator } from '../sdk/session-orchestrator'
import type { FixSessionQueue } from '../sdk/fix-session-queue'

function mapError(e: unknown): IpcError {
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof PreviewNotLiveError) return { error: 'preview_not_live' }
  if (e instanceof NotWaitingError) return { error: 'not_waiting' }
  if (e instanceof NoVisualContextError) return { error: 'no_visual_context' }
  if (e instanceof ArtifactDirError) return { error: 'artifact_dir_failed', message: e.message }
  if (e instanceof SdkInitError) return { error: 'sdk_init_failed', message: e.message }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'db_unavailable', message: e instanceof Error ? e.message : 'unknown error' }
}

export interface PointsBridgeDeps {
  capture?: PointCaptureService
  devServer?: DevServerManager
  orchestrator?: SessionOrchestrator
  fixQueue?: FixSessionQueue
  getWindow?: () => BrowserWindow | null
}

/** Point-and-fix IPC (Phase 3): file comments, list pins, start fixes, drive
 *  point mode. The optional deps keep validation-only tests cheap. */
export function registerPointsBridge(db: Db, deps: PointsBridgeDeps = {}): void {
  const { capture, devServer, orchestrator, fixQueue, getWindow } = deps

  const send = (channel: string, payload: unknown): void => {
    const win = getWindow?.()
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  }
  const pushPins = (projectId: string): void => {
    send(CH.pointsUpdate, { projectId, pins: listOpenPins(db, projectId) })
  }

  ipcMain.handle(CH.pointsRegister, (_e, raw: unknown) => {
    try {
      const req = RegisterPointRequest.parse(raw)
      getProject(db, req.projectId)
      if (devServer && devServer.getState(req.projectId).status !== 'live') {
        throw new PreviewNotLiveError('point-and-fix needs a running app')
      }

      // Element-level comments are identified by their geometry. The renderer
      // never holds the selector/screenshot — main merges its pending capture.
      const isElement = req.pinX != null || req.boundingBox != null
      const pending = capture?.consumePending(req.projectId) ?? null
      const visual = isElement
        ? {
            selector: req.selector ?? pending?.selector ?? undefined,
            boundingBox: req.boundingBox ?? pending?.boundingBox ?? undefined,
            screenshotCrop: req.screenshotCrop ?? pending?.screenshotCrop ?? undefined,
            pinX: req.pinX ?? pending?.pinX ?? undefined,
            pinY: req.pinY ?? pending?.pinY ?? undefined,
          }
        : {}

      const card = createCard(db, req.projectId, 'fix_comment', req.note, 'user_added', 'waiting')
      createFixComment(db, {
        cardId: card.id,
        projectId: req.projectId,
        ...visual,
        note: req.note,
        noteType: req.noteType,
      })
      send(CH.boardUpdate, { projectId: req.projectId, cardId: card.id, card })
      pushPins(req.projectId)
      return { card }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.fixSessionsStart, (_e, raw: unknown) => {
    try {
      const { projectId, cardId } = StartFixSessionRequest.parse(raw)
      getProject(db, projectId)
      const card = getCard(db, cardId)
      if (card.type !== 'fix_comment') throw new NotFoundError('not a fix-comment card')
      if (!orchestrator || !fixQueue) throw new ArtifactDirError('fix pipeline not wired')

      // Already queued → idempotent "still queued".
      if (fixQueue.isQueued(projectId, cardId)) return { session: null, queued: true as const }
      if (card.status !== 'waiting') throw new NotWaitingError('fix is not waiting to start')

      // One session at a time (Phase 3): a running fix OR a running build queues it.
      const busy = fixQueue.isActive(projectId) || findBuildingCard(db, projectId) != null
      if (busy) {
        fixQueue.enqueue(projectId, cardId)
        send(CH.boardUpdate, { projectId, cardId, card })
        return { session: null, queued: true as const }
      }

      const session = orchestrator.startFix(projectId, cardId)
      return { session, queued: false as const }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.pointsList, (_e, raw: unknown) => {
    try {
      const { projectId } = ListPinsRequest.parse(raw)
      getProject(db, projectId) // throws NotFoundError → not_found
      return { pins: listOpenPins(db, projectId) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.pointsActivate, (_e, raw: unknown) => {
    try {
      const { projectId } = PointModeRequest.parse(raw)
      getProject(db, projectId)
      capture?.activate(projectId)
      return { ok: true as const }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.pointsDeactivate, (_e, raw: unknown) => {
    try {
      const { projectId } = PointModeRequest.parse(raw)
      getProject(db, projectId)
      capture?.deactivate(projectId)
      return { ok: true as const }
    } catch (e) {
      return mapError(e)
    }
  })
}
