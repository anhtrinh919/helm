import type { FeedEvent } from '../../shared/ipc-schemas'
import type { Db } from './connection'
import { toFeedEvent, type FeedEventRow } from './mappers'

/** Persist a transformed feed event. rawPayload is stored for debugging only — never sent to the renderer. */
export function appendEvent(
  db: Db,
  event: FeedEvent,
  rawPayload?: string | null,
): FeedEvent {
  db.prepare(
    `INSERT INTO feed_events (id, session_id, kind, text, raw_payload, ref_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    event.id,
    event.sessionId,
    event.kind,
    event.text,
    rawPayload ?? null,
    event.refId ?? null,
    event.createdAt,
  )
  return event
}

export function getEvents(db: Db, sessionId: string, afterId?: string): FeedEvent[] {
  let rows: FeedEventRow[]
  if (afterId) {
    const after = db
      .prepare(`SELECT created_at FROM feed_events WHERE id = ?`)
      .get(afterId) as { created_at: number } | undefined
    const cutoff = after?.created_at ?? 0
    rows = db
      .prepare(
        `SELECT * FROM feed_events WHERE session_id = ? AND created_at > ? ORDER BY created_at ASC`,
      )
      .all(sessionId, cutoff) as FeedEventRow[]
  } else {
    rows = db
      .prepare(`SELECT * FROM feed_events WHERE session_id = ? ORDER BY created_at ASC`)
      .all(sessionId) as FeedEventRow[]
  }
  return rows.map(toFeedEvent)
}
