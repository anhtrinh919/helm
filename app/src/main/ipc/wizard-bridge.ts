import { ipcMain, type HelmWindow } from '../core/transport'
import { ZodError } from 'zod'
import {
  CH,
  StartScopingRequest,
  AnswerScopingRequest,
  RevisePlanRequest,
  ApprovePlanRequest,
  SaveWizardStateRequest,
  GetWizardStateRequest,
  type Card,
  type IpcError,
  type WizardScopingResponse,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import { NotFoundError } from '../db/errors'
import {
  getProject,
  getWizardState,
  setRailStep,
  setWizardState,
  updateProject,
} from '../db/projects'
import { seedCardsFromPlan } from '../db/cards'
import { SdkInitError } from '../sdk/session-runner'
import {
  SCOPING_TOTAL,
  type ScopingReply,
  type WizardOrchestrator,
} from '../sdk/wizard-orchestrator'

type GetWindow = () => HelmWindow | null

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
  if (reply.kind === 'question_batch') {
    return {
      kind: 'question_batch',
      sessionId,
      questions: reply.questions,
      round: asked,
      totalRounds: SCOPING_TOTAL,
    }
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
      const { projectId, idea, mode } = StartScopingRequest.parse(raw)
      const { sessionId, reply, asked } = await wizard.startScoping(projectId, idea, mode)
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

  ipcMain.handle(CH.wizardRevise, async (_e, raw: unknown) => {
    try {
      const { projectId, idea, mode, name, plan, note } = RevisePlanRequest.parse(raw)
      const out = await wizard.revisePlan(projectId, idea, mode ?? 'build', plan, name, note)
      return toResponse(out.sessionId, out.reply, out.asked)
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.wizardApprove, (_e, raw: unknown) => {
    try {
      const { projectId, name, plan } = ApprovePlanRequest.parse(raw)
      let project = updateProject(db, projectId, { name, plan, status: 'building' })
      const cards = seedCardsFromPlan(db, projectId, plan)
      // Build mode starts at the top of the rail; Iterate has no rail cursor.
      if (project.mode === 'build') project = setRailStep(db, projectId, 0)
      // The wizard is done — clear any persisted mid-wizard UI state.
      setWizardState(db, projectId, null)
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

  // Phase 4: the wizard's renderer UI state survives view switches and relaunches.
  // The blob is renderer-shaped and opaque to main — stored as-is on the project row.
  ipcMain.handle(CH.wizardSaveState, (_e, raw: unknown) => {
    try {
      const { projectId, state } = SaveWizardStateRequest.parse(raw)
      setWizardState(db, projectId, state)
      return { ok: true as const }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.wizardGetState, (_e, raw: unknown) => {
    try {
      const { projectId } = GetWizardStateRequest.parse(raw)
      getProject(db, projectId) // not_found guard
      return { state: getWizardState(db, projectId) }
    } catch (e) {
      return mapError(e)
    }
  })
}
