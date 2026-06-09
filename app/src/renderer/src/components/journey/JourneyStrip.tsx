import { Icon } from '../ui/Icon'
import type { Project } from '@shared/ipc-schemas'

/**
 * The journey-complete collapsed strip (Build Journey · "Journey complete — collapsed strip").
 * Once a journey is `railComplete`, its full step history folds into this single
 * tappable row that sits above the Cockpit Board. Board integration is a later
 * group — exported here so the board can mount it without re-deriving the shape.
 */
export function JourneyStrip({
  project,
  onExpand,
}: {
  project: Project
  onExpand?: () => void
}): React.JSX.Element {
  const total = project.plan?.length ?? 0
  return (
    <button
      type="button"
      onClick={onExpand}
      className="hm-recent"
      style={{
        width: '100%',
        background: 'var(--lime-weak)',
        boxShadow: 'var(--hard)',
        textAlign: 'left',
      }}
    >
      <span
        className="hm-recent__thumb"
        style={{ background: 'var(--ink)', color: 'var(--lime)' }}
      >
        <Icon n="check" />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700 }}>{project.name}</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
          Guided journey · {total} of {total} steps · <b>Completed</b>
        </span>
      </span>
      <span
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12.5,
          fontWeight: 700,
          color: 'var(--ink)',
          textTransform: 'uppercase',
          letterSpacing: '.04em',
        }}
      >
        Expand to history <Icon n="caret-down" />
      </span>
    </button>
  )
}
