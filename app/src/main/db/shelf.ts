import { randomUUID } from 'node:crypto'
import type { Card, ShelfItem } from '../../shared/ipc-schemas'
import { createCard } from './cards'
import type { Db } from './connection'
import { NotFoundError } from './errors'
import type { ShelfRow } from './mappers'

/** The Phase 4 "For later" shelf — parked mid-rail requests. */

function toShelfItem(row: ShelfRow): ShelfItem {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    source: row.source,
    createdAt: row.created_at,
  }
}

export function listShelfItems(db: Db, projectId: string): ShelfItem[] {
  const exists = db.prepare(`SELECT 1 FROM projects WHERE id = ?`).get(projectId)
  if (!exists) throw new NotFoundError('project not found')
  const rows = db
    .prepare(`SELECT * FROM shelf_items WHERE project_id = ? ORDER BY created_at DESC, rowid DESC`)
    .all(projectId) as ShelfRow[]
  return rows.map(toShelfItem)
}

export function addShelfItem(
  db: Db,
  projectId: string,
  title: string,
  source = 'user_triage',
): ShelfItem {
  const exists = db.prepare(`SELECT 1 FROM projects WHERE id = ?`).get(projectId)
  if (!exists) throw new NotFoundError('project not found')
  const id = randomUUID()
  db.prepare(
    `INSERT INTO shelf_items (id, project_id, title, source, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, projectId, title, source, Date.now())
  const row = db.prepare(`SELECT * FROM shelf_items WHERE id = ?`).get(id) as ShelfRow
  return toShelfItem(row)
}

export function removeShelfItem(db: Db, itemId: string): void {
  const res = db.prepare(`DELETE FROM shelf_items WHERE id = ?`).run(itemId)
  if (res.changes === 0) throw new NotFoundError('shelf item not found')
}

/** Promote a parked item to a real board card (atomic: card created, item removed). */
export function promoteShelfItem(db: Db, itemId: string, projectId: string): Card {
  const row = db
    .prepare(`SELECT * FROM shelf_items WHERE id = ? AND project_id = ?`)
    .get(itemId, projectId) as ShelfRow | undefined
  if (!row) throw new NotFoundError('shelf item not found')
  const promote = db.transaction(() => {
    const card = createCard(db, projectId, 'feature', row.title, 'user_added')
    db.prepare(`DELETE FROM shelf_items WHERE id = ?`).run(itemId)
    return card
  })
  return promote()
}
