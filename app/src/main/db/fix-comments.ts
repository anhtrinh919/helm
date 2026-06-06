import type { BoundingBox, FixComment, FixCommentPin, NoteType } from '../../shared/ipc-schemas'
import type { Db } from './connection'
import { NotFoundError } from './errors'

/** Raw row shape as stored in SQLite. */
interface FixCommentRow {
  id: string
  card_id: string
  project_id: string
  selector: string | null
  bounding_box: string | null
  screenshot_crop: string | null
  pin_x: number | null
  pin_y: number | null
  note: string
  note_type: string
  created_at: number
}

function toFixComment(row: FixCommentRow): FixComment {
  let boundingBox: BoundingBox | null = null
  if (row.bounding_box != null) {
    try {
      boundingBox = JSON.parse(row.bounding_box) as BoundingBox
    } catch {
      boundingBox = null
    }
  }
  return {
    id: row.id,
    cardId: row.card_id,
    projectId: row.project_id,
    selector: row.selector,
    boundingBox,
    screenshotCrop: row.screenshot_crop,
    pinX: row.pin_x,
    pinY: row.pin_y,
    note: row.note,
    noteType: row.note_type as NoteType,
    createdAt: row.created_at,
  }
}

export interface CreateFixCommentInput {
  cardId: string
  projectId: string
  selector?: string
  boundingBox?: BoundingBox
  screenshotCrop?: string
  pinX?: number
  pinY?: number
  note: string
  noteType: NoteType
}

/** Insert a fix comment. Its id IS the paired card's id (1:1, navigable without joins). */
export function createFixComment(db: Db, input: CreateFixCommentInput): FixComment {
  db.prepare(
    `INSERT INTO fix_comments (id, card_id, project_id, selector, bounding_box, screenshot_crop, pin_x, pin_y, note, note_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.cardId,
    input.cardId,
    input.projectId,
    input.selector ?? null,
    input.boundingBox ? JSON.stringify(input.boundingBox) : null,
    input.screenshotCrop ?? null,
    input.pinX ?? null,
    input.pinY ?? null,
    input.note,
    input.noteType,
    Date.now(),
  )
  return getFixComment(db, input.cardId)
}

export function getFixComment(db: Db, cardId: string): FixComment {
  const row = db.prepare(`SELECT * FROM fix_comments WHERE card_id = ?`).get(cardId) as
    | FixCommentRow
    | undefined
  if (!row) throw new NotFoundError('fix comment not found')
  return toFixComment(row)
}

/** Renderer-safe pins for every UNRESOLVED comment (paired card not done).
 *  Never selects the screenshot or selector columns. */
export function listOpenPins(db: Db, projectId: string): FixCommentPin[] {
  const rows = db
    .prepare(
      `SELECT fc.card_id, fc.pin_x, fc.pin_y, fc.note_type
       FROM fix_comments fc
       JOIN cards c ON c.id = fc.card_id
       WHERE fc.project_id = ? AND c.status != 'done'
       ORDER BY fc.created_at ASC`,
    )
    .all(projectId) as Pick<FixCommentRow, 'card_id' | 'pin_x' | 'pin_y' | 'note_type'>[]
  return rows.map((r) => ({
    cardId: r.card_id,
    pinX: r.pin_x,
    pinY: r.pin_y,
    noteType: r.note_type as NoteType,
  }))
}

/** Explicit delete (cascade already covers card deletion; exposed for tests/cleanup). */
export function deleteFixComment(db: Db, cardId: string): void {
  db.prepare(`DELETE FROM fix_comments WHERE card_id = ?`).run(cardId)
}
