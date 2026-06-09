import type { Card, PlanBlock } from '@shared/ipc-schemas'
import { Icon } from '../ui/Icon'

export type StepState = 'done' | 'current' | 'locked'

function stepStateAt(index: number, railStep: number): StepState {
  if (index < railStep) return 'done'
  if (index === railStep) return 'current'
  return 'locked'
}

/**
 * The ordered milestone rail for a Build Journey (Build Journey · "Active —
 * step in progress"). Renders `project.plan` as steps with done/current/locked
 * states and a "Step N of M" counter, in the Journey-direction-C compact column.
 *
 * State derivation is observation-only: the rail position comes from
 * `project.railStep`; the active step's gate (in-flight vs hard-stop checkpoint
 * vs failed) is read off the active card's status + `checkpoint.status`. The
 * edge-triggered advance and all mutations are owned by JourneyView.
 */
export function JourneyRail({
  plan,
  railStep,
}: {
  plan: PlanBlock[]
  railStep: number
}): React.JSX.Element {
  const total = plan.length
  // "Step N of M" — clamp to the last step at completion (railStep === total).
  const counter = Math.min(railStep + 1, total)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '4px 6px 12px' }}>
        <span className="hm-progresslabel">
          Step {counter} of {total}
        </span>
      </div>
      <div className="hm-scroll-fade" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {plan.map((block, i) => {
          const state = stepStateAt(i, railStep)
          return (
            <div key={block.id} className={'hm-step is-' + state}>
              <div className="hm-step__rail">
                <div className="hm-step__node">
                  {state === 'done' ? <Icon n="check" size={11} /> : i + 1}
                </div>
                {i < total - 1 && <div className="hm-step__line" />}
              </div>
              <div className="hm-step__body">
                <div className="hm-step__title">{block.title}</div>
                {state === 'current' && block.detail && (
                  <div className="hm-step__desc">{block.detail}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Pull the plain-language outcome of the active card / step for the focus header. */
export function activeOutcome(card: Card | null, block: PlanBlock | null): string | null {
  return card?.outcome ?? block?.detail ?? null
}
