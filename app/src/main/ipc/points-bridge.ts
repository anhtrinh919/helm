import { ipcMain } from 'electron'
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
import { NotFoundError } from '../db/errors'
import { getProject } from '../db/projects'
import { listOpenPins } from '../db/fix-comments'
import type { PointCaptureService } from '../sdk/point-capture-service'

function mapError(e: unknown): IpcError {
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'db_unavailable', message: e instanceof Error ? e.message : 'unknown error' }
}

/** Point-and-fix IPC (Phase 3). Register/start are stubs until Group 4 wires
 *  the queue + orchestration; pins listing + point-mode lifecycle are live. */
export function registerPointsBridge(db: Db, capture?: PointCaptureService): void {
  ipcMain.handle(CH.pointsRegister, (_e, raw: unknown) => {
    try {
      RegisterPointRequest.parse(raw)
      return { error: 'not_implemented' }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.fixSessionsStart, (_e, raw: unknown) => {
    try {
      StartFixSessionRequest.parse(raw)
      return { error: 'not_implemented' }
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
