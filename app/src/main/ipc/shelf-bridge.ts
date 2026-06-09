import { ipcMain, type HelmWindow } from '../core/transport'
import { ZodError } from 'zod'
import {
  CH,
  ShelfAddRequest,
  ShelfListRequest,
  ShelfPromoteRequest,
  RemoveShelfItemRequest,
  type Card,
  type IpcError,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import { NotFoundError } from '../db/errors'
import { addShelfItem, listShelfItems, promoteShelfItem, removeShelfItem } from '../db/shelf'

type GetWindow = () => HelmWindow | null

function mapError(e: unknown): IpcError {
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'db_write_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

/**
 * Phase-1 shelf channels (`shelf:remove`, and any future Phase-1 handler) follow
 * the new contract that surfaces a generic DB failure as `db_error`, matching
 * `cards:set-outcome` / `projects:reorder`. The pre-existing channels
 * (`shelf:list/add/promote`) keep their original `db_write_failed` shape via the
 * shared `mapError` above — don't migrate those.
 */
function mapPhase1Error(e: unknown): IpcError {
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'db_error', message: e instanceof Error ? e.message : 'unknown error' }
}

/**
 * Phase 4 "For later" shelf. Every mutation pushes the full per-project list
 * (CH.shelfUpdated) so the panel stays live — including adds that arrive from
 * the agent's park_to_shelf triage, not just user actions.
 */
export function registerShelfBridge(db: Db, getWindow: GetWindow): void {
  const pushShelf = (projectId: string): void => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send(CH.shelfUpdated, { projectId, items: listShelfItems(db, projectId) })
    }
  }

  ipcMain.handle(CH.shelfList, (_e, raw: unknown) => {
    try {
      const { projectId } = ShelfListRequest.parse(raw)
      return { items: listShelfItems(db, projectId) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.shelfAdd, (_e, raw: unknown) => {
    try {
      const { projectId, title } = ShelfAddRequest.parse(raw)
      const item = addShelfItem(db, projectId, title)
      pushShelf(projectId)
      return { item }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.shelfPromote, (_e, raw: unknown) => {
    try {
      const { itemId, projectId } = ShelfPromoteRequest.parse(raw)
      // Contract specifies a distinct `card_create_failed` for board-card creation
      // failure, but promoteShelfItem does not separately signal that today — a
      // failed card insert throws like any other DB error and surfaces as the
      // mapped (`db_write_failed`) error. TODO: thread a distinct card_create_failed
      // out of the shelf DB layer once it can detect the create-step failure.
      const card: Card = promoteShelfItem(db, itemId, projectId)
      pushShelf(projectId)
      const win = getWindow()
      if (win && !win.isDestroyed()) {
        win.webContents.send(CH.boardUpdate, { projectId, cardId: card.id, card })
      }
      return { card }
    } catch (e) {
      return mapError(e)
    }
  })

  // Phase 1: dismiss a parked item (no board card). Pushes the refreshed list.
  ipcMain.handle(CH.shelfRemove, (_e, raw: unknown) => {
    try {
      const { itemId } = RemoveShelfItemRequest.parse(raw)
      const projectId = removeShelfItem(db, itemId)
      pushShelf(projectId)
      return { ok: true as const }
    } catch (e) {
      return mapPhase1Error(e)
    }
  })
}
