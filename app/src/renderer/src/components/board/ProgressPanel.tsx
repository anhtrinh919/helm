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

const STATUS_PILL: Record<string, string> = {
  complete: 'bg-mint text-ink',
  failed: 'bg-orange text-ink',
  running: 'bg-lime text-ink',
}
const STATUS_LABEL: Record<string, string> = {
  complete: 'BUILT',
  failed: 'FAILED',
  running: 'BUILDING',
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
      <div className="grid flex-1 place-items-center">
        <p className="text-soft">{error}</p>
      </div>
    )
  }

  if (entries === null) {
    return (
      <div className="grid flex-1 place-items-center">
        <p className="text-soft">Loading…</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="grid flex-1 place-items-center">
        <div className="max-w-sm rounded-[18px] brut-2 border-dashed bg-cream/60 px-8 py-7 text-center">
          <div className="font-display text-2xl font-black text-ink">Nothing built yet</div>
          <div className="mt-1.5 text-soft">
            Each time Claude builds something for your project, it shows up here as a timeline entry.
          </div>
        </div>
      </div>
    )
  }

  const reversed = [...entries].reverse()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <div className="font-display text-2xl font-black text-ink">Progress Timeline</div>
      <div className="flex flex-col gap-3">
        {reversed.map((e) => {
          const pill = STATUS_PILL[e.status] ?? 'bg-cream text-soft'
          const label = STATUS_LABEL[e.status] ?? e.status
          return (
            <div key={e.id} className="flex items-start gap-4 rounded-[14px] brut-2 bg-cream px-5 py-4">
              <div className="mt-0.5 shrink-0">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide ${pill}`}>
                  {label}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink">{e.cardTitle}</div>
                {e.cardStepLabel && (
                  <div className="text-[11px] text-soft">{e.cardStepLabel}</div>
                )}
                <div className="mt-1 text-[11px] text-soft">
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
