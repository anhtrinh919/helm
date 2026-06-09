import { useState } from 'react'
import type { Card } from '@shared/ipc-schemas'

/**
 * The reviewable result shown when a build finishes: "here's what I built —
 * does this look right?" with a preview, plus Looks-good / Something's-off.
 * Judged on real output, never a percentage.
 */
export function CheckpointBlock({
  card,
  onApprove,
  onFlag,
}: {
  card: Card
  onApprove: () => void
  onFlag: (note: string) => void
}): React.JSX.Element {
  const [flagging, setFlagging] = useState(false)
  const [note, setNote] = useState('')
  const shot = card.checkpoint?.screenshotPath
  const isFix = card.type === 'fix_comment'

  return (
    <div style={{ border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: 18 }}>
      <div className="hm-eyebrow hm-eyebrow--accent">
        {isFix
          ? 'POINT & FIX · READY'
          : `${card.stepLabel ? card.stepLabel.replace(/:.*/, '').toUpperCase() : 'STEP'} · COMPLETE`}
      </div>
      <div style={{ marginTop: 6, fontFamily: 'var(--display)', fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>
        {isFix ? "Here's the fix — does this look right?" : "Here's what I built — does this look right?"}
      </div>

      <div style={{ marginTop: 14, overflow: 'hidden', border: '1.5px solid var(--frame)', background: 'var(--surface-2)' }}>
        {shot ? (
          <img src={shot} alt="Preview of what was built" style={{ width: '100%', display: 'block' }} />
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: 140, gap: 8, textAlign: 'center' }}>
            <span style={{ width: 32, height: 32, background: 'var(--ink)', border: '1.5px solid var(--frame)', display: 'grid', placeItems: 'center', fontSize: 14, color: 'var(--lime)', flexShrink: 0 }}>
              ✓
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
              {isFix ? `"${card.title}" — handled` : `"${card.title}" is built`}
            </span>
            <span className="hm-chip hm-chip--accent" style={{ fontSize: 10 }}>
              {isFix ? 'Approving refreshes the Live Preview so you can verify' : 'Open the Live Preview tab to try it'}
            </span>
          </div>
        )}
      </div>

      {flagging ? (
        <div style={{ marginTop: 14 }}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && note.trim()) onFlag(note.trim())
            }}
            placeholder="What's off about it?"
            autoFocus
            className="hm-input"
            style={{ height: 36, minHeight: 'unset', padding: '0 12px' }}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setFlagging(false)} className="hm-btn hm-btn--ghost hm-btn--sm">
              Cancel
            </button>
            <button
              onClick={() => note.trim() && onFlag(note.trim())}
              className="hm-btn hm-btn--sm"
              style={{ background: 'var(--fail-weak)', color: 'var(--fail)' }}
            >
              Send it back
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button onClick={onApprove} className="hm-btn hm-btn--accent">
            Looks good, continue
          </button>
          <button onClick={() => setFlagging(true)} className="hm-btn">
            Something's off
          </button>
        </div>
      )}
    </div>
  )
}
