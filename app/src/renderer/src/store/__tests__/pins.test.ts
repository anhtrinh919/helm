import { describe, expect, it, beforeEach, vi } from 'vitest'

/**
 * Group 5 — point-fix store: pin sync, point-mode lifecycle, capture lock,
 * and the register flow (close box + exit point mode + brief flash).
 */

const { bridge, pushes } = vi.hoisted(() => {
  const pushes = {
    pins: new Set<(p: unknown) => void>(),
    capture: new Set<(p: unknown) => void>(),
  }
  const bridge = {
    activated: [] as string[],
    deactivated: [] as string[],
    registered: [] as unknown[],
    registerResult: { card: { id: 'card-1' } } as unknown,
    points: {
      register: async (req: unknown) => {
        bridge.registered.push(req)
        return bridge.registerResult
      },
      list: async () => ({
        pins: [{ cardId: 'c1', pinX: 0.5, pinY: 0.5, noteType: 'bug' }],
        queuedCardIds: ['c9'],
      }),
      activate: async (projectId: string) => {
        bridge.activated.push(projectId)
        return { ok: true }
      },
      deactivate: async (projectId: string) => {
        bridge.deactivated.push(projectId)
        return { ok: true }
      },
    },
    events: {
      onPinsUpdate: (cb: (p: unknown) => void) => {
        pushes.pins.add(cb)
        return () => pushes.pins.delete(cb)
      },
      onPointCapture: (cb: (p: unknown) => void) => {
        pushes.capture.add(cb)
        return () => pushes.capture.delete(cb)
      },
    },
  }
  return { bridge, pushes }
})

vi.mock('../../bridge', () => ({ helm: bridge, isMock: true }))

import { usePointFix, NO_PINS } from '../pins'

const RECT = { x: 10, y: 20, width: 100, height: 40 }

beforeEach(() => {
  usePointFix.setState({ pins: {}, queued: {}, pointMode: {}, capture: {}, pageComment: {}, justFiled: {} })
  bridge.activated.length = 0
  bridge.deactivated.length = 0
  bridge.registered.length = 0
  bridge.registerResult = { card: { id: 'card-1' } }
})

describe('point-fix store', () => {
  it('loadPins fills the per-project pin list + queue membership', async () => {
    await usePointFix.getState().loadPins('p1')
    expect(usePointFix.getState().pins['p1']).toHaveLength(1)
    expect(usePointFix.getState().queued['p1']).toEqual(['c9'])
    expect(usePointFix.getState().pins['p2'] ?? NO_PINS).toBe(NO_PINS)
  })

  it('pins push updates the store (pins + queue)', () => {
    const off = usePointFix.getState().subscribe()
    pushes.pins.forEach((cb) => cb({ projectId: 'p1', pins: [], queuedCardIds: ['c2'] }))
    expect(usePointFix.getState().pins['p1']).toEqual([])
    expect(usePointFix.getState().queued['p1']).toEqual(['c2'])
    off()
  })

  it('enter/exit point mode drives main-process activation', () => {
    usePointFix.getState().enterPointMode('p1')
    expect(usePointFix.getState().pointMode['p1']).toBe(true)
    expect(bridge.activated).toEqual(['p1'])
    usePointFix.getState().exitPointMode('p1')
    expect(usePointFix.getState().pointMode['p1']).toBe(false)
    expect(bridge.deactivated).toEqual(['p1'])
  })

  it('a captured push locks the selection; an exit push leaves point mode', () => {
    const off = usePointFix.getState().subscribe()
    usePointFix.getState().enterPointMode('p1')
    pushes.capture.forEach((cb) =>
      cb({ kind: 'captured', projectId: 'p1', boundingBox: RECT, pinX: 0.4, pinY: 0.6 }),
    )
    expect(usePointFix.getState().capture['p1']).toMatchObject({ pinX: 0.4, pinY: 0.6 })
    pushes.capture.forEach((cb) => cb({ kind: 'exit', projectId: 'p1' }))
    expect(usePointFix.getState().pointMode['p1']).toBe(false)
    expect(usePointFix.getState().capture['p1']).toBeNull()
    off()
  })

  it('page comment closes any locked capture (one box at a time)', () => {
    usePointFix.getState().lockCapture('p1', { boundingBox: RECT, pinX: 0.4, pinY: 0.6 })
    usePointFix.getState().openPageComment('p1')
    expect(usePointFix.getState().capture['p1']).toBeNull()
    expect(usePointFix.getState().pageComment['p1']).toBe(true)
  })

  it('register sends GEOMETRY ONLY, exits point mode, flashes success', async () => {
    usePointFix.getState().enterPointMode('p1')
    usePointFix.getState().lockCapture('p1', { boundingBox: RECT, pinX: 0.4, pinY: 0.6 })
    const ok = await usePointFix.getState().register('p1', 'Broken thing', 'bug')
    expect(ok).toBe(true)
    expect(bridge.registered[0]).toMatchObject({
      projectId: 'p1',
      note: 'Broken thing',
      noteType: 'bug',
      pinX: 0.4,
    })
    // The privacy invariant, structurally: no selector/screenshot in the request.
    expect(JSON.stringify(bridge.registered[0])).not.toContain('selector')
    expect(JSON.stringify(bridge.registered[0])).not.toContain('screenshot')
    expect(usePointFix.getState().pointMode['p1']).toBe(false)
    expect(usePointFix.getState().justFiled['p1']).toBe(true)
  })

  it('a page-level register sends no geometry', async () => {
    usePointFix.getState().enterPointMode('p1')
    usePointFix.getState().openPageComment('p1')
    await usePointFix.getState().register('p1', 'Page feels cramped', 'change')
    const req = bridge.registered[0] as Record<string, unknown>
    expect(req.pinX).toBeUndefined()
    expect(req.boundingBox).toBeUndefined()
  })

  it('a failed register keeps the box open (no exit, no flash)', async () => {
    bridge.registerResult = { error: 'preview_not_live' }
    usePointFix.getState().enterPointMode('p1')
    usePointFix.getState().lockCapture('p1', { boundingBox: RECT, pinX: 0.4, pinY: 0.6 })
    const ok = await usePointFix.getState().register('p1', 'x', 'bug')
    expect(ok).toBe(false)
    expect(usePointFix.getState().pointMode['p1']).toBe(true)
    expect(usePointFix.getState().capture['p1']).not.toBeNull()
  })
})
