import { randomUUID } from 'node:crypto'
import type { BackgroundStatus, PlanBlock, Project, ProjectStatus } from '../../shared/ipc-schemas'
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
  // rowid DESC is a stable tiebreaker when two projects share an updated_at ms.
  const rows = db
    .prepare(`SELECT * FROM projects ORDER BY updated_at DESC, rowid DESC`)
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
