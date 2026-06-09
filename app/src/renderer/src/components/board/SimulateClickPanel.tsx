import type { LockedCapture } from '../../store/pins'

/**
 * DEMO MODE panel (F49) — mock web build only. The data:-URL iframe is an
 * opaque origin, so true click capture is impossible in the browser; these
 * pre-canned elements fire the same registration flow with synthetic data.
 * Hidden when running the real Electron app.
 */

interface DemoElement {
  label: string
  note: string
  /** Fractions of the stage; converted to pixels at pick time. */
  fx: number
  fy: number
  fw: number
  fh: number
}

const DEMO_ELEMENTS: DemoElement[] = [
  { label: 'New ticket button', note: 'in app bar', fx: 0.78, fy: 0.05, fw: 0.13, fh: 0.06 },
  { label: 'Ticket #142 card', note: 'New column', fx: 0.08, fy: 0.3, fw: 0.26, fh: 0.22 },
  { label: 'Search input', note: 'app bar', fx: 0.52, fy: 0.05, fw: 0.2, fh: 0.06 },
]

export function SimulateClickPanel({
  stageSize,
  onPick,
}: {
  stageSize: { width: number; height: number }
  onPick: (capture: LockedCapture) => void
}): React.JSX.Element {
  const pick = (el: DemoElement): void => {
    const boundingBox = {
      x: el.fx * stageSize.width,
      y: el.fy * stageSize.height,
      width: el.fw * stageSize.width,
      height: el.fh * stageSize.height,
    }
    onPick({
      boundingBox,
      pinX: el.fx + el.fw / 2,
      pinY: el.fy + el.fh / 2,
    })
  }

  return (
    <div style={{ pointerEvents: 'auto', position: 'absolute', right: 16, top: 16, width: 300, border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: 14, boxShadow: 'var(--hard)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hm-chip hm-chip--accent" style={{ fontSize: 10 }}>
          DEMO
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>mock web build only</span>
      </div>
      <div style={{ marginTop: 10, fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
        Simulate click on element
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
        Fire synthetic point-and-fix data without a live browser.
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DEMO_ELEMENTS.map((el) => (
          <button
            key={el.label}
            onClick={() => pick(el)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--frame)', background: 'var(--surface-2)', padding: '8px 10px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span style={{ width: 28, height: 28, flexShrink: 0, display: 'grid', placeItems: 'center', border: '1.5px solid var(--frame)', background: 'var(--surface-3)', fontSize: 12 }}>
              ⌖
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{el.label}</span>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--ink-3)' }}>{el.note}</span>
            </span>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>→</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-3)' }}>Hidden when running the real app</div>
    </div>
  )
}
