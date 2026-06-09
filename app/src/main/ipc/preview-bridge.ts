import { ipcMain } from '../core/transport'
import { ZodError } from 'zod'
import {
  CH,
  GetPreviewStateRequest,
  StartDevServerRequest,
  StopDevServerRequest,
  type IpcError,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import {
  AlreadyRunningError,
  DevServerNotRunningError,
  NoArtifactError,
  NotFoundError,
  StartFailedError,
} from '../db/errors'
import { getProject } from '../db/projects'
import type { DevServerManager } from '../sdk/dev-server-manager'

function mapError(e: unknown): IpcError {
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof NoArtifactError) return { error: 'no_artifact' }
  if (e instanceof StartFailedError) return { error: 'start_failed', message: e.message }
  if (e instanceof DevServerNotRunningError) return { error: 'not_running' }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'db_unavailable', message: e instanceof Error ? e.message : 'unknown error' }
}

/** Live Preview IPC (Phase 2): query preview state + control the dev server. */
export function registerPreviewBridge(db: Db, devServer: DevServerManager): void {
  ipcMain.handle(CH.previewGetState, (_e, raw: unknown) => {
    try {
      const { projectId } = GetPreviewStateRequest.parse(raw)
      getProject(db, projectId) // throws NotFoundError → not_found
      return { state: devServer.getState(projectId) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.devserverStart, async (_e, raw: unknown) => {
    try {
      const { projectId } = StartDevServerRequest.parse(raw)
      getProject(db, projectId)
      const url = await devServer.start(projectId)
      return { url }
    } catch (e) {
      // already_running is a benign "already up" — return the existing URL with the code.
      if (e instanceof AlreadyRunningError) return { error: 'already_running', url: e.url }
      return mapError(e)
    }
  })

  ipcMain.handle(CH.devserverStop, (_e, raw: unknown) => {
    try {
      const { projectId } = StopDevServerRequest.parse(raw)
      getProject(db, projectId)
      if (!devServer.isRunning(projectId)) throw new DevServerNotRunningError()
      devServer.stop(projectId)
      return { stopped: true as const }
    } catch (e) {
      return mapError(e)
    }
  })
}
