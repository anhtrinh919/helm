import { ipcMain, type HelmWindow } from '../core/transport'
import { ZodError } from 'zod'
import {
  CH,
  ListPinsRequest,
  PointModeRequest,
  RegisterPointRequest,
  RegisterTextEditRequest,
  StartFixSessionRequest,
  TextEditModeRequest,
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
import { createCard, deleteCard, getCard } from '../db/cards'
import { createFixComment, listOpenPins } from '../db/fix-comments'
import { isIpcError } from '../../shared/ipc-schemas'
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

      // Element-level comments are identified by their geometry. On the Electron
      // path the renderer never holds the selector/screenshot — those exist only
      // in main's pending capture, merged here. On the browser-proxy path the
      // same-origin proxy already exposed the selector, so it arrives in the
      // request (req.selector); when present we anchor to it directly and SKIP the
      // pending-capture merge (there is no main-side capture in the browser path).
      const isElement = req.pinX != null || req.boundingBox != null
      const browserSelector = req.selector?.trim()
      const visual = !isElement
        ? {}
        : browserSelector
          ? {
              selector: browserSelector,
              boundingBox: req.boundingBox ?? undefined,
              pinX: req.pinX ?? undefined,
              pinY: req.pinY ?? undefined,
            }
          : (() => {
              const pending = capture?.consumePending(req.projectId) ?? null
              return {
                selector: pending?.selector ?? undefined,
                boundingBox: req.boundingBox ?? pending?.boundingBox ?? undefined,
                screenshotCrop: pending?.screenshotCrop ?? undefined,
                pinX: req.pinX ?? pending?.pinX ?? undefined,
                pinY: req.pinY ?? pending?.pinY ?? undefined,
              }
            })()

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

  /* ------------------------- inline text edit (Group 5) ------------------------- */

  ipcMain.handle(CH.pointsTextEditActivate, (_e, raw: unknown) => {
    try {
      const { projectId } = TextEditModeRequest.parse(raw)
      getProject(db, projectId)
      // Mirror points:register's liveness rule, but surface it as the inline-edit
      // contract error so the UI can disable "Edit text here" precisely.
      if (!devServer || devServer.getState(projectId).status !== 'live') {
        return { error: 'webview_not_ready' as const }
      }
      if (!capture?.activateTextEdit(projectId)) {
        return { error: 'webview_not_ready' as const }
      }
      return { ok: true as const }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.pointsTextEditDeactivate, (_e, raw: unknown) => {
    try {
      const { projectId } = TextEditModeRequest.parse(raw)
      getProject(db, projectId)
      capture?.deactivateTextEdit(projectId)
      return { ok: true as const }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.pointsRegisterTextEdit, (_e, raw: unknown) => {
    let createdCardId: string | null = null
    try {
      const req = RegisterTextEditRequest.parse(raw)
      getProject(db, req.projectId)

      const selector = req.selector.trim()
      const newText = req.newText.trim()
      // Zod already rejects an empty selector; guard whitespace-only + empty newText.
      if (!selector || !newText) return { error: 'invalid_input' as const }
      if (newText === req.oldText.trim()) return { error: 'no_change' as const }

      if (devServer && devServer.getState(req.projectId).status !== 'live') {
        throw new PreviewNotLiveError('inline text edit needs a running app')
      }

      // The edit reuses the existing fix pipeline: a selector-anchored fix_comment
      // whose note is a plain-language change instruction the agent applies.
      const note = `Change the text on this element from «${req.oldText}» to «${newText}»`
      const bare = createCard(db, req.projectId, 'fix_comment', note, 'user_added', 'waiting')
      createdCardId = bare.id
      createFixComment(db, {
        cardId: bare.id,
        projectId: req.projectId,
        selector,
        note,
        noteType: 'change',
      })

      // Spawn the fix through the SAME path point-and-fix uses. On any failure
      // (throw or typed error result) roll the just-created card back so no
      // orphan fix_comment lingers, and report session_error.
      if (!orchestrator) {
        deleteCard(db, bare.id)
        return { error: 'session_error' as const }
      }
      let spawn: unknown
      try {
        spawn = orchestrator.startOrQueueFix(req.projectId, bare.id)
      } catch {
        deleteCard(db, bare.id)
        return { error: 'session_error' as const }
      }
      if (isIpcError(spawn)) {
        deleteCard(db, bare.id)
        return { error: 'session_error' as const }
      }

      const card = getCard(db, bare.id)
      send(CH.boardUpdate, { projectId: req.projectId, cardId: card.id, card })
      pushPins(req.projectId)
      return { card }
    } catch (e) {
      if (createdCardId) {
        try {
          deleteCard(db, createdCardId)
        } catch {
          /* best-effort rollback */
        }
      }
      return mapError(e)
    }
  })
}
