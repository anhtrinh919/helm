import { useState } from 'react'

/** "+ Add item" — create a feature request or a bug card. */
export function AddItemModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (type: 'feature' | 'bug', title: string) => void
}): React.JSX.Element {
  const [type, setType] = useState<'feature' | 'bug'>('feature')
  const [title, setTitle] = useState('')

  const submit = (): void => {
    if (!title.trim()) return
    onAdd(type, title.trim())
    onClose()
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center', background: 'rgba(20,21,14,.45)', padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ width: 460, maxWidth: '100%', border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: 24, boxShadow: 'var(--hard-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Add to the board</div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {(['feature', 'bug'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`hm-btn${type === t ? (t === 'bug' ? ' hm-btn--primary' : ' hm-btn--accent') : ''}`}
              style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
            >
              {t === 'feature' ? 'Feature' : 'Bug'}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder={type === 'bug' ? "What's broken?" : 'What should it do?'}
          autoFocus
          className="hm-input"
          style={{ marginTop: 12, height: 44, minHeight: 'unset', padding: '0 14px' }}
        />

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="hm-btn hm-btn--ghost">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="hm-btn hm-btn--primary"
          >
            Add it
          </button>
        </div>
      </div>
    </div>
  )
}
