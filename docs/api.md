> Agent context — not for human reading.

# API Surface — *(Updated per phase)*

## Phase 1 — IPC Channels (Electron contextBridge)

All channels use Zod-validated request/response shapes defined in `app/src/shared/ipc-schemas.ts`. The renderer never receives raw SDK payloads — every value crossing the IPC boundary is transformed and validated.

### Invoke channels (renderer → main, returns result)

| Channel | Request | Success response | Error conditions |
|---------|---------|-----------------|-----------------|
| `projects:list` | `{}` | `Project[]` | DB read failure → `IpcError` |
| `projects:create` | `{ name: string }` | `Project` | Name empty/too long; DB write failure |
| `projects:get` | `{ projectId: string }` | `Project` | Project not found |
| `cards:create` | `{ projectId, type, title }` | `Card` | Project not found; title too long; DB write failure |
| `cards:update-status` | `{ cardId, status }` | `Card` | Card not found; invalid status transition |
| `cards:approve-checkpoint` | `{ cardId, verdict, flagNote? }` | `Card` | Card not found; no checkpoint on card |
| `sessions:reopen-question` | `{ sessionId, questionId }` | `QuestionQueueItem` | Session not found; question not found |
| `sessions:get-feed` | `{ sessionId, afterId? }` | `{ events: FeedEvent[] }` | Session not found |
| `sessions:start` | `{ projectId, cardId }` | `{ sessionId: string }` | Project not found; card not found; session already active |
| `sessions:steer` | `{ sessionId, mode, text }` | `{}` | Session not found; session not active; steer mode invalid |
| `sessions:answer-decision` | `{ sessionId, questionId, answer }` | `{}` | Session/question not found; question already answered |
| `sessions:get-questions` | `{ sessionId }` | `QuestionQueueItem[]` | Session not found |
| `wizard:start-scoping` | `{ projectId, idea }` | `WizardScopingResponse` | Project not found; scoping already active |
| `wizard:answer-question` | `{ sessionId, answer }` | `WizardScopingResponse` | Session not found; no pending question |
| `wizard:approve-plan` | `{ projectId, name, plan }` | `Project` | Project not found; plan empty; DB write failure |

### Push channels (main → renderer, no reply)

| Channel | Payload | When emitted |
|---------|---------|-------------|
| `feed:event` | `{ sessionId, event: FeedEvent }` | On every session feed event (narration, activity, decision_prompt, checkpoint, summary, error, stopped) |
| `board:update` | `{ projectId, cardId, card: Card }` | On any card status change |
| `project:background-status` | `{ projectId, backgroundStatus }` | When a session starts, pauses for decision, completes, or fails |
| `question:update` | `{ sessionId, question: QuestionQueueItem }` | When a question is enqueued or answered |

### Feed event kinds

| Kind | When used |
|------|-----------|
| `narration` | Human-readable summary of what the agent is doing |
| `activity` | Brief working indicator ("thinking…", "reviewing…") |
| `decision_prompt` | Agent needs user input — carries `refId` to question queue item |
| `steering` | User-sent steering message echoed back into feed |
| `checkpoint` | Agent signals a reviewable result — carries `refId` to card |
| `summary` | Session wrap-up summary |
| `error` | Session-level error (recoverable) |
| `stopped` | Calm end-state when user stops a session mid-flight |
