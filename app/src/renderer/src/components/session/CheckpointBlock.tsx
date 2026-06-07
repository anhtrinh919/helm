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
    <div className="rounded-[18px] brut bg-cream p-5">
      <div className="text-[11px] font-black tracking-[0.16em] text-soft">
        {isFix
          ? 'POINT & FIX · READY'
          : `${card.stepLabel ? card.stepLabel.replace(/:.*/, '').toUpperCase() : 'STEP'} · COMPLETE`}
      </div>
      <div className="mt-1 font-display text-xl font-black text-ink">
        {isFix ? 'Here’s the fix — does this look right?' : 'Here’s what I built — does this look right?'}
      </div>

      <div className="mt-4 overflow-hidden rounded-[12px] brut-2 bg-canvas">
        {shot ? (
          <img src={shot} alt="Preview of what was built" className="w-full" />
        ) : (
          <div className="grid h-40 place-items-center gap-1.5 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-full brut-2 bg-mint text-base font-black text-ink">
              ✓
            </span>
            <span className="text-sm font-semibold text-ink">
              {isFix ? `“${card.title}” — handled` : `“${card.title}” is built`}
            </span>
            <span className="rounded-full bg-violetsoft px-2.5 py-0.5 text-[10px] font-black tracking-wide text-ink">
              {isFix ? 'Approving refreshes the Live Preview so you can verify' : 'Open the Live Preview tab to try it'}
            </span>
          </div>
        )}
      </div>

      {flagging ? (
        <div className="mt-4">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && note.trim()) onFlag(note.trim())
            }}
            placeholder="What’s off about it?"
            autoFocus
            className="w-full rounded-full brut-2 bg-canvas px-4 py-2 text-sm text-ink outline-none placeholder:text-soft/55"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setFlagging(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-soft"
            >
              Cancel
            </button>
            <button
              onClick={() => note.trim() && onFlag(note.trim())}
              className="rounded-full brut-2 bg-orange px-4 py-2 text-sm font-bold text-ink"
            >
              Send it back
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onApprove}
            className="rounded-full brut-2 bg-lime px-5 py-2.5 text-sm font-bold text-ink"
          >
            Looks good, continue
          </button>
          <button
            onClick={() => setFlagging(true)}
            className="rounded-full brut-2 bg-cream px-5 py-2.5 text-sm font-bold text-ink"
          >
            Something’s off
          </button>
        </div>
      )}
    </div>
  )
}
