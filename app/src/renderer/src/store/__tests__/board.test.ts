import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { Card } from '@shared/ipc-schemas'

/** Group 6 — board store handles fix_comment cards and the waiting status. */

vi.mock('../../bridge', () => ({
  helm: {
    projects: { get: async () => ({ project: { name: 'P' }, cards: [] }) },
    cards: { create: async () => ({ card: null }) },
  },
  isMock: true,
}))

import { useBoard } from '../board'

const card = (over: Partial<Card>): Card => ({
  id: 'c1',
  projectId: 'p1',
  type: 'fix_comment',
  title: 'this button is the wrong colour',
  status: 'waiting',
  source: 'user_added',
  position: 0,
  stepLabel: null,
  dependsOn: [],
  createdAt: 1,
  updatedAt: 1,
  sessionId: null,
  decisionPrompt: null,
  checkpoint: null,
  ...over,
})

beforeEach(() => {
  useBoard.setState({ projectId: 'p1', projectName: 'P', cards: [], loading: false })
})

describe('board store — fix-comment cards', () => {
  it('applyUpdate inserts a waiting fix_comment card', () => {
    useBoard.getState().applyUpdate(card({}))
    const c = useBoard.getState().cards[0]!
    expect(c.type).toBe('fix_comment')
    expect(c.status).toBe('waiting')
  })

  it('applyUpdate moves the card through the fix lifecycle', () => {
    useBoard.getState().applyUpdate(card({}))
    useBoard.getState().applyUpdate(card({ status: 'building', sessionId: 's1' }))
    expect(useBoard.getState().cards[0]!.status).toBe('building')
    useBoard.getState().applyUpdate(card({ status: 'done', sessionId: 's1' }))
    expect(useBoard.getState().cards[0]!.status).toBe('done')
    expect(useBoard.getState().cards).toHaveLength(1)
  })

  it('fix cards sort by position alongside build cards', () => {
    useBoard.getState().applyUpdate(card({ id: 'b', type: 'feature', status: 'planned', position: 1 }))
    useBoard.getState().applyUpdate(card({ id: 'a', position: 0 }))
    expect(useBoard.getState().cards.map((c) => c.id)).toEqual(['a', 'b'])
  })
})
