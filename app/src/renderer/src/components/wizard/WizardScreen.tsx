import { useEffect } from 'react'
import { useWizard } from '../../store/wizard'
import { useProjects } from '../../store/projects'
import { Confetti } from '../Confetti'
import { Rail } from '../Rail'
import { ScopingQA } from './ScopingQA'
import { PlanReview } from './PlanReview'

/** The new-project wizard shell (F3–F8): scoping → plan review → approving. */
export function WizardScreen({ projectId }: { projectId: string }): React.JSX.Element {
  // Phase 4: coming back to a project's wizard rehydrates its persisted Q&A state.
  useEffect(() => {
    void useWizard.getState().restore(projectId)
  }, [projectId])

  const step = useWizard((s) => s.step)
  const question = useWizard((s) => s.question)
  const qStep = useWizard((s) => s.qStep)
  const qTotal = useWizard((s) => s.qTotal)
  const plan = useWizard((s) => s.plan)
  const name = useWizard((s) => s.name)
  const answer = useWizard((s) => s.answer)
  const approve = useWizard((s) => s.approve)
  const editPlan = useWizard((s) => s.editPlan)
  const setName = useWizard((s) => s.setName)
  const retry = useWizard((s) => s.retry)
  const reset = useWizard((s) => s.reset)
  const newBuild = useProjects((s) => s.newBuild)

  const headerName = name || useProjects.getState().projects.find((p) => p.id === projectId)?.name || 'New project'

  const backToStart = (): void => {
    reset()
    newBuild()
  }

  return (
    <div className="relative h-full w-full bg-canvas">
      <Confetti />
      <div className="relative mx-auto flex h-full w-full max-w-[1640px] gap-6 p-6">
        <Rail activeProjectId={projectId} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-soft">
            <span className="rounded-full brut-2 bg-lime px-2.5 py-0.5 text-[10px] font-black tracking-wide text-ink">
              NEW PROJECT
            </span>
            <span className="truncate">{headerName}</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {step === 'scoping' && (
              <ScopingQA question={question} step={qStep} total={qTotal} onAnswer={(a) => void answer(a)} />
            )}

            {step === 'plan_review' && plan && (
              <PlanReview
                name={name}
                plan={plan}
                onName={setName}
                onPlan={editPlan}
                onApprove={() => void approve()}
                onBack={() => void retry()}
              />
            )}

            {step === 'approving' && (
              <div className="grid flex-1 place-items-center text-center">
                <div>
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-ink/15 border-t-ink" />
                  <div className="font-display text-2xl font-black text-ink">Getting your plan ready…</div>
                  <div className="mt-1 text-soft">Hang tight — setting up the board.</div>
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="grid flex-1 place-items-center text-center">
                <div className="max-w-md rounded-[20px] brut bg-orangesoft p-7">
                  <div className="font-display text-2xl font-black text-ink">Something broke</div>
                  <div className="mt-1.5 text-soft">I couldn’t reach the agent. This is on me, not you.</div>
                  <div className="mt-5 flex justify-center gap-2">
                    <button
                      onClick={() => void retry()}
                      className="rounded-full brut-2 bg-ink px-5 py-2.5 text-sm font-bold text-cream"
                    >
                      Try again
                    </button>
                    <button
                      onClick={backToStart}
                      className="rounded-full brut-2 bg-cream px-5 py-2.5 text-sm font-bold text-ink"
                    >
                      Back to start
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
