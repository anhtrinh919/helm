import { Icon } from './Icon'

/**
 * The persistent, calm "Running on your Claude subscription" reassurance — shown
 * where competitors put a token meter or upgrade prompt. Never a meter, never a
 * nag, never dismissable. `inline` drops the framed chrome for tight placements.
 */
export function ClaudeSignal({ inline }: { inline?: boolean }): React.JSX.Element {
  return (
    <div className={'hm-claude' + (inline ? ' hm-claude--inline' : '')}>
      <span className="hm-claude__spark">
        <Icon n="sparkle" />
      </span>
      <span className="hm-claude__txt">
        Running on <b>your Claude subscription</b>
        <br />
        No usage meter, no extra bill.
      </span>
    </div>
  )
}
