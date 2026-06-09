import { create } from 'zustand'
import { helm } from '../bridge'
import { isIpcError, type Card, type ShelfItem } from '@shared/ipc-schemas'

/**
 * The For-Later shelf (parked mid-journey requests). Stays live via the
 * `shelf:updated` push — every add/promote/remove on the core re-broadcasts the
 * full per-project list, so the panel never polls.
 */
interface ShelfState {
  items: Record<string, ShelfItem[]>
  load: (projectId: string) => Promise<void>
  add: (projectId: string, title: string) => Promise<void>
  promote: (projectId: string, itemId: string) => Promise<Card | null>
  remove: (projectId: string, itemId: string) => Promise<void>
  /** Subscribe to shelf:updated; returns an unsubscribe. Call once on mount. */
  subscribe: () => () => void
}

export const useShelf = create<ShelfState>((set) => ({
  items: {},

  load: async (projectId) => {
    const res = await helm.shelf.list(projectId)
    if (!isIpcError(res)) set((s) => ({ items: { ...s.items, [projectId]: res.items } }))
  },

  add: async (projectId, title) => {
    await helm.shelf.add(projectId, title)
    // The shelf:updated push refreshes the list; no optimistic write needed.
  },

  promote: async (projectId, itemId) => {
    const res = await helm.shelf.promote(itemId, projectId)
    return isIpcError(res) ? null : res.card
  },

  remove: async (projectId, itemId) => {
    await helm.shelf.remove(itemId, projectId)
  },

  subscribe: () =>
    helm.events.onShelfUpdate((p) =>
      set((s) => ({ items: { ...s.items, [p.projectId]: p.items } })),
    ),
}))

/** Convenience selector: items for one project (empty array if unloaded). */
export function shelfItemsFor(state: ShelfState, projectId: string): ShelfItem[] {
  return state.items[projectId] ?? []
}
