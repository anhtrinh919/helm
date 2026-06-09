import { useEffect, useState } from 'react'
import { isIpcError } from '@shared/ipc-schemas'
import type { ProgressEntry } from '@shared/ipc-schemas'
import { helm } from '../../bridge'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function duration(start: number, end: number | null): string {
  if (!end) return 'in progress'
  const s = Math.round((end - start) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r > 0 ? `${m}m ${r}s` : `${m}m`
}

type StatusKey = 'complete' | 'failed' | 'running'

const STATUS_CHIP: Record<StatusKey, string> = {
  complete: 'hm-chip--success',
  failed:   'hm-chip--fail',
  running:  'hm-chip--accent',
}
const STATUS_LABEL: Record<StatusKey, string> = {
  complete: 'BUILT',
  failed:   'FAILED',
  running:  'BUILDING',
}

export function ProgressPanel({ projectId }: { projectId: string }): React.JSX.Element {
  const [entries, setEntries] = useState<ProgressEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    helm.history.progress(projectId).then((res) => {
      if (cancelled) return
      if (isIpcError(res)) {
        setError(res.message ?? 'Failed to load progress')
      } else {
        setEntries(res.entries)
      }
    })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (error) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>{error}</p>
      </div>
    )
  }

  if (entries === null) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>Loading…</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div style={{ maxWidth: 340, border: '1.5px dashed var(--hair)', background: 'var(--surface-2)', padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Nothing built yet</div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Each time Claude builds something for your project, it shows up here as a timeline entry.
          </div>
        </div>
      </div>
    )
  }

  const reversed = [...entries].reverse()

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', paddingRight: 4 }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Progress Timeline</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reversed.map((e) => {
          const chipCls = STATUS_CHIP[e.status as StatusKey] ?? ''
          const label = STATUS_LABEL[e.status as StatusKey] ?? e.status
          return (
            <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: '12px 16px' }}>
              <div style={{ flexShrink: 0, paddingTop: 2 }}>
                <span className={`hm-chip ${chipCls}`}>{label}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{e.cardTitle}</div>
                {e.cardStepLabel && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{e.cardStepLabel}</div>
                )}
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
                  {formatDate(e.startedAt)} · {duration(e.startedAt, e.completedAt)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
