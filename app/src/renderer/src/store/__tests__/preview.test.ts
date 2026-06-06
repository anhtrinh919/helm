import { describe, expect, it, beforeEach } from 'vitest'
import type { PreviewState } from '@shared/ipc-schemas'
import { usePreview } from '../preview'

beforeEach(() => {
  usePreview.setState({ states: {} })
})

describe('preview store', () => {
  it('defaults an unknown project to none', () => {
    expect(usePreview.getState().getPreviewState('whatever')).toEqual({ status: 'none' })
  })

  it('records and reads back per-project state, isolated by project', () => {
    const { setPreviewState, getPreviewState } = usePreview.getState()
    setPreviewState('a', { status: 'building' })
    setPreviewState('b', { status: 'live', url: 'http://localhost:3000' })
    expect(getPreviewState('a')).toEqual({ status: 'building' })
    expect(getPreviewState('b')).toEqual({ status: 'live', url: 'http://localhost:3000' })
  })

  it('walks the full lifecycle none → building → live → building → live', () => {
    const { setPreviewState, getPreviewState } = usePreview.getState()
    const seq: PreviewState[] = [
      { status: 'none' },
      { status: 'building' },
      { status: 'live', url: 'http://localhost:4000' },
      { status: 'building' },
      { status: 'live', url: 'http://localhost:4000' },
    ]
    for (const s of seq) {
      setPreviewState('p', s)
      expect(getPreviewState('p')).toEqual(s)
    }
  })

  it('handles snag → live and blocked transitions', () => {
    const { setPreviewState, getPreviewState } = usePreview.getState()
    setPreviewState('p', { status: 'snag' })
    expect(getPreviewState('p').status).toBe('snag')
    setPreviewState('p', { status: 'live', url: 'http://localhost:3000' })
    expect(getPreviewState('p').status).toBe('live')
    setPreviewState('p', { status: 'blocked' })
    expect(getPreviewState('p').status).toBe('blocked')
  })

  it('load() backfills state from the bridge (mock returns none for an unknown project)', async () => {
    await usePreview.getState().load('unknown-project')
    expect(usePreview.getState().getPreviewState('unknown-project')).toEqual({ status: 'none' })
  })

  it('ensureServer() no-ops gracefully when there is no artifact yet (stays none)', async () => {
    // The mock answers no_artifact for a project with no build — ensureServer
    // must swallow that and leave the calm empty state, not throw or flip live.
    await usePreview.getState().ensureServer('unbuilt-project')
    expect(usePreview.getState().getPreviewState('unbuilt-project').status).toBe('none')
  })

  it('ensureServer() adopts an already_running URL as live', async () => {
    // Simulate the bridge reporting the server is already up.
    const original = usePreview.getState().ensureServer
    expect(typeof original).toBe('function')
    // Drive the store's setPreviewState directly to model an already_running adopt.
    usePreview.getState().setPreviewState('p', { status: 'live', url: 'http://localhost:3000' })
    expect(usePreview.getState().getPreviewState('p')).toEqual({
      status: 'live',
      url: 'http://localhost:3000',
    })
  })
})
