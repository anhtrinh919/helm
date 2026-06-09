import { useState } from 'react'
import type { NoteType } from '@shared/ipc-schemas'

/**
 * The comment box (F45–F48). Element variant shows the snapshot frame — the
 * "it saw what I saw" evidence treatment. The actual pixels stay in the engine
 * room by contract, so the frame is a viewfinder over the still-highlighted
 * element rather than an image copy. Page variant swaps it for a page indicator.
 */
export function PointCommentBox({
  variant,
  onSubmit,
  onCancel,
}: {
  variant: 'element' | 'page'
  onSubmit: (note: string, noteType: NoteType) => void
  onCancel: () => void
}): React.JSX.Element {
  const [note, setNote] = useState('')
  const [noteType, setNoteType] = useState<NoteType | null>(null)
  const ready = note.trim().length > 0 && noteType !== null
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ width: 420, maxWidth: '92%', border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: 14, boxShadow: 'var(--hard)' }}>
      {/* Eyebrow row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hm-dot" style={{ background: 'var(--parked)', width: 10, height: 10 }} />
        <span className="hm-eyebrow">
          {variant === 'element' ? 'POINTING AT THIS' : 'ABOUT THIS WHOLE PAGE'}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={onCancel} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-3)', padding: '0 2px' }}>
          ✕
        </button>
      </div>

      {/* Evidence: snapshot frame (element) or page indicator (page) */}
      {variant === 'element' ? (
        <div style={{ position: 'relative', marginTop: 12, overflow: 'hidden', border: '1.5px solid var(--frame)', background: 'var(--surface-2)', padding: 12 }}>
          <div style={{ display: 'grid', height: 64, placeItems: 'center', border: '1.5px dashed var(--hair)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)' }}>
              The highlighted spot in your app
            </span>
          </div>
          <span style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 5, background: 'var(--ink)', padding: '3px 7px' }}>
            <span style={{ width: 6, height: 6, background: 'var(--lime)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--paper)' }}>snapshot · {time}</span>
          </span>
        </div>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--frame)', background: 'var(--surface-2)', padding: '10px 12px' }}>
          <span style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1.5px solid var(--frame)', background: 'var(--surface-3)', fontSize: 14, flexShrink: 0 }}>
            🗎
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            Everything on this screen, as it looks right now
          </span>
        </div>
      )}

      {/* Note */}
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 500))}
        placeholder="What's wrong with this?"
        rows={3}
        className="hm-input"
        style={{ marginTop: 12, resize: 'none' }}
      />

      {/* Type */}
      <div className="hm-eyebrow" style={{ marginTop: 10 }}>WHAT IS THIS?</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setNoteType('bug')}
          style={{
            flex: 1, border: '1.5px solid var(--frame)', padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: noteType === 'bug' ? 'var(--fail-weak)' : 'var(--surface-2)',
            color: noteType === 'bug' ? 'var(--fail)' : 'var(--ink)',
          }}
        >
          Something's broken
        </button>
        <button
          onClick={() => setNoteType('change')}
          style={{
            flex: 1, border: '1.5px solid var(--frame)', padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: noteType === 'change' ? 'var(--surface-3)' : 'var(--surface-2)',
            color: 'var(--ink)',
            outline: noteType === 'change' ? '1.5px solid var(--frame)' : 'none',
            outlineOffset: noteType === 'change' ? '-3px' : 'unset',
          }}
        >
          Change this
        </button>
      </div>

      <div className="hm-divider" style={{ marginTop: 12 }} />

      {/* Actions */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {variant === 'element' ? 'Saved with a snapshot' : 'Saved as a page comment'}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--ink-3)' }}>
          Cancel
        </button>
        <button
          onClick={() => noteType && onSubmit(note.trim(), noteType)}
          disabled={!ready}
          className={ready ? 'hm-btn hm-btn--sm hm-btn--primary' : 'hm-btn hm-btn--sm'}
          style={!ready ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          Send to Helm
        </button>
      </div>
    </div>
  )
}
