import type { Card, CardStatus } from '@shared/ipc-schemas'

/** Pull the "Step N of M" prefix out of a stepLabel; fall back for user-added cards. */
function stepPrefix(card: Card): string {
  if (card.stepLabel) {
    const colon = card.stepLabel.indexOf(':')
    return colon > 0 ? card.stepLabel.slice(0, colon) : card.stepLabel
  }
  return card.type === 'bug' ? 'Bug' : 'Your idea'
}

function StatusPill({ status }: { status: CardStatus }): React.JSX.Element {
  const map: Record<CardStatus, [string, string]> = {
    planned: ['PLANNED', 'bg-cream'],
    up_next: ['UP NEXT', 'bg-bluesoft'],
    building: ['BUILDING', 'bg-lime'],
    needs_you: ['NEEDS YOU', 'bg-pink'],
    failed: ['OFF-TRACK', 'bg-orange'],
    done: ['DONE', 'bg-mint'],
  }
  const [label, bg] = map[status]
  return (
    <span className={`shrink-0 rounded-full brut-2 ${bg} px-2.5 py-1 text-[10px] font-black tracking-wide text-ink`}>
      {label}
    </span>
  )
}

export interface SpineItemProps {
  card: Card
  mode: 'spotlight' | 'row' | 'condensed'
  depLabel?: string
  onOpen: (cardId: string) => void
  onRetry?: (cardId: string) => void
}

export function SpineItem({ card, mode, depLabel, onOpen, onRetry }: SpineItemProps): React.JSX.Element {
  // Failed item — its own bold treatment, regardless of requested mode.
  if (card.status === 'failed') {
    return (
      <div className="rounded-[18px] brut bg-orangesoft p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full brut-2 bg-orange font-display text-base font-black text-ink">
            !
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold tracking-wide text-ink/70">{stepPrefix(card)}</div>
            <div className="font-display text-xl font-black text-ink">{card.title}</div>
            <div className="mt-1 text-sm text-soft">Something blocked this — I stopped so nothing breaks.</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onRetry?.(card.id)}
            className="rounded-full brut-2 bg-ink px-4 py-2 text-sm font-bold text-cream"
          >
            Try again
          </button>
          <button
            onClick={() => onOpen(card.id)}
            className="rounded-full brut-2 bg-cream px-4 py-2 text-sm font-bold text-ink"
          >
            Tell me more
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'spotlight') {
    return (
      <div className="rounded-[18px] brut bg-lime p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full brut-2 bg-cream font-display text-base font-black text-ink">
            {card.position + 1}
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold tracking-wide text-ink/70">{stepPrefix(card)}</div>
            <div className="font-display text-2xl font-black leading-tight text-ink">{card.title}</div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[10px] font-black text-cream">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lime" /> LIVE
          </span>
        </div>
        {/* Indeterminate activity — deliberately not a fabricated percentage. */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream">
          <div className="h-full w-1/3 animate-[helmslide_1.6s_ease-in-out_infinite] rounded-full bg-pink" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue" /> Working on it now
          </span>
          <button
            onClick={() => onOpen(card.id)}
            className="flex items-center gap-1.5 rounded-full brut-2 bg-ink px-4 py-2 text-sm font-bold text-cream"
          >
            Open <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'condensed') {
    return (
      <button
        onClick={() => onOpen(card.id)}
        className="flex w-full items-center gap-3 rounded-[12px] border-2 border-ink/15 bg-cream/40 px-4 py-2 text-left"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-mint text-[11px] font-black text-ink">✓</span>
        <span className="flex-1 truncate text-sm font-medium text-ink/55">{card.title}</span>
        <span className="text-[10px] font-bold tracking-wide text-ink/40">DONE</span>
      </button>
    )
  }

  // row mode (planned / up_next)
  return (
    <button
      onClick={() => onOpen(card.id)}
      className="flex w-full items-center gap-3 rounded-[14px] brut-2 bg-cream px-4 py-3 text-left transition hover:-translate-y-0.5"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink/20 text-sm font-black text-ink">
        {card.position + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-ink">{card.title}</span>
          {depLabel && (
            <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-soft">
              needs {depLabel}
            </span>
          )}
        </div>
        <div className="text-xs text-soft">{stepPrefix(card)}</div>
      </div>
      <StatusPill status={card.status} />
    </button>
  )
}
