import type { HelmApi } from '../../shared/bridge-api'
import type {
  BackgroundStatus,
  BackgroundStatusPush,
  BoardUpdatePush,
  Card,
  FeedEvent,
  FeedEventPush,
  Project,
  ProjectStatus,
  QuestionQueueItem,
  QuestionUpdatePush,
  Session,
} from '../../shared/ipc-schemas'

/**
 * In-memory implementation of the bridge for running the UI in a plain browser
 * (visual review + dogfooding) without launching Electron. Seeded with the
 * three projects from the design, plus a *scripted* live session so the scoped-
 * session screen (streaming feed → decision → checkpoint) can be reviewed
 * without the real Claude engine.
 */
export function createMockBridge(): HelmApi {
  let seq = 0
  const uid = (): string => `mock-${++seq}`
  const now = Date.now()

  const mk = (
    name: string,
    status: ProjectStatus,
    backgroundStatus: BackgroundStatus,
    ageMs: number,
  ): Project => ({
    id: uid(),
    name,
    createdAt: now - ageMs,
    updatedAt: now - ageMs,
    plan: null,
    status,
    backgroundStatus,
  })

  const projects: Project[] = [
    mk('Customer feedback portal', 'building', 'active', 0),
    mk('Internal HR tool', 'building', 'needs_you', 60_000),
    mk('Marketing site v2', 'done', 'idle', 3_600_000),
  ]
  const cards: Record<string, Card[]> = {}

  const card = (
    projectId: string,
    position: number,
    type: 'feature' | 'bug',
    title: string,
    status: Card['status'],
    extra: Partial<Card> = {},
  ): Card => ({
    id: uid(),
    projectId,
    type,
    title,
    status,
    source: 'plan_seed',
    position,
    stepLabel: `Step ${position + 1} of 8: ${title}`,
    dependsOn: [],
    createdAt: now - 1_000_000,
    updatedAt: status === 'building' ? now - 222_000 : now - 1_000_000,
    sessionId: null,
    decisionPrompt: null,
    checkpoint: null,
    ...extra,
  })

  // Seed the active project to match the design's build-spine (F11).
  {
    const pid = projects[0].id
    const shell = card(pid, 0, 'feature', 'Set up the project shell', 'done')
    const signin = card(pid, 1, 'feature', 'Sign-in & accounts', 'building')
    const inbox = card(pid, 2, 'feature', 'Feedback inbox view', 'up_next')
    const submit = card(pid, 3, 'feature', 'Submit a piece of feedback', 'up_next', {
      dependsOn: [inbox.id],
    })
    const tagging = card(pid, 4, 'feature', 'Tagging & labels', 'planned', {
      dependsOn: [inbox.id],
    })
    const replies = card(pid, 5, 'feature', 'Threaded replies', 'planned', {
      dependsOn: [submit.id],
    })
    cards[pid] = [shell, signin, inbox, submit, tagging, replies]
  }

  // Seed the second project paused on a real decision so the board headline renders.
  {
    const pid = projects[1].id
    cards[pid] = [
      card(pid, 0, 'feature', 'Employee directory', 'done'),
      card(pid, 1, 'feature', 'Time-off requests', 'needs_you', {
        decisionPrompt: {
          type: 'buttons',
          question: 'Should time-off approvals need one manager or two?',
          options: ['One manager', 'Two managers', 'No approval needed'],
        },
      }),
      card(pid, 2, 'feature', 'Approval workflow', 'planned'),
      card(pid, 3, 'bug', 'Calendar shows wrong week', 'planned'),
    ]
  }

  /* ----------------------- live-session simulation ----------------------- */

  const feeds: Record<string, FeedEvent[]> = {}
  const questionsBySession: Record<string, QuestionQueueItem[]> = {}
  const sessionCard: Record<string, Card> = {}

  const feedListeners = new Set<(p: FeedEventPush) => void>()
  const boardListeners = new Set<(p: BoardUpdatePush) => void>()
  const bgListeners = new Set<(p: BackgroundStatusPush) => void>()
  const questionListeners = new Set<(p: QuestionUpdatePush) => void>()

  const emitFeed = (
    sessionId: string,
    kind: FeedEvent['kind'],
    text: string,
    refId: string | null = null,
  ): void => {
    const ev: FeedEvent = { id: uid(), sessionId, kind, text, refId, createdAt: Date.now() }
    ;(feeds[sessionId] ??= []).push(ev)
    feedListeners.forEach((cb) => cb({ sessionId, event: ev }))
  }

  const pushBoard = (c: Card): void => {
    c.updatedAt = Date.now()
    boardListeners.forEach((cb) => cb({ projectId: c.projectId, cardId: c.id, card: c }))
  }

  const findCard = (cardId: string): Card | undefined => {
    for (const list of Object.values(cards)) {
      const found = list.find((c) => c.id === cardId)
      if (found) return found
    }
    return undefined
  }

  const finishScripted = (sessionId: string, c: Card): void => {
    setTimeout(() => emitFeed(sessionId, 'narration', 'Got it — finishing the sign-in form.'), 700)
    setTimeout(() => {
      c.status = 'building'
      c.checkpoint = { status: 'pending' }
      pushBoard(c)
      emitFeed(sessionId, 'checkpoint', 'Here’s what I built — does this look right?', c.id)
    }, 1700)
  }

  const startScripted = (sessionId: string, c: Card): void => {
    const lines: [number, FeedEvent['kind'], string][] = [
      [500, 'narration', 'Reading the project plan.'],
      [1100, 'narration', 'Starting work on the sign-in form.'],
      [1800, 'activity', 'Writing some code'],
      [2600, 'narration', 'Wiring up the email and password fields.'],
      [3400, 'narration', 'Sign-in form first pass is up.'],
    ]
    lines.forEach(([t, k, txt]) => setTimeout(() => emitFeed(sessionId, k, txt), t))
    setTimeout(() => {
      const q: QuestionQueueItem = {
        id: uid(),
        sessionId,
        prompt: {
          type: 'buttons',
          question: 'Should sign-in use a password or a magic link?',
          options: ['Password', 'Magic link', 'Both'],
        },
        status: 'pending',
        answer: null,
        position: questionsBySession[sessionId]?.length ?? 0,
        createdAt: Date.now(),
        answeredAt: null,
      }
      ;(questionsBySession[sessionId] ??= []).push(q)
      emitFeed(sessionId, 'decision_prompt', q.prompt.question, q.id)
      questionListeners.forEach((cb) => cb({ sessionId, question: q }))
      c.status = 'needs_you'
      pushBoard(c)
    }, 4200)
  }

  const promoteNextPlanned = (projectId: string): void => {
    const next = (cards[projectId] ?? [])
      .filter((c) => c.status === 'planned')
      .sort((a, b) => a.position - b.position)[0]
    if (next) {
      next.status = 'up_next'
      pushBoard(next)
    }
  }

  return {
    projects: {
      list: async () => ({ projects: [...projects].sort((a, b) => b.updatedAt - a.updatedAt) }),
      create: async (name) => {
        const p = mk(name, 'planning', 'idle', -1 * ++seq)
        projects.unshift(p)
        cards[p.id] = []
        return { project: p }
      },
      get: async (projectId) => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) return { error: 'not_found' }
        return { project, cards: cards[projectId] ?? [] }
      },
    },
    cards: {
      create: async (projectId, type, title) => {
        const list = cards[projectId] ?? (cards[projectId] = [])
        const c: Card = {
          id: uid(),
          projectId,
          type,
          title,
          status: 'planned',
          source: 'user_added',
          position: list.length,
          stepLabel: null,
          dependsOn: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sessionId: null,
          decisionPrompt: null,
          checkpoint: null,
        }
        list.push(c)
        return { card: c }
      },
      updateStatus: async (cardId, status) => {
        const c = findCard(cardId)
        if (!c) return { error: 'not_found' }
        c.status = status
        pushBoard(c)
        return { card: c }
      },
      approveCheckpoint: async (cardId, verdict, flagNote) => {
        const c = findCard(cardId)
        if (!c) return { error: 'not_found' }
        c.checkpoint = { status: verdict, ...(flagNote ? { flagNote } : {}) }
        if (verdict === 'approved') {
          c.status = 'done'
          pushBoard(c)
          promoteNextPlanned(c.projectId)
        } else {
          pushBoard(c)
        }
        return { card: c }
      },
    },
    sessions: {
      start: async (projectId, cardId) => {
        const c = findCard(cardId)
        if (!c) return { error: 'not_found' }
        const sessionId = uid()
        const session: Session = {
          id: sessionId,
          projectId,
          cardId,
          name: c.stepLabel ?? c.title,
          status: 'active',
          startedAt: Date.now(),
          endedAt: null,
          resumedAt: null,
        }
        c.sessionId = sessionId
        c.status = 'building'
        c.checkpoint = null
        sessionCard[sessionId] = c
        feeds[sessionId] = []
        questionsBySession[sessionId] = []
        pushBoard(c)
        startScripted(sessionId, c)
        return { session }
      },
      steer: async (sessionId, mode, text) => {
        const verb =
          mode === 'interrupt' ? 'Asked it to stop' : mode === 'redirect' ? 'Redirected it' : 'Asked it to look closer'
        emitFeed(sessionId, 'steering', `${verb}: ${text}`)
        return { ok: true as const }
      },
      answerDecision: async (sessionId, questionId, answer) => {
        const list = questionsBySession[sessionId] ?? []
        const q = list.find((x) => x.id === questionId)
        if (!q) return { error: 'not_found' }
        q.status = 'answered'
        q.answer = answer
        q.answeredAt = Date.now()
        questionListeners.forEach((cb) => cb({ sessionId, question: q }))
        emitFeed(sessionId, 'narration', `You answered: ${answer}`)
        const c = sessionCard[sessionId]
        if (c) {
          c.status = 'building'
          pushBoard(c)
          finishScripted(sessionId, c)
        }
        return { question: q }
      },
      getQuestions: async (sessionId) => ({ questions: questionsBySession[sessionId] ?? [] }),
      reopenQuestion: async (sessionId, questionId) => {
        const q = (questionsBySession[sessionId] ?? []).find((x) => x.id === questionId)
        if (!q) return { error: 'not_found' }
        q.status = 'reopened'
        questionListeners.forEach((cb) => cb({ sessionId, question: q }))
        return { question: q }
      },
    },
    events: {
      onBoardUpdate: (cb) => {
        boardListeners.add(cb)
        return () => boardListeners.delete(cb)
      },
      onBackgroundStatus: (cb) => {
        bgListeners.add(cb)
        return () => bgListeners.delete(cb)
      },
      onFeedEvent: (cb) => {
        feedListeners.add(cb)
        return () => feedListeners.delete(cb)
      },
      onQuestionUpdate: (cb) => {
        questionListeners.add(cb)
        return () => questionListeners.delete(cb)
      },
    },
    startProbe: async () => ({ sessionId: uid() }),
    getFeed: async (sessionId) => ({ events: feeds[sessionId] ?? [] }),
  }
}
