import type { Card } from '@shared/ipc-schemas'

/**
 * A fix-comment card on the board's REPORTED shelf (F50–F55 + the Fix-Comment
 * Card component sheet). One face, status-driven dressing: waiting shows
 * "Start Fix"; queued/building/needs-you/failed show badges; done resolves.
 * The card describes itself (noteType/pageLevel ride on the Card) — no joins
 * against the preview overlay's pin feed.
 */

function timeAgo(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

function StatusBadge({ label, cls }: { label: string; cls: string }): React.JSX.Element {
  return (
    <span className={`shrink-0 rounded-full brut-2 px-2.5 py-1 text-[10px] font-black tracking-wide text-ink ${cls}`}>
      {label}
    </span>
  )
}

export function FixCommentCard({
  card,
  queued,
  onStartFix,
  onOpen,
}: {
  card: Card
  queued: boolean
  onStartFix: (cardId: string) => void
  onOpen: (cardId: string) => void
}): React.JSX.Element {
  const isPage = card.pageLevel === true
  const noteType = card.noteType
  const done = card.status === 'done'
  const openable = card.sessionId != null && !done

  return (
    <div
      className={`flex items-center gap-3.5 rounded-[14px] brut-2 bg-cream p-3 ${done ? 'opacity-70' : ''} ${
        openable ? 'cursor-pointer hover:bg-cream/70' : ''
      }`}
      onClick={openable ? () => onOpen(card.id) : undefined}
    >
      {/* Thumb — the captured spot (page icon for whole-page comments; a calm
          check once resolved). */}
      <div className="grid h-[50px] w-[62px] shrink-0 place-items-center rounded-[6px] brut-2 bg-[#F5E9C8]">
        {done ? (
          <span className="grid h-6 w-6 place-items-center rounded-full brut-2 bg-mint text-[11px] font-black text-ink">
            ✓
          </span>
        ) : isPage ? (
          <span className="text-lg">🗎</span>
        ) : (
          <span
            className={`grid h-6 w-6 place-items-center rounded-full brut-2 text-[11px] font-black text-cream ${
              noteType === 'bug' ? 'bg-orange' : 'bg-blue'
            }`}
          >
            {noteType === 'bug' ? '!' : '✎'}
          </span>
        )}
      </div>

      {/* Body — type badge (dropped once resolved), age, note. */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {noteType && !done && (
            <span
              className={`rounded-full border-2 px-2 py-0.5 text-[9px] font-black tracking-wide text-ink ${
                noteType === 'bug' ? 'border-orange bg-orangesoft' : 'border-blue bg-bluesoft'
              }`}
            >
              {noteType === 'bug' ? 'BROKEN' : 'CHANGE'}
            </span>
          )}
          <span className="text-[11px] text-soft">{timeAgo(card.createdAt)}</span>
        </div>
        <div className="mt-1 truncate text-sm font-bold text-ink">{card.title}</div>
      </div>

      {/* Action / status. */}
      {done ? (
        <StatusBadge label="✓ FIXED" cls="bg-mint" />
      ) : card.status === 'building' ? (
        <StatusBadge label="IN PROGRESS" cls="bg-lime" />
      ) : card.status === 'needs_you' ? (
        <StatusBadge label="NEEDS YOU" cls="bg-pink" />
      ) : card.status === 'failed' ? (
        <StatusBadge label="OFF-TRACK" cls="bg-orange" />
      ) : queued ? (
        <StatusBadge label="QUEUED" cls="bg-cream" />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStartFix(card.id)
          }}
          className="shrink-0 rounded-full brut-2 bg-pink px-4 py-2 text-[12px] font-bold text-ink"
        >
          Start Fix →
        </button>
      )}
    </div>
  )
}
