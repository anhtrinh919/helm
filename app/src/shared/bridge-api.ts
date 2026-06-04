import type {
  BackgroundStatusPush,
  BoardUpdatePush,
  Card,
  CardStatus,
  FeedEvent,
  FeedEventPush,
  Project,
  QuestionQueueItem,
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
    reopenQuestion(
      sessionId: string,
      questionId: string,
    ): Promise<Result<{ question: QuestionQueueItem }>>
  }
  events: {
    onBoardUpdate(cb: (p: BoardUpdatePush) => void): () => void
    onBackgroundStatus(cb: (p: BackgroundStatusPush) => void): () => void
    onFeedEvent(cb: (p: FeedEventPush) => void): () => void
  }
  /** Group 1 probe — dev smoke test of the live engine. */
  startProbe(prompt: string): Promise<Result<{ sessionId: string }>>
  getFeed(sessionId: string): Promise<Result<{ events: FeedEvent[] }>>
}
