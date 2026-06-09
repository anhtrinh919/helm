import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { Card, FeedEvent } from '@shared/ipc-schemas'

/**
 * Group 7 — fix-session checkpoint semantics in the feed store: rejecting a fix
 * must NOT spawn a new build session (main resumes the same one), and a
 * checkpoint stops meaning 'done' once the retry's narration follows it.
 */

const { bridge } = vi.hoisted(() => {
  const bridge = {
    approveCalls: [] as unknown[],
    startCalls: [] as unknown[],
    approveResult: null as unknown,
    cards: {
      approveCheckpoint: async (cardId: string, verdict: string, note?: string) => {
        bridge.approveCalls.push({ cardId, verdict, note })
        return bridge.approveResult
      },
    },
    sessions: {
      start: async (projectId: string, cardId: string) => {
        bridge.startCalls.push({ projectId, cardId })
        return { session: { id: 's-new' } }
      },
      getQuestions: async () => ({ questions: [] }),
    },
    projects: { get: async () => ({ project: { name: 'P' }, cards: [] }) },
    getFeed: async () => ({ events: [] }),
  }
  return { bridge }
})
vi.mock('../../bridge', () => ({ helm: bridge, isMock: true }))

import { useFeed } from '../feed'

const fixCard = (over: Partial<Card> = {}): Card => ({
  id: 'c1',
  projectId: 'p1',
  type: 'fix_comment',
  title: 'wrong colour',
  status: 'building',
  source: 'user_added',
  position: 0,
  stepLabel: null,
  dependsOn: [],
  createdAt: 1,
  updatedAt: 1,
  sessionId: 's1',
  decisionPrompt: null,
  checkpoint: { status: 'pending' },
  outcome: null,
  ...over,
})

const ev = (kind: FeedEvent['kind'], id: string): FeedEvent => ({
  id,
  sessionId: 's1',
  kind,
  text: 'x',
  refId: null,
  createdAt: Number(id.replace(/\D/g, '') || 1),
})

beforeEach(() => {
  bridge.approveCalls.length = 0
  bridge.startCalls.length = 0
  useFeed.setState({
    projectId: 'p1',
    card: fixCard(),
    session: { id: 's1' } as never,
    status: 'done',
    events: [ev('narration', 'e1'), ev('checkpoint', 'e2')],
    questions: [],
  })
})

describe('fix-session checkpoint in the feed store', () => {
  it('rejecting a fix does NOT start a new session — the same feed goes active', async () => {
    bridge.approveResult = { card: fixCard({ checkpoint: { status: 'flagged', flagNote: 'still wrong' } }) }
    await useFeed.getState().approveCheckpoint('flagged', 'still wrong')
    expect(bridge.approveCalls).toHaveLength(1)
    expect(bridge.startCalls).toHaveLength(0) // ← the duplicate-session trap
    expect(useFeed.getState().status).toBe('active')
  })

  it('rejecting a regular build card still retries via a new session', async () => {
    useFeed.setState({ card: fixCard({ type: 'feature', stepLabel: 'Step 1 of 3: X' }) })
    bridge.approveResult = { card: fixCard({ type: 'feature' }) }
    await useFeed.getState().approveCheckpoint('flagged', 'redo')
    expect(bridge.startCalls).toHaveLength(1)
  })

  it('a checkpoint followed by retry narration no longer reads as done', () => {
    const { appendEvent } = useFeed.getState()
    appendEvent(ev('steering', 'e3'))
    appendEvent(ev('narration', 'e4'))
    // live pushes set status directly; verify the backfill inference agrees
    expect(useFeed.getState().status).not.toBe('done')
  })

  it('a fresh checkpoint at the tail reads as done again', () => {
    useFeed.getState().appendEvent(ev('steering', 'e3'))
    useFeed.getState().appendEvent(ev('checkpoint', 'e5'))
    expect(useFeed.getState().status).toBe('done')
  })
})
