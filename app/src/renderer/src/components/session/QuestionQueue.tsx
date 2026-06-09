import type { QuestionQueueItem } from '@shared/ipc-schemas'
import { DecisionCard } from './DecisionCard'

/** All of a session's decisions, pending and decided, with re-open on answered ones. */
export function QuestionQueue({
  questions,
  onAnswer,
  onReopen,
}: {
  questions: QuestionQueueItem[]
  onAnswer: (questionId: string, answer: string) => void
  onReopen: (questionId: string) => void
}): React.JSX.Element {
  const open = questions.filter((q) => q.status === 'pending' || q.status === 'reopened').length

  return (
    <div style={{ border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="hm-eyebrow">QUESTIONS</span>
        <span className="hm-chip" style={{ background: open > 0 ? 'var(--needs-weak)' : 'var(--surface-2)', color: open > 0 ? 'var(--needs)' : 'var(--ink-3)' }}>
          {open} open
        </span>
      </div>

      {questions.length === 0 ? (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-3)' }}>No questions yet.</div>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.map((q) => (
            <DecisionCard
              key={q.id}
              prompt={q.prompt}
              answered={q.status === 'answered'}
              answer={q.answer}
              onAnswer={(a) => onAnswer(q.id, a)}
              onReopen={() => onReopen(q.id)}
              compact
            />
          ))}
        </div>
      )}
    </div>
  )
}
