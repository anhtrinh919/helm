import { create } from 'zustand'
import { helm } from '../bridge'
import { isIpcError, type Card } from '@shared/ipc-schemas'

interface BoardState {
  projectId: string | null
  projectName: string
  cards: Card[]
  loading: boolean
  loadBoard: (projectId: string) => Promise<void>
  addCard: (type: 'feature' | 'bug', title: string) => Promise<void>
  applyUpdate: (card: Card) => void
  approveCheckpoint: (
    cardId: string,
    verdict: 'approved' | 'flagged',
    flagNote?: string,
  ) => Promise<void>
}

function sortByPosition(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.position - b.position)
}

export const useBoard = create<BoardState>((set, get) => ({
  projectId: null,
  projectName: '',
  cards: [],
  loading: true,

  loadBoard: async (projectId) => {
    set({ loading: true, projectId })
    const res = await helm.projects.get(projectId)
    if (isIpcError(res)) {
      set({ loading: false, cards: [] })
      return
    }
    set({ cards: sortByPosition(res.cards), projectName: res.project.name, loading: false })
  },

  addCard: async (type, title) => {
    const projectId = get().projectId
    if (!projectId) return
    const res = await helm.cards.create(projectId, type, title)
    if (isIpcError(res)) return
    set((s) => ({ cards: sortByPosition([...s.cards, res.card]) }))
  },

  applyUpdate: (card) =>
    set((s) => {
      const exists = s.cards.some((c) => c.id === card.id)
      const cards = exists
        ? s.cards.map((c) => (c.id === card.id ? card : c))
        : [...s.cards, card]
      return { cards: sortByPosition(cards) }
    }),

  approveCheckpoint: async (cardId, verdict, flagNote) => {
    const res = await helm.cards.approveCheckpoint(cardId, verdict, flagNote)
    if (isIpcError(res)) return
    get().applyUpdate(res.card)
  },
}))
