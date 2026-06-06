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
    <section className="rounded-[18px] brut bg-pinksoft/60 p-4">
      <div className="text-[10px] font-black tracking-[0.16em] text-soft">WHAT YOU REPORTED</div>

      {/* The captured spot — snapshot frame for elements, page chip for pages. */}
      {isPage ? (
        <div className="mt-2.5 flex items-center gap-3 rounded-[8px] brut-2 bg-[#FAF4E8] px-3 py-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[6px] brut-2 bg-cream text-sm">🗎</span>
          <span className="text-[12px] font-bold text-ink">The whole screen, as it looked then</span>
        </div>
      ) : (
        <div className="relative mt-2.5 overflow-hidden rounded-[8px] brut-2 bg-[#FAF4E8] p-3">
          <div className="grid h-14 place-items-center rounded-[6px] border-2 border-dashed border-ink/25">
            <span className="text-[11px] font-bold text-soft">The spot you pointed at</span>
          </div>
          <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-[6px] bg-ink px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-lime" />
            <span className="text-[10px] font-bold text-cream">captured from {projectName}</span>
          </span>
        </div>
      )}

      {/* Type + age, then the note verbatim. */}
      <div className="mt-2.5 flex items-center gap-2">
        {card.noteType && (
          <span
            className={`rounded-full border-2 px-2 py-0.5 text-[9px] font-black tracking-wide text-ink ${
              isBug ? 'border-orange bg-orangesoft' : 'border-blue bg-bluesoft'
            }`}
          >
            {isBug ? 'BROKEN' : 'CHANGE'}
          </span>
        )}
        <span className="text-[11px] text-soft">{timeAgo(card.createdAt)}</span>
      </div>
      <div className="mt-1.5 text-sm font-bold text-ink">“{card.title}”</div>
    </section>
  )
}
