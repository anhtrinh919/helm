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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px', borderBottom: '1.5px solid var(--frame)', background: 'var(--surface)', height: 42, flexShrink: 0 }}>
      {TABS.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 28,
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--sans)', letterSpacing: '-.01em',
              border: '1.5px solid', borderColor: isActive ? 'var(--frame)' : 'transparent',
              background: isActive ? 'var(--ink)' : 'transparent',
              color: isActive ? 'var(--paper)' : 'var(--ink-3)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        )
      })}
      {trailing && (
        <>
          <span style={{ flex: 1 }} />
          {trailing}
        </>
      )}
    </div>
  )
}
