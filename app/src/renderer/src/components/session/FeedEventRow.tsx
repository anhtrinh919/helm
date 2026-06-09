import type { FeedEvent } from '@shared/ipc-schemas'

export function clockTime(ms: number): string {
  const d = new Date(ms)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const s = d.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

/** One line in the live feed. Narration + activity are the common case; decision
 *  and checkpoint markers are breadcrumbs (the interactive blocks render elsewhere). */
export function FeedEventRow({ event }: { event: FeedEvent }): React.JSX.Element {
  const ts = (
    <span style={{ width: 60, flexShrink: 0, fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)', paddingTop: 2 }}>
      {clockTime(event.createdAt)}
    </span>
  )

  if (event.kind === 'activity') {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {ts}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-3)' }}>
          <span className="hm-dot" style={{ background: 'var(--parked)', opacity: 0.7 }} />
          {event.text}
        </div>
      </div>
    )
  }

  if (event.kind === 'steering') {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {ts}
        <div style={{ border: '1.5px solid var(--frame)', background: 'var(--accent-weak)', padding: '6px 12px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {event.text}
        </div>
      </div>
    )
  }

  if (event.kind === 'decision_prompt') {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {ts}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
          <span className="hm-dot hm-dot--needs" />
          Paused to ask you something
        </div>
      </div>
    )
  }

  if (event.kind === 'checkpoint') {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {ts}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
          <span style={{ width: 16, height: 16, background: 'var(--ink)', border: '1.5px solid var(--frame)', display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--lime)', flexShrink: 0 }}>✓</span>
          First pass is ready to review
        </div>
      </div>
    )
  }

  if (event.kind === 'error') {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {ts}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fail)' }}>{event.text}</div>
      </div>
    )
  }

  if (event.kind === 'stopped') {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {ts}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>
          <span style={{ width: 14, height: 14, background: 'var(--surface-2)', border: '1.5px solid var(--frame)', display: 'grid', placeItems: 'center', fontSize: 9, color: 'var(--ink-3)', flexShrink: 0 }}>■</span>
          {event.text}
        </div>
      </div>
    )
  }

  // Phase 4 triage: a request was parked on the For-later shelf.
  if (event.kind === 'parked') {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {ts}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>
          <span className="hm-dot hm-dot--parked" />
          {event.text}
        </div>
      </div>
    )
  }

  // narration
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {ts}
      <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>{event.text}</div>
    </div>
  )
}
