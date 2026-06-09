import { createElement, useEffect, useRef, useState } from 'react'
import { Icon } from '../ui/Icon'
import type { PreviewState } from '@shared/ipc-schemas'
import { isMock } from '../../bridge'
import { usePreview } from '../../store/preview'
import { PointAnnotations } from './PointModeOverlay'

const NONE: PreviewState = { status: 'none' }

/**
 * DOT-MATRIX live preview panel — the `.hm-preview` chrome with a URL pill,
 * live dot, refresh/pop-out controls, and calm in-between states.
 * Building/snag keep the last-good app underneath dimmed.
 */
export function LivePreviewPane({ projectId }: { projectId: string }): React.JSX.Element {
  const state = usePreview((s) => s.states[projectId]) ?? NONE
  const load = usePreview((s) => s.load)
  const ensureServer = usePreview((s) => s.ensureServer)
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    setLoadFailed(false)
    void load(projectId).then(() => ensureServer(projectId))
  }, [projectId, load, ensureServer])

  useEffect(() => {
    if (state.status === 'live') setLastUrl(state.url)
  }, [state])

  const isLive = state.status === 'live' && !loadFailed
  const overlayStatus: 'none' | 'building' | 'snag' | 'blocked' =
    loadFailed || state.status === 'live' ? 'snag' : state.status
  const hasUnderlay = (overlayStatus === 'building' || overlayStatus === 'snag') && !!lastUrl

  const displayUrl =
    isLive && state.status === 'live'
      ? (state.url.replace(/^https?:\/\//, ''))
      : (lastUrl ? lastUrl.replace(/^https?:\/\//, '') : 'localhost')

  return (
    <div className="hm-preview" style={{ flex: 1, minHeight: 0 }}>
      {/* Address bar */}
      <div className="hm-preview__bar">
        {isLive ? (
          <span className="hm-dot hm-dot--live" />
        ) : (
          <span className="hm-dot hm-dot--idle" />
        )}
        <div className="hm-urlpill" style={{ flex: 1 }}>
          <Icon n="lock-simple" size={12} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: isLive ? 1 : 0.45,
            }}
          >
            {displayUrl}
          </span>
          {!isLive && overlayStatus !== 'none' && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                fontWeight: 700,
                color: overlayStatus === 'building' ? 'var(--accent-text)' : 'var(--fail)',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {overlayStatus === 'building' ? 'Building…' : 'Not running'}
            </span>
          )}
        </div>
        <button className="hm-btn hm-btn--sm hm-btn--quiet">
          <Icon n="arrow-clockwise" />
        </button>
        <button className="hm-btn hm-btn--sm hm-btn--quiet">
          <Icon n="arrow-square-out" />
        </button>
      </div>

      {/* Stage */}
      <div className="hm-preview__stage" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {isLive && state.status === 'live' ? (
          <div className="hm-preview__frame" style={{ flex: 1, position: 'relative' }}>
            <LiveEmbed url={state.url} projectId={projectId} onFail={() => setLoadFailed(true)} />
          </div>
        ) : (
          <div className="hm-preview__frame" style={{ flex: 1, position: 'relative' }}>
            {hasUnderlay && <Embed url={lastUrl!} muted projectId={projectId} />}
            <PreviewOverlay status={overlayStatus} veiled={hasUnderlay} />
          </div>
        )}
      </div>

      {/* Point-and-fix hint when live */}
      {isLive && (
        <div style={{ padding: '0 18px 18px', display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--ink-2)',
              background: 'var(--surface-3)',
              border: '1.5px solid var(--frame)',
              padding: '8px 14px',
            }}
          >
            <Icon n="cursor-click" size={14} />
            Click any part of your app to change it
          </span>
        </div>
      )}
    </div>
  )
}

function Embed({
  url,
  muted,
  onFail,
  projectId,
}: {
  url: string
  muted?: boolean
  onFail?: () => void
  projectId: string
}): React.JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const className = `absolute inset-0 h-full w-full border-0 ${muted ? 'pointer-events-none' : ''}`
  const style = muted ? { display: 'flex', opacity: 0.4, filter: 'saturate(0.7)' } : { display: 'flex' }

  useEffect(() => {
    const el = ref.current
    if (!el || !onFail) return
    const handler = (): void => onFail()
    el.addEventListener('did-fail-load', handler)
    el.addEventListener('error', handler)
    return () => {
      el.removeEventListener('did-fail-load', handler)
      el.removeEventListener('error', handler)
    }
  }, [onFail, url])

  // Electron shell: a <webview> guest the core injects capture/edit into.
  // Plain browser (hybrid dogfood): the <webview> tag renders nothing, so load
  // the running app through the core's same-origin preview proxy instead, which
  // serves it under /preview/<projectId>/ with the capture/edit bridge injected.
  const isElectron =
    typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)

  if (isMock || !isElectron) {
    const src = isMock ? url : `/preview/${projectId}/`
    return (
      <iframe
        ref={ref as React.RefObject<HTMLIFrameElement>}
        src={src}
        title="Live preview"
        className={className}
        style={style}
      />
    )
  }
  return createElement('webview', { ref, src: url, class: className, style })
}

// Wrap Embed + PointAnnotations only when live (avoids importing PointAnnotations
// in the muted path — keeps the component focused)
function LiveEmbed({
  url,
  projectId,
  onFail,
}: {
  url: string
  projectId: string
  onFail: () => void
}): React.JSX.Element {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Embed url={url} onFail={onFail} projectId={projectId} />
      <PointAnnotations projectId={projectId} />
    </div>
  )
}

const OVERLAY_COPY: Record<
  'none' | 'building' | 'snag' | 'blocked',
  { title: string; body: string }
> = {
  none: {
    title: 'Your app will appear here once the first step builds something.',
    body: "The moment there's something runnable, it shows up right here — ready to click around.",
  },
  building: {
    title: 'Building…',
    body: "The current version stays underneath — it'll swap in the moment the next one is ready.",
  },
  snag: {
    title: 'Not running',
    body: "The app isn't running right now. It will come back when the next build step completes.",
  },
  blocked: {
    title: 'Waiting on your answer',
    body: 'A question is waiting on the board. Answer it to continue the build.',
  },
}

function PreviewOverlay({
  status,
  veiled,
}: {
  status: 'none' | 'building' | 'snag' | 'blocked'
  veiled: boolean
}): React.JSX.Element {
  const c = OVERLAY_COPY[status]
  const busy = status === 'building'
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: veiled ? 'rgba(250,250,241,.88)' : 'transparent',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'var(--surface-3)',
          border: '1.5px solid var(--frame)',
          borderRadius: 0,
          padding: '28px 30px',
          maxWidth: 360,
          textAlign: 'center',
          boxShadow: veiled ? 'none' : 'var(--hard)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{c.title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>{c.body}</div>
        {busy && (
          <div className="hm-buildbar" style={{ marginTop: 16 }}><i /></div>
        )}
      </div>
    </div>
  )
}
