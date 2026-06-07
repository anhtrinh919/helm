import { useEffect, useState } from 'react'
import { isIpcError } from '@shared/ipc-schemas'
import type { DecisionEntry } from '@shared/ipc-schemas'
import { helm } from '../../bridge'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DecisionsPanel({ projectId }: { projectId: string }): React.JSX.Element {
  const [entries, setEntries] = useState<DecisionEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    helm.history.decisions(projectId).then((res) => {
      if (cancelled) return
      if (isIpcError(res)) {
        setError(res.message ?? 'Failed to load decisions')
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
          <div className="font-display text-2xl font-black text-ink">No decisions yet</div>
          <div className="mt-1.5 text-soft">
            When Claude asks you a question and you answer it, every call gets logged here.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <div className="font-display text-2xl font-black text-ink">Decisions Log</div>
      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <div key={e.id} className="rounded-[14px] brut-2 bg-cream px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black tracking-[0.12em] text-soft">
                  {e.cardTitle ?? e.sessionName}
                </div>
                <div className="mt-1 font-semibold text-ink">{e.question}</div>
                <div className="mt-2 rounded-lg bg-pinksoft/60 px-3 py-2 text-sm text-ink">
                  {e.answer}
                </div>
              </div>
              <div className="shrink-0 text-[11px] text-soft">{formatTime(e.answeredAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
