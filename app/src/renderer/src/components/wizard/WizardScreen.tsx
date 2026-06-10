import { useEffect } from 'react'
import { useWizard } from '../../store/wizard'
import { useProjects } from '../../store/projects'
import { ScopingQA } from './ScopingQA'
import { PlanReview } from './PlanReview'
import { Icon } from '../ui/Icon'
import { ClaudeSignal } from '../ui/ClaudeSignal'

function Mark(): React.JSX.Element {
  return <span className="hm-mark">H</span>
}

/** The wizard shell: top bar + centred content column. */
function WizardShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const backToFront = (): void => useProjects.getState().newBuild()
  return (
    <div className="hm hm-guide">
      <div className="hm-guide-top">
        <div className="hm-top__back" style={{ background: '#fff' }} onClick={backToFront} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') backToFront() }}>
          <Icon n="arrow-left" />
        </div>
        <Mark />
        <span className="hm-wordmark">Helm</span>
        <span className="hm-chip" style={{ marginLeft: 6 }}>
          <Icon n="compass-tool" />New project
        </span>
        <div style={{ marginLeft: 'auto' }}><ClaudeSignal inline /></div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>{children}</div>
      </div>
    </div>
  )
}

/** Pinned banner showing the user's goal during Q&A and plan review. */
function GoalPin({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 14px', background: 'var(--surface-3)', border: '1px solid var(--line)', boxShadow: 'var(--sh1)', marginBottom: 24 }}>
      <Icon n="target" size={16} />
      <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
        Building:&nbsp;<b style={{ color: 'var(--ink)', fontWeight: 600 }}>{children}</b>
      </span>
    </div>
  )
}

/** Idea input step — the entry point of the wizard (also reached via Back). */
function IdeaStep(): React.JSX.Element {
  const reviseIdea = useWizard((s) => s.reviseIdea)
  const existingIdea = useWizard((s) => s.idea)

  const handleSubmit = (form: React.FormEvent<HTMLFormElement>): void => {
    form.preventDefault()
    const data = new FormData(form.currentTarget)
    const idea = (data.get('idea') as string | null)?.trim() ?? ''
    if (idea) void reviseIdea(idea)
  }

  return (
    <WizardShell>
      <span className="hm-eyebrow">Step one · the idea</span>
      <div className="hm-display hm-h-l" style={{ marginTop: 14, marginBottom: 12 }}>What do you want to build?</div>
      <div style={{ fontSize: 16, color: 'var(--ink-2)', marginBottom: 22, lineHeight: 1.5 }}>
        One plain sentence is enough. No jargon, no features list — just the idea. Helm will ask the rest.
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          name="idea"
          className="hm-input hm-input--lg"
          rows={3}
          defaultValue={existingIdea}
          placeholder="A sign-up page for my neighbourhood book club, where people can reserve a seat at the next meet."
          autoFocus
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)', alignSelf: 'center' }}>Try:</span>
          {['a booking page for my studio', 'a simple online shop', 'a club sign-up'].map((s) => (
            <span key={s} className="hm-chip" style={{ cursor: 'pointer' }}>{s}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Helm will ask a few quick questions next.</span>
          <button type="submit" className="hm-btn hm-btn--primary hm-btn--lg" style={{ marginLeft: 'auto' }}>
            Continue <Icon n="arrow-right" />
          </button>
        </div>
      </form>
    </WizardShell>
  )
}

/** Thinking state — Claude is generating the next question. */
function ThinkingStep({ idea }: { idea: string }): React.JSX.Element {
  return (
    <WizardShell>
      <GoalPin>{idea || 'Your idea'}</GoalPin>
      <div className="hm-panel" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-2)', fontSize: 15 }}>
          <span className="hm-claude__spark" style={{ width: 24, height: 24 }}><Icon n="sparkle" /></span>
          Thinking through your idea&nbsp;
          <span className="hm-thinking" style={{ marginLeft: 4 }}><i /><i /><i /></span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
          <div style={{ height: 14, background: 'var(--surface-2)', width: '70%' }} />
          <div style={{ height: 14, background: 'var(--surface-2)', width: '92%' }} />
          <div style={{ height: 14, background: 'var(--surface-2)', width: '48%' }} />
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-3)', marginTop: 18 }}>
        This usually takes a few seconds. You can keep your idea in mind — nothing is locked in yet.
      </div>
    </WizardShell>
  )
}

/** Approving — plan was submitted, setting up the board. */
function ApprovingStep(): React.JSX.Element {
  return (
    <WizardShell>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-2)', fontSize: 15, justifyContent: 'center' }}>
          <span className="hm-claude__spark" style={{ width: 24, height: 24 }}><Icon n="sparkle" /></span>
          Setting up your board&nbsp;
          <span className="hm-thinking"><i /><i /><i /></span>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-3)' }}>
          Hang tight — this only takes a moment.
        </div>
      </div>
    </WizardShell>
  )
}

/** Error step — Claude unreachable or agent failure. */
function ErrorStep(): React.JSX.Element {
  const retry = useWizard((s) => s.retry)
  const reset = useWizard((s) => s.reset)
  const backToFront = (): void => {
    reset()
    useProjects.getState().newBuild()
  }
  return (
    <WizardShell>
      <div className="hm-callout hm-callout--fail" style={{ marginBottom: 24 }}>
        <Icon n="warning-circle" size={20} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Helm couldn't reach Claude</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            Check that your Claude subscription is active and your internet is connected, then try again.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="hm-btn hm-btn--primary" onClick={() => void retry()}>
          <Icon n="arrow-clockwise" /> Try again
        </button>
        <button className="hm-btn" onClick={backToFront}>
          <Icon n="arrow-left" /> Back to start
        </button>
      </div>
    </WizardShell>
  )
}

/** The new-project wizard shell (idea → scoping → plan review → approving). */
export function WizardScreen({ projectId }: { projectId: string }): React.JSX.Element {
  useEffect(() => {
    void useWizard.getState().restore(projectId)
  }, [projectId])

  const step = useWizard((s) => s.step)
  const idea = useWizard((s) => s.idea)
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

  if (step === 'idea') {
    return <IdeaStep />
  }

  if (step === 'scoping' && question === null) {
    return <ThinkingStep idea={idea} />
  }

  if (step === 'scoping' && question !== null) {
    return (
      <WizardShell>
        <GoalPin>{idea || 'Your idea'}</GoalPin>
        <ScopingQA
          question={question}
          step={qStep}
          total={qTotal}
          onAnswer={(a) => void answer(a)}
          onBack={() => useWizard.getState().backToIdea()}
        />
      </WizardShell>
    )
  }

  if (step === 'plan_review' && plan !== null) {
    return (
      <WizardShell>
        <PlanReview
          name={name}
          plan={plan}
          onName={setName}
          onPlan={editPlan}
          onApprove={() => void approve()}
          onBack={() => void retry()}
        />
      </WizardShell>
    )
  }

  if (step === 'approving') {
    return <ApprovingStep />
  }

  if (step === 'error') {
    return <ErrorStep />
  }

  // Fallback — scoping with null question (covers the initial empty-projectId render)
  return <ThinkingStep idea={idea} />
}
