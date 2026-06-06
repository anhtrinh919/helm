export type BoardTab = 'board' | 'preview' | 'fix' | 'decisions' | 'progress' | 'docs'

interface TabDef {
  id: BoardTab
  label: string
  phase?: number // undefined = live now
}

const TABS: TabDef[] = [
  { id: 'board', label: 'Board' },
  // Point & Fix shipped in Phase 3 — it lives INSIDE Live Preview (crosshair
  // toggle in this strip's right cluster), not as its own tab.
  { id: 'preview', label: 'Live Preview' },
  { id: 'decisions', label: 'Decisions', phase: 4 },
  { id: 'progress', label: 'Progress', phase: 4 },
]

/** Board tab + later-phase tabs shown as invitations (phase badge), never greyed-out dead UI.
 *  `trailing` renders in the strip's right cluster (the point-mode toggle, F36–F38). */
export function TabStrip({
  active,
  onSelect,
  trailing,
}: {
  active: BoardTab
  onSelect: (tab: BoardTab) => void
  trailing?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {TABS.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
              isActive ? 'bg-ink text-cream' : 'brut-2 bg-cream text-ink'
            }`}
          >
            {t.label}
            {t.phase && (
              <span className="rounded-full bg-pinksoft px-1.5 py-0.5 text-[9px] font-black tracking-wide text-ink">
                PHASE {t.phase}
              </span>
            )}
          </button>
        )
      })}
      {trailing && (
        <>
          <span className="flex-1" />
          {trailing}
        </>
      )}
    </div>
  )
}

/** Placeholder panel for a not-yet-unlocked tab. Reads as an invitation, not a lock. */
export function StubPanel({ tab }: { tab: BoardTab }): React.JSX.Element {
  const copy: Partial<Record<BoardTab, { title: string; phase: number; blurb: string }>> = {
    preview: { title: 'Live Preview', phase: 2, blurb: 'Watch the real app you’re building run right here.' },
    fix: { title: 'Point & Fix', phase: 3, blurb: 'Click anything in the preview and ask for a fix.' },
    decisions: { title: 'Decisions Log', phase: 4, blurb: 'Every call you made, with the reasoning kept.' },
    progress: { title: 'Progress', phase: 4, blurb: 'A timeline of what got built, and when.' },
    docs: { title: 'Docs', phase: 4, blurb: 'Living documentation, written as you go.' },
  }
  const c = copy[tab]
  if (!c) return <div />
  return (
    <div className="grid flex-1 place-items-center">
      <div className="max-w-sm rounded-[18px] brut-2 border-dashed bg-cream/60 px-8 py-7 text-center">
        <span className="rounded-full brut-2 bg-pinksoft px-3 py-1 text-[11px] font-black tracking-wide text-ink">
          UNLOCKS IN PHASE {c.phase}
        </span>
        <div className="mt-3 font-display text-2xl font-black text-ink">{c.title}</div>
        <div className="mt-1.5 text-soft">{c.blurb}</div>
      </div>
    </div>
  )
}
