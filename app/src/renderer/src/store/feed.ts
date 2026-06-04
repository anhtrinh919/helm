import { create } from 'zustand'
import { helm } from '../bridge'
import {
  isIpcError,
  type Card,
  type FeedEvent,
  type QuestionQueueItem,
  type Session,
  type SteerMode,
} from '@shared/ipc-schemas'

export type FeedStatus = 'idle' | 'active' | 'paused_for_decision' | 'done' | 'error'

interface FeedState {
  projectId: string | null
  card: Card | null
  session: Session | null
  status: FeedStatus
  events: FeedEvent[]
  questions: QuestionQueueItem[]
  /** Open a card's scoped session — reattach if running, else show it idle (user starts the build). */
  open: (projectId: string, cardId: string) => Promise<void>
  /** Explicitly kick off the build for the open card (user-driven). */
  startBuild: () => Promise<void>
  /** Reconcile feed + questions from the source of truth (backfill any gap). */
  syncFeed: (sessionId: string) => Promise<void>
  appendEvent: (ev: FeedEvent) => void
  upsertQuestion: (q: QuestionQueueItem) => void
  answer: (questionId: string, answer: string) => Promise<void>
  reopen: (questionId: string) => Promise<void>
  steer: (mode: SteerMode, text: string) => Promise<void>
  approveCheckpoint: (verdict: 'approved' | 'flagged', note?: string) => Promise<void>
  retry: () => Promise<void>
  reset: () => void
}

/** Infer the UI status from a reattached session's feed + questions. */
function inferStatus(events: FeedEvent[], questions: QuestionQueueItem[]): FeedStatus {
  if (events.some((e) => e.kind === 'error')) return 'error'
  if (events.some((e) => e.kind === 'checkpoint')) return 'done'
  if (questions.some((q) => q.status === 'pending' || q.status === 'reopened')) {
    return 'paused_for_decision'
  }
  return 'active'
}

export const useFeed = create<FeedState>((set, get) => ({
  projectId: null,
  card: null,
  session: null,
  status: 'idle',
  events: [],
  questions: [],

  open: async (projectId, cardId) => {
    set({ projectId, card: null, session: null, status: 'idle', events: [], questions: [] })

    const proj = await helm.projects.get(projectId)
    if (isIpcError(proj)) return
    const card = proj.cards.find((c) => c.id === cardId) ?? null
    set({ card })

    if (card?.sessionId) {
      // Reattach to an in-flight or finished session.
      const [feed, qs] = await Promise.all([
        helm.getFeed(card.sessionId),
        helm.sessions.getQuestions(card.sessionId),
      ])
      const events = isIpcError(feed) ? [] : feed.events
      const questions = isIpcError(qs) ? [] : qs.questions
      set({
        session: { id: card.sessionId } as Session,
        events,
        questions,
        status: inferStatus(events, questions),
      })
      return
    }

    // Only the active spotlight item auto-attaches. Everything else waits for
    // the user to press "Start building" — building is user-driven, not implicit.
    if (card?.status === 'building') {
      const res = await helm.sessions.start(projectId, cardId)
      if (isIpcError(res)) {
        set({ status: 'error' })
        return
      }
      set({ session: res.session, status: 'active' })
      return
    }
    set({ status: 'idle' })
  },

  startBuild: async () => {
    const { projectId, card } = get()
    if (!projectId || !card) return
    set({ status: 'active', events: [], questions: [] })
    const res = await helm.sessions.start(projectId, card.id)
    if (isIpcError(res)) {
      set({ status: 'error' })
      return
    }
    set({ session: res.session })
  },

  syncFeed: async (sessionId) => {
    const [feed, qs] = await Promise.all([
      helm.getFeed(sessionId),
      helm.sessions.getQuestions(sessionId),
    ])
    set((s) => {
      if (s.session?.id !== sessionId) return s // navigated away mid-fetch
      const seen = new Set(s.events.map((e) => e.id))
      const merged = [...s.events, ...(isIpcError(feed) ? [] : feed.events.filter((e) => !seen.has(e.id)))]
      merged.sort((a, b) => a.createdAt - b.createdAt)
      const questions = isIpcError(qs) ? s.questions : qs.questions
      return { events: merged, questions, status: inferStatus(merged, questions) }
    })
  },

  appendEvent: (ev) =>
    set((s) => {
      if (s.events.some((e) => e.id === ev.id)) return s
      const next: Partial<FeedState> = { events: [...s.events, ev] }
      if (ev.kind === 'checkpoint') next.status = 'done'
      else if (ev.kind === 'error') next.status = 'error'
      else if (ev.kind === 'decision_prompt') next.status = 'paused_for_decision'
      return next as FeedState
    }),

  upsertQuestion: (q) =>
    set((s) => {
      const exists = s.questions.some((x) => x.id === q.id)
      const questions = exists ? s.questions.map((x) => (x.id === q.id ? q : x)) : [...s.questions, q]
      return { questions: questions.sort((a, b) => a.position - b.position) }
    }),

  answer: async (questionId, answer) => {
    const sid = get().session?.id
    if (!sid) return
    set({ status: 'active' })
    const res = await helm.sessions.answerDecision(sid, questionId, answer)
    if (!isIpcError(res)) get().upsertQuestion(res.question)
  },

  reopen: async (questionId) => {
    const sid = get().session?.id
    if (!sid) return
    const res = await helm.sessions.reopenQuestion(sid, questionId)
    if (!isIpcError(res)) get().upsertQuestion(res.question)
  },

  steer: async (mode, text) => {
    const sid = get().session?.id
    if (!sid) return
    await helm.sessions.steer(sid, mode, text)
  },

  approveCheckpoint: async (verdict, note) => {
    const cardId = get().card?.id
    if (!cardId) return
    const res = await helm.cards.approveCheckpoint(cardId, verdict, note)
    if (isIpcError(res)) return
    set({ card: res.card })
    // "Something's off" re-opens the build so it can take another pass — never
    // leave the user stuck on a checkpoint they rejected.
    if (verdict === 'flagged') await get().retry()
  },

  retry: async () => {
    const { projectId, card } = get()
    if (!projectId || !card) return
    set({ events: [], questions: [], status: 'active' })
    const res = await helm.sessions.start(projectId, card.id)
    if (isIpcError(res)) {
      set({ status: 'error' })
      return
    }
    set({ session: res.session })
  },

  reset: () => set({ projectId: null, card: null, session: null, status: 'idle', events: [], questions: [] }),
}))
