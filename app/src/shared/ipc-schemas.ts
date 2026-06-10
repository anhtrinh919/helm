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
  'stopped',
  'parked',
])
export type FeedEventKind = z.infer<typeof FeedEventKind>

export const SteerMode = z.enum(['interrupt', 'redirect', 'look_closer'])
export type SteerMode = z.infer<typeof SteerMode>

export const ProjectStatus = z.enum(['planning', 'building', 'done'])
export type ProjectStatus = z.infer<typeof ProjectStatus>

/** Phase 4: every project is explicitly in Build (goal-driven rail) or Iterate (freeform board) mode. */
export const ProjectMode = z.enum(['build', 'iterate'])
export type ProjectMode = z.infer<typeof ProjectMode>

export const BackgroundStatus = z.enum(['idle', 'active', 'needs_you', 'failed'])
export type BackgroundStatus = z.infer<typeof BackgroundStatus>

export const CardType = z.enum(['feature', 'bug', 'decision', 'fix_comment'])
export type CardType = z.infer<typeof CardType>

/** 'waiting' (Phase 3) = a filed point-and-fix comment whose fix hasn't been started. */
export const CardStatus = z.enum([
  'planned',
  'up_next',
  'building',
  'needs_you',
  'failed',
  'done',
  'waiting',
])
export type CardStatus = z.infer<typeof CardStatus>

export const NoteType = z.enum(['bug', 'change'])
export type NoteType = z.infer<typeof NoteType>

export const CardSource = z.enum(['plan_seed', 'user_added', 'agent_raised'])
export type CardSource = z.infer<typeof CardSource>

export const SessionStatus = z.enum(['active', 'paused_for_decision', 'done', 'error', 'failed', 'stopped'])
export type SessionStatus = z.infer<typeof SessionStatus>

export const QuestionStatus = z.enum(['pending', 'answered', 'reopened'])
export type QuestionStatus = z.infer<typeof QuestionStatus>

export const CheckpointStatus = z.enum(['pending', 'approved', 'flagged'])
export type CheckpointStatus = z.infer<typeof CheckpointStatus>

export const DecisionPromptType = z.enum(['buttons', 'freetext', 'plan_approval'])
export type DecisionPromptType = z.infer<typeof DecisionPromptType>

/** A real build step's OUTCOME (Phase 2 — the real-file pipeline). This is an
 *  audit record of the build, NOT a mirror of the live preview: snag/blocked are
 *  dev-server runtime states owned solely by DevServerManager, never persisted here. */
export const BuildStepStatus = z.enum(['running', 'complete', 'failed'])
export type BuildStepStatus = z.infer<typeof BuildStepStatus>

/** What the Live Preview pane is showing for a project. */
export const PreviewStatus = z.enum(['none', 'building', 'live', 'snag', 'blocked'])
export type PreviewStatus = z.infer<typeof PreviewStatus>

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
  /** Absolute path to the project's on-disk working dir. Internal only —
   *  never displayed to the user. Null until the first real build session. */
  artifactDir: z.string().nullable(),
  /** Phase 4: Build (rail) or Iterate (board). */
  mode: ProjectMode,
  /** 0-based index of the current rail step. Null in iterate mode. */
  railStep: z.number().nullable(),
  /** True once the celebration has run and the project transitioned to Iterate. */
  railComplete: z.boolean(),
  /** Absolute path of the imported app's folder (null for Helm-native projects). Internal only. */
  importFolder: z.string().nullable(),
})
export type Project = z.infer<typeof Project>

/** A parked mid-rail request on the "For later" shelf (Phase 4). */
export const ShelfItem = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  source: z.string(),
  createdAt: z.number(),
})
export type ShelfItem = z.infer<typeof ShelfItem>

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
  /** Plain-language description of what this card is for (Phase 1). Null when not set. */
  outcome: z.string().nullable(),
  /** Fix-comment dressing (Phase 3, `fix_comment` cards only): the comment's
   *  type and whether it pointed at the whole page rather than one element.
   *  Renderer-safe — derived from the fix record's non-private columns. */
  noteType: NoteType.optional(),
  pageLevel: z.boolean().optional(),
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

export const BuildStep = z.object({
  id: z.string(),
  projectId: z.string(),
  sessionId: z.string(),
  cardId: z.string(),
  status: BuildStepStatus,
  startedAt: z.number(),
  completedAt: z.number().nullable(),
  /** Local dev-server URL once the step's app is running; null otherwise. Internal only. */
  devUrl: z.string().nullable(),
})
export type BuildStep = z.infer<typeof BuildStep>

/**
 * The Live Preview state for a project. A discriminated union — `live` carries
 * the local dev-server URL (used only to point the embedded webview; never
 * shown to the user as text). Mirrors requirements.md API Contracts.
 */
export const PreviewState = z.discriminatedUnion('status', [
  z.object({ status: z.literal('none') }),
  z.object({ status: z.literal('building') }),
  z.object({ status: z.literal('live'), url: z.string() }),
  z.object({ status: z.literal('snag') }),
  z.object({ status: z.literal('blocked') }),
])
export type PreviewState = z.infer<typeof PreviewState>

export const BoundingBox = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})
export type BoundingBox = z.infer<typeof BoundingBox>

/**
 * A point-and-fix comment's full record (Phase 3). MAIN-PROCESS ONLY —
 * `screenshotCrop` and `selector` never cross to the renderer. The renderer
 * sees only `FixCommentPin` below.
 */
export const FixComment = z.object({
  id: z.string(),
  cardId: z.string(),
  projectId: z.string(),
  selector: z.string().nullable(),
  boundingBox: BoundingBox.nullable(),
  screenshotCrop: z.string().nullable(),
  pinX: z.number().nullable(),
  pinY: z.number().nullable(),
  note: z.string(),
  noteType: NoteType,
  createdAt: z.number(),
})
export type FixComment = z.infer<typeof FixComment>

/** The renderer-safe pin shape — position + type only, no visual context. */
export const FixCommentPin = z.object({
  cardId: z.string(),
  pinX: z.number().nullable(),
  pinY: z.number().nullable(),
  noteType: NoteType,
})
export type FixCommentPin = z.infer<typeof FixCommentPin>

export const FeedEvent = z.object({
  id: z.string(),
  sessionId: z.string(),
  kind: FeedEventKind,
  text: z.string(),
  /** Links a `decision_prompt` event to its question, or a `checkpoint` event to its card. */
  refId: z.string().nullable(),
  /** Button choices for a `decision_prompt` (in-flight only; the queued question holds the canonical prompt). */
  options: z.array(z.string()).optional(),
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
  /** Phase 4: 'iterate' scopes to ONE combined scaffold+first-feature step. Default 'build'. */
  mode: ProjectMode.optional(),
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
    kind: z.literal('question_batch'),
    sessionId: z.string(),
    questions: z.array(DecisionPrompt),
    /** 1-based index of this batch in the interview, for a "Round N of M" label. */
    round: z.number(),
    /** Upper bound on batches the interview may run (advisory, for the label). */
    totalRounds: z.number(),
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

export const GetPreviewStateRequest = z.object({ projectId: z.string() })
export const StartDevServerRequest = z.object({ projectId: z.string() })
export const StopDevServerRequest = z.object({ projectId: z.string() })

/* --------------------------- Phase 3: point-and-fix --------------------------- */

export const RegisterPointRequest = z.object({
  projectId: z.string(),
  // Element-level capture is GEOMETRY ONLY for the Electron path (all omitted for
  // page-level comments). The selector and screenshot crop never appear here by
  // construction — main merges its own pending capture at register time.
  boundingBox: BoundingBox.optional(),
  pinX: z.number().min(0).max(1).optional(),
  pinY: z.number().min(0).max(1).optional(),
  // BROWSER-PROXY PATH ONLY: the same-origin proxy already exposes the selector to
  // the renderer (it postMessages `helm:point-capture`), so the browser path
  // carries it back here directly. When present, points-bridge anchors the
  // fix_comment to this selector and SKIPS the main-side pending-capture merge.
  // Absent (Electron path) → the existing consumePending merge is used unchanged.
  selector: z.string().optional(),
  note: z.string().min(1).max(500),
  noteType: NoteType,
})
export type RegisterPointRequest = z.infer<typeof RegisterPointRequest>

export const StartFixSessionRequest = z.object({ projectId: z.string(), cardId: z.string() })
export type StartFixSessionRequest = z.infer<typeof StartFixSessionRequest>

/** Started now (navigate to the session) vs queued behind the running fix (stay put). */
export const StartFixSessionResponse = z.discriminatedUnion('queued', [
  z.object({ queued: z.literal(false), session: Session }),
  z.object({ queued: z.literal(true), session: z.null() }),
])
export type StartFixSessionResponse = z.infer<typeof StartFixSessionResponse>

export const ListPinsRequest = z.object({ projectId: z.string() })
export const ListPinsResponse = z.object({
  pins: z.array(FixCommentPin),
  /** Cards queued behind the running fix — display state, resets on relaunch. */
  queuedCardIds: z.array(z.string()),
})
export type ListPinsResponse = z.infer<typeof ListPinsResponse>

export const PointModeRequest = z.object({ projectId: z.string() })

/* --------------------------- push payloads --------------------------- */

export const PinsUpdatePush = z.object({
  projectId: z.string(),
  pins: z.array(FixCommentPin),
  /** Cards queued behind the running fix — pushed by the queue's one owner
   *  (the orchestrator) so the board never keeps its own copy of this fact. */
  queuedCardIds: z.array(z.string()),
})
export type PinsUpdatePush = z.infer<typeof PinsUpdatePush>

/**
 * Point-mode events from the embedded app, relayed by main. Renderer-safe by
 * construction: geometry only — the CSS selector and screenshot never cross.
 */
export const PointCapturePush = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('captured'),
    projectId: z.string(),
    boundingBox: BoundingBox,
    pinX: z.number(),
    pinY: z.number(),
  }),
  z.object({ kind: z.literal('exit'), projectId: z.string() }),
])
export type PointCapturePush = z.infer<typeof PointCapturePush>

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

export const PreviewUpdatePush = z.object({ projectId: z.string(), state: PreviewState })
export type PreviewUpdatePush = z.infer<typeof PreviewUpdatePush>

/* --------------------------- Group 1 probe (kept for dev smoke test) --------------------------- */

export const StartProbeRequest = z.object({ prompt: z.string().min(1).max(5000) })
export type StartProbeRequest = z.infer<typeof StartProbeRequest>

export const StartProbeResponse = z.object({ sessionId: z.string() })
export type StartProbeResponse = z.infer<typeof StartProbeResponse>

export const GetFeedResponse = z.object({ events: z.array(FeedEvent) })
export type GetFeedResponse = z.infer<typeof GetFeedResponse>

/* --------------------------- Phase 4: history tabs --------------------------- */

/** One answered decision question, with its session + card context. */
export const DecisionEntry = z.object({
  id: z.string(),
  sessionId: z.string(),
  sessionName: z.string(),
  cardId: z.string().nullable(),
  cardTitle: z.string().nullable(),
  question: z.string(),
  answer: z.string(),
  answeredAt: z.number(),
})
export type DecisionEntry = z.infer<typeof DecisionEntry>

/** One completed build step, with card + session context (Progress tab). */
export const ProgressEntry = z.object({
  id: z.string(),
  sessionId: z.string(),
  sessionName: z.string(),
  cardId: z.string(),
  cardTitle: z.string(),
  cardStepLabel: z.string().nullable(),
  status: BuildStepStatus,
  startedAt: z.number(),
  completedAt: z.number().nullable(),
})
export type ProgressEntry = z.infer<typeof ProgressEntry>

export const GetDecisionsRequest = z.object({ projectId: z.string() })
export const GetProgressRequest = z.object({ projectId: z.string() })
export const GetDocsRequest = z.object({ projectId: z.string() })

/* --------------------------- Phase 4: modes, shelf, import, project management --------------------------- */

export const SetModeRequest = z.object({ projectId: z.string(), mode: ProjectMode })
export const SetRailStepRequest = z.object({ projectId: z.string(), step: z.number().int().min(0) })
export const RenameProjectRequest = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(200),
})
export const DeleteProjectRequest = z.object({ projectId: z.string() })

export const ShelfListRequest = z.object({ projectId: z.string() })
export const ShelfAddRequest = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(300),
})
export const ShelfPromoteRequest = z.object({ itemId: z.string(), projectId: z.string() })

export const ImportScanRequest = z.object({ folderPath: z.string().min(1) })
export const ImportScanResponse = z.discriminatedUnion('found', [
  z.object({
    found: z.literal(true),
    startCommand: z.string(),
    port: z.number(),
    confidence: z.enum(['high', 'low']),
  }),
  z.object({ found: z.literal(false) }),
])
export type ImportScanResponse = z.infer<typeof ImportScanResponse>

export const ImportStartRequest = z.object({
  projectId: z.string(),
  folderPath: z.string().min(1),
  startCommand: z.string().min(1).max(500),
  port: z.number().int().min(1).max(65535),
})

export const StopSessionRequest = z.object({ sessionId: z.string() })

/* --------------------------- Phase 1: outcome + reorder + shelf-remove --------------------------- */

export const SetCardOutcomeRequest = z.object({
  cardId: z.string(),
  outcome: z.string(),
})
export type SetCardOutcomeRequest = z.infer<typeof SetCardOutcomeRequest>

export const ReorderProjectsRequest = z.object({
  orderedIds: z.array(z.string()),
})
export type ReorderProjectsRequest = z.infer<typeof ReorderProjectsRequest>

export const RemoveShelfItemRequest = z.object({
  itemId: z.string(),
})
export type RemoveShelfItemRequest = z.infer<typeof RemoveShelfItemRequest>

/** Inline text edit (Group 5): point at text in the live app and edit it in place. */
export const RegisterTextEditRequest = z.object({
  projectId: z.string(),
  selector: z.string().min(1),
  oldText: z.string(),
  newText: z.string(),
})
export type RegisterTextEditRequest = z.infer<typeof RegisterTextEditRequest>

export const TextEditModeRequest = z.object({ projectId: z.string() })

/** Wizard UI state blob — renderer-shaped, persisted opaquely on the project row. */
export const SaveWizardStateRequest = z.object({
  projectId: z.string(),
  state: z.string().max(50_000).nullable(),
})
export const GetWizardStateRequest = z.object({ projectId: z.string() })

export const ShelfUpdatePush = z.object({ projectId: z.string(), items: z.array(ShelfItem) })
export type ShelfUpdatePush = z.infer<typeof ShelfUpdatePush>

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
  // live preview (Phase 2)
  previewGetState: 'preview:get-state',
  devserverStart: 'devserver:start',
  devserverStop: 'devserver:stop',
  // point-and-fix (Phase 3)
  pointsRegister: 'points:register',
  pointsList: 'points:list',
  pointsActivate: 'points:activate',
  pointsDeactivate: 'points:deactivate',
  fixSessionsStart: 'fix-sessions:start',
  // history (Phase 4 tabs)
  historyDecisions: 'history:decisions',
  historyProgress: 'history:progress',
  historyDocs: 'history:docs',
  // Phase 4: project management
  projectsRename: 'projects:rename',
  projectsDelete: 'projects:delete',
  projectsSetMode: 'projects:set-mode',
  projectsSetRailStep: 'projects:set-rail-step',
  // Phase 4: for-later shelf
  shelfList: 'shelf:list',
  shelfAdd: 'shelf:add',
  shelfPromote: 'shelf:promote',
  // Phase 4: import an existing app
  importScan: 'import:scan',
  importStart: 'import:start',
  // Phase 4: session stop + wizard persistence
  sessionsStop: 'sessions:stop',
  wizardSaveState: 'wizard:save-state',
  wizardGetState: 'wizard:get-state',
  // Phase 1: outcome + reorder + shelf-remove
  cardsSetOutcome: 'cards:set-outcome',
  projectsReorder: 'projects:reorder',
  shelfRemove: 'shelf:remove',
  // Phase 1 (Group 5): inline text edit in the live app
  pointsTextEditActivate: 'points:text-edit-activate',
  pointsTextEditDeactivate: 'points:text-edit-deactivate',
  pointsRegisterTextEdit: 'points:register-text-edit',
  // pushes
  feedEvent: 'feed:event',
  boardUpdate: 'board:update',
  backgroundStatus: 'project:background-status',
  questionUpdate: 'question:update',
  previewUpdate: 'preview:update',
  pointsUpdate: 'points:update',
  pointCaptured: 'point:captured',
  shelfUpdated: 'shelf:updated',
} as const
