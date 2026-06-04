import { useState } from 'react'
import type { Card } from '@shared/ipc-schemas'

/**
 * The most prominent thing on the board when the agent is blocked on a genuine
 * decision. Shows the full question + answer options inline — the user answers
 * here without opening the item.
 */
export function NeedsYouHeadline({
  card,
  onAnswer,
}: {
  card: Card
  onAnswer: (cardId: string, answer: string) => void
}): React.JSX.Element {
  const prompt = card.decisionPrompt
  const [text, setText] = useState('')

  return (
    <div className="rounded-[20px] brut bg-pinksoft p-5">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pink" />
        <span className="text-[11px] font-black tracking-[0.18em] text-ink">NEEDS YOU</span>
        <span className="text-[11px] font-medium text-soft">· paused on {card.title}</span>
      </div>

      <div className="mt-2 font-display text-xl font-black leading-snug text-ink">
        {prompt?.question ?? 'I need your call to keep going.'}
      </div>

      {prompt?.type === 'buttons' && prompt.options ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {prompt.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(card.id, opt)}
              className="rounded-full brut-2 bg-cream px-4 py-2 text-sm font-bold text-ink hover:bg-lime"
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) onAnswer(card.id, text.trim())
            }}
            placeholder="Type your answer…"
            className="flex-1 rounded-full brut-2 bg-cream px-4 py-2 text-sm text-ink outline-none placeholder:text-soft/55"
          />
          <button
            onClick={() => text.trim() && onAnswer(card.id, text.trim())}
            className="rounded-full brut-2 bg-ink px-4 py-2 text-sm font-bold text-cream"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
