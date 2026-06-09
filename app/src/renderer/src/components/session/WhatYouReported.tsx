import type { Card } from '@shared/ipc-schemas'

/**
 * The fix session's evidence card (F56 — "WHAT YOU REPORTED"): the comment
 * that started this session, pinned beside the feed so the user sees Helm is
 * working on exactly what they pointed at. Renderer-safe by construction —
 * the element is represented by the snapshot-frame treatment (the real crop
 * never crosses to the renderer), same as the comment box.
 */

function timeAgo(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

export function WhatYouReported({
  card,
  projectName,
}: {
  card: Card
  projectName: string
}): React.JSX.Element {
  const isPage = card.pageLevel === true
  const isBug = card.noteType === 'bug'

  return (
    <section style={{ border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: 14 }}>
      <div className="hm-eyebrow">WHAT YOU REPORTED</div>

      {/* The captured spot — snapshot frame for elements, page chip for pages. */}
      {isPage ? (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--frame)', background: 'var(--surface-2)', padding: '10px 12px' }}>
          <span style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1.5px solid var(--frame)', background: 'var(--surface-3)', fontSize: 14, flexShrink: 0 }}>🗎</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>The whole screen, as it looked then</span>
        </div>
      ) : (
        <div style={{ position: 'relative', marginTop: 10, overflow: 'hidden', border: '1.5px solid var(--frame)', background: 'var(--surface-2)', padding: 12 }}>
          <div style={{ display: 'grid', height: 56, placeItems: 'center', border: '1.5px dashed var(--hair)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)' }}>The spot you pointed at</span>
          </div>
          <span style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 5, background: 'var(--ink)', padding: '3px 7px' }}>
            <span style={{ width: 6, height: 6, background: 'var(--lime)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--paper)' }}>captured from {projectName}</span>
          </span>
        </div>
      )}

      {/* Type + age, then the note verbatim. */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        {card.noteType && (
          <span
            className="hm-chip"
            style={{
              background: isBug ? 'var(--fail-weak)' : 'var(--surface-2)',
              color: isBug ? 'var(--fail)' : 'var(--ink-3)',
              fontSize: 9,
            }}
          >
            {isBug ? 'BROKEN' : 'CHANGE'}
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{timeAgo(card.createdAt)}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>"{card.title}"</div>
    </section>
  )
}
