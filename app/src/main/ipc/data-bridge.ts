import { ipcMain, type HelmWindow } from '../core/transport'
import { ZodError } from 'zod'
import {
  CH,
  CreateProjectRequest,
  GetProjectRequest,
  CreateCardRequest,
  UpdateCardStatusRequest,
  ApproveCheckpointRequest,
  SetCardOutcomeRequest,
  type Card,
  type IpcError,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import {
  CannotReopenError,
  InvalidTransitionError,
  NoCheckpointError,
  NotFoundError,
} from '../db/errors'
import { createProject, getProject, listProjects } from '../db/projects'
import {
  createCard,
  listCards,
  updateCardStatus,
  updateCheckpoint,
  promoteNextPlanned,
  setCardOutcome,
} from '../db/cards'
import type { SessionOrchestrator } from '../sdk/session-orchestrator'

type GetWindow = () => HelmWindow | null

/** Phase 3 hook for fix-comment checkpoints — the orchestrator owns the whole
 *  outcome (preview refresh, pin resolution, queue advance, reject-retry). */
export interface FixCheckpointDeps {
  orchestrator: SessionOrchestrator
}

function mapError(e: unknown): IpcError {
  if (e instanceof InvalidTransitionError) return { error: 'invalid_transition', from: e.from, to: e.to }
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof CannotReopenError) return { error: 'cannot_reopen' }
  if (e instanceof NoCheckpointError) return { error: 'no_checkpoint' }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'db_write_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

export function registerDataBridge(db: Db, getWindow: GetWindow, fix?: FixCheckpointDeps): void {
  const send = (channel: string, payload: unknown): void => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  }
  const pushBoard = (projectId: string, card: Card): void => {
    send(CH.boardUpdate, { projectId, cardId: card.id, card })
  }

  ipcMain.handle(CH.projectsList, () => {
    try {
      return { projects: listProjects(db) }
    } catch (e) {
      return { error: 'db_unavailable', message: e instanceof Error ? e.message : 'unknown' }
    }
  })

  ipcMain.handle(CH.projectsCreate, (_e, raw: unknown) => {
    try {
      const { name } = CreateProjectRequest.parse(raw)
      return { project: createProject(db, name) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.projectsGet, (_e, raw: unknown) => {
    try {
      const { projectId } = GetProjectRequest.parse(raw)
      return { project: getProject(db, projectId), cards: listCards(db, projectId) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.cardsCreate, (_e, raw: unknown) => {
    try {
      const { projectId, type, title } = CreateCardRequest.parse(raw)
      const card = createCard(db, projectId, type, title)
      pushBoard(projectId, card)
      return { card }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.cardsUpdateStatus, (_e, raw: unknown) => {
    try {
      const { cardId, status } = UpdateCardStatusRequest.parse(raw)
      const card = updateCardStatus(db, cardId, status)
      pushBoard(card.projectId, card)
      return { card }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.cardsApproveCheckpoint, (_e, raw: unknown) => {
    try {
      const { cardId, verdict, flagNote } = ApproveCheckpointRequest.parse(raw)
      let card = updateCheckpoint(db, cardId, verdict, flagNote)

      // Fix-comment cards (Phase 3): the whole outcome is the orchestrator's.
      if (card.type === 'fix_comment' && fix) {
        return { card: fix.orchestrator.resolveFixCheckpoint(cardId, verdict, flagNote) }
      }

      if (verdict === 'approved') {
        // Approving a finished build completes the item and pulls the next one up.
        if (card.status === 'building') card = updateCardStatus(db, cardId, 'done')
        pushBoard(card.projectId, card)
        const promoted = promoteNextPlanned(db, card.projectId)
        if (promoted) pushBoard(card.projectId, promoted)
        // A freed spotlight lets a queued fix start (fix-after-build queueing).
        fix?.orchestrator.maybeStartNextFix(card.projectId)
      } else {
        pushBoard(card.projectId, card)
      }
      return { card }
    } catch (e) {
      return mapError(e)
    }
  })

  // Phase 1: edit a card's plain-language outcome (plan approval is the primary write).
  ipcMain.handle(CH.cardsSetOutcome, (_e, raw: unknown) => {
    try {
      const { cardId, outcome } = SetCardOutcomeRequest.parse(raw)
      const trimmed = outcome.trim()
      if (trimmed.length === 0 || trimmed.length > 500) return { error: 'invalid_input' }
      const card = setCardOutcome(db, cardId, trimmed)
      pushBoard(card.projectId, card)
      return { ok: true as const }
    } catch (e) {
      if (e instanceof NotFoundError) return { error: 'card_not_found' }
      if (e instanceof ZodError) return mapError(e)
      return { error: 'db_error', message: e instanceof Error ? e.message : 'unknown error' }
    }
  })
}
