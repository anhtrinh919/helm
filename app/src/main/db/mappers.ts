import type {
  BackgroundStatus,
  BuildStep,
  Card,
  Checkpoint,
  DecisionPrompt,
  FeedEvent,
  PlanBlock,
  Project,
  QuestionQueueItem,
  Session,
} from '../../shared/ipc-schemas'

/** Raw row shapes as stored in SQLite (snake_case, JSON columns as text). */
export interface ProjectRow {
  id: string
  name: string
  created_at: number
  updated_at: number
  plan: string | null
  status: string
  artifact_dir: string | null
  dev_pid: number | null
}
export interface BuildStepRow {
  id: string
  project_id: string
  session_id: string
  card_id: string
  status: string
  started_at: number
  completed_at: number | null
  dev_url: string | null
}
export interface CardRow {
  id: string
  project_id: string
  type: string
  title: string
  status: string
  source: string
  position: number
  step_label: string | null
  depends_on: string | null
  created_at: number
  updated_at: number
  session_id: string | null
  decision_prompt: string | null
  checkpoint: string | null
}
export interface SessionRow {
  id: string
  project_id: string
  card_id: string | null
  name: string
  status: string
  started_at: number
  ended_at: number | null
  resumed_at: number | null
}
export interface FeedEventRow {
  id: string
  session_id: string
  kind: string
  text: string
  raw_payload: string | null
  ref_id: string | null
  created_at: number
}
export interface QuestionRow {
  id: string
  session_id: string
  prompt: string
  status: string
  answer: string | null
  position: number
  created_at: number
  answered_at: number | null
}

function parse<T>(json: string | null, fallback: T): T {
  if (json == null) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export function toProject(row: ProjectRow, backgroundStatus: BackgroundStatus): Project {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    plan: parse<PlanBlock[] | null>(row.plan, null),
    status: row.status as Project['status'],
    backgroundStatus,
    artifactDir: row.artifact_dir ?? null,
  }
}

export function toBuildStep(row: BuildStepRow): BuildStep {
  return {
    id: row.id,
    projectId: row.project_id,
    sessionId: row.session_id,
    cardId: row.card_id,
    status: row.status as BuildStep['status'],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    devUrl: row.dev_url,
  }
}

export function toCard(row: CardRow): Card {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type as Card['type'],
    title: row.title,
    status: row.status as Card['status'],
    source: row.source as Card['source'],
    position: row.position,
    stepLabel: row.step_label,
    dependsOn: parse<string[]>(row.depends_on, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sessionId: row.session_id,
    decisionPrompt: parse<DecisionPrompt | null>(row.decision_prompt, null),
    checkpoint: parse<Checkpoint | null>(row.checkpoint, null),
  }
}

export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    projectId: row.project_id,
    cardId: row.card_id,
    name: row.name,
    status: row.status as Session['status'],
    startedAt: row.started_at,
    endedAt: row.ended_at,
    resumedAt: row.resumed_at,
  }
}

export function toFeedEvent(row: FeedEventRow): FeedEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    kind: row.kind as FeedEvent['kind'],
    text: row.text,
    refId: row.ref_id,
    createdAt: row.created_at,
  }
}

export function toQuestion(row: QuestionRow): QuestionQueueItem {
  return {
    id: row.id,
    sessionId: row.session_id,
    prompt: parse<DecisionPrompt>(row.prompt, { type: 'freetext', question: '' }),
    status: row.status as QuestionQueueItem['status'],
    answer: row.answer,
    position: row.position,
    createdAt: row.created_at,
    answeredAt: row.answered_at,
  }
}
