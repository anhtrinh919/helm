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

  it('ensureServer() brings the preview to live via the bridge', async () => {
    await usePreview.getState().ensureServer('p')
    expect(usePreview.getState().getPreviewState('p').status).toBe('live')
  })
})
