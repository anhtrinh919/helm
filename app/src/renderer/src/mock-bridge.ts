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
