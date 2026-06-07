import { createElement, useEffect, useRef, useState } from 'react'
import type { PreviewState } from '@shared/ipc-schemas'
import { isMock } from '../../bridge'
import { usePreview } from '../../store/preview'
import { PointAnnotations } from './PointModeOverlay'

/** Stable default so the zustand selector never returns a fresh object (which
 *  would re-render every tick and blank the tree). */
const NONE: PreviewState = { status: 'none' }

/**
 * The Live Preview tab (formerly the F29 stub). Renders the project's running
 * app embedded in the Helm window, with calm in-between states. Frames F30–F35.
 *
 * The running app sits in a neutral "stage" with macOS-style window dots and NO
 * browser chrome — no address bar, no URL, no devtools. During building / snag
 * the last-good app stays underneath a calm cream veil so it never blanks out.
 * The live stage is kept a clean canvas: Phase 3's point-and-fix layer lands here.
 */
export function LivePreviewPane({ projectId }: { projectId: string }): React.JSX.Element {
  const state = usePreview((s) => s.states[projectId]) ?? NONE
  const load = usePreview((s) => s.load)
  const ensureServer = usePreview((s) => s.ensureServer)
  // Remember the last URL we saw live, so building/snag can keep it underneath.
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  // A webview that fails to load shows the calm snag veil, not a raw error page.
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    setLoadFailed(false)
    // Backfill state, then idempotently ask the dev server to come up. If the
    // project has no artifact yet the main process answers no_artifact and we
    // stay on the calm empty state — opening the tab is the user's start signal.
    void load(projectId).then(() => ensureServer(projectId))
  }, [projectId, load, ensureServer])

  useEffect(() => {
    if (state.status === 'live') setLastUrl(state.url)
  }, [state])

  if (state.status === 'live' && !loadFailed) {
    return <LiveStage url={state.url} projectId={projectId} onFail={() => setLoadFailed(true)} />
  }

  // none / building / snag / blocked (or a failed embed) → a calm centered panel.
  // building & snag keep the last-good app dimmed underneath when we have one.
  // (state.status === 'live' only reaches here when loadFailed, → snag.)
  const status: 'none' | 'building' | 'snag' | 'blocked' =
    loadFailed || state.status === 'live' ? 'snag' : state.status
  const underlay = (status === 'building' || status === 'snag') && lastUrl
  return (
    <div className="relative grid flex-1 place-items-center overflow-hidden rounded-[18px] bg-stage brut-2">
      {underlay && <Embed url={lastUrl} muted />}
      <Overlay status={status} veiled={!!underlay} />
    </div>
  )
}

/** The running app, full-bleed in a chrome-less stage (window dots only).
 *  The point-and-fix annotation layer (pins, rings, comment box) sits over the
 *  embed — pointer-transparent so the embedded app still feels the cursor. */
function LiveStage({
  url,
  projectId,
  onFail,
}: {
  url: string
  projectId: string
  onFail: () => void
}): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[18px] bg-stage brut-2">
      <div className="flex items-center gap-2 border-b-2 border-ink/10 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full" style={{ background: '#FF5F57' }} />
        <span className="h-3 w-3 rounded-full" style={{ background: '#FFBD2E' }} />
        <span className="h-3 w-3 rounded-full" style={{ background: '#28C940' }} />
        <span className="ml-2 text-[11px] font-bold tracking-wide text-soft">
          Your app · live — yours to try
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <Embed url={url} onFail={onFail} />
        <PointAnnotations projectId={projectId} />
      </div>
    </div>
  )
}

/** Picks the embed element: a real <webview> in Electron, an <iframe> in the
 *  browser mock (which has no webview tag). Both just render a URL. A load
 *  failure calls `onFail` so the pane shows the calm snag veil, not a raw error. */
function Embed({
  url,
  muted,
  onFail,
}: {
  url: string
  muted?: boolean
  onFail?: () => void
}): React.JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const className = `absolute inset-0 h-full w-full border-0 ${muted ? 'pointer-events-none opacity-40' : ''}`

  useEffect(() => {
    const el = ref.current
    if (!el || !onFail) return
    // Electron <webview> emits `did-fail-load`; the <iframe> mock emits `error`.
    const handler = (): void => onFail()
    el.addEventListener('did-fail-load', handler)
    el.addEventListener('error', handler)
    return () => {
      el.removeEventListener('did-fail-load', handler)
      el.removeEventListener('error', handler)
    }
  }, [onFail, url])

  if (isMock) {
    return <iframe ref={ref as React.RefObject<HTMLIFrameElement>} src={url} title="Live preview" className={className} />
  }
  // <webview> is an Electron intrinsic element not in React's JSX types.
  return createElement('webview', { ref, src: url, class: className, style: { display: 'flex' } })
}

const COPY: Record<
  'none' | 'building' | 'snag' | 'blocked',
  { eyebrow?: string; title: string; body: string; tone: string }
> = {
  none: {
    title: 'Your app will appear here as it’s built.',
    body: 'The moment there’s something runnable, it shows up right here — ready to click around.',
    tone: 'text-soft',
  },
  building: {
    eyebrow: 'BUILDING',
    title: 'Building the next piece…',
    body: 'The current version is still here underneath — it’ll swap in the moment the new one is ready.',
    tone: 'text-blue',
  },
  snag: {
    eyebrow: 'FIXING A SNAG',
    title: 'The agent caught something — it’s handling it.',
    body: 'A small hitch, nothing for you to do. Your app stays up while it sorts itself out.',
    tone: 'text-orange',
  },
  blocked: {
    eyebrow: 'PAUSED — NEEDS YOU',
    title: 'A question is waiting on the board.',
    body: 'The agent reached a fork it can’t pick on its own. Find it pinned on the build spine.',
    tone: 'text-pink',
  },
}

function Overlay({
  status,
  veiled,
}: {
  status: 'none' | 'building' | 'snag' | 'blocked'
  veiled: boolean
}): React.JSX.Element {
  const c = COPY[status]
  const busy = status === 'building' || status === 'snag'
  return (
    <div
      className={`relative z-10 mx-6 max-w-md rounded-[18px] brut-2 px-8 py-7 text-center ${
        veiled ? 'bg-canvas/90 backdrop-blur-sm' : 'bg-cream/70 border-dashed'
      }`}
    >
      {c.eyebrow && (
        <span className={`text-[11px] font-black tracking-[0.16em] ${c.tone}`}>{c.eyebrow}</span>
      )}
      <div className="mt-2 font-display text-2xl font-black text-ink">{c.title}</div>
      <div className="mt-1.5 text-sm text-soft">{c.body}</div>
      {busy && (
        <div className="mx-auto mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full w-1/3 animate-[helmslide_1.4s_ease-in-out_infinite] rounded-full bg-ink/40" />
        </div>
      )}
    </div>
  )
}
