import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ipcMain } from '../core/transport'
import { ZodError } from 'zod'
import {
  CH,
  GetDecisionsRequest,
  GetProgressRequest,
  GetDocsRequest,
  DecisionEntry,
  ProgressEntry,
  type IpcError,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'

function mapError(e: unknown): IpcError {
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'db_read_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

type DecisionRow = {
  id: string
  session_id: string
  session_name: string
  card_id: string | null
  card_title: string | null
  question: string
  answer: string
  answered_at: number
}

type ProgressRow = {
  id: string
  session_id: string
  session_name: string
  card_id: string
  card_title: string
  step_label: string | null
  status: string
  started_at: number
  completed_at: number | null
}

export function registerHistoryBridge(db: Db): void {
  ipcMain.handle(CH.historyDecisions, (_e, raw: unknown) => {
    try {
      const { projectId } = GetDecisionsRequest.parse(raw)
      const rows = db
        .prepare(
          `SELECT q.id, q.session_id, s.name AS session_name, s.card_id,
                  c.title AS card_title, q.prompt AS question_json, q.answer, q.answered_at
           FROM question_queue q
           JOIN sessions s ON s.id = q.session_id
           LEFT JOIN cards c ON c.id = s.card_id
           WHERE s.project_id = ? AND q.status = 'answered'
           ORDER BY q.answered_at ASC`,
        )
        .all(projectId) as (DecisionRow & { question_json: string })[]
      const entries: DecisionEntry[] = rows
        .map((r) => {
          try {
            const prompt = JSON.parse(r.question_json) as { question?: string }
            return DecisionEntry.parse({
              id: r.id,
              sessionId: r.session_id,
              sessionName: r.session_name,
              cardId: r.card_id ?? null,
              cardTitle: r.card_title ?? null,
              question: prompt.question ?? '',
              answer: r.answer ?? '',
              answeredAt: r.answered_at,
            })
          } catch {
            return null
          }
        })
        .filter((e): e is DecisionEntry => e !== null)
      return { entries }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.historyProgress, (_e, raw: unknown) => {
    try {
      const { projectId } = GetProgressRequest.parse(raw)
      const rows = db
        .prepare(
          `SELECT bs.id, bs.session_id, s.name AS session_name, bs.card_id,
                  c.title AS card_title, c.step_label, bs.status, bs.started_at, bs.completed_at
           FROM build_steps bs
           JOIN sessions s ON s.id = bs.session_id
           JOIN cards c ON c.id = bs.card_id
           WHERE bs.project_id = ?
           ORDER BY bs.started_at ASC`,
        )
        .all(projectId) as ProgressRow[]
      const entries: ProgressEntry[] = rows.map((r) =>
        ProgressEntry.parse({
          id: r.id,
          sessionId: r.session_id,
          sessionName: r.session_name,
          cardId: r.card_id,
          cardTitle: r.card_title,
          cardStepLabel: r.step_label ?? null,
          status: r.status,
          startedAt: r.started_at,
          completedAt: r.completed_at ?? null,
        }),
      )
      return { entries }
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.historyDocs, (_e, raw: unknown) => {
    try {
      const { projectId } = GetDocsRequest.parse(raw)
      const row = db
        .prepare(`SELECT artifact_dir FROM projects WHERE id = ?`)
        .get(projectId) as { artifact_dir: string | null } | undefined
      if (!row?.artifact_dir) return { content: null }
      for (const name of ['README.md', 'readme.md', 'docs/README.md']) {
        try {
          const content = readFileSync(join(row.artifact_dir, name), 'utf-8')
          return { content }
        } catch {
          // not found, try next
        }
      }
      return { content: null }
    } catch (e) {
      return mapError(e)
    }
  })
}
