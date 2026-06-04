import { ipcMain, type BrowserWindow } from 'electron'
import { ZodError } from 'zod'
import {
  CH,
  StartScopingRequest,
  AnswerScopingRequest,
  ApprovePlanRequest,
  type Card,
  type IpcError,
  type WizardScopingResponse,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import { NotFoundError } from '../db/errors'
import { updateProject } from '../db/projects'
import { seedCardsFromPlan } from '../db/cards'
import { SdkInitError } from '../sdk/session-runner'
import {
  SCOPING_TOTAL,
  type ScopingReply,
  type WizardOrchestrator,
} from '../sdk/wizard-orchestrator'

type GetWindow = () => BrowserWindow | null

function mapError(e: unknown): IpcError {
  if (e instanceof SdkInitError) return { error: 'sdk_init_failed', message: e.message }
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'wizard_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

function toResponse(sessionId: string, reply: ScopingReply, asked: number): WizardScopingResponse {
  if (reply.kind === 'question') {
    return { kind: 'question', sessionId, question: reply.question, step: asked, total: SCOPING_TOTAL }
  }
  return { kind: 'plan', sessionId, name: reply.name, plan: reply.plan }
}

export function registerWizardBridge(
  db: Db,
  wizard: WizardOrchestrator,
  getWindow: GetWindow,
): void {
  ipcMain.handle(CH.wizardStartScoping, async (_e, raw: unknown) => {
    try {
      const { projectId, idea } = StartScopingRequest.parse(raw)
      const { sessionId, reply, asked } = await wizard.startScoping(projectId, idea)
      return toResponse(sessionId, reply, asked)
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.wizardAnswer, async (_e, raw: unknown) => {
    try {
      const { sessionId, answer } = AnswerScopingRequest.parse(raw)
      const { reply, asked } = await wizard.answerScoping(sessionId, answer)
      return toResponse(sessionId, reply, asked)
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.wizardApprove, (_e, raw: unknown) => {
    try {
      const { projectId, name, plan } = ApprovePlanRequest.parse(raw)
      const project = updateProject(db, projectId, { name, plan, status: 'building' })
      const cards = seedCardsFromPlan(db, projectId, plan)
      const win = getWindow()
      if (win && !win.isDestroyed()) {
        for (const card of cards) {
          win.webContents.send(CH.boardUpdate, { projectId, cardId: card.id, card } satisfies {
            projectId: string
            cardId: string
            card: Card
          })
        }
      }
      return { project, cards }
    } catch (e) {
      return mapError(e)
    }
  })
}
