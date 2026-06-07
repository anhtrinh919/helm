export type BoardTab = 'board' | 'preview' | 'fix' | 'decisions' | 'progress' | 'docs'

interface TabDef {
  id: BoardTab
  label: string
}

const TABS: TabDef[] = [
  { id: 'board', label: 'Board' },
  { id: 'preview', label: 'Live Preview' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'progress', label: 'Progress' },
  { id: 'docs', label: 'Docs' },
]

/** Board tab strip. `trailing` renders in the strip's right cluster (e.g. point-mode toggle). */
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
