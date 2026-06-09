import { Icon } from '../ui/Icon'
import type { Card, CardStatus } from '@shared/ipc-schemas'

/** Map card status → DOT-MATRIX state name and card class modifier. */
const STATE_META: Record<
  CardStatus,
  { label: string; icon: string; cls: string }
> = {
  planned:   { label: 'Planned',        icon: 'circle-dashed',        cls: '' },
  up_next:   { label: 'Up next',        icon: 'arrow-bend-down-right', cls: 'is-upnext' },
  building:  { label: 'Building',       icon: 'circle-notch',         cls: 'is-building' },
  needs_you: { label: 'Needs you',      icon: 'hand-tap',             cls: 'is-needs' },
  failed:    { label: "Couldn't finish", icon: 'warning-circle',       cls: 'is-fail' },
  done:      { label: 'Done',           icon: 'check-circle',         cls: '' },
  waiting:   { label: 'Waiting',        icon: 'circle-dashed',        cls: '' },
}

/** The null empty-state for outcome — shown when outcome is not yet set. */
function OutcomeEmpty(): React.JSX.Element {
  return (
    <span style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>
      What this delivers will appear here once the build starts.
    </span>
  )
}

export interface SpineItemProps {
  card: Card
  mode: 'spotlight' | 'row' | 'condensed'
  depLabel?: string
  onOpen: (cardId: string) => void
  onRetry?: (cardId: string) => void
}

/** A condensed done row — quiet history. */
function DoneRow({ card, onOpen }: { card: Card; onOpen: (id: string) => void }): React.JSX.Element {
  return (
    <div
      className="hm-card hm-card--done"
      onClick={() => onOpen(card.id)}
      style={{ cursor: 'pointer' }}
    >
      <span className="hm-check">
        <Icon n="check" />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0, flex: 1 }}>
        <span className="t">{card.title}</span>
        <span className="o">{card.outcome ?? 'Done'}</span>
      </span>
      <Icon n="arrow-counter-clockwise" size={15} />
    </div>
  )
}

/** A full work card — the core Cockpit A primitive. */
function WorkCard({
  card,
  onOpen,
  onRetry,
}: {
  card: Card
  onOpen: (id: string) => void
  onRetry?: (id: string) => void
}): React.JSX.Element {
  const m = STATE_META[card.status] ?? STATE_META.planned

  return (
    <div className={`hm-card ${m.cls}`} style={{ cursor: 'pointer' }} onClick={() => onOpen(card.id)}>
      <div className="hm-card__top">
        <span className="hm-card__state">
          <Icon n={m.icon} size={14} />
          {m.label}
        </span>
        <span
          className="hm-card__menu"
          onClick={(e) => { e.stopPropagation(); onOpen(card.id) }}
        >
          <Icon n="dots-three" />
        </span>
      </div>
      <div className="hm-card__title">{card.title}</div>
      <div className="hm-card__outcome">
        <Icon n="arrow-bend-down-right" size={15} />
        <span>{card.outcome !== null && card.outcome !== '' ? card.outcome : <OutcomeEmpty />}</span>
      </div>

      {card.status === 'building' && (
        <div className="hm-buildbar"><i /></div>
      )}

      {card.status === 'failed' && (
        <div
          className="hm-callout hm-callout--fail"
          style={{ marginTop: 13, padding: '11px 13px', fontSize: 13 }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="hm-callout__ic"><Icon n="info" /></span>
          <span>
            Something blocked this step.{' '}
            <b
              style={{ cursor: 'pointer', color: 'var(--fail)' }}
              onClick={(e) => { e.stopPropagation(); onRetry?.(card.id) }}
            >
              Try again
            </b>{' '}
            or open for details.
          </span>
        </div>
      )}

      {card.status === 'needs_you' && card.decisionPrompt && (
        <div className="hm-card__foot">
          <span style={{ fontSize: 13, color: 'var(--needs)', fontWeight: 700 }}>
            {card.decisionPrompt.question}
          </span>
        </div>
      )}
    </div>
  )
}

/** SpineItem: routes to the right card shape based on mode/status. */
export function SpineItem({ card, mode, onOpen, onRetry }: SpineItemProps): React.JSX.Element {
  if (mode === 'condensed' || card.status === 'done') {
    return <DoneRow card={card} onOpen={onOpen} />
  }
  return <WorkCard card={card} onOpen={onOpen} onRetry={onRetry} />
}
