import { randomUUID } from 'node:crypto'
import type {
  BackgroundStatus,
  PlanBlock,
  Project,
  ProjectMode,
  ProjectStatus,
} from '../../shared/ipc-schemas'
import type { Db } from './connection'
import { NotFoundError } from './errors'
import { toProject, type ProjectRow } from './mappers'

/** Derive a project's live background status from its sessions. Priority: needs_you > active > failed > idle. */
export function deriveBackgroundStatus(db: Db, projectId: string): BackgroundStatus {
  const row = db
    .prepare(
      `SELECT
         SUM(status = 'paused_for_decision') AS needs,
         SUM(status = 'active')              AS active,
         SUM(status IN ('failed','error'))   AS failed
       FROM sessions WHERE project_id = ?`,
    )
    .get(projectId) as { needs: number | null; active: number | null; failed: number | null }
  if (row.needs) return 'needs_you'
  if (row.active) return 'active'
  if (row.failed) return 'failed'
  return 'idle'
}

export function listProjects(db: Db): Project[] {
  // position ASC (Phase 1 reorder field) is primary; NULLs sort last via COALESCE.
  // updated_at DESC, rowid DESC are the pre-Phase-1 tiebreakers, retained for stability.
  const rows = db
    .prepare(`SELECT * FROM projects ORDER BY COALESCE(position, 9999999) ASC, updated_at DESC, rowid DESC`)
    .all() as ProjectRow[]
  return rows.map((r) => toProject(r, deriveBackgroundStatus(db, r.id)))
}

export function createProject(db: Db, name: string): Project {
  const now = Date.now()
  const id = randomUUID()
  db.prepare(
    `INSERT INTO projects (id, name, created_at, updated_at, plan, status)
     VALUES (?, ?, ?, ?, NULL, 'planning')`,
  ).run(id, name, now, now)
  return getProject(db, id)
}

export function getProject(db: Db, id: string): Project {
  const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as ProjectRow | undefined
  if (!row) throw new NotFoundError('project not found')
  return toProject(row, deriveBackgroundStatus(db, id))
}

export interface ProjectPatch {
  name?: string
  plan?: PlanBlock[] | null
  status?: ProjectStatus
}

/** Persist the project's on-disk working directory (set once, on first build). */
export function setArtifactDir(db: Db, projectId: string, dir: string): void {
  db.prepare(`UPDATE projects SET artifact_dir = ?, updated_at = ? WHERE id = ?`).run(
    dir,
    Date.now(),
    projectId,
  )
}

export function getArtifactDir(db: Db, projectId: string): string | null {
  const row = db.prepare(`SELECT artifact_dir FROM projects WHERE id = ?`).get(projectId) as
    | { artifact_dir: string | null }
    | undefined
  if (!row) throw new NotFoundError('project not found')
  return row.artifact_dir ?? null
}

/** Track the running dev-server PID (null when no server is up). */
export function setDevPid(db: Db, projectId: string, pid: number | null): void {
  db.prepare(`UPDATE projects SET dev_pid = ? WHERE id = ?`).run(pid, projectId)
}

export function getDevPid(db: Db, projectId: string): number | null {
  const row = db.prepare(`SELECT dev_pid FROM projects WHERE id = ?`).get(projectId) as
    | { dev_pid: number | null }
    | undefined
  return row?.dev_pid ?? null
}

/** Projects that have a real working directory (candidates for dev-server resume). */
export function listProjectsWithArtifacts(db: Db): { id: string; devPid: number | null }[] {
  const rows = db
    .prepare(`SELECT id, dev_pid FROM projects WHERE artifact_dir IS NOT NULL`)
    .all() as { id: string; dev_pid: number | null }[]
  return rows.map((r) => ({ id: r.id, devPid: r.dev_pid }))
}

/* --------------------------- Phase 4: modes, rail, management --------------------------- */

export function setProjectMode(db: Db, projectId: string, mode: ProjectMode): Project {
  const res = db
    .prepare(`UPDATE projects SET mode = ?, updated_at = ? WHERE id = ?`)
    .run(mode, Date.now(), projectId)
  if (res.changes === 0) throw new NotFoundError('project not found')
  return getProject(db, projectId)
}

export function setRailStep(db: Db, projectId: string, step: number): Project {
  const res = db
    .prepare(`UPDATE projects SET rail_step = ?, updated_at = ? WHERE id = ?`)
    .run(step, Date.now(), projectId)
  if (res.changes === 0) throw new NotFoundError('project not found')
  return getProject(db, projectId)
}

/** The celebration ran: rail finished, project lives on the Iterate board now. */
export function markRailComplete(db: Db, projectId: string): Project {
  const res = db
    .prepare(`UPDATE projects SET rail_complete = 1, mode = 'iterate', updated_at = ? WHERE id = ?`)
    .run(Date.now(), projectId)
  if (res.changes === 0) throw new NotFoundError('project not found')
  return getProject(db, projectId)
}

export function renameProject(db: Db, projectId: string, name: string): Project {
  const res = db
    .prepare(`UPDATE projects SET name = ?, updated_at = ? WHERE id = ?`)
    .run(name, Date.now(), projectId)
  if (res.changes === 0) throw new NotFoundError('project not found')
  return getProject(db, projectId)
}

/** Cascades to sessions, cards, feed, questions, build steps, fix comments, shelf items. */
export function deleteProject(db: Db, projectId: string): void {
  const res = db.prepare(`DELETE FROM projects WHERE id = ?`).run(projectId)
  if (res.changes === 0) throw new NotFoundError('project not found')
}

export function setImportFolder(db: Db, projectId: string, folder: string): void {
  db.prepare(`UPDATE projects SET import_folder = ?, updated_at = ? WHERE id = ?`).run(
    folder,
    Date.now(),
    projectId,
  )
}

/** Opaque renderer-shaped wizard UI blob; null clears it (wizard finished or abandoned). */
export function setWizardState(db: Db, projectId: string, state: string | null): void {
  const res = db.prepare(`UPDATE projects SET wizard_state = ? WHERE id = ?`).run(state, projectId)
  if (res.changes === 0) throw new NotFoundError('project not found')
}

export function getWizardState(db: Db, projectId: string): string | null {
  const row = db.prepare(`SELECT wizard_state FROM projects WHERE id = ?`).get(projectId) as
    | { wizard_state: string | null }
    | undefined
  if (!row) throw new NotFoundError('project not found')
  return row.wizard_state ?? null
}

/**
 * One-time mapping of pre-Phase-4 projects into the modes world (runs on every
 * launch after migrate(); idempotent):
 *  - finished projects → Iterate (their journey is over, the board is home)
 *  - in-progress projects → Build, positioned at the first not-done plan step
 */
export function mapLegacyProjects(db: Db): void {
  db.prepare(
    `UPDATE projects SET mode = 'iterate', rail_complete = 1
     WHERE status = 'done' AND rail_complete = 0 AND mode = 'build'`,
  ).run()

  const inProgress = db
    .prepare(
      `SELECT id, plan FROM projects
       WHERE status = 'building' AND mode = 'build' AND rail_step IS NULL AND plan IS NOT NULL`,
    )
    .all() as { id: string; plan: string }[]
  for (const p of inProgress) {
    let plan: PlanBlock[]
    try {
      plan = JSON.parse(p.plan) as PlanBlock[]
    } catch {
      continue
    }
    if (!Array.isArray(plan) || plan.length === 0) continue
    const done = db
      .prepare(
        `SELECT COUNT(*) AS n FROM cards
         WHERE project_id = ? AND source = 'plan_seed' AND status = 'done'`,
      )
      .get(p.id) as { n: number }
    const step = Math.min(done.n, plan.length - 1)
    db.prepare(`UPDATE projects SET rail_step = ? WHERE id = ?`).run(step, p.id)
  }
}

/** Assign sequential position values to the given project ids in one transaction.
 *  orderedIds must contain every project id (complete reorder). */
export function reorderProjects(db: Db, orderedIds: string[]): void {
  const update = db.prepare(`UPDATE projects SET position = ? WHERE id = ?`)
  const tx = db.transaction(() => {
    orderedIds.forEach((id, i) => {
      update.run(i, id)
    })
  })
  tx()
}

export function updateProject(db: Db, id: string, patch: ProjectPatch): Project {
  const existing = getProject(db, id)
  const name = patch.name ?? existing.name
  const plan = patch.plan !== undefined ? patch.plan : existing.plan
  const status = patch.status ?? existing.status
  db.prepare(`UPDATE projects SET name = ?, plan = ?, status = ?, updated_at = ? WHERE id = ?`).run(
    name,
    plan === null ? null : JSON.stringify(plan),
    status,
    Date.now(),
    id,
  )
  return getProject(db, id)
}
