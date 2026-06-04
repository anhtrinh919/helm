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
      <div className="rounded-[14px] brut-2 bg-cream/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-[0.16em] text-soft">DECIDED</span>
          {onReopen && (
            <button
              onClick={onReopen}
              className="text-xs font-bold text-violet underline-offset-2 hover:underline"
            >
              Re-open
            </button>
          )}
        </div>
        <div className="mt-1 text-sm text-soft">Q: {prompt.question}</div>
        <div className="text-sm font-bold text-ink">A: {answer ?? prompt.answer}</div>
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
    <div className={`rounded-[16px] brut bg-pinksoft ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-pink" />
        <span className="text-[10px] font-black tracking-[0.18em] text-ink">NEEDS YOU</span>
        {subtitle && <span className="text-[11px] font-medium text-soft">· paused on {subtitle}</span>}
      </div>
      <div
        className={`mt-2 font-display font-black leading-snug text-ink ${compact ? 'text-lg' : 'text-2xl'}`}
      >
        {prompt.question}
      </div>

      {isPlan ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onAnswer('approve')}
            className="rounded-full brut-2 bg-lime px-5 py-2 text-sm font-bold text-ink"
          >
            Approve
          </button>
          <button
            onClick={() => setOwn(true)}
            className="rounded-full brut-2 bg-cream px-5 py-2 text-sm font-bold text-ink"
          >
            Change something
          </button>
        </div>
      ) : showButtons && !own ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {prompt.options!.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
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
