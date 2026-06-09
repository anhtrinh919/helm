import { useState } from 'react'
import type { DecisionPrompt } from '@shared/ipc-schemas'

/**
 * One agent decision, rendered the same everywhere it appears: inline in a
 * scoped session's question queue, as the board's "Needs you" headline, and in
 * the wizard. Pending shows buttons / free text / a plan-approval prompt;
 * answered shows the chosen answer dimmed with an optional Re-open link.
 */
export function DecisionCard({
  prompt,
  answered,
  answer,
  onAnswer,
  onReopen,
  compact,
  subtitle,
}: {
  prompt: DecisionPrompt
  answered?: boolean
  answer?: string | null
  onAnswer: (answer: string) => void
  onReopen?: () => void
  compact?: boolean
  /** Optional context (e.g. which item is paused) shown beside the NEEDS YOU label. */
  subtitle?: string
}): React.JSX.Element {
  const [own, setOwn] = useState(false)
  const [text, setText] = useState('')

  if (answered) {
    return (
      <div style={{ border: '1.5px solid var(--frame)', background: 'var(--surface-2)', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="hm-eyebrow">DECIDED</span>
          {onReopen && (
            <button
              onClick={onReopen}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--accent-text)', padding: 0 }}
            >
              Re-open
            </button>
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-3)' }}>Q: {prompt.question}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>A: {answer ?? prompt.answer}</div>
      </div>
    )
  }

  const submitOwn = (): void => {
    if (!text.trim()) return
    onAnswer(text.trim())
  }

  const showButtons = prompt.type === 'buttons' && prompt.options && prompt.options.length > 0
  const isPlan = prompt.type === 'plan_approval'

  return (
    <div className="hm-callout hm-callout--needs" style={{ flexDirection: 'column', gap: 10, padding: compact ? 14 : 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hm-dot hm-dot--needs" />
        <span className="hm-eyebrow" style={{ color: 'var(--needs)' }}>NEEDS YOU</span>
        {subtitle && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· paused on {subtitle}</span>}
      </div>
      <div
        style={{ fontFamily: 'var(--display)', fontWeight: 700, lineHeight: 1.2, color: 'var(--ink)', fontSize: compact ? 15 : 20 }}
      >
        {prompt.question}
      </div>

      {isPlan ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onAnswer('approve')} className="hm-btn hm-btn--accent">
            Approve
          </button>
          <button onClick={() => setOwn(true)} className="hm-btn">
            Change something
          </button>
        </div>
      ) : showButtons && !own ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {prompt.options!.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              className="hm-btn hm-btn--sm"
            >
              {opt}
            </button>
          ))}
          <button
            onClick={() => setOwn(true)}
            className="hm-btn hm-btn--ghost hm-btn--sm"
          >
            Own answer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitOwn()
            }}
            placeholder="Type your answer…"
            autoFocus
            className="hm-input"
            style={{ flex: 1, minHeight: 'unset', height: 36, padding: '0 12px' }}
          />
          <button onClick={submitOwn} className="hm-btn hm-btn--primary">
            Send
          </button>
        </div>
      )}
    </div>
  )
}
