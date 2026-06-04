import { create } from 'zustand'
import { helm } from '../bridge'
import { isIpcError, type BackgroundStatus, type Project } from '@shared/ipc-schemas'

export type View =
  | { name: 'front-door' }
  | { name: 'switcher' }
  | { name: 'wizard'; projectId: string }
  | { name: 'board'; projectId: string }
  | { name: 'session'; projectId: string; cardId: string }

interface ProjectsState {
  projects: Project[]
  loading: boolean
  view: View
  init: () => Promise<void>
  refresh: () => Promise<void>
  open: (projectId: string) => void
  openWizard: (projectId: string) => void
  openSession: (projectId: string, cardId: string) => void
  backToBoard: (projectId: string) => void
  newBuild: () => void
  backToSwitcher: () => void
  applyBackgroundStatus: (projectId: string, status: BackgroundStatus) => void
}

export const useProjects = create<ProjectsState>((set) => ({
  projects: [],
  loading: true,
  view: { name: 'front-door' },

  init: async () => {
    set({ loading: true })
    const res = await helm.projects.list()
    if (isIpcError(res)) {
      set({ loading: false })
      return
    }
    set({
      projects: res.projects,
      loading: false,
      view: res.projects.length === 0 ? { name: 'front-door' } : { name: 'switcher' },
    })
  },

  refresh: async () => {
    const res = await helm.projects.list()
    if (!isIpcError(res)) set({ projects: res.projects })
  },

  open: (projectId) => set({ view: { name: 'board', projectId } }),
  openWizard: (projectId) => set({ view: { name: 'wizard', projectId } }),
  openSession: (projectId, cardId) => set({ view: { name: 'session', projectId, cardId } }),
  backToBoard: (projectId) => set({ view: { name: 'board', projectId } }),
  newBuild: () => set({ view: { name: 'front-door' } }),
  backToSwitcher: () => set({ view: { name: 'switcher' } }),

  applyBackgroundStatus: (projectId, status) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, backgroundStatus: status } : p,
      ),
    })),
}))
