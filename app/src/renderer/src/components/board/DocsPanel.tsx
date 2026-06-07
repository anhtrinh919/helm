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
      <div className="grid flex-1 place-items-center">
        <p className="text-soft">{error}</p>
      </div>
    )
  }

  if (content === undefined) {
    return (
      <div className="grid flex-1 place-items-center">
        <p className="text-soft">Loading…</p>
      </div>
    )
  }

  if (content === null) {
    return (
      <div className="grid flex-1 place-items-center">
        <div className="max-w-sm rounded-[18px] brut-2 border-dashed bg-cream/60 px-8 py-7 text-center">
          <div className="font-display text-2xl font-black text-ink">No docs yet</div>
          <div className="mt-1.5 text-soft">
            When Claude builds your app, it can create a README in the project folder. It'll appear here.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <div className="font-display text-2xl font-black text-ink">Docs</div>
      <div className="rounded-[14px] brut-2 bg-cream px-6 py-5">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink">{content}</pre>
      </div>
    </div>
  )
}
