import { useState } from 'react'
import { useShelf } from '../../store/shelf'
import { Icon } from '../ui/Icon'
import type { ShelfItem } from '@shared/ipc-schemas'

function parkedDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * The For-Later shelf (Build Journey · "For-Later Shelf"). Parked mid-journey
 * requests — large or off-track ideas the agent set aside so the journey kept
 * moving. The user can promote a parked item onto the board or dismiss it.
 *
 * The classification (fix-now vs park) is agent-side; this panel renders the
 * parked outcomes plus a user-initiated "park an idea" affordance that calls
 * `shelf.add` (the agent's own parks arrive over the same `shelf:updated` push).
 */
export function ShelfPanel({
  projectId,
  onClose,
}: {
  projectId: string
  onClose: () => void
}): React.JSX.Element {
  const items = useShelf((s) => s.items[projectId] ?? [])
  const add = useShelf((s) => s.add)
  const promote = useShelf((s) => s.promote)
  const remove = useShelf((s) => s.remove)
  const [draft, setDraft] = useState('')

  const submit = (): void => {
    const t = draft.trim()
    if (!t) return
    void add(projectId, t)
    setDraft('')
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1.5px solid var(--frame)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '16px 18px',
          borderBottom: '1.5px solid var(--frame)',
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            background: 'var(--parked-weak)',
            border: '1.5px solid var(--frame)',
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
          }}
        >
          <Icon n="tray" size={17} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>For-Later shelf</span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {items.length === 0
              ? 'Nothing parked'
              : `${items.length} parked request${items.length === 1 ? '' : 's'}`}
          </span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close shelf"
          className="hm-btn hm-btn--ghost hm-btn--sm"
          style={{ marginLeft: 'auto' }}
        >
          <Icon n="caret-right" />
        </button>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 30,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              border: '1.5px dashed var(--line-2)',
              display: 'grid',
              placeItems: 'center',
              marginBottom: 18,
            }}
          >
            <Icon n="tray" size={26} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Your shelf is clear</div>
          <div
            style={{
              fontSize: 13.5,
              color: 'var(--ink-2)',
              marginTop: 8,
              maxWidth: '34ch',
              lineHeight: 1.55,
            }}
          >
            Nothing parked — mid-journey requests that are too big or off-track will appear here, so
            the journey never derails and nothing is lost.
          </div>
        </div>
      ) : (
        <div
          className="hm-scroll-fade"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
            Parked so the journey kept moving. Promote to the board or dismiss.
          </div>
          {items.map((it) => (
            <ShelfRow
              key={it.id}
              item={it}
              onPromote={() => void promote(projectId, it.id)}
              onDismiss={() => void remove(projectId, it.id)}
            />
          ))}
        </div>
      )}

      <div style={{ padding: 16, borderTop: '1.5px solid var(--frame)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="hm-input"
            style={{ minHeight: 38, padding: '8px 12px', fontSize: 13 }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="Park an idea for later…"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim()}
            className="hm-btn hm-btn--sm"
          >
            <Icon n="tray" />
            Park
          </button>
        </div>
      </div>
    </div>
  )
}

function ShelfRow({
  item,
  onPromote,
  onDismiss,
}: {
  item: ShelfItem
  onPromote: () => void
  onDismiss: () => void
}): React.JSX.Element {
  return (
    <div className="hm-shelfitem" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
        <span className="hm-shelfitem__ic">
          <Icon n="tray" />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700 }}>{item.title}</span>
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--ink-3)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
            }}
          >
            Parked {parkedDate(item.createdAt)}
          </span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <button type="button" onClick={onPromote} className="hm-btn hm-btn--accent hm-btn--sm">
          <Icon n="check" />
          Promote to board
        </button>
        <button type="button" onClick={onDismiss} className="hm-btn hm-btn--sm hm-btn--quiet">
          Dismiss
        </button>
      </div>
    </div>
  )
}
