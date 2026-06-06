import { randomUUID } from 'node:crypto'
import type { Card, CardStatus, CardType, CardSource, PlanBlock } from '../../shared/ipc-schemas'
import type { Db } from './connection'
import { InvalidTransitionError, NoCheckpointError, NotFoundError } from './errors'
import { toCard, type CardRow } from './mappers'

/** Allowed card status transitions (build-spine state machine).
 *  'waiting' (Phase 3) belongs to fix_comment cards only: filed → start fix →
 *  building. Queueing keeps the stored status at 'waiting' (queue is in-memory). */
const TRANSITIONS: Record<CardStatus, CardStatus[]> = {
  planned: ['up_next', 'building'],
  up_next: ['building', 'planned'],
  building: ['needs_you', 'done', 'failed', 'up_next'], // up_next: user stopped, resumable
  needs_you: ['building', 'failed'],
  failed: ['building', 'up_next'],
  done: ['building'], // re-open via flagged checkpoint
  waiting: ['building'],
}

/** Card reads carry the fix comment's renderer-safe dressing (type + page-ness)
 *  so a fix_comment card describes itself — the board never joins UI feeds. */
const CARD_SELECT = `SELECT c.*, fc.note_type AS fc_note_type, fc.pin_x AS fc_pin_x
   FROM cards c LEFT JOIN fix_comments fc ON fc.card_id = c.id`

export function getCard(db: Db, id: string): Card {
  const row = db.prepare(`${CARD_SELECT} WHERE c.id = ?`).get(id) as CardRow | undefined
  if (!row) throw new NotFoundError('card not found')
  return toCard(row)
}

export function listCards(db: Db, projectId: string): Card[] {
  const rows = db
    .prepare(`${CARD_SELECT} WHERE c.project_id = ? ORDER BY c.position ASC`)
    .all(projectId) as CardRow[]
  return rows.map(toCard)
}

function nextPosition(db: Db, projectId: string): number {
  const row = db
    .prepare(`SELECT COALESCE(MAX(position), -1) AS maxPos FROM cards WHERE project_id = ?`)
    .get(projectId) as { maxPos: number }
  return row.maxPos + 1
}

export function createCard(
  db: Db,
  projectId: string,
  type: CardType,
  title: string,
  source: CardSource = 'user_added',
  initialStatus: Extract<CardStatus, 'planned' | 'waiting'> = 'planned',
): Card {
  // FK guard: project must exist
  const exists = db.prepare(`SELECT 1 FROM projects WHERE id = ?`).get(projectId)
  if (!exists) throw new NotFoundError('project not found')
  const now = Date.now()
  const id = randomUUID()
  db.prepare(
    `INSERT INTO cards (id, project_id, type, title, status, source, position, depends_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)`,
  ).run(id, projectId, type, title, initialStatus, source, nextPosition(db, projectId), now, now)
  return getCard(db, id)
}

export function updateCardStatus(db: Db, id: string, status: CardStatus): Card {
  const card = getCard(db, id)
  if (card.status === status) return card
  if (!TRANSITIONS[card.status].includes(status)) {
    throw new InvalidTransitionError(card.status, status)
  }
  db.prepare(`UPDATE cards SET status = ?, updated_at = ? WHERE id = ?`).run(status, Date.now(), id)
  return getCard(db, id)
}

export function setCardSession(db: Db, id: string, sessionId: string): Card {
  getCard(db, id)
  db.prepare(`UPDATE cards SET session_id = ?, updated_at = ? WHERE id = ?`).run(
    sessionId,
    Date.now(),
    id,
  )
  return getCard(db, id)
}

/** Seed one feature card per plan block, in order, with generated step labels. */
export function seedCardsFromPlan(db: Db, projectId: string, plan: PlanBlock[]): Card[] {
  const total = plan.length
  const now = Date.now()
  const insert = db.prepare(
    `INSERT INTO cards (id, project_id, type, title, status, source, position, step_label, depends_on, created_at, updated_at)
     VALUES (?, ?, 'feature', ?, 'planned', 'plan_seed', ?, ?, '[]', ?, ?)`,
  )
  const ids: string[] = []
  const tx = db.transaction(() => {
    plan.forEach((block, i) => {
      const id = randomUUID()
      ids.push(id)
      insert.run(id, projectId, block.title, i, `Step ${i + 1} of ${total}: ${block.title}`, now, now)
    })
  })
  tx()
  return ids.map((id) => getCard(db, id))
}

export function updateCheckpoint(
  db: Db,
  id: string,
  verdict: 'approved' | 'flagged',
  flagNote?: string,
): Card {
  const card = getCard(db, id)
  if (!card.checkpoint || card.checkpoint.status !== 'pending') {
    throw new NoCheckpointError('card has no pending checkpoint')
  }
  const checkpoint = {
    ...card.checkpoint,
    status: verdict,
    ...(flagNote ? { flagNote } : {}),
  }
  db.prepare(`UPDATE cards SET checkpoint = ?, updated_at = ? WHERE id = ?`).run(
    JSON.stringify(checkpoint),
    Date.now(),
    id,
  )
  return getCard(db, id)
}

/** Set a pending checkpoint on a card (called when a session finishes). */
export function setPendingCheckpoint(db: Db, id: string, screenshotPath?: string): Card {
  getCard(db, id)
  const checkpoint = { status: 'pending' as const, ...(screenshotPath ? { screenshotPath } : {}) }
  db.prepare(`UPDATE cards SET checkpoint = ?, updated_at = ? WHERE id = ?`).run(
    JSON.stringify(checkpoint),
    Date.now(),
    id,
  )
  return getCard(db, id)
}

/** The card currently in the Building spotlight for a project, if any (Phase 1: at most one). */
export function findBuildingCard(db: Db, projectId: string): Card | null {
  const row = db
    .prepare(`SELECT * FROM cards WHERE project_id = ? AND status = 'building' LIMIT 1`)
    .get(projectId) as CardRow | undefined
  return row ? toCard(row) : null
}

/** Promote the lowest-position planned card to up_next (used after a card completes). */
export function promoteNextPlanned(db: Db, projectId: string): Card | null {
  const row = db
    .prepare(
      `SELECT * FROM cards WHERE project_id = ? AND status = 'planned' ORDER BY position ASC LIMIT 1`,
    )
    .get(projectId) as CardRow | undefined
  if (!row) return null
  return updateCardStatus(db, row.id, 'up_next')
}
