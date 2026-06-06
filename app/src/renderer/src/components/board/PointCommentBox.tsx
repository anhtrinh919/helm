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
    <div className="w-[420px] max-w-[92%] rounded-[14px] brut-2 bg-cream p-4 shadow-[6px_6px_0_rgba(27,18,8,0.18)]">
      {/* Eyebrow row */}
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-violet" />
        <span className="text-[10px] font-black tracking-[0.16em] text-soft">
          {variant === 'element' ? 'POINTING AT THIS' : 'ABOUT THIS WHOLE PAGE'}
        </span>
        <span className="flex-1" />
        <button onClick={onCancel} aria-label="Close" className="px-1 text-soft hover:text-ink">
          ✕
        </button>
      </div>

      {/* Evidence: snapshot frame (element) or page indicator (page) */}
      {variant === 'element' ? (
        <div className="relative mt-3 overflow-hidden rounded-[8px] brut-2 bg-[#FAF4E8] p-3">
          <div className="grid h-16 place-items-center rounded-[6px] border-2 border-dashed border-ink/25">
            <span className="text-[11px] font-bold text-soft">
              The highlighted spot in your app
            </span>
          </div>
          <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-[6px] bg-ink px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-lime" />
            <span className="text-[10px] font-bold text-cream">snapshot · {time}</span>
          </span>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3 rounded-[8px] brut-2 bg-[#FAF4E8] px-3 py-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[6px] brut-2 bg-cream text-sm">
            🗎
          </span>
          <span className="text-[12px] font-bold text-ink">
            Everything on this screen, as it looks right now
          </span>
        </div>
      )}

      {/* Note */}
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 500))}
        placeholder="What’s wrong with this?"
        rows={3}
        className="mt-3 w-full resize-none rounded-[8px] brut-2 bg-canvas px-3 py-2 text-sm text-ink outline-none placeholder:text-soft"
      />

      {/* Type */}
      <div className="mt-2 text-[10px] font-black tracking-[0.16em] text-soft">WHAT IS THIS?</div>
      <div className="mt-1.5 flex gap-2">
        <button
          onClick={() => setNoteType('bug')}
          className={`flex-1 rounded-[8px] px-3 py-2 text-[12px] font-bold ${
            noteType === 'bug'
              ? 'border-2 border-orange bg-orangesoft text-ink'
              : 'brut-2 bg-cream text-ink'
          }`}
        >
          Something’s broken
        </button>
        <button
          onClick={() => setNoteType('change')}
          className={`flex-1 rounded-[8px] px-3 py-2 text-[12px] font-bold ${
            noteType === 'change'
              ? 'border-2 border-blue bg-bluesoft text-ink'
              : 'brut-2 bg-cream text-ink'
          }`}
        >
          Change this
        </button>
      </div>

      <div className="mt-3 h-px bg-ink/15" />

      {/* Actions */}
      <div className="mt-2.5 flex items-center gap-3">
        <span className="text-[11px] text-soft">
          {variant === 'element' ? 'Saved with a snapshot' : 'Saved with this screen'}
        </span>
        <span className="flex-1" />
        <button onClick={onCancel} className="text-[12px] font-bold text-soft hover:text-ink">
          Cancel
        </button>
        <button
          onClick={() => noteType && onSubmit(note.trim(), noteType)}
          disabled={!ready}
          className={`rounded-full px-4 py-2 text-[12px] font-bold ${
            ready ? 'bg-ink text-cream' : 'cursor-not-allowed bg-ink/25 text-cream/70'
          }`}
        >
          Send to Helm
        </button>
      </div>
    </div>
  )
}
