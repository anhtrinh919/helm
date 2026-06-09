import { create } from 'zustand'
import { helm } from '../bridge'
import { isIpcError, type BackgroundStatus, type Project } from '@shared/ipc-schemas'

export type View =
  | { name: 'front-door' }
  | { name: 'switcher' }
  | { name: 'wizard'; projectId: string }
  | { name: 'journey'; projectId: string }
  | { name: 'board'; projectId: string }
  | { name: 'session'; projectId: string; cardId: string }

interface ProjectsState {
  projects: Project[]
  loading: boolean
  view: View
  /** Journey-complete celebration overlay (Group 9). Null when not celebrating. */
  celebration: { projectId: string } | null
  init: () => Promise<void>
  refresh: () => Promise<void>
  /** Open a project on the right surface: Build mode + unfinished → journey, else board. */
  open: (projectId: string) => void
  openJourney: (projectId: string) => void
  openWizard: (projectId: string) => void
  openSession: (projectId: string, cardId: string) => void
  backToBoard: (projectId: string) => void
  newBuild: () => void
  backToSwitcher: () => void
  /** Escape hatch / celebration exit: flip to iterate mode, then land on the board. */
  leaveJourney: (projectId: string) => Promise<void>
  showCelebration: (projectId: string) => void
  dismissCelebration: () => Promise<void>
  applyBackgroundStatus: (projectId: string, status: BackgroundStatus) => void
}

/** Where a project should open: the guided journey while a Build is unfinished,
 *  otherwise the free-iteration board. */
function surfaceFor(project: Project | undefined): 'journey' | 'board' {
  if (project && project.mode === 'build' && !project.railComplete) return 'journey'
  return 'board'
}

export const useProjects = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: true,
  view: { name: 'front-door' },
  celebration: null,

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

  open: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    set({ view: { name: surfaceFor(project), projectId } })
  },
  openJourney: (projectId) => set({ view: { name: 'journey', projectId } }),
  openWizard: (projectId) => set({ view: { name: 'wizard', projectId } }),
  openSession: (projectId, cardId) => set({ view: { name: 'session', projectId, cardId } }),
  backToBoard: (projectId) => {
    // From a session, return to whichever surface the project belongs on.
    const project = get().projects.find((p) => p.id === projectId)
    set({ view: { name: surfaceFor(project), projectId } })
  },
  newBuild: () => set({ view: { name: 'front-door' } }),
  backToSwitcher: () => set({ view: { name: 'switcher' } }),

  leaveJourney: async (projectId) => {
    // Escape hatch / celebration exit: flip to iterate mode, then land on the board.
    const res = await helm.projects.setMode(projectId, 'iterate')
    if (!isIpcError(res)) {
      set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? res.project : p)) }))
    }
    set({ view: { name: 'board', projectId }, celebration: null })
    void get().refresh()
  },

  showCelebration: (projectId) => set({ celebration: { projectId } }),
  dismissCelebration: async () => {
    const c = get().celebration
    if (c) await get().leaveJourney(c.projectId)
    else set({ celebration: null })
  },

  applyBackgroundStatus: (projectId, status) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, backgroundStatus: status } : p,
      ),
    })),
}))
