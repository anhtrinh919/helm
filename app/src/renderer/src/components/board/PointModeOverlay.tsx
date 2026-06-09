import { useEffect, useRef, useState } from 'react'
import type { BoundingBox, NoteType } from '@shared/ipc-schemas'
import { isMock } from '../../bridge'
import { useBoard } from '../../store/board'
import { usePreview } from '../../store/preview'
import { usePointFix, NO_PINS, type LockedCapture } from '../../store/pins'
import { PointCommentBox } from './PointCommentBox'
import { SimulateClickPanel } from './SimulateClickPanel'
import { Icon } from '../ui/Icon'

/**
 * The point-and-fix annotation layer over the F32 live stage (F38–F44).
 * Extended in Group 12 to support inline text editing:
 * - text-bearing elements show TWO options: "Edit text here" + "Describe a fix"
 * - non-text elements show only "Describe a fix"
 * - "Edit text here" arms the in-place text editor via activateTextEdit
 * - commit flows through registerTextEdit
 * - double-submit guard: same selector blocked until its card appears
 *
 * Browser-proxy path: the HELM_PREVIEW_BRIDGE relay patch sends a postMessage
 * on commit; this overlay intercepts it and calls commitTextEdit.
 * Electron path: same-origin webview + main-process console interception +
 * pendingTextEdit — the renderer still needs the commit postMessage path, which
 * the webview does NOT send (gap: Electron text-edit commit requires a new push
 * channel not yet present; the overlay gracefully falls back to a "reload"
 * message in that case).
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {active && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--ink)', border: '1.5px solid var(--frame)', padding: '4px 10px' }}>
          <span style={{ background: 'rgba(255,255,255,.15)', padding: '2px 5px', fontSize: 10, fontWeight: 700, color: 'var(--paper)' }}>
            Esc
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--paper)' }}>to exit point mode</span>
        </span>
      )}
      <button
        onClick={() => (active ? exit(projectId) : enter(projectId))}
        disabled={!live}
        title={live ? 'Point & fix' : 'Point & fix (needs a running app)'}
        className="hm-btn hm-btn--sm"
        style={{
          background: active ? 'var(--ink)' : 'var(--surface-3)',
          color: active ? 'var(--lime)' : live ? 'var(--ink)' : 'var(--ink-4)',
          cursor: live ? 'pointer' : 'not-allowed',
          opacity: live ? 1 : 0.4,
        }}
      >
        <CrosshairIcon style={{ color: active ? 'var(--lime)' : 'currentColor' }} />
        Point &amp; fix
      </button>
    </div>
  )
}

function CrosshairIcon({ style }: { style?: React.CSSProperties }): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={style}>
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
                style={{
                  width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1.5px solid var(--frame)',
                  fontSize: 13, fontWeight: 900, color: 'var(--paper)', flexShrink: 0,
                  background: p.noteType === 'bug' ? 'var(--fail)' : 'var(--ink)',
                }}
              >
                {p.noteType === 'bug' ? '!' : '✎'}
              </span>
              {fixing && (
                <span style={{ position: 'absolute', left: 34, top: '50%', transform: 'translateY(-50%)', whiteSpace: 'nowrap', border: '1.5px solid var(--frame)', background: 'var(--needs-weak)', padding: '3px 7px', fontSize: 9, fontWeight: 900, letterSpacing: '.06em', color: 'var(--needs)' }}>
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
  const veilStyle: React.CSSProperties = { position: 'absolute', background: 'rgba(250,250,241,.88)' }
  return (
    <>
      <div style={{ ...veilStyle, left: 0, top: 0, right: 0, height: Math.max(0, y - 6) }} />
      <div style={{ ...veilStyle, left: 0, top: y + h + 6, right: 0, bottom: 0 }} />
      <div style={{ ...veilStyle, left: 0, top: Math.max(0, y - 6), width: Math.max(0, x - 6), height: h + 12 }} />
      <div style={{ ...veilStyle, left: x + w + 6, top: Math.max(0, y - 6), right: 0, height: h + 12 }} />
      <div
        style={{ position: 'absolute', border: '2px solid var(--fail-weak)', left: x - 10, top: y - 10, width: w + 20, height: h + 20 }}
      />
      <div
        style={{ position: 'absolute', border: '3px solid var(--fail)', left: x - 5, top: y - 5, width: w + 10, height: h + 10 }}
      />
    </>
  )
}

/** "Comment on this page" pill pinned to the bottom of the overlay (F44). */
function AffordanceStrip({ onPage }: { onPage: () => void }): React.JSX.Element {
  return (
    <div style={{ pointerEvents: 'auto', position: 'absolute', bottom: 16, left: '50%', zIndex: 30, transform: 'translateX(-50%)' }}>
      <button
        onClick={onPage}
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ink)', border: '2px solid var(--frame)', padding: '8px 16px 8px 8px', boxShadow: 'var(--hard)', cursor: 'pointer' }}
      >
        <span style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', background: 'var(--lime)', fontSize: 14, fontWeight: 900, color: 'var(--ink)', flexShrink: 0 }}>
          +
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--paper)' }}>Comment on this page</span>
        <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,.25)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>or point at any element</span>
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

/** Position the action popover next to the locked rect (right side when room, left otherwise). */
function popoverPosition(
  rect: BoundingBox,
  stage: { width: number; height: number },
): React.CSSProperties {
  const POP_W = 256
  const POP_H = 140
  const rightX = rect.x + rect.width + 12
  const leftX = rect.x - POP_W - 12
  const left = rightX + POP_W < stage.width ? rightX : Math.max(8, leftX)
  const top = Math.min(Math.max(8, rect.y), stage.height - POP_H - 8)
  return { left, top }
}

/** DOT-MATRIX dual-choice popover when a text element is selected. */
function ElementActionPopover({
  capture,
  projectId,
  onDescribeFix,
  onEditText,
  onCancel,
  isTextElement,
  previewLive,
}: {
  capture: LockedCapture
  projectId: string
  onDescribeFix: () => void
  onEditText: () => void
  onCancel: () => void
  isTextElement: boolean
  previewLive: boolean
}): React.JSX.Element {
  // Double-submit guard: block "Edit text here" if text-edit mode is already active.
  const isTextEditActive = usePointFix((s) => s.textEdit[projectId] !== null && s.textEdit[projectId] !== undefined)

  return (
    <div
      className="pointer-events-auto absolute z-50"
      style={{ width: 256, background: 'var(--surface-3)', border: '1.5px solid var(--frame)', padding: 8, boxShadow: 'var(--hard)' }}
    >
      <div style={{ padding: '8px 10px 10px', fontSize: 12.5, color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>
        You picked a piece of{' '}
        <b style={{ color: 'var(--ink-2)', fontWeight: 600 }}>
          {isTextElement ? 'text' : 'content'}
        </b>
        .
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
        {isTextElement && (
          <button
            onClick={onEditText}
            disabled={!previewLive || isTextEditActive}
            title={!previewLive ? 'Needs a running app' : isTextEditActive ? 'Text edit already active' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '10px 10px',
              background: 'var(--accent-weak)', cursor: previewLive && !isTextEditActive ? 'pointer' : 'not-allowed',
              border: 'none', width: '100%', textAlign: 'left',
              opacity: previewLive && !isTextEditActive ? 1 : 0.5,
            }}
          >
            <Icon n="text-aa" size={19} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Edit the text here</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Type the new words in place</span>
            </span>
          </button>
        )}
        <button
          onClick={onDescribeFix}
          style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '10px 10px',
            background: 'transparent', cursor: 'pointer',
            border: 'none', width: '100%', textAlign: 'left',
          }}
        >
          <span style={{ color: 'var(--ink-2)', fontSize: 19 }}><Icon n="chat-teardrop-text" size={19} /></span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Describe a fix</span>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Tell Helm what to change</span>
          </span>
        </button>
      </div>
      <button
        onClick={onCancel}
        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-3)' }}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  )
}

/** Pill shown when text-edit mode is armed, waiting for the user to click an element. */
function TextEditArmedPill({
  onCancel,
}: {
  onCancel: () => void
}): React.JSX.Element {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-3 border border-ink bg-ink px-4 py-2.5 shadow-[4px_4px_0_rgba(27,18,8,0.25)]">
        <span className="hm-chip hm-chip--accent" style={{ fontSize: 11 }}>
          <Icon n="text-aa" size={12} />
          Text edit · on
        </span>
        <span style={{ fontSize: 12, color: 'var(--paper)' }}>Click any text in your app to edit it</span>
        <button
          onClick={onCancel}
          className="hm-btn hm-btn--sm"
          style={{ background: 'var(--surface-3)', color: 'var(--ink)', marginLeft: 4 }}
        >
          <Icon n="x" size={12} />
          Done
        </button>
      </div>
    </div>
  )
}

/** Flash message after text-edit submit. */
function TextEditFlash({
  flash,
  onDismiss,
}: {
  flash: 'no_change' | 'reload' | 'error'
  onDismiss: () => void
}): React.JSX.Element {
  const msgs: Record<typeof flash, string> = {
    no_change: 'No change — the text was the same.',
    reload: 'The app reloaded — your edit wasn\'t saved, try again.',
    error: 'Something went wrong — try again.',
  }
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div
      className="pointer-events-auto absolute left-1/2 top-4 z-40 -translate-x-1/2"
      style={{
        background: flash === 'no_change' ? 'var(--surface-3)' : 'var(--fail-weak)',
        border: '1.5px solid var(--frame)',
        padding: '10px 18px',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: 'var(--hard)',
        whiteSpace: 'nowrap',
      }}
    >
      {msgs[flash]}
    </div>
  )
}

/** The full annotation layer; mounts inside the live stage's embed container. */
export function PointAnnotations({ projectId }: { projectId: string }): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const pointMode = usePointFix((s) => s.pointMode[projectId]) ?? FALSE_DEFAULT
  const capture = usePointFix((s) => s.capture[projectId]) ?? null
  const pageComment = usePointFix((s) => s.pageComment[projectId]) ?? FALSE_DEFAULT
  const justFiled = usePointFix((s) => s.justFiled[projectId]) ?? FALSE_DEFAULT
  const textEditState = usePointFix((s) => s.textEdit[projectId]) ?? null
  const exit = usePointFix((s) => s.exitPointMode)
  const lock = usePointFix((s) => s.lockCapture)
  const clear = usePointFix((s) => s.clearCapture)
  const openPage = usePointFix((s) => s.openPageComment)
  const register = usePointFix((s) => s.register)
  const loadPins = usePointFix((s) => s.loadPins)
  const enterTextEdit = usePointFix((s) => s.enterTextEdit)
  const exitTextEdit = usePointFix((s) => s.exitTextEdit)
  const commitTextEdit = usePointFix((s) => s.commitTextEdit)
  const clearTextEditFlash = usePointFix((s) => s.clearTextEditFlash)
  const previewState = usePreview((s) => s.states[projectId])
  const previewLive = previewState?.status === 'live'

  // Local UI state: whether the user has chosen "Describe a fix" from the dual-choice popover
  const [showCommentBox, setShowCommentBox] = useState(false)

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
      if (e.key === 'Escape') {
        if (textEditState) {
          exitTextEdit(projectId)
        } else {
          exit(projectId)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pointMode, projectId, exit, textEditState, exitTextEdit])

  // Listen for text-edit commit messages from the same-origin proxied iframe
  // (browser-proxy path). The HELM_PREVIEW_BRIDGE relay patch sends:
  // { type: 'helm:text-edit-commit', selector, oldText, newText }
  useEffect(() => {
    if (!textEditState || textEditState.phase !== 'armed') return
    const onMessage = (e: MessageEvent): void => {
      if (
        e.data &&
        typeof e.data === 'object' &&
        (e.data as Record<string, unknown>).type === 'helm:text-edit-commit'
      ) {
        const { selector, oldText, newText } = e.data as {
          type: string
          selector: string
          oldText: string
          newText: string
        }
        if (selector) void commitTextEdit(projectId, selector, oldText, newText)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [textEditState, projectId, commitTextEdit])

  // Reset showCommentBox when capture is cleared
  useEffect(() => {
    if (!capture) setShowCommentBox(false)
  }, [capture])

  const submit = (note: string, noteType: NoteType): void => {
    void register(projectId, note, noteType)
  }

  const handleDescribeFix = (): void => {
    setShowCommentBox(true)
  }

  const handleEditText = (): void => {
    clear(projectId) // close the popover
    void enterTextEdit(projectId)
  }

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <PinsLayer projectId={projectId} />

      {pointMode && !capture && !pageComment && !textEditState && (
        <AffordanceStrip onPage={() => openPage(projectId)} />
      )}

      {pointMode && isMock && !capture && !pageComment && !textEditState && (
        <SimulateClickPanel
          stageSize={stageSize}
          onPick={(c: LockedCapture) => lock(projectId, c)}
        />
      )}

      {/* Text-edit armed: show a pill, hide the normal capture UI */}
      {pointMode && textEditState && textEditState.phase === 'armed' && (
        <TextEditArmedPill onCancel={() => exitTextEdit(projectId)} />
      )}

      {/* Submitting indicator */}
      {pointMode && textEditState && textEditState.phase === 'submitting' && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
              background: 'var(--surface-3)', border: '1.5px solid var(--frame)',
              boxShadow: 'var(--hard)', fontSize: 13, fontWeight: 600,
            }}
          >
            <div className="hm-thinking"><i /><i /><i /></div>
            Applying edit…
          </div>
        </div>
      )}

      {/* Flash messages from text-edit */}
      {textEditState?.flash && (
        <TextEditFlash
          flash={textEditState.flash}
          onDismiss={() => clearTextEditFlash(projectId)}
        />
      )}

      {/* Capture with dual-choice popover (or just comment box after user chose "Describe a fix") */}
      {pointMode && capture && !textEditState && (
        <div className="pointer-events-auto absolute inset-0">
          <LockedRing rect={capture.boundingBox} />
          {!showCommentBox ? (
            <div
              className="absolute z-40"
              style={popoverPosition(capture.boundingBox, stageSize)}
            >
              <ElementActionPopover
                capture={capture}
                projectId={projectId}
                isTextElement={capture.isTextElement ?? false}
                previewLive={previewLive}
                onDescribeFix={handleDescribeFix}
                onEditText={handleEditText}
                onCancel={() => clear(projectId)}
              />
            </div>
          ) : (
            <div className="absolute z-40" style={boxPosition(capture.boundingBox, stageSize)}>
              <PointCommentBox
                variant="element"
                onSubmit={submit}
                onCancel={() => clear(projectId)}
              />
            </div>
          )}
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
        <div style={{ position: 'absolute', left: '50%', top: 16, zIndex: 40, transform: 'translateX(-50%)', background: 'var(--lime)', border: '1.5px solid var(--frame)', padding: '7px 16px', fontSize: 12, fontWeight: 700, color: 'var(--ink)', boxShadow: 'var(--hard)', whiteSpace: 'nowrap' }}>
          Sent to the board — find it under REPORTED
        </div>
      )}
    </div>
  )
}
