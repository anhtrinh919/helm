import { useState } from 'react'
import type { SteerMode } from '@shared/ipc-schemas'

// Stop is a one-click halt (no words needed). The other two steer a running build.
const DIRECTIONS: { id: SteerMode; label: string }[] = [
  { id: 'redirect', label: 'Redirect' },
  { id: 'look_closer', label: 'Look closer' },
]

/** The "STEERING" card — a one-click Stop, plus redirect / look-closer with a direction. */
export function SteeringInput({
  disabled,
  onSteer,
}: {
  disabled?: boolean
  onSteer: (mode: SteerMode, text: string) => void
}): React.JSX.Element {
  const [mode, setMode] = useState<SteerMode>('redirect')
  const [text, setText] = useState('')

  const submit = (): void => {
    if (!text.trim()) return
    onSteer(mode, text.trim())
    setText('')
  }

  return (
    <div style={{ border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="hm-eyebrow">STEERING</div>
        <button
          onClick={() => onSteer('interrupt', '')}
          disabled={disabled}
          className="hm-btn hm-btn--sm"
          style={{ background: 'var(--fail-weak)', color: 'var(--fail)' }}
        >
          ■ Stop
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
        }}
        placeholder="Tell me to do something differently…"
        rows={2}
        className="hm-input"
        style={{ marginTop: 10, resize: 'none' }}
      />
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7 }}>
        {DIRECTIONS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={mode === m.id ? 'hm-btn hm-btn--sm hm-btn--primary' : 'hm-btn hm-btn--sm'}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="hm-btn hm-btn--sm hm-btn--accent"
          style={{ marginLeft: 'auto' }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
