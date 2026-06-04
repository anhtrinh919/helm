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
    <div className="rounded-[18px] brut bg-cream p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black tracking-[0.18em] text-ink">QUESTIONS</span>
        <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cream">
          {open} open
        </span>
      </div>

      {questions.length === 0 ? (
        <div className="mt-3 text-sm text-soft">No questions yet.</div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
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
