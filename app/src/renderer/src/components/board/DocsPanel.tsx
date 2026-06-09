import { useEffect, useState } from 'react'
import { isIpcError } from '@shared/ipc-schemas'
import { helm } from '../../bridge'

export function DocsPanel({ projectId }: { projectId: string }): React.JSX.Element {
  const [content, setContent] = useState<string | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    helm.history.docs(projectId).then((res) => {
      if (cancelled) return
      if (isIpcError(res)) {
        setError(res.message ?? 'Failed to load docs')
      } else {
        setContent(res.content)
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

  if (content === undefined) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>Loading…</p>
      </div>
    )
  }

  if (content === null) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div style={{ maxWidth: 340, border: '1.5px dashed var(--hair)', background: 'var(--surface-2)', padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>No docs yet</div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            When Claude builds your app, it can create a README in the project folder. It'll appear here.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', paddingRight: 4 }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Docs</div>
      <div style={{ border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: '18px 22px' }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.6, color: 'var(--ink)' }}>{content}</pre>
      </div>
    </div>
  )
}
