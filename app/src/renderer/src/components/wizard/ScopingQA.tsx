import { useState } from 'react'
import type { DecisionPrompt } from '@shared/ipc-schemas'
import { Icon } from '../ui/Icon'

/**
 * One scoping question (wizard Q&A step).
 * "QUESTION N OF M" — deliberately distinct from the Journey's "STEP N OF M".
 * Uses `.hm-progresslabel--wizard` (ink-3 colour, neutral).
 */
export function ScopingQA({
  question,
  step,
  total,
  onAnswer,
}: {
  question: DecisionPrompt | null
  step: number
  total: number
  onAnswer: (answer: string) => void
}): React.JSX.Element {
  const [text, setText] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  if (!question) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-2)', fontSize: 15, padding: '28px 0' }}>
        <span className="hm-claude__spark" style={{ width: 24, height: 24 }}><Icon n="sparkle" /></span>
        Thinking up the next question&nbsp;
        <span className="hm-thinking"><i /><i /><i /></span>
      </div>
    )
  }

  const isButtons = question.type === 'buttons' && question.options && question.options.length > 0
  const n = Math.max(1, step)
  const m = Math.max(total, step)

  const submit = (value: string): void => {
    if (!value.trim()) return
    onAnswer(value.trim())
  }

  return (
    <div>
      {/* Progress indicator — "QUESTION N OF M", visually distinct from journey "STEP N OF M" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <span className="hm-progresslabel hm-progresslabel--wizard">Question {n} of {m}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: m }).map((_, i) => (
            <span
              key={i}
              style={{
                width: i + 1 === n ? 22 : 8,
                height: 8,
                background: i + 1 < n ? 'var(--ink-3)' : i + 1 === n ? 'var(--ink)' : 'var(--line-2)',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>
      </div>

      <div className="hm-display hm-h-m" style={{ marginBottom: 10, lineHeight: 1.12 }}>
        {question.question}
      </div>
      <div style={{ marginBottom: 22 }} />

      {isButtons ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options!.map((opt) => {
            const isSel = selected === opt
            return (
              <div
                key={opt}
                onClick={() => { setSelected(opt); submit(opt) }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelected(opt); submit(opt) } }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '15px 16px',
                  border: `1.5px solid ${isSel ? 'var(--frame)' : 'var(--line-2)'}`,
                  background: isSel ? 'var(--accent-weak)' : 'var(--surface-3)',
                  cursor: 'pointer',
                  boxShadow: isSel ? 'var(--hard)' : 'none',
                }}
              >
                <span style={{
                  width: 40,
                  height: 40,
                  display: 'grid',
                  placeItems: 'center',
                  background: isSel ? 'var(--lime)' : 'var(--surface-2)',
                  color: 'var(--ink-2)',
                  fontSize: 20,
                  flex: '0 0 auto',
                  border: `1.5px solid ${isSel ? 'var(--frame)' : 'var(--line-2)'}`,
                }}>
                  <Icon n="check" />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600 }}>{opt}</span>
                </span>
                <span style={{
                  marginLeft: 'auto',
                  width: 20,
                  height: 20,
                  border: `2px solid ${isSel ? 'var(--ink)' : 'var(--line-2)'}`,
                  display: 'grid',
                  placeItems: 'center',
                }}>
                  {isSel && <span style={{ width: 9, height: 9, background: 'var(--ink)' }} />}
                </span>
              </div>
            )
          })}
          <div
            style={{ marginTop: 4, fontSize: 13.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
            onClick={() => submit('No preference — you choose')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') submit('No preference — you choose') }}
          >
            <Icon n="pencil-simple" /> Or describe it in your own words
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
            <button className="hm-btn hm-btn--ghost" onClick={() => onAnswer('No preference — you choose')}>
              <Icon n="arrow-left" /> Back
            </button>
          </div>
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) submit(text)
            }}
            placeholder="Describe it in your own words…"
            rows={4}
            autoFocus
            className="hm-input hm-input--lg"
          />
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 20, gap: 10 }}>
            <button className="hm-btn hm-btn--ghost" onClick={() => onAnswer('No preference — you choose')}>
              <Icon n="arrow-left" /> Back
            </button>
            <button
              className="hm-btn hm-btn--primary hm-btn--lg"
              style={{ marginLeft: 'auto' }}
              onClick={() => submit(text)}
              disabled={!text.trim()}
            >
              Continue <Icon n="arrow-right" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
