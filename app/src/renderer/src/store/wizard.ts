import { create } from 'zustand'
import { helm } from '../bridge'
import { useProjects } from './projects'
import {
  isIpcError,
  type DecisionPrompt,
  type PlanBlock,
  type WizardScopingResponse,
} from '@shared/ipc-schemas'

export type WizardStep = 'scoping' | 'plan_review' | 'approving' | 'error'

interface WizardState {
  idea: string
  projectId: string | null
  sessionId: string | null
  step: WizardStep
  /** null while the agent is thinking up the next question. */
  question: DecisionPrompt | null
  qStep: number
  qTotal: number
  plan: PlanBlock[] | null
  name: string
  /** Create the project and open the scoping conversation. */
  begin: (idea: string) => Promise<void>
  answer: (answer: string) => Promise<void>
  approve: () => Promise<void>
  editPlan: (plan: PlanBlock[]) => void
  setName: (name: string) => void
  retry: () => Promise<void>
  reset: () => void
}

const BLANK = {
  sessionId: null,
  question: null,
  qStep: 0,
  qTotal: 0,
  plan: null as PlanBlock[] | null,
  name: '',
}

export const useWizard = create<WizardState>((set, get) => {
  const apply = (res: WizardScopingResponse): void => {
    if (res.kind === 'question') {
      set({
        step: 'scoping',
        sessionId: res.sessionId,
        question: res.question,
        qStep: res.step,
        qTotal: res.total,
      })
    } else {
      set({ step: 'plan_review', sessionId: res.sessionId, plan: res.plan, name: res.name })
    }
  }

  return {
    idea: '',
    projectId: null,
    step: 'scoping',
    ...BLANK,

    begin: async (idea) => {
      // Short placeholder until the agent names it on plan approval — the raw idea
      // sentence is too long for headers (it overflowed the board title).
      const proj = await helm.projects.create('New build')
      if (isIpcError(proj)) {
        set({ idea, step: 'error', projectId: null, ...BLANK })
        useProjects.getState().openWizard('')
        return
      }
      const projectId = proj.project.id
      set({ idea, projectId, step: 'scoping', ...BLANK })
      void useProjects.getState().refresh()
      useProjects.getState().openWizard(projectId)

      const res = await helm.wizard.startScoping(projectId, idea)
      if (isIpcError(res)) {
        set({ step: 'error' })
        return
      }
      apply(res)
    },

    answer: async (answer) => {
      const sid = get().sessionId
      if (!sid) return
      set({ step: 'scoping', question: null }) // thinking…
      const res = await helm.wizard.answerScoping(sid, answer)
      if (isIpcError(res)) {
        set({ step: 'error' })
        return
      }
      apply(res)
    },

    approve: async () => {
      const { projectId, name, plan } = get()
      if (!projectId || !plan) return
      set({ step: 'approving' })
      const res = await helm.wizard.approvePlan(projectId, name.trim() || 'New project', plan)
      if (isIpcError(res)) {
        set({ step: 'error' })
        return
      }
      void useProjects.getState().refresh()
      useProjects.getState().open(projectId)
      get().reset()
    },

    editPlan: (plan) => set({ plan }),
    setName: (name) => set({ name }),

    retry: async () => {
      const idea = get().idea
      set({ step: 'scoping', ...BLANK })
      const projectId = get().projectId
      if (!projectId) {
        await get().begin(idea)
        return
      }
      const res = await helm.wizard.startScoping(projectId, idea)
      if (isIpcError(res)) {
        set({ step: 'error' })
        return
      }
      apply(res)
    },

    reset: () => set({ idea: '', projectId: null, step: 'scoping', ...BLANK }),
  }
})
