import { Icon } from './ui/Icon'
import { ClaudeSignal } from './ui/ClaudeSignal'
import { useProjects } from '../store/projects'
import { useWizard } from '../store/wizard'
import type { Project } from '@shared/ipc-schemas'

function Mark(): React.JSX.Element {
  return (
    <span className="hm-mark">H</span>
  )
}

function PrimaryDoor(): React.JSX.Element {
  const startNew = (): void => useWizard.getState().startNew('build')
  return (
    <div className="hm-door hm-door--primary" onClick={startNew} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startNew() }}>
      <div className="hm-door__icon hm-door__icon--accent">
        <Icon n="compass-tool" size={25} />
      </div>
      <div className="hm-door__title">Build with structure</div>
      <div className="hm-door__desc">
        Describe what you want. Helm asks a few plain questions, lays out a clear plan, and guides you there one step at a time.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 22 }}>
        <div className="hm-subdoor hm-subdoor--cta">
          <span className="hm-subdoor__ic"><Icon n="compass-tool" /></span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
            <span className="s-title">Start the guided journey</span>
            <span className="s-sub">A clear plan, one step at a time</span>
          </span>
          <Icon n="arrow-right" />
        </div>
      </div>
    </div>
  )
}

function IterateDoor(): React.JSX.Element {
  const startFree = (): void => useWizard.getState().startNew('iterate')
  return (
    <div className="hm-door">
      <div className="hm-door__icon hm-door__icon--quiet">
        <Icon n="pencil-simple-line" size={25} />
      </div>
      <div className="hm-door__title">Build freely</div>
      <div className="hm-door__desc">
        Jump straight into free-form building, beside your live app — no rails, change anything anytime.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 22 }}>
        <div className="hm-subdoor hm-subdoor--cta" onClick={startFree} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startFree() }}>
          <span className="hm-subdoor__ic"><Icon n="sparkle" /></span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
            <span className="s-title">Start fresh</span>
            <span className="s-sub">Your first request scaffolds the app</span>
          </span>
          <Icon n="arrow-right" />
        </div>
        <div className="hm-subdoor is-soon">
          <span className="hm-subdoor__ic"><Icon n="download-simple" /></span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
            <span className="s-title">Bring an existing app</span>
            <span className="s-sub">Import from Lovable, Bolt, or Replit — coming in a future update</span>
          </span>
          <span className="hm-soontag">Phase 5</span>
        </div>
      </div>
    </div>
  )
}

function RecentRow({ project }: { project: Project }): React.JSX.Element {
  const open = useProjects((s) => s.open)
  const isLive = project.backgroundStatus === 'active' || project.mode === 'iterate'
  const modeLabel = project.mode === 'build' ? 'Journey' : 'Iterate'
  const statusLabel = project.railComplete
    ? 'Completed'
    : project.railStep != null
      ? `${modeLabel} · Step ${project.railStep + 1}`
      : modeLabel

  return (
    <div className="hm-recent" onClick={() => open(project.id)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(project.id) }}>
      <span className="hm-recent__thumb"><Icon n="books" /></span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, minWidth: 0 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {project.name}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLive && <span className="hm-dot hm-dot--live" />}
          {statusLabel}
        </span>
      </span>
    </div>
  )
}

/** Front door — default (new user) and returning-user variants. */
export function FrontDoor(): React.JSX.Element {
  const projects = useProjects((s) => s.projects)
  const hasProjects = projects.length > 0

  if (hasProjects) {
    return (
      <div className="hm hm-guide">
        {/* Top bar */}
        <div className="hm-guide-top">
          <Mark /><span className="hm-wordmark">Helm</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <ClaudeSignal inline />
            <div className="hm-top__back" style={{ background: 'transparent', border: '1px solid var(--line)' }}>
              <Icon n="gear-six" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
          <div style={{ width: '100%', maxWidth: 920 }}>
            {/* Welcome back heading */}
            <div style={{ marginBottom: 26 }}>
              <span className="hm-eyebrow hm-eyebrow--prompt">Welcome back</span>
              <div className="hm-display hm-h-m" style={{ marginTop: 12 }}>Pick up where you left off, or start fresh.</div>
            </div>

            {/* Recent projects */}
            <div style={{ marginBottom: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                  Jump back in
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {projects.slice(0, 6).map((p) => (
                  <RecentRow key={p.id} project={p} />
                ))}
              </div>
            </div>

            {/* Doors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              <PrimaryDoor />
              <IterateDoor />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default — no projects yet
  return (
    <div className="hm hm-guide">
      {/* Top bar */}
      <div className="hm-guide-top">
        <Mark /><span className="hm-wordmark">Helm</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <ClaudeSignal inline />
          <div className="hm-top__back" style={{ background: 'transparent', border: '1px solid var(--line)' }}>
            <Icon n="gear-six" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
        <div style={{ width: '100%', maxWidth: 920 }}>
          <div style={{ textAlign: 'center', marginBottom: 38 }}>
            <span className="hm-eyebrow hm-eyebrow--prompt" style={{ justifyContent: 'center' }}>Welcome to Helm</span>
            <div className="hm-display hm-h-l" style={{ marginTop: 14 }}>
              What would you like to <span className="hm-hl">build</span>?<span className="hm-caret" />
            </div>
            <div style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 12 }}>
              Two ways in. Pick the one that fits — you can always change course.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'stretch' }}>
            <PrimaryDoor />
            <IterateDoor />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--ink-3)' }}>
              <span className="hm-claude__spark" style={{ width: 18, height: 18 }}><Icon n="sparkle" /></span>
              Running on <b style={{ color: 'var(--ink-2)' }}>your Claude subscription</b> — no usage meter, no extra bill.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
