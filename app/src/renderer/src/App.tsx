import { useEffect, useState } from 'react'
import type { FeedEvent } from '../../shared/ipc-schemas'

/**
 * Group 1 renderer stub: a single button that starts a live SDK session and
 * lists the streamed feed events. Proves the full SDK → main → IPC → renderer
 * path in-app. Real UI begins in Group 3.
 */
export default function App(): React.JSX.Element {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => window.helm.onFeedEvent((push) => setEvents((prev) => [...prev, push.event])), [])

  const start = async (): Promise<void> => {
    setRunning(true)
    setEvents([])
    await window.helm.startProbe('Reply with exactly: Hello from Helm. Do not use any tools.')
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32, color: '#1B1208' }}>
      <h1 style={{ margin: '0 0 16px' }}>Helm — engine plumbing</h1>
      <button
        onClick={() => void start()}
        disabled={running}
        style={{ padding: '10px 18px', fontSize: 16, cursor: 'pointer' }}
      >
        Start a live session
      </button>
      <ul style={{ marginTop: 24, lineHeight: 1.6 }}>
        {events.map((e) => (
          <li key={e.id}>
            <strong>{e.kind}</strong>: {e.text}
          </li>
        ))}
      </ul>
    </main>
  )
}
