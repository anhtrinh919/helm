/** The Helm wordmark + logo block. `onDark` flips the icon for dark backgrounds. */
export function BrandMark({ onDark = false }: { onDark?: boolean }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        className="hm-mark"
        style={onDark ? { background: 'var(--lime)', color: 'var(--ink)' } : undefined}
      >
        H
      </span>
      <span
        className="hm-wordmark"
        style={{ color: onDark ? 'var(--paper)' : 'var(--ink)' }}
      >
        Helm
      </span>
    </div>
  )
}
