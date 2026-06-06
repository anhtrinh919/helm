import type {
  BackgroundStatusPush,
  BoardUpdatePush,
  Card,
  CardStatus,
  FeedEvent,
  FeedEventPush,
  FixCommentPin,
  PinsUpdatePush,
  PlanBlock,
  PointCapturePush,
  PreviewState,
  PreviewUpdatePush,
  Project,
  QuestionQueueItem,
  QuestionUpdatePush,
  RegisterPointRequest,
  Session,
  StartFixSessionResponse,
  SteerMode,
  WizardScopingResponse,
  Result,
} from './ipc-schemas'

/**
 * The complete surface the renderer is allowed to touch. The Electron preload
 * implements this over IPC; a browser-dev mock implements it in-memory so the
 * UI can run (and be dogfooded) without launching Electron.
 */
export interface HelmApi {
  projects: {
    list(): Promise<Result<{ projects: Project[] }>>
    create(name: string): Promise<Result<{ project: Project }>>
    get(projectId: string): Promise<Result<{ project: Project; cards: Card[] }>>
  }
  cards: {
    create(projectId: string, type: 'feature' | 'bug', title: string): Promise<Result<{ card: Card }>>
    updateStatus(cardId: string, status: CardStatus): Promise<Result<{ card: Card }>>
    approveCheckpoint(
      cardId: string,
      verdict: 'approved' | 'flagged',
      flagNote?: string,
    ): Promise<Result<{ card: Card }>>
  }
  sessions: {
    /** Open (or resume) the scoped session for a card. Starts a live SDK build. */
    start(projectId: string, cardId: string): Promise<Result<{ session: Session }>>
    /** Steer a running session: interrupt, redirect, or look closer. */
    steer(sessionId: string, mode: SteerMode, text: string): Promise<Result<{ ok: true }>>
    /** Answer a pending decision; resumes the paused session. */
    answerDecision(
      sessionId: string,
      questionId: string,
      answer: string,
    ): Promise<Result<{ question: QuestionQueueItem }>>
    getQuestions(sessionId: string): Promise<Result<{ questions: QuestionQueueItem[] }>>
    reopenQuestion(
      sessionId: string,
      questionId: string,
    ): Promise<Result<{ question: QuestionQueueItem }>>
  }
  wizard: {
    /** Start the scoping conversation for a new project; returns the first question. */
    startScoping(projectId: string, idea: string): Promise<Result<WizardScopingResponse>>
    /** Answer the current scoping question; returns the next question or the finished plan. */
    answerScoping(sessionId: string, answer: string): Promise<Result<WizardScopingResponse>>
    /** Approve the plan: seeds the board and names the project. */
    approvePlan(
      projectId: string,
      name: string,
      plan: PlanBlock[],
    ): Promise<Result<{ project: Project; cards: Card[] }>>
  }
  /** Live Preview (Phase 2): query state + control the project's dev server. */
  preview: {
    /** Current preview state for a project (e.g. on tab open / app resume). */
    getState(projectId: string): Promise<Result<{ state: PreviewState }>>
    /** Start (or report already-running) the project's dev server; returns the live URL. */
    startServer(projectId: string): Promise<Result<{ url: string }>>
    /** Stop the project's dev server. */
    stopServer(projectId: string): Promise<Result<{ stopped: true }>>
  }
  /** Point-and-fix (Phase 3): register comments, list pins, drive point mode. */
  points: {
    /** File a completed comment; main pairs it with a new board card. */
    register(req: RegisterPointRequest): Promise<Result<{ card: Card }>>
    /** Open (unresolved) pins + queue membership for the board/overlay. */
    list(projectId: string): Promise<Result<{ pins: FixCommentPin[]; queuedCardIds: string[] }>>
    /** Turn point mode on: main injects the capture listener into the embedded app. */
    activate(projectId: string): Promise<Result<{ ok: true }>>
    /** Turn point mode off: main removes the capture listener. */
    deactivate(projectId: string): Promise<Result<{ ok: true }>>
  }
  fixSessions: {
    /** Start the fix for a comment card — or queue it behind the running fix. */
    start(projectId: string, cardId: string): Promise<Result<StartFixSessionResponse>>
  }
  events: {
    onBoardUpdate(cb: (p: BoardUpdatePush) => void): () => void
    onBackgroundStatus(cb: (p: BackgroundStatusPush) => void): () => void
    onFeedEvent(cb: (p: FeedEventPush) => void): () => void
    onQuestionUpdate(cb: (p: QuestionUpdatePush) => void): () => void
    onPreviewUpdate(cb: (p: PreviewUpdatePush) => void): () => void
    onPinsUpdate(cb: (p: PinsUpdatePush) => void): () => void
    onPointCapture(cb: (p: PointCapturePush) => void): () => void
  }
  /** Group 1 probe — dev smoke test of the live engine. */
  startProbe(prompt: string): Promise<Result<{ sessionId: string }>>
  getFeed(sessionId: string): Promise<Result<{ events: FeedEvent[] }>>
}
