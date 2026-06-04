import { useState } from 'react'
import type { QuestionQueueItem } from '@shared/ipc-schemas'

/**
 * One agent decision. Pending: answer via buttons (+ own-answer) or free text.
 * Answered: shows the chosen answer dimmed with a Re-open link. Shared by the
 * scoped-session feed, the question queue, and the board headline.
 */
export function DecisionCard({
  question,
  onAnswer,
  onReopen,
  compact,
}: {
  question: QuestionQueueItem
  onAnswer: (questionId: string, answer: string) => void
  onReopen?: (questionId: string) => void
  compact?: boolean
}): React.JSX.Element {
  const { prompt } = question
  const decided = question.status === 'answered'
  const [own, setOwn] = useState(false)
  const [text, setText] = useState('')

  if (decided) {
    return (
      <div className="rounded-[14px] brut-2 bg-cream/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-[0.16em] text-soft">DECIDED</span>
          {onReopen && (
            <button
              onClick={() => onReopen(question.id)}
              className="text-xs font-bold text-violet underline-offset-2 hover:underline"
            >
              Re-open
            </button>
          )}
        </div>
        <div className="mt-1 text-sm text-soft">Q: {prompt.question}</div>
        <div className="text-sm font-bold text-ink">A: {question.answer}</div>
      </div>
    )
  }

  const submitOwn = (): void => {
    if (!text.trim()) return
    onAnswer(question.id, text.trim())
  }

  const showButtons = prompt.type === 'buttons' && prompt.options && prompt.options.length > 0

  return (
    <div className={`rounded-[16px] brut bg-pinksoft ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-pink" />
        <span className="text-[10px] font-black tracking-[0.18em] text-ink">NEEDS YOU</span>
      </div>
      <div className="mt-2 font-display text-lg font-black leading-snug text-ink">
        {prompt.question}
      </div>

      {showButtons && !own ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {prompt.options!.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(question.id, opt)}
              className="rounded-full brut-2 bg-cream px-4 py-2 text-sm font-bold text-ink hover:bg-lime"
            >
              {opt}
            </button>
          ))}
          <button
            onClick={() => setOwn(true)}
            className="rounded-full px-3 py-2 text-sm font-semibold text-soft hover:text-ink"
          >
            Own answer
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitOwn()
            }}
            placeholder="Type your answer…"
            autoFocus
            className="flex-1 rounded-full brut-2 bg-cream px-4 py-2 text-sm text-ink outline-none placeholder:text-soft/55"
          />
          <button
            onClick={submitOwn}
            className="rounded-full brut-2 bg-ink px-4 py-2 text-sm font-bold text-cream"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
