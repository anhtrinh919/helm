import { describe, expect, it } from 'vitest'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { stripCode, transform } from '../event-transformer'

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

  it('a decision marker carries button options through to the event', () => {
    const out = transform(
      's1',
      assistant([text('{"decision":{"question":"Export format?","options":["CSV","PDF"]}}')]),
    )
    expect(out[0].kind).toBe('decision_prompt')
    expect(out[0].options).toEqual(['CSV', 'PDF'])
  })

  it('tolerates a decision marker wrapped in prose / code fences', () => {
    const out = transform(
      's1',
      assistant([text('Quick question first:\n```json\n{"decision":{"question":"Dark mode by default?"}}\n```')]),
    )
    // the leading prose is preserved as narration, then the decision pauses
    expect(out.map((e) => e.kind)).toEqual(['narration', 'decision_prompt'])
    expect(out.find((e) => e.kind === 'narration')?.text).toBe('Quick question first:')
    expect(out.find((e) => e.kind === 'decision_prompt')?.text).toBe('Dark mode by default?')
  })

  it('a marker mid-paragraph keeps the surrounding prose AND pauses (no narration is dropped)', () => {
    const out = transform(
      's1',
      assistant([text('I could go two ways. {"decision":{"question":"Password or magic link?"}} Let me know.')]),
    )
    expect(out.find((e) => e.kind === 'decision_prompt')?.text).toBe('Password or magic link?')
    const prose = out.filter((e) => e.kind === 'narration').map((e) => e.text).join(' ')
    expect(prose).toContain('I could go two ways.')
    expect(prose).toContain('Let me know.')
    // raw JSON braces never leak into narration
    expect(out.every((e) => !e.text.includes('{'))).toBe(true)
  })

  it('a NON-decision JSON blob is dropped, never narrated as raw braces (hard gate)', () => {
    const out = transform('s1', assistant([text('Here is the shape: {"plan":{"steps":[1,2,3]}} done.')]))
    expect(out.every((e) => e.kind !== 'decision_prompt')).toBe(true)
    expect(out.every((e) => !e.text.includes('{') && !e.text.includes('}'))).toBe(true)
    const prose = out.map((e) => e.text).join(' ')
    expect(prose).toContain('Here is the shape:')
    expect(prose).toContain('done.')
  })

  it('an unbalanced JSON fragment fails closed — the fragment never reaches narration', () => {
    const out = transform('s1', assistant([text('Working on it {"decision":{"question":"unclosed')]))
    expect(out.every((e) => !e.text.includes('{'))).toBe(true)
    expect(out.find((e) => e.kind === 'narration')?.text).toBe('Working on it')
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

  /* ---- Phase 2: real tool calls (Write/Edit/Bash) must not leak code/paths ---- */

  it('real file-writing tool_use surfaces only a friendly label — path in args never read', () => {
    // The SDK only gives us the tool name in the label path; args are never read.
    const out = transform('s1', assistant([tool('Write'), tool('Edit'), tool('MultiEdit')]))
    expect(out.map((e) => e.text)).toEqual(['Writing some code', 'Editing the code', 'Editing the code'])
  })

  it('a fenced code block in assistant text is stripped whole — never narrated', () => {
    const out = transform(
      's1',
      assistant([
        text('Wiring the route.\n```ts\nconst db = open("/Users/me/app/helm.db")\n```\nDone wiring.'),
      ]),
    )
    const prose = out.map((e) => e.text).join(' ')
    expect(prose).toContain('Wiring the route.')
    expect(prose).toContain('Done wiring.')
    // no code, no backticks, no path leaked
    expect(prose).not.toContain('const db')
    expect(prose).not.toContain('/Users/')
    expect(prose).not.toContain('`')
  })

  it('inline backtick literals and absolute paths are scrubbed from narration', () => {
    const out = transform(
      's1',
      assistant([text('Saved the file to /Users/me/dev/app/src/index.ts and ran `npm run build`.')]),
    )
    const prose = out.map((e) => e.text).join(' ')
    expect(prose).not.toContain('/Users/')
    expect(prose).not.toContain('`')
    expect(prose).not.toContain('npm run build')
    expect(prose).toContain('Saved the file to')
  })

  it('a decision marker still pauses even when the same turn also contains a code block', () => {
    const out = transform(
      's1',
      assistant([
        text('```bash\ncd /tmp/app && npm i\n```\n{"decision":{"question":"Use SQLite or Postgres?","options":["SQLite","Postgres"]}}'),
      ]),
    )
    const decision = out.find((e) => e.kind === 'decision_prompt')
    expect(decision?.text).toBe('Use SQLite or Postgres?')
    expect(decision?.options).toEqual(['SQLite', 'Postgres'])
    // the shell command never reaches narration
    expect(out.every((e) => !e.text.includes('npm i') && !e.text.includes('/tmp/'))).toBe(true)
  })

  it('stripCode leaves ordinary prose (including slashes like and/or) intact', () => {
    expect(stripCode('Pick CSV and/or PDF — your call.')).toBe('Pick CSV and/or PDF — your call.')
    expect(stripCode('No code here at all.')).toBe('No code here at all.')
  })
})

describe('Phase 3 — CSS selector scrub (fix sessions)', () => {
  it('strips a bare selector chain echoed in narration', () => {
    const out = stripCode('I found the element at main > button#submit and fixed its colour.')
    expect(out).not.toContain('button#submit')
    expect(out).not.toContain('>')
    expect(out).toContain('fixed its colour')
  })

  it('strips nth-of-type chains', () => {
    const out = stripCode('Looking at nav > a:nth-of-type(2) now.')
    expect(out).not.toContain('nth-of-type')
    expect(out).not.toContain('nav >')
  })

  it('strips a lone tag#id token', () => {
    const out = stripCode('The header#main element was the problem.')
    expect(out).not.toContain('header#main')
  })

  it('leaves ordinary prose with comparisons intact', () => {
    expect(stripCode('We need 5 > 3 here.')).toBe('We need 5 > 3 here.')
    expect(stripCode('Settings then Profile, in that order.')).toBe(
      'Settings then Profile, in that order.',
    )
  })
})
