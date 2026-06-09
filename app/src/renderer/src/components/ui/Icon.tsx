/**
 * Phosphor icon. The Phosphor regular stylesheet (loaded in index.html) provides
 * the `.ph` / `.ph-<name>` glyph classes; this is a thin typed wrapper so screens
 * render `<Icon n="house" />` instead of raw `<i className="ph ph-house" />`.
 */
export function Icon({ n, size }: { n: string; size?: number }): React.JSX.Element {
  return <i className={`ph ph-${n}`} style={size ? { fontSize: size } : undefined} />
}
