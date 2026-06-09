import { useEffect, useMemo, useRef, useState } from 'react'
import { helm } from '../../bridge'
import { isIpcError, type Card } from '@shared/ipc-schemas'
import { useProjects } from '../../store/projects'
import { useBoard } from '../../store/board'
import { useShelf } from '../../store/shelf'
import { Icon } from '../ui/Icon'
import { ClaudeSignal } from '../ui/ClaudeSignal'
import { LivePreviewPane } from '../board/LivePreviewPane'
import { JourneyRail, activeOutcome } from './JourneyRail'
import { ShelfPanel } from './ShelfPanel'

/**
 * The whole guided Build Journey screen — Journey direction C (split,
 * preview-dominant): the milestone rail + shelf on the left, the live app
 * continuous with it on the right. The journey OBSERVES card status (it never
 * adds push channels): a step's failure is the active card going `failed`; a
 * promoted shelf card appears on the board through the existing card-update path.
 *
 * `railStep` advance is EDGE-TRIGGERED: exactly once on the active card's
 * checkpoint transition pending→approved (a ref guard makes re-renders idempotent
 * — they can neither double-advance nor stall). Celebration fires when railStep
 * reaches plan.length.
 */
export function JourneyView({ projectId }: { projectId: string }): React.JSX.Element {
  const project = useProjects((s) => s.projects.find((p) => p.id === projectId))
  const refreshProjects = useProjects((s) => s.refresh)
  const openWizard = useProjects((s) => s.openWizard)
  const showCelebration = useProjects((s) => s.showCelebration)

  const cards = useBoard((s) => s.cards)
  const loadBoard = useBoard((s) => s.loadBoard)
  const applyUpdate = useBoard((s) => s.applyUpdate)
  const approveCheckpoint = useBoard((s) => s.approveCheckpoint)

  const loadShelf = useShelf((s) => s.load)
  const subscribeShelf = useShelf((s) => s.subscribe)
  const shelfCount = useShelf((s) => (s.items[projectId] ?? []).length)

  const [shelfOpen, setShelfOpen] = useState(false)
  const [escaping, setEscaping] = useState(false)
  // Local gate states for the two GAP flows that have no card status of their own.
  const [spawnFailed, setSpawnFailed] = useState(false)
  const [retrying, setRetrying] = useState(false)

  // Load board + shelf and subscribe to the two live seams we observe.
  useEffect(() => {
    void loadBoard(projectId)
    void loadShelf(projectId)
    const offShelf = subscribeShelf()
    const offBoard = helm.events.onBoardUpdate((p) => {
      if (p.projectId === projectId) applyUpdate(p.card)
    })
    return () => {
      offShelf()
      offBoard()
    }
  }, [projectId, loadBoard, loadShelf, subscribeShelf, applyUpdate])

  const plan = project?.plan ?? []
  const total = plan.length
  const railStep = project?.railStep ?? 0

  // The plan-seed cards in plan order — the milestone-backing work cards.
  const stepCards = useMemo(
    () => cards.filter((c) => c.type !== 'fix_comment').sort((a, b) => a.position - b.position),
    [cards],
  )
  // The active card for the current step: the seed card at the rail index, else
  // whichever non-fix card is in flight.
  const activeCard: Card | null = useMemo(() => {
    if (stepCards[railStep]) return stepCards[railStep]
    return (
      stepCards.find((c) => c.status === 'building' || c.status === 'needs_you' || c.status === 'up_next' || c.status === 'failed') ??
      null
    )
  }, [stepCards, railStep])

  const activeBlock = plan[railStep] ?? null
  const checkpointStatus = activeCard?.checkpoint?.status ?? null

  // ---- EDGE-TRIGGERED rail advance ----------------------------------------
  // Fire setRailStep exactly once when the active card's checkpoint flips
  // pending→approved. The ref keys on the card id so a fresh step re-arms.
  const lastApprovedRef = useRef<{ cardId: string; railStep: number } | null>(null)
  useEffect(() => {
    if (!activeCard || checkpointStatus !== 'approved') return
    if (railStep >= total) return
    const already =
      lastApprovedRef.current &&
      lastApprovedRef.current.cardId === activeCard.id &&
      lastApprovedRef.current.railStep === railStep
    if (already) return
    lastApprovedRef.current = { cardId: activeCard.id, railStep }
    void (async () => {
      const res = await helm.projects.setRailStep(projectId, railStep + 1)
      if (isIpcError(res)) {
        // Checkpoint → next-step spawn failed: do NOT advance; surface a retry.
        setSpawnFailed(true)
        lastApprovedRef.current = null
        return
      }
      setSpawnFailed(false)
      await refreshProjects()
    })()
  }, [activeCard, checkpointStatus, railStep, total, projectId, refreshProjects])

  // ---- Celebration on completion ------------------------------------------
  useEffect(() => {
    if (total > 0 && railStep >= total) showCelebration(projectId)
  }, [railStep, total, projectId, showCelebration])

  // ---- DEGENERATE 0-step plan ---------------------------------------------
  if (project && total === 0) {
    return (
      <DegenerateState projectId={projectId} onRetry={() => openWizard(projectId)} />
    )
  }

  const projectName = project?.name ?? 'Your app'
  const stepFailed = activeCard?.status === 'failed'
  const atCheckpoint = checkpointStatus === 'pending'

  const retryStep = async (): Promise<void> => {
    if (!activeCard) return
    setRetrying(true)
    setSpawnFailed(false)
    const res = await helm.sessions.start(projectId, activeCard.id)
    if (!isIpcError(res)) await Promise.all([loadBoard(projectId), refreshProjects()])
    setRetrying(false)
  }

  return (
    <div className="hm">
      <div className="hm-top">
        <button
          type="button"
          className="hm-top__back"
          aria-label="Leave the journey"
          onClick={() => setEscaping(true)}
        >
          <Icon n="arrow-u-up-left" />
        </button>
        <div className="hm-crumb">
          <b>{projectName}</b>
        </div>
        <span className="hm-chip hm-chip--accent" style={{ marginLeft: 10 }}>
          <Icon n="target" />
          Step {Math.min(railStep + 1, total)} of {total}
        </span>
        <div className="hm-top__spacer" />
        <button type="button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={() => setEscaping(true)}>
          <Icon n="sign-out" />
          Leave the journey
        </button>
        <div className="hm-slot-reserved">
          <Icon n="rocket-launch" />
          Publish · Phase 2
        </div>
      </div>

      <div className="hm-shell">
        {/* compact journey column */}
        <aside
          style={{
            width: 290,
            flex: '0 0 290px',
            borderRight: '1.5px solid var(--frame)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            padding: '18px 16px 14px',
          }}
        >
          <JourneyRail plan={plan} railStep={railStep} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setShelfOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '10px 13px',
                border: '1.5px solid var(--frame)',
                background: 'var(--parked-weak)',
                cursor: 'pointer',
              }}
            >
              <Icon n="tray" size={18} />
              <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
                For-later shelf
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  background: 'var(--lime)',
                  border: '1.5px solid var(--frame)',
                  minWidth: 22,
                  height: 22,
                  display: 'grid',
                  placeItems: 'center',
                  padding: '0 6px',
                }}
              >
                {shelfCount}
              </span>
            </button>
            <ClaudeSignal />
          </div>
        </aside>

        {/* preview-dominant main */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface-2)',
          }}
        >
          {stepFailed ? (
            <StepFailedState
              title={activeCard?.title ?? activeBlock?.title ?? 'this step'}
              retrying={retrying}
              onRetry={() => void retryStep()}
              onLeave={() => setEscaping(true)}
            />
          ) : spawnFailed ? (
            <SpawnFailedState retrying={retrying} onRetry={() => void retryStep()} />
          ) : atCheckpoint && activeCard ? (
            <CheckpointState
              projectId={projectId}
              card={activeCard}
              outcome={activeOutcome(activeCard, activeBlock)}
              railStep={railStep}
              total={total}
              onApprove={() => void approveCheckpoint(activeCard.id, 'approved')}
              onFlag={(note) => void approveCheckpoint(activeCard.id, 'flagged', note)}
            />
          ) : (
            <BuildingState
              projectId={projectId}
              title={activeCard?.title ?? activeBlock?.title ?? 'your next step'}
              outcome={activeOutcome(activeCard, activeBlock)}
            />
          )}
        </main>

        {/* the shelf slides in over the preview as a right rail */}
        {shelfOpen && (
          <aside style={{ width: 360, flex: '0 0 360px' }}>
            <ShelfPanel projectId={projectId} onClose={() => setShelfOpen(false)} />
          </aside>
        )}
      </div>

      {escaping && (
        <EscapeConfirm
          railStep={railStep}
          onCancel={() => setEscaping(false)}
          onConfirm={() => void useProjects.getState().leaveJourney(projectId)}
        />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- building */
function BuildingState({
  projectId,
  title,
  outcome,
}: {
  projectId: string
  title: string
  outcome: string | null
}): React.JSX.Element {
  return (
    <>
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1.5px solid var(--frame)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'var(--surface)',
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            background: 'var(--lime)',
            color: 'var(--ink)',
            border: '1.5px solid var(--frame)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 19,
            flex: '0 0 auto',
          }}
        >
          <Icon n="circle-notch" />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, minWidth: 0 }}>
          <span style={{ fontSize: 15.5, fontWeight: 600 }}>Building: {title}</span>
          {outcome && (
            <span style={{ fontSize: 13.5, color: 'var(--ink-2)', display: 'flex', gap: 7 }}>
              <Icon n="arrow-bend-down-right" />
              {outcome}
            </span>
          )}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <LivePreviewPane projectId={projectId} />
      </div>
    </>
  )
}

/* -------------------------------------------------------------- checkpoint */
function CheckpointState({
  projectId,
  card,
  outcome,
  railStep,
  total,
  onApprove,
  onFlag,
}: {
  projectId: string
  card: Card
  outcome: string | null
  railStep: number
  total: number
  onApprove: () => void
  onFlag: (note: string) => void
}): React.JSX.Element {
  const [note, setNote] = useState('')
  return (
    <div className="hm-shell" style={{ flex: 1, minHeight: 0 }}>
      <aside
        style={{
          width: 440,
          flex: '0 0 440px',
          borderRight: '1.5px solid var(--frame)',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          padding: '30px 32px',
          overflowY: 'auto',
        }}
      >
        <span className="hm-eyebrow hm-eyebrow--accent">
          Step {Math.min(railStep + 1, total)} done — your turn
        </span>
        <div className="hm-display hm-h-m" style={{ marginTop: 12 }}>
          Have a look — does this look right?
        </div>
        <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.5 }}>
          I added <b>“{card.title}”</b> to your live app on the right. Test it in the preview, then
          tell me if it’s right before we move on.
        </div>

        <div
          style={{
            marginTop: 22,
            marginBottom: 4,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
          }}
        >
          What I built
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 10 }}>
          <span
            style={{
              width: 20,
              height: 20,
              background: 'var(--lime)',
              color: 'var(--ink)',
              border: '1.5px solid var(--frame)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              flex: '0 0 auto',
              marginTop: 1,
            }}
          >
            <Icon n="check" size={12} />
          </span>
          <span style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>
            {outcome ?? card.title}
          </span>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 8 }}>
            Anything to change? <span style={{ color: 'var(--ink-3)' }}>(optional)</span>
          </div>
          <textarea
            className="hm-input"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. make the date bigger, or use a warmer colour…"
          />
        </div>

        <div className="hm-rail__spacer" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
          <button
            type="button"
            onClick={onApprove}
            className="hm-btn hm-btn--primary hm-btn--lg hm-btn--block"
          >
            <Icon n="check-circle" />
            Looks good — continue
          </button>
          <button
            type="button"
            onClick={() => onFlag(note.trim() || 'Something looks off')}
            className="hm-btn hm-btn--block hm-btn--quiet"
          >
            <Icon n="arrow-u-up-left" />
            Something’s not right
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1.5px solid var(--frame)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--surface)',
          }}
        >
          <span className="hm-chip hm-chip--success">
            <Icon n="check" />
            Live · try it
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-3)', marginLeft: 'auto' }}>
            <Icon n="hand-tap" />
            Click around — this is your real app.
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <LivePreviewPane projectId={projectId} />
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------- step failed */
function StepFailedState({
  title,
  retrying,
  onRetry,
  onLeave,
}: {
  title: string
  retrying: boolean
  onRetry: () => void
  onLeave: () => void
}): React.JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div className="hm-callout hm-callout--fail" style={{ flexDirection: 'column', gap: 10, boxShadow: 'var(--hard)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="hm-callout__ic">
              <Icon n="warning-circle" />
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
              This step didn’t finish
            </span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            While building <b>“{title}”</b>, Helm hit a snag partway through. Nothing earlier was
            affected — your finished steps are safe.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="hm-btn hm-btn--accent hm-btn--lg"
            style={{ flex: 1 }}
          >
            <Icon n={retrying ? 'circle-notch' : 'arrow-u-up-left'} />
            {retrying ? 'Retrying…' : 'Try this step again'}
          </button>
          <button type="button" onClick={onLeave} className="hm-btn hm-btn--lg">
            <Icon n="sign-out" />
            Leave the journey
          </button>
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center' }}>
          If it keeps happening, leaving for free building lets you work around it.
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------- checkpoint → spawn failed */
function SpawnFailedState({
  retrying,
  onRetry,
}: {
  retrying: boolean
  onRetry: () => void
}): React.JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div className="hm-callout hm-callout--fail" style={{ flexDirection: 'column', gap: 10, boxShadow: 'var(--hard)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="hm-callout__ic">
              <Icon n="warning-circle" />
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
              Helm couldn’t start the next step
            </span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            Your last step is safe and still approved — only kicking off the next one hit a snag. Try
            again.
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="hm-btn hm-btn--accent hm-btn--lg hm-btn--block"
          style={{ marginTop: 20 }}
        >
          <Icon n={retrying ? 'circle-notch' : 'arrow-u-up-left'} />
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    </div>
  )
}

/* ----------------------------------------------- degenerate 0-step plan */
function DegenerateState({
  onRetry,
}: {
  projectId: string
  onRetry: () => void
}): React.JSX.Element {
  return (
    <div className="hm hm-guide">
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 40px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div className="hm-callout hm-callout--fail" style={{ flexDirection: 'column', gap: 10, boxShadow: 'var(--hard)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span className="hm-callout__ic">
                <Icon n="warning-circle" />
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                Helm couldn’t plan the journey
              </span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              I couldn’t break this into clear steps. Describe what you want to build again and I’ll
              lay out the journey.
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="hm-btn hm-btn--accent hm-btn--lg hm-btn--block"
            style={{ marginTop: 20 }}
          >
            <Icon n="arrow-u-up-left" />
            Describe your goal again
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------- escape confirm */
function EscapeConfirm({
  railStep,
  onCancel,
  onConfirm,
}: {
  railStep: number
  onCancel: () => void
  onConfirm: () => void
}): React.JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,21,14,.35)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 60,
      }}
      onClick={onCancel}
    >
      <div
        className="hm-panel"
        style={{ width: 440, padding: 26, boxShadow: 'var(--hard-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: 'var(--surface-2)',
            border: '1.5px solid var(--frame)',
            display: 'grid',
            placeItems: 'center',
            marginBottom: 16,
          }}
        >
          <Icon n="sign-out" size={22} />
        </div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 21, letterSpacing: '-.01em' }}>
          Leave the guided journey?
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.55 }}>
          You’ll switch to free building, where you steer everything yourself. Work in progress keeps
          running, and:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {[
            railStep > 0
              ? `Your ${railStep} finished step${railStep === 1 ? '' : 's'} stay done`
              : 'Your progress is kept',
            'Your For-Later shelf carries over',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--ink-2)' }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  background: 'var(--lime)',
                  border: '1.5px solid var(--frame)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  color: 'var(--ink)',
                  flex: '0 0 auto',
                }}
              >
                <Icon n="check" size={11} />
              </span>
              {t}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onCancel} className="hm-btn hm-btn--block">
            Stay on the journey
          </button>
          <button type="button" onClick={onConfirm} className="hm-btn hm-btn--primary hm-btn--block">
            <Icon n="sign-out" />
            Leave for free building
          </button>
        </div>
      </div>
    </div>
  )
}
