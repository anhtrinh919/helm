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
    <span className="w-16 shrink-0 pt-0.5 font-mono text-[11px] text-soft/70">
      {clockTime(event.createdAt)}
    </span>
  )

  if (event.kind === 'activity') {
    return (
      <div className="flex gap-3">
        {ts}
        <div className="flex items-center gap-2 text-sm text-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          {event.text}
        </div>
      </div>
    )
  }

  if (event.kind === 'steering') {
    return (
      <div className="flex gap-3">
        {ts}
        <div className="rounded-[10px] brut-2 bg-violetsoft px-3 py-1.5 text-sm font-semibold text-ink">
          {event.text}
        </div>
      </div>
    )
  }

  if (event.kind === 'decision_prompt') {
    return (
      <div className="flex gap-3">
        {ts}
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="h-2 w-2 animate-pulse rounded-full bg-pink" />
          Paused to ask you something
        </div>
      </div>
    )
  }

  if (event.kind === 'checkpoint') {
    return (
      <div className="flex gap-3">
        {ts}
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-mint text-[10px] text-ink">✓</span>
          First pass is ready to review
        </div>
      </div>
    )
  }

  if (event.kind === 'error') {
    return (
      <div className="flex gap-3">
        {ts}
        <div className="text-sm font-semibold text-orange">{event.text}</div>
      </div>
    )
  }

  if (event.kind === 'stopped') {
    return (
      <div className="flex gap-3">
        {ts}
        <div className="flex items-center gap-2 text-sm font-semibold text-soft">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-soft/25 text-[9px] text-ink">■</span>
          {event.text}
        </div>
      </div>
    )
  }

  // narration
  return (
    <div className="flex gap-3">
      {ts}
      <div className="text-sm leading-relaxed text-ink">{event.text}</div>
    </div>
  )
}
