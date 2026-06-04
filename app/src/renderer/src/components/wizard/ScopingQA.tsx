import { useState } from 'react'
import type { DecisionPrompt } from '@shared/ipc-schemas'

/** One scoping question (F4/F5). Buttons or free text; progress shown as "Step N of M". */
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

  if (!question) {
    return (
      <div className="grid flex-1 place-items-center">
        <div className="flex items-center gap-2 text-soft">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet" /> Thinking about what to ask…
        </div>
      </div>
    )
  }

  const isButtons = question.type === 'buttons' && question.options && question.options.length > 0

  return (
    <div className="mx-auto w-full max-w-[640px] py-8">
      <div className="text-[11px] font-black tracking-[0.18em] text-soft">
        STEP {Math.max(1, step)} OF {Math.max(total, step)}: SCOPING
      </div>
      <h2 className="mt-3 font-display text-4xl font-black leading-tight text-ink">
        {question.question}
      </h2>

      {isButtons ? (
        <div className="mt-7 flex flex-col gap-3">
          {question.options!.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              className="rounded-[16px] brut bg-cream px-5 py-4 text-left text-lg font-bold text-ink transition hover:bg-lime"
            >
              {opt}
            </button>
          ))}
          <button
            onClick={() => onAnswer('No preference — you choose')}
            className="mt-1 self-start text-sm font-semibold text-soft hover:text-ink"
          >
            Skip this question
          </button>
        </div>
      ) : (
        <div className="mt-7">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) onAnswer(text.trim())
            }}
            placeholder="Describe it in your own words…"
            rows={4}
            autoFocus
            className="w-full resize-none rounded-[16px] brut bg-cream px-5 py-4 text-lg text-ink outline-none placeholder:text-soft/55"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => onAnswer('No preference — you choose')}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-soft hover:text-ink"
            >
              Skip
            </button>
            <button
              onClick={() => text.trim() && onAnswer(text.trim())}
              disabled={!text.trim()}
              className="rounded-full brut-2 bg-pink px-6 py-2.5 text-sm font-bold text-ink disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
