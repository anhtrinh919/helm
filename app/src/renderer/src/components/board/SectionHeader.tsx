import { Icon } from '../ui/Icon'

/** DOT-MATRIX section divider: uppercase label, count, and a hairline rule. */
export function SectionHeader({
  label,
  count,
  icon,
}: {
  label: string
  count: number
  pill?: string // kept for backwards compat — not used in DOT-MATRIX
  icon?: string
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 4px',
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '.05em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
      }}
    >
      {icon && <Icon n={icon} />}
      {label}
      <span style={{ color: 'var(--ink-4)' }}>· {count}</span>
      <span style={{ flex: 1, height: '1.5px', background: 'var(--hair)', marginLeft: 4 }} />
    </div>
  )
}
