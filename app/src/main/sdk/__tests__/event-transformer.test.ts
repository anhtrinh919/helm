import { describe, expect, it } from 'vitest'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { transform } from '../event-transformer'

const assistant = (blocks: unknown[]): SDKMessage =>
  ({ type: 'assistant', message: { content: blocks } }) as unknown as SDKMessage
const text = (t: string): unknown => ({ type: 'text', text: t })
const tool = (name: string): unknown => ({ type: 'tool_use', name })

describe('event-transformer (hard gate)', () => {
  it('plain agent text becomes a narration event', () => {
    const out = transform('s1', assistant([text('Building the sign-in form.')]))
    expect(out.map((e) => [e.kind, e.text])).toEqual([['narration', 'Building the sign-in form.']])
  })

  it('tool calls surface only a friendly label — never the tool name or its arguments', () => {
    const out = transform('s1', assistant([tool('Bash'), tool('Write')]))
    expect(out.map((e) => e.text)).toEqual(['Running a command', 'Writing some code'])
    // unknown tools never leak their raw name
    expect(transform('s1', assistant([tool('SomeInternalTool')]))[0].text).toBe('Working on it')
  })

  it('a genuine-decision marker becomes a decision_prompt, not narration', () => {
    const out = transform(
      's1',
      assistant([text('{"decision":{"question":"Should the export be CSV or PDF?"}}')]),
    )
    expect(out).toHaveLength(1)
    expect(out[0].kind).toBe('decision_prompt')
    expect(out[0].text).toBe('Should the export be CSV or PDF?')
  })

  it('tolerates a decision marker wrapped in prose / code fences', () => {
    const out = transform(
      's1',
      assistant([text('Quick question first:\n```json\n{"decision":{"question":"Dark mode by default?"}}\n```')]),
    )
    expect(out[0].kind).toBe('decision_prompt')
    expect(out[0].text).toBe('Dark mode by default?')
  })

  it('text mentioning "decision" but with no valid marker stays narration', () => {
    const out = transform('s1', assistant([text('I made a quick decision about naming and moved on.')]))
    expect(out[0].kind).toBe('narration')
  })

  it('a successful result is a suppressible summary, a failed result is a friendly error', () => {
    expect(transform('s1', { type: 'result', subtype: 'success' } as unknown as SDKMessage)[0].kind).toBe('summary')
    const err = transform('s1', { type: 'result', subtype: 'error_max_turns' } as unknown as SDKMessage)
    expect(err[0].kind).toBe('error')
  })

  it('system / partial messages produce no feed events', () => {
    expect(transform('s1', { type: 'system' } as unknown as SDKMessage)).toEqual([])
  })
})
