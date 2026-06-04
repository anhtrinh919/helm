import { z } from 'zod'

/**
 * Single source of truth for every value that crosses the IPC boundary.
 * Both main and renderer import from here. No raw SDK payload type is ever
 * exported to the renderer — only the transformed, user-safe shapes below.
 */

/* ----------------------------- enums ----------------------------- */

export const FeedEventKind = z.enum([
  'narration',
  'activity',
  'decision_prompt',
  'steering',
  'checkpoint',
  'summary',
  'error',
])
export type FeedEventKind = z.infer<typeof FeedEventKind>

export const SteerMode = z.enum(['interrupt', 'redirect', 'look_closer'])
export type SteerMode = z.infer<typeof SteerMode>

export const ProjectStatus = z.enum(['planning', 'building', 'done'])
export type ProjectStatus = z.infer<typeof ProjectStatus>

export const BackgroundStatus = z.enum(['idle', 'active', 'needs_you', 'failed'])
export type BackgroundStatus = z.infer<typeof BackgroundStatus>

export const CardType = z.enum(['feature', 'bug', 'decision'])
export type CardType = z.infer<typeof CardType>

export const CardStatus = z.enum(['planned', 'up_next', 'building', 'needs_you', 'failed', 'done'])
export type CardStatus = z.infer<typeof CardStatus>

export const CardSource = z.enum(['plan_seed', 'user_added', 'agent_raised'])
export type CardSource = z.infer<typeof CardSource>

export const SessionStatus = z.enum(['active', 'paused_for_decision', 'done', 'error', 'failed'])
export type SessionStatus = z.infer<typeof SessionStatus>

export const QuestionStatus = z.enum(['pending', 'answered', 'reopened'])
export type QuestionStatus = z.infer<typeof QuestionStatus>

export const CheckpointStatus = z.enum(['pending', 'approved', 'flagged'])
export type CheckpointStatus = z.infer<typeof CheckpointStatus>

export const DecisionPromptType = z.enum(['buttons', 'freetext', 'plan_approval'])
export type DecisionPromptType = z.infer<typeof DecisionPromptType>

/* --------------------------- domain types --------------------------- */

export const PlanBlock = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string().optional(),
})
export type PlanBlock = z.infer<typeof PlanBlock>

export const DecisionPrompt = z.object({
  type: DecisionPromptType,
  question: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
})
export type DecisionPrompt = z.infer<typeof DecisionPrompt>

export const Checkpoint = z.object({
  screenshotPath: z.string().optional(),
  status: CheckpointStatus,
  flagNote: z.string().optional(),
})
export type Checkpoint = z.infer<typeof Checkpoint>

export const Project = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  plan: z.array(PlanBlock).nullable(),
  status: ProjectStatus,
  backgroundStatus: BackgroundStatus,
})
export type Project = z.infer<typeof Project>

export const Card = z.object({
  id: z.string(),
  projectId: z.string(),
  type: CardType,
  title: z.string(),
  status: CardStatus,
  source: CardSource,
  position: z.number(),
  stepLabel: z.string().nullable(),
  dependsOn: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
  sessionId: z.string().nullable(),
  decisionPrompt: DecisionPrompt.nullable(),
  checkpoint: Checkpoint.nullable(),
})
export type Card = z.infer<typeof Card>

export const Session = z.object({
  id: z.string(),
  projectId: z.string(),
  cardId: z.string().nullable(),
  name: z.string(),
  status: SessionStatus,
  startedAt: z.number(),
  endedAt: z.number().nullable(),
  resumedAt: z.number().nullable(),
})
export type Session = z.infer<typeof Session>

export const FeedEvent = z.object({
  id: z.string(),
  sessionId: z.string(),
  kind: FeedEventKind,
  text: z.string(),
  /** Links a `decision_prompt` event to its question, or a `checkpoint` event to its card. */
  refId: z.string().nullable(),
  createdAt: z.number(),
})
export type FeedEvent = z.infer<typeof FeedEvent>

export const QuestionQueueItem = z.object({
  id: z.string(),
  sessionId: z.string(),
  prompt: DecisionPrompt,
  status: QuestionStatus,
  answer: z.string().nullable(),
  position: z.number(),
  createdAt: z.number(),
  answeredAt: z.number().nullable(),
})
export type QuestionQueueItem = z.infer<typeof QuestionQueueItem>

/* --------------------------- IPC errors --------------------------- */

export const IpcError = z.object({
  error: z.string(),
  message: z.string().optional(),
  field: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sessionId: z.string().optional(),
})
export type IpcError = z.infer<typeof IpcError>

/** A handler result is either the success payload T or a typed error. */
export type Result<T> = T | IpcError
export function isIpcError(v: unknown): v is IpcError {
  return typeof v === 'object' && v !== null && 'error' in v
}

/* --------------------------- request payloads --------------------------- */

export const CreateProjectRequest = z.object({ name: z.string().min(1).max(200) })
export const GetProjectRequest = z.object({ projectId: z.string() })
export const CreateCardRequest = z.object({
  projectId: z.string(),
  type: z.enum(['feature', 'bug']),
  title: z.string().min(1).max(300),
})
export const UpdateCardStatusRequest = z.object({ cardId: z.string(), status: CardStatus })
export const ApproveCheckpointRequest = z.object({
  cardId: z.string(),
  verdict: z.enum(['approved', 'flagged']),
  flagNote: z.string().optional(),
})
export const ReopenQuestionRequest = z.object({ sessionId: z.string(), questionId: z.string() })
export const GetFeedRequest = z.object({ sessionId: z.string(), afterId: z.string().optional() })

export const StartScopingRequest = z.object({
  projectId: z.string(),
  idea: z.string().min(1).max(2000),
})
export const AnswerScopingRequest = z.object({
  sessionId: z.string(),
  answer: z.string().min(1).max(2000),
})
export const ApprovePlanRequest = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(200),
  plan: z.array(PlanBlock).min(1),
})

/** The scoping session's reply: another question, or the finished plan. */
export const WizardScopingResponse = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('question'),
    sessionId: z.string(),
    question: DecisionPrompt,
    step: z.number(),
    total: z.number(),
  }),
  z.object({
    kind: z.literal('plan'),
    sessionId: z.string(),
    name: z.string(),
    plan: z.array(PlanBlock),
  }),
])
export type WizardScopingResponse = z.infer<typeof WizardScopingResponse>

export const StartSessionRequest = z.object({ projectId: z.string(), cardId: z.string() })
export const SteerRequest = z.object({
  sessionId: z.string(),
  mode: SteerMode,
  text: z.string().min(1).max(2000),
})
export const AnswerDecisionRequest = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  answer: z.string().min(1).max(2000),
})
export const GetQuestionsRequest = z.object({ sessionId: z.string() })

/* --------------------------- push payloads --------------------------- */

export const FeedEventPush = z.object({ sessionId: z.string(), event: FeedEvent })
export type FeedEventPush = z.infer<typeof FeedEventPush>

export const BoardUpdatePush = z.object({ projectId: z.string(), cardId: z.string(), card: Card })
export type BoardUpdatePush = z.infer<typeof BoardUpdatePush>

export const QuestionUpdatePush = z.object({ sessionId: z.string(), question: QuestionQueueItem })
export type QuestionUpdatePush = z.infer<typeof QuestionUpdatePush>

export const BackgroundStatusPush = z.object({
  projectId: z.string(),
  backgroundStatus: BackgroundStatus,
})
export type BackgroundStatusPush = z.infer<typeof BackgroundStatusPush>

/* --------------------------- Group 1 probe (kept for dev smoke test) --------------------------- */

export const StartProbeRequest = z.object({ prompt: z.string().min(1).max(5000) })
export type StartProbeRequest = z.infer<typeof StartProbeRequest>

export const StartProbeResponse = z.object({ sessionId: z.string() })
export type StartProbeResponse = z.infer<typeof StartProbeResponse>

export const GetFeedResponse = z.object({ events: z.array(FeedEvent) })
export type GetFeedResponse = z.infer<typeof GetFeedResponse>

/* --------------------------- channel names --------------------------- */

export const CH = {
  // Group 1
  startProbe: 'sessions:start-probe',
  // data (Group 2)
  projectsList: 'projects:list',
  projectsCreate: 'projects:create',
  projectsGet: 'projects:get',
  cardsCreate: 'cards:create',
  cardsUpdateStatus: 'cards:update-status',
  cardsApproveCheckpoint: 'cards:approve-checkpoint',
  sessionsReopenQuestion: 'sessions:reopen-question',
  getFeed: 'sessions:get-feed',
  // scoped session (Group 5)
  sessionsStart: 'sessions:start',
  sessionsSteer: 'sessions:steer',
  sessionsAnswerDecision: 'sessions:answer-decision',
  sessionsGetQuestions: 'sessions:get-questions',
  // new project wizard (Group 6)
  wizardStartScoping: 'wizard:start-scoping',
  wizardAnswer: 'wizard:answer-question',
  wizardApprove: 'wizard:approve-plan',
  // pushes
  feedEvent: 'feed:event',
  boardUpdate: 'board:update',
  backgroundStatus: 'project:background-status',
  questionUpdate: 'question:update',
} as const
