import { randomUUID } from 'node:crypto'
import type { DecisionPrompt, QuestionQueueItem } from '../../shared/ipc-schemas'
import type { Db } from './connection'
import { CannotReopenError, NotFoundError } from './errors'
import { toQuestion, type QuestionRow } from './mappers'

function get(db: Db, id: string): QuestionQueueItem {
  const row = db.prepare(`SELECT * FROM question_queue WHERE id = ?`).get(id) as
    | QuestionRow
    | undefined
  if (!row) throw new NotFoundError('question not found')
  return toQuestion(row)
}

export function createQuestion(
  db: Db,
  sessionId: string,
  prompt: DecisionPrompt,
  position: number,
): QuestionQueueItem {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO question_queue (id, session_id, prompt, status, position, created_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`,
  ).run(id, sessionId, JSON.stringify(prompt), position, Date.now())
  return get(db, id)
}

export function listQuestions(db: Db, sessionId: string): QuestionQueueItem[] {
  const rows = db
    .prepare(`SELECT * FROM question_queue WHERE session_id = ? ORDER BY position ASC`)
    .all(sessionId) as QuestionRow[]
  return rows.map(toQuestion)
}

export function nextPosition(db: Db, sessionId: string): number {
  const row = db
    .prepare(`SELECT COALESCE(MAX(position), -1) AS maxPos FROM question_queue WHERE session_id = ?`)
    .get(sessionId) as { maxPos: number }
  return row.maxPos + 1
}

export function answerQuestion(db: Db, id: string, answer: string): QuestionQueueItem {
  get(db, id) // existence
  db.prepare(
    `UPDATE question_queue SET status = 'answered', answer = ?, answered_at = ? WHERE id = ?`,
  ).run(answer, Date.now(), id)
  return get(db, id)
}

/** Re-open an answered question. State machine: pending → answered → reopened → answered. */
export function reopenQuestion(db: Db, id: string): QuestionQueueItem {
  const q = get(db, id)
  if (q.status === 'pending') throw new CannotReopenError('question is still pending')
  db.prepare(`UPDATE question_queue SET status = 'reopened' WHERE id = ?`).run(id)
  return get(db, id)
}
