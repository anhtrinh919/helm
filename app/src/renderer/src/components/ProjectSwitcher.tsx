import { useState } from 'react'
import { useProjects } from '../store/projects'
import { usePreview } from '../store/preview'
import { helm } from '../bridge'
import { Icon } from './ui/Icon'
import { ClaudeSignal } from './ui/ClaudeSignal'
import type { Project } from '@shared/ipc-schemas'

/**
 * The returning-user workshop: every build with its mode + truthful Live status,
 * and full project management — rename in place, reorder, stop a running server,
 * delete with confirmation. DOT-MATRIX surface.
 */
export function ProjectSwitcher(): React.JSX.Element {
  const projects = useProjects((s) => s.projects)
  const open = useProjects((s) => s.open)
  const newBuild = useProjects((s) => s.newBuild)
  const rename = useProjects((s) => s.rename)
  const remove = useProjects((s) => s.delete)
  const reorder = useProjects((s) => s.reorder)
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null)

  const move = (index: number, dir: -1 | 1): void => {
    const next = index + dir
    if (next < 0 || next >= projects.length) return
    const ids = projects.map((p) => p.id)
    ;[ids[index], ids[next]] = [ids[next]!, ids[index]!]
    void reorder(ids)
  }

  return (
    <div className="hm hm-guide">
      <div className="hm-guide-top">
        <span className="hm-mark hm-mark--accent">H</span>
        <span className="hm-wordmark">Helm</span>
        <div style={{ flex: 1 }} />
        <button className="hm-btn hm-btn--accent" onClick={newBuild}>
          <Icon n="plus" />
          New build
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '40px 28px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="hm-eyebrow hm-eyebrow--accent" style={{ marginBottom: 10 }}>
            Your workshop
          </div>
          <div className="hm-display hm-h-m" style={{ marginBottom: 6 }}>
            Pick up where you left off
          </div>
          <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 26 }}>
            Open a build, reorder them, or start something new.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.map((p, i) => (
              <ProjectRow
                key={p.id}
                project={p}
                first={i === 0}
                last={i === projects.length - 1}
                onOpen={() => open(p.id)}
                onRename={(name) => rename(p.id, name)}
                onDelete={() => setPendingDelete(p)}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
              />
            ))}
          </div>

          <div style={{ marginTop: 30, maxWidth: 320 }}>
            <ClaudeSignal />
          </div>
        </div>
      </div>

      {pendingDelete && (
        <DeleteConfirm
          name={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void remove(pendingDelete.id)
            setPendingDelete(null)
          }}
        />
      )}
    </div>
  )
}

function ProjectRow({
  project,
  first,
  last,
  onOpen,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  project: Project
  first: boolean
  last: boolean
  onOpen: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}): React.JSX.Element {
  const preview = usePreview((s) => s.getPreviewState(project.id))
  const isLive = preview.status === 'live'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(project.name)

  const commit = (): void => {
    setEditing(false)
    onRename(draft) // store guards: only a non-empty, changed name saves
    setDraft(project.name)
  }

  return (
    <div className="hm-recent" style={{ cursor: 'default' }}>
      {/* reorder controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          className="hm-btn hm-btn--ghost hm-btn--sm"
          disabled={first}
          onClick={onMoveUp}
          aria-label="Move up"
          style={{ height: 18, padding: '0 4px' }}
        >
          <Icon n="caret-up-down" />
        </button>
      </div>

      <div className="hm-recent__thumb">
        <Icon n="squares-four" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            className="hm-input"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(project.name)
                setEditing(false)
              }
            }}
            style={{ minHeight: 34, padding: '6px 10px', fontSize: 14 }}
          />
        ) : (
          <div
            onClick={onOpen}
            style={{ cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}
          >
            {project.name}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span className="hm-chip">{project.mode === 'build' ? 'Build' : 'Iterate'}</span>
          {isLive && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="hm-dot hm-dot--live" />
              <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Live</span>
            </span>
          )}
        </div>
      </div>

      {isLive && (
        <button
          className="hm-btn hm-btn--sm"
          onClick={() => void helm.preview.stopServer(project.id)}
        >
          <Icon n="x" />
          Stop
        </button>
      )}
      {!editing && (
        <button
          className="hm-btn hm-btn--ghost hm-btn--sm"
          onClick={() => setEditing(true)}
          aria-label="Rename"
        >
          <Icon n="pencil-simple" />
        </button>
      )}
      <button className="hm-btn hm-btn--ghost hm-btn--sm" onClick={onDelete} aria-label="Delete">
        <Icon n="x" />
      </button>
      {/* down-reorder kept beside the row end for symmetry */}
      <button
        className="hm-btn hm-btn--ghost hm-btn--sm"
        disabled={last}
        onClick={onMoveDown}
        aria-label="Move down"
        style={{ padding: '0 4px' }}
      >
        <Icon n="caret-down" />
      </button>
    </div>
  )
}

function DeleteConfirm({
  name,
  onCancel,
  onConfirm,
}: {
  name: string
  onCancel: () => void
  onConfirm: () => void
}): React.JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,21,14,.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div className="hm-panel" style={{ width: 420, padding: 22 }} onClick={(e) => e.stopPropagation()}>
        <div className="hm-display hm-h-m" style={{ fontSize: 20, marginBottom: 8 }}>
          Delete “{name}”?
        </div>
        <p style={{ color: 'var(--ink-2)', fontSize: 13.5, marginBottom: 20 }}>
          This can’t be undone. The project and everything in it is removed from your machine.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="hm-btn" onClick={onCancel}>
            Keep it
          </button>
          <button className="hm-btn hm-btn--primary" onClick={onConfirm}>
            <Icon n="x" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
