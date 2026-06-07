import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import {
  CH,
  StartSessionRequest,
  SteerRequest,
  AnswerDecisionRequest,
  GetQuestionsRequest,
  ReopenQuestionRequest,
  type IpcError,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import {
  ArtifactDirError,
  CannotReopenError,
  NotAwaitingDecisionError,
  NotFoundError,
} from '../db/errors'
import { listQuestions } from '../db/question-queue'
import type { SessionOrchestrator } from '../sdk/session-orchestrator'
import { SdkInitError } from '../sdk/session-runner'

function mapError(e: unknown): IpcError {
  if (e instanceof SdkInitError) return { error: 'sdk_init_failed', message: e.message }
  if (e instanceof NotAwaitingDecisionError) return { error: 'not_awaiting_decision' }
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof CannotReopenError) return { error: 'cannot_reopen' }
  if (e instanceof ArtifactDirError) return { error: 'artifact_dir_failed', message: e.message }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'session_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

/** Live scoped-session IPC (Group 5). Reopen lives in the data bridge (DB-only). */
export function registerSessionBridge(db: Db, orchestrator: SessionOrchestrator): void {
  ipcMain.handle(CH.sessionsStart, (_e, raw: unknown) => {
    try {
      const { projectId, cardId } = StartSessionRequest.parse(raw)
      return { session: orchestrator.start(projectId, cardId) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.sessionsSteer, (_e, raw: unknown) => {
    try {
      const { sessionId, mode, text } = SteerRequest.parse(raw)
      const ok = orchestrator.steer(sessionId, mode, text)
      if (!ok) return { error: 'session_not_active' }
      return { ok: true as const }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.sessionsAnswerDecision, (_e, raw: unknown) => {
    try {
      const { sessionId, questionId, answer } = AnswerDecisionRequest.parse(raw)
      orchestrator.answerDecision(sessionId, questionId, answer)
      const questions = listQuestions(db, sessionId)
      const question = questions.find((q) => q.id === questionId)
      if (!question) return { error: 'not_found' }
      return { question }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.sessionsGetQuestions, (_e, raw: unknown) => {
    try {
      const { sessionId } = GetQuestionsRequest.parse(raw)
      return { questions: listQuestions(db, sessionId) }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.sessionsReopenQuestion, (_e, raw: unknown) => {
    try {
      const { sessionId, questionId } = ReopenQuestionRequest.parse(raw)
      return { question: orchestrator.reopen(sessionId, questionId) }
    } catch (e) {
      return mapError(e)
    }
  })
}
