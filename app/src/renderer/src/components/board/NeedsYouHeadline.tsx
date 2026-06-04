import type { Card } from '@shared/ipc-schemas'
import { DecisionCard } from '../session/DecisionCard'

/**
 * The most prominent thing on the board when a build is blocked on a genuine
 * decision. The user answers right here, without opening the item. It is just
 * the shared DecisionCard with the paused item as its subtitle.
 */
export function NeedsYouHeadline({
  card,
  onAnswer,
}: {
  card: Card
  onAnswer: (cardId: string, answer: string) => void
}): React.JSX.Element {
  const prompt = card.decisionPrompt
  if (!prompt) {
    return (
      <div className="rounded-[20px] brut bg-pinksoft p-5">
        <span className="text-[11px] font-black tracking-[0.18em] text-ink">NEEDS YOU</span>
        <div className="mt-2 font-display text-2xl font-black text-ink">
          I need your call to keep going — open {card.title}.
        </div>
      </div>
    )
  }
  return <DecisionCard prompt={prompt} subtitle={card.title} onAnswer={(a) => onAnswer(card.id, a)} />
}
