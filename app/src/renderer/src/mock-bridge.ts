import type { HelmApi } from '../../shared/bridge-api'
import type { BackgroundStatus, Card, Project, ProjectStatus } from '../../shared/ipc-schemas'

/**
 * In-memory implementation of the bridge for running the UI in a plain browser
 * (visual review + dogfooding) without launching Electron. Seeded with the
 * three projects from the design so the switcher looks real.
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
    sessionId: status === 'building' ? 'mock-session' : null,
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

  // Seed the second project paused on a real decision so the headline renders.
  {
    const pid = projects[1].id
    cards[pid] = [
      card(pid, 0, 'feature', 'Employee directory', 'done'),
      card(pid, 1, 'feature', 'Time-off requests', 'needs_you', {
        sessionId: 'mock-session-2',
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
        const card: Card = {
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
        list.push(card)
        return { card }
      },
      updateStatus: async (cardId) => {
        for (const list of Object.values(cards)) {
          const card = list.find((c) => c.id === cardId)
          if (card) return { card }
        }
        return { error: 'not_found' }
      },
      approveCheckpoint: async (cardId) => {
        for (const list of Object.values(cards)) {
          const card = list.find((c) => c.id === cardId)
          if (card) return { card }
        }
        return { error: 'not_found' }
      },
    },
    sessions: {
      reopenQuestion: async () => ({ error: 'not_found' }),
    },
    events: {
      onBoardUpdate: () => () => {},
      onBackgroundStatus: () => () => {},
      onFeedEvent: () => () => {},
    },
    startProbe: async () => ({ sessionId: 'mock-session' }),
    getFeed: async () => ({ events: [] }),
  }
}
