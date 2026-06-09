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

function StatusBadge({ label, chipCls }: { label: string; chipCls: string }): React.JSX.Element {
  return (
    <span className={`hm-chip ${chipCls}`}>{label}</span>
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
      style={{
        display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid var(--frame)',
        background: 'var(--surface-3)', padding: 12,
        opacity: done ? 0.7 : 1,
        cursor: openable ? 'pointer' : 'default',
      }}
      onClick={openable ? () => onOpen(card.id) : undefined}
    >
      {/* Thumb */}
      <div style={{ width: 62, height: 50, flexShrink: 0, display: 'grid', placeItems: 'center', border: '1.5px solid var(--frame)', background: 'var(--surface-2)' }}>
        {done ? (
          <span style={{ width: 22, height: 22, background: 'var(--ink)', border: '1.5px solid var(--frame)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--lime)' }}>
            ✓
          </span>
        ) : isPage ? (
          <span style={{ fontSize: 18 }}>🗎</span>
        ) : (
          <span
            style={{
              width: 22, height: 22, display: 'grid', placeItems: 'center', border: '1.5px solid var(--frame)',
              fontSize: 11, fontWeight: 700, color: 'var(--paper)',
              background: noteType === 'bug' ? 'var(--fail)' : 'var(--ink)',
            }}
          >
            {noteType === 'bug' ? '!' : '✎'}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {noteType && !done && (
            <span
              className="hm-chip"
              style={{
                fontSize: 9,
                background: noteType === 'bug' ? 'var(--fail-weak)' : 'var(--surface-2)',
                color: noteType === 'bug' ? 'var(--fail)' : 'var(--ink-3)',
              }}
            >
              {noteType === 'bug' ? 'BROKEN' : 'CHANGE'}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{timeAgo(card.createdAt)}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</div>
      </div>

      {/* Action / status */}
      {done ? (
        <StatusBadge label="✓ FIXED" chipCls="hm-chip--success" />
      ) : card.status === 'building' ? (
        <StatusBadge label="IN PROGRESS" chipCls="hm-chip--accent" />
      ) : card.status === 'needs_you' ? (
        <StatusBadge label="NEEDS YOU" chipCls="hm-chip--needs" />
      ) : card.status === 'failed' ? (
        <StatusBadge label="OFF-TRACK" chipCls="hm-chip--fail" />
      ) : queued ? (
        <StatusBadge label="QUEUED" chipCls="" />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStartFix(card.id)
          }}
          className="hm-btn hm-btn--sm hm-btn--primary"
        >
          Start Fix →
        </button>
      )}
    </div>
  )
}
