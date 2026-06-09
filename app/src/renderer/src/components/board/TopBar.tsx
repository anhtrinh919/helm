import { Icon } from '../ui/Icon'
import type { Card } from '@shared/ipc-schemas'

/**
 * The DOT-MATRIX top bar: back chevron, breadcrumb, spacer,
 * optional right slot, and the reserved Phase 2 Publish slot.
 * `building` is kept as a prop so callers can pass the in-flight card
 * for contextual use — not shown in the bar itself (the card spine shows it).
 */
export function TopBar({
  projectName,
  building: _building,
  onBack,
}: {
  projectName: string
  building: Card | null
  onBack?: () => void
}): React.JSX.Element {
  return (
    <div className="hm-top">
      <div className="hm-top__back" onClick={onBack} style={{ cursor: onBack ? 'pointer' : 'default' }}>
        <Icon n="arrow-left" />
      </div>
      <div className="hm-crumb">
        <Icon n="house" size={16} />
        <b>{projectName}</b>
      </div>
      <div className="hm-top__spacer" />
      <div className="hm-slot-reserved">
        <Icon n="rocket-launch" />Publish · Phase 2
      </div>
    </div>
  )
}
