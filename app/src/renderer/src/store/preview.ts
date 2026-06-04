import { create } from 'zustand'
import { helm } from '../bridge'
import { isIpcError, type PreviewState } from '@shared/ipc-schemas'

const NONE: PreviewState = { status: 'none' }

interface PreviewStore {
  /** Latest preview state per project, keyed by projectId. */
  states: Record<string, PreviewState>
  setPreviewState: (projectId: string, state: PreviewState) => void
  getPreviewState: (projectId: string) => PreviewState
  /** Backfill the current state from the main process (on tab open / app resume). */
  load: (projectId: string) => Promise<void>
  /** Idempotently bring the project's dev server up (called when the live tab opens). */
  ensureServer: (projectId: string) => Promise<void>
  /** Subscribe to push updates from the main process. Returns an unsubscribe fn. */
  subscribe: () => () => void
}

export const usePreview = create<PreviewStore>((set, get) => ({
  states: {},

  setPreviewState: (projectId, state) =>
    set((s) => ({ states: { ...s.states, [projectId]: state } })),

  getPreviewState: (projectId) => get().states[projectId] ?? NONE,

  load: async (projectId) => {
    const res = await helm.preview.getState(projectId)
    if (!isIpcError(res)) get().setPreviewState(projectId, res.state)
  },

  ensureServer: async (projectId) => {
    const res = await helm.preview.startServer(projectId)
    // `already_running` carries the live URL — treat it as success.
    if (isIpcError(res)) {
      const err = res as { error: string; url?: string }
      if (err.error === 'already_running' && err.url) {
        get().setPreviewState(projectId, { status: 'live', url: err.url })
      }
      return
    }
    get().setPreviewState(projectId, { status: 'live', url: res.url })
  },

  subscribe: () =>
    helm.events.onPreviewUpdate((p) => get().setPreviewState(p.projectId, p.state)),
}))
