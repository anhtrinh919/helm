import { randomUUID } from 'node:crypto'
import type { BuildStep } from '../../shared/ipc-schemas'
import type { Db } from './connection'
import { NotFoundError } from './errors'
import { toBuildStep, type BuildStepRow } from './mappers'

/**
 * A build_step records one real-pipeline session producing real artifacts for a
 * card. Status walks running → complete | failed | snag. The dev URL is filled
 * in once the dev server is up (the DevServerManager owns that transition).
 */

function get(db: Db, id: string): BuildStep {
  const row = db.prepare(`SELECT * FROM build_steps WHERE id = ?`).get(id) as BuildStepRow | undefined
  if (!row) throw new NotFoundError('build step not found')
  return toBuildStep(row)
}

export function createBuildStep(db: Db, projectId: string, sessionId: string, cardId: string): BuildStep {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO build_steps (id, project_id, session_id, card_id, status, started_at, completed_at, dev_url)
     VALUES (?, ?, ?, ?, 'running', ?, NULL, NULL)`,
  ).run(id, projectId, sessionId, cardId, Date.now())
  return get(db, id)
}

export function completeBuildStep(db: Db, buildStepId: string, devUrl: string | null): BuildStep {
  db.prepare(
    `UPDATE build_steps SET status = 'complete', completed_at = ?, dev_url = ? WHERE id = ?`,
  ).run(Date.now(), devUrl, buildStepId)
  return get(db, buildStepId)
}

export function failBuildStep(db: Db, buildStepId: string): BuildStep {
  db.prepare(`UPDATE build_steps SET status = 'failed', completed_at = ? WHERE id = ?`).run(
    Date.now(),
    buildStepId,
  )
  return get(db, buildStepId)
}

export function snaggingBuildStep(db: Db, buildStepId: string): BuildStep {
  db.prepare(`UPDATE build_steps SET status = 'snag' WHERE id = ?`).run(buildStepId)
  return get(db, buildStepId)
}

export function getLatestBuildStep(db: Db, projectId: string): BuildStep | null {
  const row = db
    .prepare(`SELECT * FROM build_steps WHERE project_id = ? ORDER BY started_at DESC, rowid DESC LIMIT 1`)
    .get(projectId) as BuildStepRow | undefined
  return row ? toBuildStep(row) : null
}
