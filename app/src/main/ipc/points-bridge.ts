import { ipcMain, type HelmWindow } from '../core/transport'
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
import { createCard, getCard } from '../db/cards'
import { createFixComment, listOpenPins } from '../db/fix-comments'
import { SdkInitError } from '../sdk/session-runner'
import type { PointCaptureService } from '../sdk/point-capture-service'
import type { DevServerManager } from '../sdk/dev-server-manager'
import type { SessionOrchestrator } from '../sdk/session-orchestrator'

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
  getWindow?: () => HelmWindow | null
}

/** Point-and-fix IPC (Phase 3): file comments, list pins, start fixes, drive
 *  point mode. Parse-and-delegate only — the fix-session policy (queue, busy
 *  rule, checkpoint outcomes) lives in the orchestrator. The optional deps
 *  keep validation-only tests cheap. */
export function registerPointsBridge(db: Db, deps: PointsBridgeDeps = {}): void {
  const { capture, devServer, orchestrator, getWindow } = deps

  const send = (channel: string, payload: unknown): void => {
    const win = getWindow?.()
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  }
  const queuedIds = (projectId: string): string[] =>
    orchestrator?.queuedFixCardIds(projectId) ?? []
  const pushPins = (projectId: string): void => {
    send(CH.pointsUpdate, {
      projectId,
      pins: listOpenPins(db, projectId),
      queuedCardIds: queuedIds(projectId),
    })
  }

  ipcMain.handle(CH.pointsRegister, (_e, raw: unknown) => {
    try {
      const req = RegisterPointRequest.parse(raw)
      getProject(db, req.projectId)
      if (devServer && devServer.getState(req.projectId).status !== 'live') {
        throw new PreviewNotLiveError('point-and-fix needs a running app')
      }

      // Element-level comments are identified by their geometry. The renderer
      // never holds the selector/screenshot — those exist only in main's
      // pending capture, merged here.
      const isElement = req.pinX != null || req.boundingBox != null
      const pending = capture?.consumePending(req.projectId) ?? null
      const visual = isElement
        ? {
            selector: pending?.selector ?? undefined,
            boundingBox: req.boundingBox ?? pending?.boundingBox ?? undefined,
            screenshotCrop: pending?.screenshotCrop ?? undefined,
            pinX: req.pinX ?? pending?.pinX ?? undefined,
            pinY: req.pinY ?? pending?.pinY ?? undefined,
          }
        : {}

      const bare = createCard(db, req.projectId, 'fix_comment', req.note, 'user_added', 'waiting')
      createFixComment(db, {
        cardId: bare.id,
        projectId: req.projectId,
        ...visual,
        note: req.note,
        noteType: req.noteType,
      })
      // Re-read so the card carries its fix dressing (noteType/pageLevel).
      const card = getCard(db, bare.id)
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
      if (getCard(db, cardId).type !== 'fix_comment') {
        throw new NotFoundError('not a fix-comment card')
      }
      if (!orchestrator) throw new ArtifactDirError('fix pipeline not wired')
      return orchestrator.startOrQueueFix(projectId, cardId)
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.pointsList, (_e, raw: unknown) => {
    try {
      const { projectId } = ListPinsRequest.parse(raw)
      getProject(db, projectId) // throws NotFoundError → not_found
      return { pins: listOpenPins(db, projectId), queuedCardIds: queuedIds(projectId) }
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
