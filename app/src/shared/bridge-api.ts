import type {
  BackgroundStatusPush,
  BoardUpdatePush,
  Card,
  CardStatus,
  DecisionEntry,
  FeedEvent,
  FeedEventPush,
  FixCommentPin,
  ImportScanResponse,
  PinsUpdatePush,
  PlanBlock,
  PointCapturePush,
  PreviewState,
  PreviewUpdatePush,
  ProgressEntry,
  Project,
  ProjectMode,
  QuestionQueueItem,
  QuestionUpdatePush,
  RegisterPointRequest,
  RegisterTextEditRequest,
  Session,
  ShelfItem,
  ShelfUpdatePush,
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
    /** Phase 4 project management. */
    rename(projectId: string, name: string): Promise<Result<{ project: Project }>>
    delete(projectId: string): Promise<Result<{ ok: true }>>
    setMode(projectId: string, mode: ProjectMode): Promise<Result<{ project: Project }>>
    /** Advance the Build rail; step === plan length triggers the celebration. */
    setRailStep(projectId: string, step: number): Promise<Result<{ project: Project }>>
    /** Persist a new project order (full ordered id list). Phase 1 project management. */
    reorder(orderedIds: string[]): Promise<Result<{ ok: true }>>
  }
  /** Phase 4 "For later" shelf — parked mid-rail requests. */
  shelf: {
    list(projectId: string): Promise<Result<{ items: ShelfItem[] }>>
    add(projectId: string, title: string): Promise<Result<{ item: ShelfItem }>>
    /** Move a parked item onto the board as a real card. */
    promote(itemId: string, projectId: string): Promise<Result<{ card: Card }>>
    /** Dismiss a parked item without promoting it. */
    remove(itemId: string, projectId: string): Promise<Result<{ ok: true }>>
  }
  /** Phase 4 import — bring an existing AI-built local web app into Helm. */
  import: {
    scan(folderPath: string): Promise<Result<ImportScanResponse>>
    start(
      projectId: string,
      folderPath: string,
      startCommand: string,
      port: number,
    ): Promise<Result<{ ok: true; url: string }>>
  }
  cards: {
    create(projectId: string, type: 'feature' | 'bug', title: string): Promise<Result<{ card: Card }>>
    updateStatus(cardId: string, status: CardStatus): Promise<Result<{ card: Card }>>
    approveCheckpoint(
      cardId: string,
      verdict: 'approved' | 'flagged',
      flagNote?: string,
    ): Promise<Result<{ card: Card }>>
    /** Edit a card's plain-language outcome later (plan approval is the primary write). */
    setOutcome(cardId: string, outcome: string): Promise<Result<{ ok: true }>>
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
    /** Phase 4: explicit user stop (the Stop button). */
    stop(sessionId: string): Promise<Result<{ ok: true }>>
  }
  wizard: {
    /** Start the scoping conversation for a new project; returns the first question.
     *  mode 'iterate' (Phase 4) scopes to ONE combined scaffold+first-feature step. */
    startScoping(
      projectId: string,
      idea: string,
      mode?: ProjectMode,
    ): Promise<Result<WizardScopingResponse>>
    /** Answer the current scoping question; returns the next question or the finished plan. */
    answerScoping(sessionId: string, answer: string): Promise<Result<WizardScopingResponse>>
    /** Regenerate the plan from a change note WITHOUT re-running the interview.
     *  A fresh one-shot session is seeded with the plan-in-hand, so this works
     *  even after the local core was restarted. Returns the revised plan. */
    revisePlan(
      projectId: string,
      idea: string,
      mode: ProjectMode | undefined,
      name: string,
      plan: PlanBlock[],
      note: string,
    ): Promise<Result<WizardScopingResponse>>
    /** Approve the plan: seeds the board and names the project. */
    approvePlan(
      projectId: string,
      name: string,
      plan: PlanBlock[],
    ): Promise<Result<{ project: Project; cards: Card[] }>>
    /** Phase 4: persist/restore the wizard's UI state so Q&A survives view switches. */
    saveState(projectId: string, state: string | null): Promise<Result<{ ok: true }>>
    getState(projectId: string): Promise<Result<{ state: string | null }>>
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
    /** Group 5: arm in-place text editing of the pointed element in the live app. */
    activateTextEdit(projectId: string): Promise<Result<{ ok: true }>>
    deactivateTextEdit(projectId: string): Promise<Result<{ ok: true }>>
    /** Register an in-place text edit; spawns a fix session for the element. */
    registerTextEdit(req: RegisterTextEditRequest): Promise<Result<{ card: Card }>>
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
    /** Phase 4: the shelf changed (user add, agent triage, or promote). */
    onShelfUpdate(cb: (p: ShelfUpdatePush) => void): () => void
  }
  /** Phase 4 history tabs: decisions log, progress timeline, docs. */
  history: {
    decisions(projectId: string): Promise<Result<{ entries: DecisionEntry[] }>>
    progress(projectId: string): Promise<Result<{ entries: ProgressEntry[] }>>
    docs(projectId: string): Promise<Result<{ content: string | null }>>
  }
  /** Group 1 probe — dev smoke test of the live engine. */
  startProbe(prompt: string): Promise<Result<{ sessionId: string }>>
  getFeed(sessionId: string): Promise<Result<{ events: FeedEvent[] }>>
}
