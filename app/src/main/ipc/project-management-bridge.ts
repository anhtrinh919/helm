import { ipcMain } from '../core/transport'
import { ZodError } from 'zod'
import {
  CH,
  DeleteProjectRequest,
  RenameProjectRequest,
  SetModeRequest,
  SetRailStepRequest,
  ReorderProjectsRequest,
  type IpcError,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import { NotFoundError } from '../db/errors'
import {
  deleteProject,
  getProject,
  listProjects,
  renameProject,
  reorderProjects,
  setProjectMode,
  setRailStep,
} from '../db/projects'
import type { DevServerManager } from '../sdk/dev-server-manager'

function mapError(e: unknown): IpcError {
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'db_write_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

/** Phase 4: project management (rename, delete) + mode/rail transitions. */
export function registerProjectManagementBridge(db: Db, devServer?: DevServerManager): void {
  ipcMain.handle(CH.projectsRename, (_e, raw: unknown) => {
    try {
      const { projectId, name } = RenameProjectRequest.parse(raw)
      return { project: renameProject(db, projectId, name) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.projectsDelete, (_e, raw: unknown) => {
    try {
      const { projectId } = DeleteProjectRequest.parse(raw)
      getProject(db, projectId) // not_found before any side effect
      // Bring the project's dev server down before the row (and FK cascade) goes.
      try {
        devServer?.stop(projectId)
      } catch {
        /* best effort — no server up is fine */
      }
      deleteProject(db, projectId)
      return { ok: true as const }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.projectsSetMode, (_e, raw: unknown) => {
    try {
      const { projectId, mode } = SetModeRequest.parse(raw)
      return { project: setProjectMode(db, projectId, mode) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.projectsSetRailStep, (_e, raw: unknown) => {
    try {
      const { projectId, step } = SetRailStepRequest.parse(raw)
      const project = getProject(db, projectId)
      const max = project.plan?.length ?? 0
      // step === max is legal: it is "past the last step" — the celebration trigger.
      if (step > max) return { error: 'step_out_of_bounds', message: `max is ${max}` }
      return { project: setRailStep(db, projectId, step) }
    } catch (e) {
      return mapError(e)
    }
  })

  // Phase 1: persist a new project order. The client sends the full ordered id list.
  ipcMain.handle(CH.projectsReorder, (_e, raw: unknown) => {
    try {
      const { orderedIds } = ReorderProjectsRequest.parse(raw)
      const all = listProjects(db).map((p) => p.id)
      const known = new Set(all)
      for (const id of orderedIds) {
        if (!known.has(id)) return { error: 'unknown_project', id }
      }
      const unique = new Set(orderedIds)
      if (unique.size !== orderedIds.length || orderedIds.length !== all.length) {
        return { error: 'incomplete_list' }
      }
      reorderProjects(db, orderedIds)
      return { ok: true as const }
    } catch (e) {
      if (e instanceof ZodError) return mapError(e)
      return { error: 'db_error', message: e instanceof Error ? e.message : 'unknown error' }
    }
  })
}
