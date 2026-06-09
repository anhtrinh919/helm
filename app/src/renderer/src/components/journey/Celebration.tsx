import { useProjects } from '../../store/projects'
import { Icon } from '../ui/Icon'

/** Scattered hard-edged squares — the Dot-Matrix celebration motion (the old
 *  pastel Confetti belongs to the legacy design language; the canon uses ink/lime
 *  squares on the bone-paper guide grid). Purely ornamental. */
const SQUARES: [number, number, number][] = [
  [12, 18, 8],
  [86, 14, 12],
  [22, 78, 10],
  [92, 70, 9],
  [50, 8, 7],
  [70, 88, 11],
  [8, 52, 9],
  [40, 92, 8],
]

function Squares(): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {SQUARES.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: s[0] + '%',
            top: s[1] + '%',
            width: s[2],
            height: s[2],
            background: i % 2 ? 'var(--ink)' : 'var(--lime)',
            border: '1.5px solid var(--frame)',
            transform: `rotate(${i * 18}deg)`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  )
}

/**
 * The journey-complete celebration (Build Journey · "Journey complete — celebration").
 * Fired when `railStep` reaches `plan.length`. Oversized display headline, the
 * lime highlighter on the closing word, the milestones recapped, and a single
 * continue CTA → `dismissCelebration()` (flips the project to Iterate and lands
 * it on the Cockpit Board).
 */
export function Celebration({ projectId }: { projectId: string }): React.JSX.Element {
  const project = useProjects((s) => s.projects.find((p) => p.id === projectId))
  const dismiss = useProjects((s) => s.dismissCelebration)
  const built = project?.plan?.map((b) => b.title) ?? []

  return (
    <div
      className="hm hm-guide"
      style={{ position: 'fixed', inset: 0, zIndex: 50 }}
    >
      <Squares />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 40px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: 'var(--lime)',
            border: '1.5px solid var(--frame)',
            boxShadow: 'var(--hard-lg)',
            display: 'grid',
            placeItems: 'center',
            marginBottom: 26,
          }}
        >
          <Icon n="flag-checkered" size={32} />
        </div>
        <span className="hm-eyebrow hm-eyebrow--prompt">Journey complete</span>
        <div
          className="hm-display hm-h-xl"
          style={{ textAlign: 'center', marginTop: 14, maxWidth: '20ch' }}
        >
          Your app now does what you set out to <span className="hm-hl">build</span>.
        </div>
        <div
          style={{
            fontSize: 15,
            color: 'var(--ink-2)',
            marginTop: 14,
            textAlign: 'center',
            maxWidth: '52ch',
            lineHeight: 1.55,
          }}
        >
          Every step is done and tested. Your app is live and ready to keep shaping.
        </div>

        {built.length > 0 && (
          <div
            className="hm-panel"
            style={{
              marginTop: 26,
              padding: '8px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 20px',
              justifyContent: 'center',
              maxWidth: 720,
            }}
          >
            {built.map((b, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 4px',
                  fontSize: 13,
                  color: 'var(--ink-2)',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    background: 'var(--ink)',
                    color: 'var(--lime)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    border: '1.5px solid var(--frame)',
                  }}
                >
                  <Icon n="check" size={11} />
                </span>
                {b}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => void dismiss()}
          className="hm-btn hm-btn--accent hm-btn--lg"
          style={{ marginTop: 30 }}
        >
          <Icon n="check-circle" />
          Open your cockpit
        </button>
        <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--ink-3)' }}>
          The journey folds into a strip you can reopen anytime.
        </div>
      </div>
    </div>
  )
}
