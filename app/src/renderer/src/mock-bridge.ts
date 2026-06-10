import type { HelmApi } from '../../shared/bridge-api'
import type {
  BackgroundStatus,
  BackgroundStatusPush,
  BoardUpdatePush,
  Card,
  FeedEvent,
  FeedEventPush,
  FixCommentPin,
  PinsUpdatePush,
  PointCapturePush,
  PreviewState,
  PreviewUpdatePush,
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
    artifactDir: null,
    mode: 'iterate',
    railStep: null,
    railComplete: status === 'done',
    importFolder: null,
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
    outcome: null,
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
  const previewListeners = new Set<(p: PreviewUpdatePush) => void>()
  const pinsListeners = new Set<(p: PinsUpdatePush) => void>()
  const pointCaptureListeners = new Set<(p: PointCapturePush) => void>()

  // Live Preview simulation. In a plain browser there is no real dev server, so
  // the "live" state points the embed at a tiny inline demo app so the preview
  // states (none → building → live → snag → blocked) can be dogfooded.
  const previewStates: Record<string, PreviewState> = {}
  const DEMO_APP_URL =
    'data:text/html,' +
    encodeURIComponent(
      `<!doctype html><meta charset=utf8><style>body{margin:0;font:16px/1.5 system-ui;background:#fff;color:#1b1208}` +
        `header{padding:18px 22px;border-bottom:2px solid #1b1208;font-weight:800}` +
        `.row{display:flex;gap:14px;padding:18px 22px}` +
        `.t{flex:1;border:2px solid #1b1208;border-radius:12px;padding:14px;background:#fff7e6}` +
        `.t b{display:block;margin-bottom:6px}button{font:inherit;font-weight:700;border:2px solid #1b1208;` +
        `border-radius:999px;background:#c8f23a;padding:8px 14px;cursor:pointer}</style>` +
        `<header>Customer feedback portal — inbox</header><div class=row>` +
        `<div class=t><b>“Love the new dashboard, but export is slow”</b><button onclick="this.textContent='Replied ✓'">Reply</button></div>` +
        `<div class=t><b>“Can we get dark mode?”</b><button onclick="this.textContent='Replied ✓'">Reply</button></div></div>`,
    )

  const pushPreview = (projectId: string, state: PreviewState): void => {
    previewStates[projectId] = state
    previewListeners.forEach((cb) => cb({ projectId, state }))
  }
  // Projects that have produced a runnable artifact (a real build session ran).
  // startServer only has something to serve for these — mirrors the real
  // `no_artifact` semantics so opening the tab on an unbuilt project stays calm.
  const builtProjects = new Set<string>([projects[0]!.id])
  // The active demo project already has a running app to preview.
  previewStates[projects[0]!.id] = { status: 'live', url: DEMO_APP_URL }

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
      // The build produced a runnable version — the preview goes live.
      pushPreview(c.projectId, { status: 'live', url: DEMO_APP_URL })
      emitFeed(sessionId, 'checkpoint', 'Here’s what I built — does this look right?', c.id)
    }, 1700)
  }

  const startScripted = (sessionId: string, c: Card): void => {
    // A real build session is in flight — the preview shows the building veil.
    pushPreview(c.projectId, { status: 'building' })
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

  /* ----------------------- point-and-fix simulation (Phase 3) ----------------------- */

  const pinsByProject: Record<string, FixCommentPin[]> = {}
  const activeFix = new Map<string, string>() // projectId → running fix sessionId
  const fixQueue = new Map<string, string[]>() // projectId → queued cardIds

  const pushPins = (projectId: string): void => {
    const pins = pinsByProject[projectId] ?? []
    const queuedCardIds = [...(fixQueue.get(projectId) ?? [])]
    pinsListeners.forEach((cb) => cb({ projectId, pins, queuedCardIds }))
  }

  const runScriptedFix = (sessionId: string, c: Card): void => {
    const lines: [number, FeedEvent['kind'], string][] = [
      [500, 'narration', 'Taking a look at the spot you pointed at.'],
      [1300, 'narration', 'Found it — making the change now.'],
      [2100, 'activity', 'Working on it'],
      [2900, 'narration', 'Done — double-checking nothing else moved.'],
    ]
    lines.forEach(([t, k, txt]) => setTimeout(() => emitFeed(sessionId, k, txt), t))
    setTimeout(() => {
      c.checkpoint = { status: 'pending' }
      pushBoard(c)
      emitFeed(sessionId, 'checkpoint', 'Here’s the fix — does this look right?', c.id)
    }, 3600)
  }

  const startFixNow = (projectId: string, c: Card): Session => {
    const sessionId = uid()
    const session: Session = {
      id: sessionId,
      projectId,
      cardId: c.id,
      name: c.title,
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
    activeFix.set(projectId, sessionId)
    pushBoard(c)
    runScriptedFix(sessionId, c)
    return session
  }

  /* ----------------------- wizard (scripted scoping) ----------------------- */

  const wizardSessions: Record<string, { asked: number; idea: string }> = {}
  const SCRIPT: { type: 'buttons' | 'freetext'; question: string; options?: string[] }[] = [
    { type: 'buttons', question: 'Who will use this?', options: ['Just me', 'My team', 'My customers'] },
    { type: 'freetext', question: 'What’s the single most important thing it needs to do?' },
    {
      type: 'buttons',
      question: 'How should people sign in?',
      options: ['Email & password', 'Magic link', 'No login needed'],
    },
  ]
  const WTOTAL = SCRIPT.length

  const niceName = (idea: string): string => {
    const stop = new Set(['app', 'application', 'and', 'for', 'with', 'that', 'our', 'export'])
    const words = idea
      .toLowerCase()
      .replace(/^(i want to build |i wanna build |build |a |an |the )/g, '')
      .split(/[\s,]+/)
      .filter((w) => w.length > 2 && !stop.has(w))
    const pick = words.slice(0, 2).map((w) => w[0]!.toUpperCase() + w.slice(1))
    return pick.join(' ') || 'New Project'
  }

  const scriptedPlan = (): { id: string; title: string; detail: string }[] =>
    [
      ['Set up the project shell', 'Create the app skeleton and prepare the workspace.'],
      ['Accounts and sign-in', 'Let the right people in and keep their data safe.'],
      ['Capture entries', 'The main screen where people add what matters.'],
      ['Organize and review', 'Browse, filter, and make sense of everything captured.'],
      ['Reports and export', 'Turn the data into something shareable.'],
    ].map(([title, detail]) => ({ id: uid(), title: title!, detail: detail! }))

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
      rename: async (projectId, name) => {
        const p = projects.find((x) => x.id === projectId)
        if (!p) return { error: 'not_found' }
        p.name = name
        p.updatedAt = Date.now()
        return { project: p }
      },
      delete: async (projectId) => {
        const idx = projects.findIndex((x) => x.id === projectId)
        if (idx === -1) return { error: 'not_found' }
        projects.splice(idx, 1)
        delete cards[projectId]
        return { ok: true as const }
      },
      setMode: async (projectId, mode) => {
        const p = projects.find((x) => x.id === projectId)
        if (!p) return { error: 'not_found' }
        p.mode = mode
        return { project: p }
      },
      setRailStep: async (projectId, step) => {
        const p = projects.find((x) => x.id === projectId)
        if (!p) return { error: 'not_found' }
        p.railStep = step
        return { project: p }
      },
      get: async (projectId) => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) return { error: 'not_found' }
        return { project, cards: cards[projectId] ?? [] }
      },
      reorder: async (orderedIds) => {
        projects.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
        return { ok: true as const }
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
          outcome: null,
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

        // Fix-comment cards (Phase 3): approve resolves the pin + refreshes the
        // preview; reject sends the note back into the same scripted session.
        if (c.type === 'fix_comment') {
          if (verdict === 'approved') {
            c.status = 'done'
            pushBoard(c)
            pinsByProject[c.projectId] = (pinsByProject[c.projectId] ?? []).filter(
              (p) => p.cardId !== c.id,
            )
            pushPins(c.projectId)
            activeFix.delete(c.projectId)
            // The fix lands: brief rebuild veil, then the refreshed app.
            pushPreview(c.projectId, { status: 'building' })
            setTimeout(() => pushPreview(c.projectId, { status: 'live', url: DEMO_APP_URL }), 900)
            // Auto-start the next queued fix — board updates only, no navigation.
            const nextId = (fixQueue.get(c.projectId) ?? []).shift()
            if (nextId) {
              pushPins(c.projectId) // queue shrank — QUEUED badge drops
              const next = findCard(nextId)
              if (next) startFixNow(c.projectId, next)
            }
          } else {
            c.status = 'building'
            c.checkpoint = null
            pushBoard(c)
            const sid = c.sessionId
            if (sid) {
              emitFeed(sid, 'steering', `You sent it back: ${flagNote ?? ''}`)
              setTimeout(() => emitFeed(sid, 'narration', 'Got it — adjusting based on your note.'), 700)
              setTimeout(() => {
                c.checkpoint = { status: 'pending' }
                pushBoard(c)
                emitFeed(sid, 'checkpoint', 'Here’s the new version — better?', c.id)
              }, 2000)
            }
          }
          return { card: c }
        }

        if (verdict === 'approved') {
          c.status = 'done'
          pushBoard(c)
          promoteNextPlanned(c.projectId)
        } else {
          pushBoard(c)
        }
        return { card: c }
      },
      setOutcome: async (cardId, outcome) => {
        const c = findCard(cardId)
        if (!c) return { error: 'card_not_found' }
        const trimmed = outcome.trim()
        if (trimmed.length === 0 || trimmed.length > 500) return { error: 'invalid_input' }
        c.outcome = trimmed
        pushBoard(c)
        return { ok: true as const }
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
        builtProjects.add(projectId) // a build is now producing a real artifact
        pushBoard(c)
        startScripted(sessionId, c)
        return { session }
      },
      steer: async (sessionId, mode, text) => {
        const verb =
          mode === 'interrupt' ? 'Asked it to stop' : mode === 'redirect' ? 'Redirected it' : 'Asked it to look closer'
        emitFeed(sessionId, 'steering', `${verb}: ${text}`)
        if (mode === 'interrupt') {
          // A deliberate stop: halt calmly, return the card to up_next (resumable).
          emitFeed(sessionId, 'stopped', 'You stopped this build — your place is saved.')
          const c = sessionCard[sessionId]
          if (c) {
            c.status = 'up_next'
            pushBoard(c)
          }
        }
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
        if (q.status === 'pending') return { error: 'cannot_reopen' }
        q.status = 'reopened'
        questionListeners.forEach((cb) => cb({ sessionId, question: q }))
        emitFeed(sessionId, 'narration', 'You re-opened a question — I’ll wait for your updated answer.')
        const c = sessionCard[sessionId]
        if (c) {
          c.status = 'needs_you'
          pushBoard(c)
        }
        return { question: q }
      },
      stop: async (sessionId) => {
        const c = sessionCard[sessionId]
        if (!c) return { error: 'not_found' }
        c.status = 'up_next'
        pushBoard(c)
        emitFeed(sessionId, 'stopped', 'You stopped this build — your place is saved.')
        return { ok: true as const }
      },
    },
    // Phase 4 surfaces — the web mock is retired as a dogfood vehicle; these are
    // honest no-data stubs that keep the browser build compiling, nothing more.
    shelf: {
      list: async () => ({ items: [] }),
      add: async () => ({ error: 'mock_unsupported' }),
      promote: async () => ({ error: 'mock_unsupported' }),
      remove: async () => ({ ok: true as const }),
    },
    import: {
      scan: async () => ({ found: false as const }),
      start: async () => ({ error: 'mock_unsupported' }),
    },
    wizard: {
      startScoping: async (_projectId, idea) => {
        const sessionId = uid()
        wizardSessions[sessionId] = { asked: 1, idea }
        return { kind: 'question' as const, sessionId, question: SCRIPT[0]!, step: 1, total: WTOTAL }
      },
      answerScoping: async (sessionId, _answer) => {
        const ws = wizardSessions[sessionId]
        if (!ws) return { error: 'not_found' }
        const idx = ws.asked
        if (idx < SCRIPT.length) {
          ws.asked = idx + 1
          return { kind: 'question' as const, sessionId, question: SCRIPT[idx]!, step: ws.asked, total: WTOTAL }
        }
        return { kind: 'plan' as const, sessionId, name: niceName(ws.idea), plan: scriptedPlan() }
      },
      revisePlan: async (_projectId, _idea, _mode, name, plan, _note) => {
        // Stateless by design — echoes the plan back under a fresh session id.
        return { kind: 'plan' as const, sessionId: uid(), name, plan }
      },
      approvePlan: async (projectId, name, plan) => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) return { error: 'not_found' }
        project.name = name
        project.status = 'building'
        project.backgroundStatus = 'idle'
        const seeded: Card[] = plan.map((b, i) => ({
          id: uid(),
          projectId,
          type: 'feature',
          title: b.title,
          status: 'planned',
          source: 'plan_seed',
          position: i,
          stepLabel: `Step ${i + 1} of ${plan.length}: ${b.title}`,
          dependsOn: [],
          createdAt: now,
          updatedAt: now,
          sessionId: null,
          decisionPrompt: null,
          checkpoint: null,
          outcome: b.detail ?? null,
        }))
        cards[projectId] = seeded
        seeded.forEach((c) => pushBoard(c))
        return { project, cards: seeded }
      },
      saveState: async () => ({ ok: true as const }),
      getState: async () => ({ state: null }),
    },
    preview: {
      getState: async (projectId) => ({ state: previewStates[projectId] ?? { status: 'none' } }),
      startServer: async (projectId) => {
        // Nothing to serve until a build has produced an artifact.
        if (!builtProjects.has(projectId)) return { error: 'no_artifact' }
        pushPreview(projectId, { status: 'live', url: DEMO_APP_URL })
        return { url: DEMO_APP_URL }
      },
      stopServer: async (projectId) => {
        pushPreview(projectId, { status: 'none' })
        return { stopped: true as const }
      },
    },
    points: {
      register: async (req) => {
        const project = projects.find((p) => p.id === req.projectId)
        if (!project) return { error: 'not_found' }
        const state = previewStates[req.projectId]
        if (state?.status !== 'live') return { error: 'preview_not_live' }
        const list = cards[req.projectId] ?? (cards[req.projectId] = [])
        const c: Card = {
          id: uid(),
          projectId: req.projectId,
          type: 'fix_comment',
          title: req.note,
          status: 'waiting',
          source: 'user_added',
          position: list.length,
          stepLabel: null,
          dependsOn: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sessionId: null,
          decisionPrompt: null,
          checkpoint: null,
          outcome: null,
          noteType: req.noteType,
          pageLevel: req.pinX == null,
        }
        list.push(c)
        pushBoard(c)
        ;(pinsByProject[req.projectId] ??= []).push({
          cardId: c.id,
          pinX: req.pinX ?? null,
          pinY: req.pinY ?? null,
          noteType: req.noteType,
        })
        pushPins(req.projectId)
        return { card: c }
      },
      list: async (projectId) => ({
        pins: pinsByProject[projectId] ?? [],
        queuedCardIds: [...(fixQueue.get(projectId) ?? [])],
      }),
      activate: async () => ({ ok: true as const }),
      deactivate: async () => ({ ok: true as const }),
      activateTextEdit: async () => ({ ok: true as const }),
      deactivateTextEdit: async () => ({ ok: true as const }),
      registerTextEdit: async () => ({ error: 'mock_unsupported' }),
    },
    fixSessions: {
      start: async (projectId, cardId) => {
        const c = findCard(cardId)
        if (!c || c.type !== 'fix_comment') return { error: 'not_found' }
        if (c.status !== 'waiting') return { error: 'not_waiting' }
        if (activeFix.has(projectId)) {
          const q = fixQueue.get(projectId) ?? []
          if (!q.includes(cardId)) {
            q.push(cardId)
            fixQueue.set(projectId, q)
            pushPins(projectId) // queue membership changed — board shows QUEUED
          }
          return { queued: true as const, session: null }
        }
        return { queued: false as const, session: startFixNow(projectId, c) }
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
      onPreviewUpdate: (cb) => {
        previewListeners.add(cb)
        return () => previewListeners.delete(cb)
      },
      onPinsUpdate: (cb) => {
        pinsListeners.add(cb)
        return () => pinsListeners.delete(cb)
      },
      onPointCapture: (cb) => {
        pointCaptureListeners.add(cb)
        return () => pointCaptureListeners.delete(cb)
      },
      onShelfUpdate: () => () => {},
    },
    history: {
      decisions: async (projectId) => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) return { entries: [] }
        const ms = project.createdAt
        return {
          entries: [
            {
              id: uid(), sessionId: uid(), sessionName: 'Step 1 of 5: User auth',
              cardId: uid(), cardTitle: 'User sign-in & sign-up',
              question: 'Should users sign in with an email/password or use a magic-link flow?',
              answer: 'Email and password — I want to keep it simple for now.',
              answeredAt: ms + 120_000,
            },
            {
              id: uid(), sessionId: uid(), sessionName: 'Step 2 of 5: Feedback form',
              cardId: uid(), cardTitle: 'Feedback submission form',
              question: 'How many categories should feedback be tagged with?',
              answer: 'Three: Bug, Feature request, and General feedback.',
              answeredAt: ms + 3_600_000,
            },
            {
              id: uid(), sessionId: uid(), sessionName: 'Step 3 of 5: Dashboard',
              cardId: uid(), cardTitle: 'Admin dashboard',
              question: 'Should the dashboard have a chart showing submissions over time?',
              answer: 'Yes — a simple bar chart by week.',
              answeredAt: ms + 7_200_000,
            },
          ],
        }
      },
      progress: async (projectId) => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) return { entries: [] }
        const ms = project.createdAt
        return {
          entries: [
            {
              id: uid(), sessionId: uid(), sessionName: 'Step 1 of 5: User auth',
              cardId: uid(), cardTitle: 'User sign-in & sign-up',
              cardStepLabel: 'Step 1 of 5: User sign-in & sign-up',
              status: 'complete' as const,
              startedAt: ms + 60_000,
              completedAt: ms + 18 * 60_000,
            },
            {
              id: uid(), sessionId: uid(), sessionName: 'Step 2 of 5: Feedback form',
              cardId: uid(), cardTitle: 'Feedback submission form',
              cardStepLabel: 'Step 2 of 5: Feedback submission form',
              status: 'complete' as const,
              startedAt: ms + 20 * 60_000,
              completedAt: ms + 44 * 60_000,
            },
            {
              id: uid(), sessionId: uid(), sessionName: 'Step 3 of 5: Dashboard',
              cardId: uid(), cardTitle: 'Admin dashboard',
              cardStepLabel: 'Step 3 of 5: Admin dashboard',
              status: 'complete' as const,
              startedAt: ms + 50 * 60_000,
              completedAt: ms + 80 * 60_000,
            },
          ],
        }
      },
      docs: async (projectId) => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) return { content: null }
        return {
          content: `# ${project.name}\n\nA web app built with Helm.\n\n## Getting started\n\nRun \`npm install\` then \`npm run dev\` to start the development server.\n\n## Features\n\n- User sign-in and sign-up with email/password\n- Feedback submission form with category tagging\n- Admin dashboard with weekly submission chart\n- Email notifications for new feedback`,
        }
      },
    },
    startProbe: async () => ({ sessionId: uid() }),
    getFeed: async (sessionId) => ({ events: feeds[sessionId] ?? [] }),
  }
}
