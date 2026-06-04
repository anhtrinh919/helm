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
    <div className="rounded-[18px] brut bg-cream p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-black tracking-[0.18em] text-ink">STEERING</div>
        <button
          onClick={() => onSteer('interrupt', '')}
          disabled={disabled}
          className="rounded-full brut-2 bg-orangesoft px-3 py-1.5 text-xs font-bold text-ink disabled:opacity-40"
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
        className="mt-2 w-full resize-none rounded-[12px] brut-2 bg-canvas px-3 py-2 text-sm text-ink outline-none placeholder:text-soft/55"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {DIRECTIONS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              mode === m.id ? 'bg-ink text-cream' : 'brut-2 bg-cream text-ink'
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="ml-auto rounded-full brut-2 bg-pink px-4 py-1.5 text-xs font-bold text-ink disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  )
}
