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
  selector: string
  /** Fractions of the stage; converted to pixels at pick time. */
  fx: number
  fy: number
  fw: number
  fh: number
}

const DEMO_ELEMENTS: DemoElement[] = [
  { label: 'New ticket button', note: 'in app bar', selector: 'header > button.new-ticket', fx: 0.78, fy: 0.05, fw: 0.13, fh: 0.06 },
  { label: 'Ticket #142 card', note: 'New column', selector: 'main .col-new article:nth-of-type(1)', fx: 0.08, fy: 0.3, fw: 0.26, fh: 0.22 },
  { label: 'Search input', note: 'app bar', selector: 'header input[type=search]', fx: 0.52, fy: 0.05, fw: 0.2, fh: 0.06 },
]

const DEMO_CROP = 'ZGVtby1jcm9w' // synthetic placeholder crop (mock only)

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
      selector: el.selector,
      screenshotCrop: DEMO_CROP,
    })
  }

  return (
    <div className="pointer-events-auto absolute right-4 top-4 w-[300px] rounded-[14px] brut-2 bg-cream p-4 shadow-[6px_6px_0_rgba(27,18,8,0.18)]">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          <span className="text-[10px] font-black tracking-wide text-cream">DEMO</span>
        </span>
        <span className="text-[11px] text-soft">mock web build only</span>
      </div>
      <div className="mt-2.5 font-display text-lg font-black text-ink">
        Simulate click on element
      </div>
      <div className="mt-0.5 text-[11px] text-soft">
        Fire synthetic point-and-fix data without a live browser.
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {DEMO_ELEMENTS.map((el) => (
          <button
            key={el.label}
            onClick={() => pick(el)}
            className="flex items-center gap-2.5 rounded-[10px] brut-2 bg-canvas px-3 py-2 text-left hover:bg-cream"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] brut-2 bg-cream text-[12px]">
              ⌖
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-bold text-ink">{el.label}</span>
              <span className="block text-[10px] text-soft">{el.note}</span>
            </span>
            <span className="text-soft">→</span>
          </button>
        ))}
      </div>
      <div className="mt-3 text-[10px] text-soft">Hidden when running the real app</div>
    </div>
  )
}
