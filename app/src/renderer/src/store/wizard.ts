import { create } from 'zustand'
import { helm } from '../bridge'
import { useProjects } from './projects'
import {
  isIpcError,
  type DecisionPrompt,
  type PlanBlock,
  type ProjectMode,
  type WizardScopingResponse,
} from '@shared/ipc-schemas'

export type WizardStep = 'idea' | 'scoping' | 'plan_review' | 'approving' | 'error'

interface WizardState {
  idea: string
  projectId: string | null
  sessionId: string | null
  step: WizardStep
  /** Build (guided journey) vs Iterate (freeform) — picked at the front door. */
  mode: ProjectMode
  /** null while the agent is thinking up the next question. */
  question: DecisionPrompt | null
  /** A batch of questions to answer together (decision-tree round). null otherwise. */
  questions: DecisionPrompt[] | null
  qStep: number
  qTotal: number
  plan: PlanBlock[] | null
  name: string
  /** Front-door entry: open a fresh wizard at the idea-input step in the chosen mode. */
  startNew: (mode: ProjectMode) => void
  /** Step back from the Q&A to the idea-input, keeping the idea editable. */
  backToIdea: () => void
  /** Submit the idea from the idea-input step: reuses the project if one exists
   *  (came back to edit), else creates it. Then (re)starts the scoping interview. */
  reviseIdea: (idea: string) => Promise<void>
  /** Create the project and open the scoping conversation (in the chosen mode). */
  begin: (idea: string) => Promise<void>
  answer: (answer: string) => Promise<void>
  /** Submit a full batch of answers (one per question in the current round). */
  answerBatch: (answers: string[]) => Promise<void>
  approve: () => Promise<void>
  editPlan: (plan: PlanBlock[]) => void
  /** Feed a change note to the live scoping session and regenerate the plan in
   *  place — no re-running the question interview. */
  revisePlan: (note: string) => Promise<void>
  setName: (name: string) => void
  retry: () => Promise<void>
  reset: () => void
  /** Phase 4: rehydrate this project's in-flight wizard (Q&A survives view switches). */
  restore: (projectId: string) => Promise<void>
}

/** The persisted snapshot — everything needed to put the wizard back on screen. */
interface WizardSnapshot {
  idea: string
  sessionId: string | null
  step: WizardStep
  question: DecisionPrompt | null
  questions: DecisionPrompt[] | null
  qStep: number
  qTotal: number
  plan: PlanBlock[] | null
  name: string
}

const BLANK = {
  sessionId: null,
  question: null,
  questions: null as DecisionPrompt[] | null,
  qStep: 0,
  qTotal: 0,
  plan: null as PlanBlock[] | null,
  name: '',
}

export const useWizard = create<WizardState>((set, get) => {
  // Fire-and-forget save of the current wizard snapshot to the project row, so
  // switching projects (or relaunching) never loses the Q&A in progress.
  const persist = (): void => {
    const s = get()
    if (!s.projectId) return
    const snap: WizardSnapshot = {
      idea: s.idea,
      sessionId: s.sessionId,
      step: s.step === 'approving' ? 'plan_review' : s.step,
      question: s.question,
      questions: s.questions,
      qStep: s.qStep,
      qTotal: s.qTotal,
      plan: s.plan,
      name: s.name,
    }
    void helm.wizard.saveState(s.projectId, JSON.stringify(snap))
  }

  const apply = (res: WizardScopingResponse): void => {
    if (res.kind === 'question') {
      set({
        step: 'scoping',
        sessionId: res.sessionId,
        question: res.question,
        questions: null,
        qStep: res.step,
        qTotal: res.total,
      })
    } else if (res.kind === 'question_batch') {
      set({
        step: 'scoping',
        sessionId: res.sessionId,
        question: null,
        questions: res.questions,
        qStep: res.round,
        qTotal: res.totalRounds,
      })
    } else {
      set({
        step: 'plan_review',
        sessionId: res.sessionId,
        question: null,
        questions: null,
        plan: res.plan,
        name: res.name,
      })
    }
    persist()
  }

  return {
    idea: '',
    projectId: null,
    step: 'scoping',
    mode: 'build',
    ...BLANK,

    startNew: (mode) => {
      set({ idea: '', projectId: null, step: 'idea', mode, ...BLANK })
      // No project exists yet — open the wizard view on the idea-input step.
      useProjects.getState().openWizard('')
    },

    backToIdea: () => {
      // Return to the idea-input step with the idea preserved and editable. The
      // forward-only scoping session is dropped; resubmitting restarts it.
      set({ step: 'idea', question: null, questions: null, qStep: 0, qTotal: 0 })
      persist()
    },

    reviseIdea: async (idea) => {
      const projectId = get().projectId
      if (!projectId) {
        await get().begin(idea)
        return
      }
      // Reuse the existing project (we came back to edit) — restart scoping with
      // the edited idea instead of creating a second project.
      set({ idea, step: 'scoping', ...BLANK })
      useProjects.getState().openWizard(projectId)
      const res = await helm.wizard.startScoping(projectId, idea, get().mode)
      if (isIpcError(res)) {
        set({ step: 'error' })
        return
      }
      apply(res)
    },

    begin: async (idea) => {
      const mode = get().mode
      // Short placeholder until the agent names it on plan approval — the raw idea
      // sentence is too long for headers (it overflowed the board title).
      const proj = await helm.projects.create('New build')
      if (isIpcError(proj)) {
        set({ idea, step: 'error', projectId: null, ...BLANK })
        useProjects.getState().openWizard('')
        return
      }
      const projectId = proj.project.id
      // Iterate projects start freeform; Build is the default mode on create.
      if (mode === 'iterate') await helm.projects.setMode(projectId, 'iterate')
      set({ idea, projectId, step: 'scoping', mode, ...BLANK })
      void useProjects.getState().refresh()
      useProjects.getState().openWizard(projectId)

      const res = await helm.wizard.startScoping(projectId, idea, mode)
      if (isIpcError(res)) {
        set({ step: 'error' })
        return
      }
      apply(res)
    },

    answer: async (answer) => {
      const sid = get().sessionId
      if (!sid) return
      set({ step: 'scoping', question: null, questions: null }) // thinking…
      const res = await helm.wizard.answerScoping(sid, answer)
      if (isIpcError(res)) {
        set({ step: 'error' })
        return
      }
      apply(res)
    },

    answerBatch: async (answers) => {
      const sid = get().sessionId
      const batch = get().questions
      if (!sid || !batch) return
      // Pair each question with its answer so the agent reads the round as a block.
      const reply = batch
        .map((q, i) => `Q: ${q.question}\nA: ${answers[i]?.trim() || '(no preference — you choose)'}`)
        .join('\n\n')
      set({ step: 'scoping', question: null, questions: null }) // thinking…
      const res = await helm.wizard.answerScoping(sid, reply)
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

    editPlan: (plan) => {
      set({ plan })
      persist()
    },

    revisePlan: async (note) => {
      const sid = get().sessionId
      if (!sid || !note.trim()) return
      // Same live session that produced the plan — ask it to adjust the plan from
      // the user's note. Go to the thinking state (no plan, no question) meanwhile.
      set({ step: 'scoping', question: null, questions: null, plan: null })
      const msg =
        `Revise the plan based on this feedback, then reply with ONLY the updated ` +
        `plan JSON in the same format (do not ask any more questions): ${note.trim()}`
      const res = await helm.wizard.answerScoping(sid, msg)
      if (isIpcError(res)) {
        set({ step: 'error' })
        return
      }
      apply(res)
    },

    setName: (name) => {
      set({ name })
      persist()
    },

    restore: async (projectId) => {
      if (get().projectId === projectId) return // already live in memory
      const res = await helm.wizard.getState(projectId)
      if (isIpcError(res) || !res.state) return
      try {
        const snap = JSON.parse(res.state) as WizardSnapshot
        set({ projectId, ...snap })
      } catch {
        /* corrupt snapshot — start clean rather than crash the wizard */
      }
    },

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
