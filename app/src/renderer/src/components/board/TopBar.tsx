import { useEffect, useState } from 'react'
import type { Card } from '@shared/ipc-schemas'

function useElapsed(since: number | null): string {
  const [, tick] = useState(0)
  useEffect(() => {
    if (since === null) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [since])
  if (since === null) return ''
  const secs = Math.max(0, Math.floor((Date.now() - since) / 1000))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * The board's top bar: project name on the left, a live "what's building now"
 * banner + the user's avatar on the right. The banner only appears while a card
 * is actively building — it's the at-a-glance heartbeat of the dashboard.
 */
export function TopBar({
  projectName,
  building,
}: {
  projectName: string
  building: Card | null
}): React.JSX.Element {
  const elapsed = useElapsed(building ? building.updatedAt : null)

  return (
    <div className="flex items-center justify-between">
      <div className="font-display text-3xl font-black leading-none text-ink">{projectName}</div>

      <div className="flex items-center gap-3">
        {building && (
          <div className="flex items-center gap-2.5 rounded-full brut-2 bg-cream px-3.5 py-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime" />
            <span className="text-sm font-semibold text-ink">Building {building.title}</span>
            <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-xs font-bold text-cream">
              {elapsed}
            </span>
          </div>
        )}
        <div className="grid h-11 w-11 place-items-center rounded-full brut bg-violet font-display text-lg font-black text-cream">
          T
        </div>
      </div>
    </div>
  )
}
