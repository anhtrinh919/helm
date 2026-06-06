import { useEffect, useRef, useState } from 'react'
import type { BoundingBox, NoteType } from '@shared/ipc-schemas'
import { isMock } from '../../bridge'
import { useBoard } from '../../store/board'
import { usePreview } from '../../store/preview'
import { usePointFix, NO_PINS, type LockedCapture } from '../../store/pins'
import { PointCommentBox } from './PointCommentBox'
import { SimulateClickPanel } from './SimulateClickPanel'

/**
 * The point-and-fix annotation layer over the F32 live stage (F38–F44).
 * The container is pointer-transparent — in the real app, hovers and clicks
 * must reach the embedded <webview> where the injected capture script does the
 * highlighting; only this layer's own controls take pointer events.
 */

const FALSE_DEFAULT = false as const

/** Crosshair toggle + Esc hint for the tab strip's right cluster (F36–F38). */
export function PointModeToggle({ projectId }: { projectId: string }): React.JSX.Element {
  const state = usePreview((s) => s.states[projectId])
  const active = usePointFix((s) => s.pointMode[projectId]) ?? FALSE_DEFAULT
  const enter = usePointFix((s) => s.enterPointMode)
  const exit = usePointFix((s) => s.exitPointMode)
  const live = state?.status === 'live'

  return (
    <div className="flex items-center gap-2">
      {active && (
        <span className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5">
          <span className="rounded-[5px] bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-cream">
            Esc
          </span>
          <span className="text-[11px] font-bold text-cream">to exit point mode</span>
        </span>
      )}
      <button
        onClick={() => (active ? exit(projectId) : enter(projectId))}
        disabled={!live}
        title={live ? 'Point & fix' : 'Point & fix (needs a running app)'}
        className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-[12px] font-bold ${
          active
            ? 'border-2 border-ink bg-ink text-lime'
            : live
              ? 'brut-2 bg-cream text-ink'
              : 'brut-2 cursor-not-allowed bg-cream text-ink opacity-40'
        }`}
      >
        <CrosshairIcon className={active ? 'text-lime' : 'text-current'} />
        Point &amp; fix
      </button>
    </div>
  )
}

function CrosshairIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2.4" />
      <path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  )
}

/** Open-comment pins on the stage (F42/F43) — visible in AND out of point mode. */
function PinsLayer({ projectId }: { projectId: string }): React.JSX.Element {
  const pins = usePointFix((s) => s.pins[projectId]) ?? NO_PINS
  const cards = useBoard((s) => s.cards)
  return (
    <>
      {pins
        .filter((p) => p.pinX != null && p.pinY != null)
        .map((p) => {
          const fixing = cards.find((c) => c.id === p.cardId)?.status === 'building'
          return (
            <span
              key={p.cardId}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(p.pinX as number) * 100}%`, top: `${(p.pinY as number) * 100}%` }}
            >
              <span
                className={`grid h-[30px] w-[30px] place-items-center rounded-full brut-2 text-[13px] font-black text-cream ${
                  p.noteType === 'bug' ? 'bg-orange' : 'bg-blue'
                }`}
              >
                {p.noteType === 'bug' ? '!' : '✎'}
              </span>
              {fixing && (
                <span className="absolute left-[34px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-[10px] brut-2 bg-pinksoft px-2 py-1 text-[9px] font-black tracking-wide text-ink">
                  FIXING NOW
                </span>
              )}
            </span>
          )
        })}
    </>
  )
}

/** Cream veils around the locked rect + the frozen orange ring (F40). */
function LockedRing({ rect }: { rect: BoundingBox }): React.JSX.Element {
  const { x, y, width: w, height: h } = rect
  const veil = 'absolute bg-[#FFF7E6]/85'
  return (
    <>
      <div className={veil} style={{ left: 0, top: 0, right: 0, height: Math.max(0, y - 6) }} />
      <div className={veil} style={{ left: 0, top: y + h + 6, right: 0, bottom: 0 }} />
      <div className={veil} style={{ left: 0, top: Math.max(0, y - 6), width: Math.max(0, x - 6), height: h + 12 }} />
      <div className={veil} style={{ left: x + w + 6, top: Math.max(0, y - 6), right: 0, height: h + 12 }} />
      <div
        className="absolute rounded-[18px] border-2 border-orangesoft"
        style={{ left: x - 10, top: y - 10, width: w + 20, height: h + 20 }}
      />
      <div
        className="absolute rounded-[12px] border-[3px] border-orange"
        style={{ left: x - 5, top: y - 5, width: w + 10, height: h + 10 }}
      />
    </>
  )
}

/** "Comment on this page" pill pinned to the bottom of the overlay (F44). */
function AffordanceStrip({ onPage }: { onPage: () => void }): React.JSX.Element {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
      <button
        onClick={onPage}
        className="flex items-center gap-2.5 rounded-full border-2 border-ink bg-ink py-2 pl-2 pr-4 shadow-[4px_4px_0_rgba(27,18,8,0.25)]"
      >
        <span className="grid h-6 w-6 place-items-center rounded-[8px] bg-lime text-[14px] font-black text-ink">
          +
        </span>
        <span className="text-[12px] font-bold text-cream">Comment on this page</span>
        <span className="h-4 w-px bg-white/25" />
        <span className="text-[11px] text-white/60">or point at any element</span>
      </button>
    </div>
  )
}

/** Position the comment box next to the locked rect — below it when there's
 *  room, above when the element sits low (per the F40 design note). */
function boxPosition(
  rect: BoundingBox,
  stage: { width: number; height: number },
): React.CSSProperties {
  const BOX_W = 420
  const left = Math.min(Math.max(8, rect.x), Math.max(8, stage.width - BOX_W - 8))
  const below = rect.y + rect.height + 16
  if (below + 340 < stage.height) return { left, top: below }
  return { left, bottom: stage.height - rect.y + 16 }
}

/** The full annotation layer; mounts inside the live stage's embed container. */
export function PointAnnotations({ projectId }: { projectId: string }): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const pointMode = usePointFix((s) => s.pointMode[projectId]) ?? FALSE_DEFAULT
  const capture = usePointFix((s) => s.capture[projectId]) ?? null
  const pageComment = usePointFix((s) => s.pageComment[projectId]) ?? FALSE_DEFAULT
  const justFiled = usePointFix((s) => s.justFiled[projectId]) ?? FALSE_DEFAULT
  const exit = usePointFix((s) => s.exitPointMode)
  const lock = usePointFix((s) => s.lockCapture)
  const clear = usePointFix((s) => s.clearCapture)
  const openPage = usePointFix((s) => s.openPageComment)
  const register = usePointFix((s) => s.register)
  const loadPins = usePointFix((s) => s.loadPins)

  useEffect(() => {
    void loadPins(projectId)
  }, [projectId, loadPins])

  // Track the stage size for demo-pick geometry + comment box placement.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = (): void => {
      const r = el.getBoundingClientRect()
      setStageSize({ width: r.width, height: r.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Esc exits point mode when focus is on the Helm side (guest Esc is injected).
  useEffect(() => {
    if (!pointMode) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') exit(projectId)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pointMode, projectId, exit])

  const submit = (note: string, noteType: NoteType): void => {
    void register(projectId, note, noteType)
  }

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <PinsLayer projectId={projectId} />

      {pointMode && !capture && !pageComment && (
        <AffordanceStrip onPage={() => openPage(projectId)} />
      )}

      {pointMode && isMock && !capture && !pageComment && (
        <SimulateClickPanel
          stageSize={stageSize}
          onPick={(c: LockedCapture) => lock(projectId, c)}
        />
      )}

      {pointMode && capture && (
        <div className="pointer-events-auto absolute inset-0">
          <LockedRing rect={capture.boundingBox} />
          <div className="absolute z-40" style={boxPosition(capture.boundingBox, stageSize)}>
            <PointCommentBox
              variant="element"
              onSubmit={submit}
              onCancel={() => clear(projectId)}
            />
          </div>
        </div>
      )}

      {pointMode && pageComment && (
        <div className="pointer-events-auto absolute inset-0 bg-[#FFF7E6]/60">
          <div className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2">
            <PointCommentBox variant="page" onSubmit={submit} onCancel={() => clear(projectId)} />
          </div>
        </div>
      )}

      {justFiled && (
        <div className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full brut-2 bg-lime px-4 py-2 text-[12px] font-bold text-ink shadow-[4px_4px_0_rgba(27,18,8,0.2)]">
          Sent to the board — find it under REPORTED
        </div>
      )}
    </div>
  )
}
