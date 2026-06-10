import { useState } from 'react'
import type { DecisionPrompt } from '@shared/ipc-schemas'
import { Icon } from '../ui/Icon'

/**
 * One round of the scoping interview: a batch of 4-5 questions answered together.
 * "ROUND N OF M" — distinct from the single-question "QUESTION N OF M" and the
 * journey's "STEP N OF M". The agent uses the whole round's answers to decide the
 * next round (decision-tree), so the user answers and advances a batch at a time.
 */
export function BatchQA({
  questions,
  round,
  totalRounds,
  onSubmit,
  onBack,
}: {
  questions: DecisionPrompt[]
  round: number
  totalRounds: number
  onSubmit: (answers: string[]) => void
  onBack: () => void
}): React.JSX.Element {
  // One answer slot per question; '' means unanswered.
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  // Per-question: typing a custom answer instead of picking an option.
  const [ownAnswer, setOwnAnswer] = useState<boolean[]>(() => questions.map(() => false))

  const setAnswer = (i: number, value: string): void => {
    setAnswers((prev) => prev.map((a, j) => (j === i ? value : a)))
  }
  const setOwn = (i: number, on: boolean): void => {
    setOwnAnswer((prev) => prev.map((o, j) => (j === i ? on : o)))
    if (on) setAnswer(i, '')
  }
  // Multi-select stores the chosen options as a comma-joined list in the same slot.
  const selectedSet = (i: number): string[] => answers[i].split(', ').filter(Boolean)
  const toggleMulti = (i: number, opt: string): void => {
    const cur = selectedSet(i)
    const next = cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]
    setAnswer(i, next.join(', '))
  }

  const n = Math.max(1, round)
  const m = Math.max(totalRounds, round)
  const answeredCount = answers.filter((a) => a.trim()).length
  const allAnswered = answeredCount === questions.length

  return (
    <div>
      {/* Round progress — "ROUND N OF M", visually distinct from the journey */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span className="hm-progresslabel hm-progresslabel--wizard">Round {n} of ~{m}</span>
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
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-3)' }}>
          {answeredCount} of {questions.length} answered
        </span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 24, lineHeight: 1.5 }}>
        A few quick ones. Your answers shape what I ask next.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {questions.map((q, i) => {
          const isButtons = q.type === 'buttons' && q.options && q.options.length > 0
          const own = ownAnswer[i]
          const multi = q.multi === true
          return (
            <div key={i}>
              <div className="hm-display hm-h-s" style={{ marginBottom: multi ? 4 : 12, lineHeight: 1.2 }}>
                <span style={{ color: 'var(--ink-3)', fontSize: '0.78em', marginRight: 8 }}>
                  {i + 1}.
                </span>
                {q.question}
              </div>
              {multi && (
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 12 }}>
                  Pick all that apply
                </div>
              )}

              {isButtons && !own ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {q.options!.map((opt) => {
                    const isSel = multi ? selectedSet(i).includes(opt) : answers[i] === opt
                    const choose = (): void => (multi ? toggleMulti(i, opt) : setAnswer(i, opt))
                    return (
                      <div
                        key={opt}
                        onClick={choose}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') choose()
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          padding: '10px 14px',
                          border: `1.5px solid ${isSel ? 'var(--frame)' : 'var(--line-2)'}`,
                          background: isSel ? 'var(--accent-weak)' : 'var(--surface-3)',
                          cursor: 'pointer',
                          boxShadow: isSel ? 'var(--hard)' : 'none',
                          fontSize: 14.5,
                          fontWeight: isSel ? 600 : 500,
                        }}
                      >
                        {multi ? (
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              border: `2px solid ${isSel ? 'var(--ink)' : 'var(--line-2)'}`,
                              background: isSel ? 'var(--lime)' : 'transparent',
                              display: 'grid',
                              placeItems: 'center',
                              flex: '0 0 auto',
                            }}
                          >
                            {isSel && <Icon n="check" size={12} />}
                          </span>
                        ) : (
                          isSel && (
                            <span style={{ display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                              <Icon n="check" size={15} />
                            </span>
                          )
                        )}
                        {opt}
                      </div>
                    )
                  })}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 12px',
                      fontSize: 13,
                      color: 'var(--ink-3)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setOwn(i, true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setOwn(i, true)
                    }}
                  >
                    <Icon n="pencil-simple" size={14} /> Other…
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={answers[i]}
                    onChange={(e) => setAnswer(i, e.target.value)}
                    placeholder="Type your answer…"
                    className="hm-input"
                    style={{ width: '100%' }}
                  />
                  {isButtons && (
                    <div
                      style={{
                        marginTop: 7,
                        fontSize: 12.5,
                        color: 'var(--ink-3)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      onClick={() => setOwn(i, false)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setOwn(i, false)
                      }}
                    >
                      <Icon n="arrow-left" size={13} /> Back to options
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 32, gap: 10 }}>
        <button className="hm-btn hm-btn--ghost" onClick={onBack}>
          <Icon n="arrow-left" /> Back
        </button>
        <button
          className="hm-btn hm-btn--primary hm-btn--lg"
          style={{ marginLeft: 'auto' }}
          onClick={() => onSubmit(answers)}
          disabled={!allAnswered}
        >
          Continue <Icon n="arrow-right" />
        </button>
      </div>
    </div>
  )
}
