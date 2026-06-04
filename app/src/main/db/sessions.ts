import { randomUUID } from 'node:crypto'
import type { Session, SessionStatus } from '../../shared/ipc-schemas'
import type { Db } from './connection'
import { NotFoundError } from './errors'
import { toSession, type SessionRow } from './mappers'

export function getSession(db: Db, id: string): Session {
  const row = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as SessionRow | undefined
  if (!row) throw new NotFoundError('session not found')
  return toSession(row)
}

export function createSession(
  db: Db,
  projectId: string,
  cardId: string | null,
  name: string,
): Session {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO sessions (id, project_id, card_id, name, status, started_at)
     VALUES (?, ?, ?, ?, 'active', ?)`,
  ).run(id, projectId, cardId, name, Date.now())
  return getSession(db, id)
}

export function updateSessionStatus(db: Db, id: string, status: SessionStatus): Session {
  getSession(db, id)
  const ended = status === 'done' || status === 'failed' || status === 'error' ? Date.now() : null
  db.prepare(`UPDATE sessions SET status = ?, ended_at = ? WHERE id = ?`).run(status, ended, id)
  return getSession(db, id)
}

export function setResumedAt(db: Db, id: string, timestamp: number): Session {
  getSession(db, id)
  db.prepare(`UPDATE sessions SET resumed_at = ? WHERE id = ?`).run(timestamp, id)
  return getSession(db, id)
}

/**
 * On app launch: any session still marked 'active' was interrupted by a quit.
 * Stamp resumed_at so the rail can show it as in-progress. Returns the recovered sessions.
 */
export function recoverActiveSessions(db: Db, timestamp: number): Session[] {
  const rows = db
    .prepare(`SELECT * FROM sessions WHERE status = 'active'`)
    .all() as SessionRow[]
  const update = db.prepare(`UPDATE sessions SET resumed_at = ? WHERE id = ?`)
  const tx = db.transaction(() => {
    for (const r of rows) update.run(timestamp, r.id)
  })
  tx()
  return rows.map((r) => ({ ...toSession(r), resumedAt: timestamp }))
}
