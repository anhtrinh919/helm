const COLS = [120, 340, 560, 780, 1000, 1220]
const ROWS = [60, 260, 460, 660]
// Dot-matrix palette: small ink-tinted dots as texture, using design-canon vars
const COLORS = ['var(--needs-dot)', 'var(--parked)', 'var(--lime)', 'var(--ink-4)', 'var(--fail)']

/** The scattered decorative dots from the design. Purely ornamental. */
export function Confetti(): React.JSX.Element {
  const dots: { x: number; y: number; c: string }[] = []
  let i = 0
  for (const y of ROWS) {
    for (const x of COLS) {
      dots.push({ x, y, c: COLORS[i % COLORS.length]! })
      i++
    }
  }
  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden' }} aria-hidden>
      {dots.map((d, k) => (
        <span
          key={k}
          style={{
            position: 'absolute',
            width: 5,
            height: 5,
            background: d.c,
            opacity: 0.5,
            left: d.x,
            top: d.y,
          }}
        />
      ))}
    </div>
  )
}
