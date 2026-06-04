const COLS = [120, 340, 560, 780, 1000, 1220]
const ROWS = [60, 260, 460, 660]
const COLORS = ['bg-pink', 'bg-violet', 'bg-lime', 'bg-blue', 'bg-orange']

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
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, k) => (
        <span
          key={k}
          className={`absolute h-1.5 w-1.5 rounded-full ${d.c} opacity-70`}
          style={{ left: d.x, top: d.y }}
        />
      ))}
    </div>
  )
}
