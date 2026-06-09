import { useState } from 'react'
import type { PlanBlock } from '@shared/ipc-schemas'
import { Icon } from '../ui/Icon'

/**
 * The proposed plan (wizard plan-review step).
 * Ordered list of milestones; user can approve or revise.
 * Revising shows an input that regenerates the plan.
 */
export function PlanReview({
  name,
  plan,
  onName,
  onPlan,
  onApprove,
  onBack,
}: {
  name: string
  plan: PlanBlock[]
  onName: (name: string) => void
  onPlan: (plan: PlanBlock[]) => void
  onApprove: () => void
  onBack: () => void
}): React.JSX.Element {
  const [revising, setRevising] = useState(false)
  const [reviseText, setReviseText] = useState('')

  const submitRevise = (): void => {
    if (!reviseText.trim()) return
    // Pass the revision note as the last block's detail as a lightweight signal;
    // the store's editPlan + retry handles regeneration. We surface it by calling
    // onPlan with the revision note appended, then calling onBack (which calls retry).
    onPlan([...plan, { id: crypto.randomUUID(), title: `Revision: ${reviseText.trim()}`, detail: '' }])
    onBack()
  }

  return (
    <div>
      <span className="hm-eyebrow hm-eyebrow--accent">The plan</span>
      <div className="hm-display hm-h-l" style={{ marginTop: 12, marginBottom: 10 }}>Here's how we'll get there.</div>
      <div style={{ fontSize: 15.5, color: 'var(--ink-2)', marginBottom: 22, lineHeight: 1.5 }}>
        {plan.length} step{plan.length !== 1 ? 's' : ''} to a working result. We'll do them in order and stop after each one so you can try it.
      </div>

      {/* Project name */}
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        className="hm-input"
        style={{ marginBottom: 16, fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}
        placeholder="Name your project"
      />

      <div className="hm-panel" style={{ padding: 10, marginBottom: 24 }}>
        {plan.map((b, i) => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              gap: 14,
              padding: '14px 14px',
              borderBottom: i < plan.length - 1 ? '1px solid var(--line)' : 'none',
            }}
          >
            <span style={{
              width: 28,
              height: 28,
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--ink-2)',
              flex: '0 0 auto',
              fontFamily: 'var(--display)',
            }}>
              {i + 1}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>{b.title}</span>
              {b.detail && (
                <span style={{ fontSize: 13.5, color: 'var(--ink-2)', display: 'flex', gap: 7, marginTop: 2 }}>
                  <Icon n="arrow-bend-down-right" size={15} />
                  {b.detail}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {revising ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 10 }}>
            What would you like to change about the plan?
          </div>
          <textarea
            value={reviseText}
            onChange={(e) => setReviseText(e.target.value)}
            className="hm-input hm-input--lg"
            rows={3}
            placeholder="e.g. Add a contact form, remove the gallery step…"
            autoFocus
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="hm-btn hm-btn--ghost" onClick={() => setRevising(false)}>
              Cancel
            </button>
            <button
              className="hm-btn hm-btn--primary"
              style={{ marginLeft: 'auto' }}
              onClick={submitRevise}
              disabled={!reviseText.trim()}
            >
              <Icon n="sparkle" /> Regenerate plan
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="hm-btn" onClick={() => setRevising(true)}>
            <Icon n="pencil-simple" /> Revise the plan
          </button>
          <button
            className="hm-btn hm-btn--primary hm-btn--lg"
            style={{ marginLeft: 'auto' }}
            onClick={onApprove}
            disabled={plan.length === 0}
          >
            <Icon n="check" /> Approve &amp; start building
          </button>
        </div>
      )}
    </div>
  )
}
