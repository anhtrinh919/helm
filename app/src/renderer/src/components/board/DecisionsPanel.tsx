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
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>No decisions yet</div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            When Claude asks you a question and you answer it, every call gets logged here.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', paddingRight: 4 }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Decisions Log</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map((e) => (
          <div key={e.id} style={{ border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hm-eyebrow" style={{ marginBottom: 6 }}>
                  {e.cardTitle ?? e.sessionName}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>{e.question}</div>
                <div style={{ marginTop: 8, background: 'var(--needs-weak)', border: '1.5px solid var(--frame)', padding: '8px 12px', fontSize: 13, color: 'var(--ink)' }}>
                  {e.answer}
                </div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{formatTime(e.answeredAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
