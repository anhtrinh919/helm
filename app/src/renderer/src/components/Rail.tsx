import { Icon } from './ui/Icon'
import { ClaudeSignal } from './ui/ClaudeSignal'
import { useProjects } from '../store/projects'
import type { Project } from '@shared/ipc-schemas'

function modeLabel(p: Project): string {
  if (p.mode === 'build') return (p.railComplete ? 'Build · done' : 'Build mode')
  return 'Iterate mode'
}

/** The DOT-MATRIX working surface rail: brand mark, project switcher pill,
 *  nav items for this project, Claude signal at the bottom. */
export function Rail({ activeProjectId }: { activeProjectId?: string }): React.JSX.Element {
  const projects = useProjects((s) => s.projects)
  const open = useProjects((s) => s.open)
  const newBuild = useProjects((s) => s.newBuild)

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const isLive = activeProject?.backgroundStatus === 'active'

  return (
    <aside className="hm-rail">
      {/* Brand */}
      <div className="hm-rail__brand">
        <span className="hm-mark">H</span>
        <span className="hm-wordmark">Helm</span>
      </div>

      {/* Project switcher pill */}
      {activeProject && (
        <div className="hm-projpill" onClick={() => open(activeProject.id)} style={{ cursor: 'pointer' }}>
          <span
            className="hm-projpill__dot"
            style={!isLive ? { background: 'var(--ink-4)', boxShadow: 'none' } : undefined}
          />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0, flex: 1 }}>
            <span className="hm-projpill__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject.name}
            </span>
            <span className="hm-projpill__meta">
              {isLive ? 'Live · ' : ''}{modeLabel(activeProject)}
            </span>
          </span>
          <Icon n="caret-up-down" size={15} />
        </div>
      )}

      {/* Nav items */}
      <div className="hm-rail__group">
        <div className="hm-rail__label">This project</div>
        <div className="hm-navitem is-active">
          <Icon n="squares-four" />Cockpit
        </div>
        <div className="hm-navitem">
          <Icon n="git-branch" />Decisions
        </div>
        <div className="hm-navitem">
          <Icon n="chart-line-up" />Progress
        </div>
        <div className="hm-navitem">
          <Icon n="book-open" />Docs
        </div>
        <div className="hm-navitem" style={{ color: 'var(--ink-4)', cursor: 'default' }}>
          <Icon n="database" />Data
          <span className="hm-soontag" style={{ marginLeft: 'auto' }}>Phase 3</span>
        </div>
      </div>

      {/* Other projects quick-access */}
      {projects.filter((p) => p.id !== activeProjectId).length > 0 && (
        <div className="hm-rail__group" style={{ marginTop: 8 }}>
          <div className="hm-rail__label">Switch project</div>
          {projects
            .filter((p) => p.id !== activeProjectId)
            .slice(0, 3)
            .map((p) => (
              <div
                key={p.id}
                className="hm-navitem"
                onClick={() => open(p.id)}
                style={{ cursor: 'pointer' }}
              >
                <Icon n="squares-four" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {p.name}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* New build CTA */}
      <div style={{ marginTop: 12 }}>
        <button className="hm-btn hm-btn--block" onClick={newBuild} style={{ justifyContent: 'flex-start' }}>
          <Icon n="plus" />New build
        </button>
      </div>

      <div className="hm-rail__spacer" />
      <ClaudeSignal />
    </aside>
  )
}
