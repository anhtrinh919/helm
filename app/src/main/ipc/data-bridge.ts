import { ipcMain, type BrowserWindow } from 'electron'
import { ZodError } from 'zod'
import {
  CH,
  CreateProjectRequest,
  GetProjectRequest,
  CreateCardRequest,
  UpdateCardStatusRequest,
  ApproveCheckpointRequest,
  ReopenQuestionRequest,
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
} from '../db/cards'
import { reopenQuestion } from '../db/question-queue'

type GetWindow = () => BrowserWindow | null

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

export function registerDataBridge(db: Db, getWindow: GetWindow): void {
  const pushBoard = (projectId: string, card: Card): void => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send(CH.boardUpdate, { projectId, cardId: card.id, card })
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
      if (verdict === 'approved') {
        // Approving a finished build completes the item and pulls the next one up.
        if (card.status === 'building') card = updateCardStatus(db, cardId, 'done')
        pushBoard(card.projectId, card)
        const promoted = promoteNextPlanned(db, card.projectId)
        if (promoted) pushBoard(card.projectId, promoted)
      } else {
        pushBoard(card.projectId, card)
      }
      return { card }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.sessionsReopenQuestion, (_e, raw: unknown) => {
    try {
      const { questionId } = ReopenQuestionRequest.parse(raw)
      return { question: reopenQuestion(db, questionId) }
    } catch (e) {
      return mapError(e)
    }
  })
}
