import { Icon } from '../ui/Icon'
import type { Card } from '@shared/ipc-schemas'

/**
 * The "Needs you" callout pinned above the card spine in DOT-MATRIX style.
 * Shows the one-line question with inline answer buttons when a decisionPrompt
 * is present; falls back to a simple "open the card" nudge otherwise.
 */
export function NeedsYouHeadline({
  card,
  onAnswer,
}: {
  card: Card
  onAnswer: (cardId: string, answer: string) => void
}): React.JSX.Element {
  const prompt = card.decisionPrompt

  return (
    <div className="hm-callout hm-callout--needs" style={{ alignItems: 'flex-start' }}>
      <span className="hm-callout__ic">
        <Icon n="hand-tap" />
      </span>
      <span style={{ flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--needs)',
            marginBottom: 4,
          }}
        >
          Needs you — {card.title}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, display: 'block' }}>
          {prompt?.question ?? `Open "${card.title}" to answer a question before I can continue.`}
        </span>
      </span>
      {prompt && (
        <span style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', marginTop: 2 }}>
          {prompt.options?.map((opt) => (
            <button
              key={opt}
              className="hm-btn hm-btn--sm"
              onClick={() => onAnswer(card.id, opt)}
            >
              {opt}
            </button>
          ))}
          {(!prompt.options || prompt.options.length === 0) && (
            <button
              className="hm-btn hm-btn--sm hm-btn--primary"
              onClick={() => onAnswer(card.id, 'yes')}
            >
              Answer
            </button>
          )}
        </span>
      )}
    </div>
  )
}
