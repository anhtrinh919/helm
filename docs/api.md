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

## Phase 2 — IPC Channels (Watch It Get Made)

All new channels follow the same patterns as Phase 1: typed in `ipc-schemas.ts`, registered in `src/main/ipc/`, exposed via contextBridge, consumed via `src/renderer/src/bridge.ts`.

### Invoke channels (renderer → main, returns result)

| Channel | Request | Success response | Error conditions |
|---------|---------|-----------------|-----------------|
| `preview:get-state` | `{ projectId: string }` | `{ state: PreviewState }` | `not_found`; `db_unavailable` |
| `devserver:start` | `{ projectId: string }` | `{ url: string }` | `not_found`; `no_artifact`; `already_running`; `start_failed` |
| `devserver:stop` | `{ projectId: string }` | `{ stopped: true }` | `not_found`; `not_running` |
| `sessions:start` (extended) | unchanged | unchanged | + `artifact_dir_failed` (new Phase 2 error) |

### Push channels (main → renderer, no reply)

| Channel | Payload | When emitted |
|---------|---------|-------------|
| `preview:update` | `{ projectId: string, state: PreviewState }` | Whenever preview state changes for a project (build starts, step completes, server goes live, snag/block/recovery) |

### PreviewState union

| Status | Payload fields | Meaning |
|--------|---------------|---------|
| `none` | — | No runnable artifact yet |
| `building` | — | A build session is actively in progress |
| `live` | `url: string` | Dev server is running; url is e.g. `http://localhost:3000` |
| `snag` | — | Agent hit an auto-recoverable error; recovering automatically |
| `blocked` | — | Truly blocking error; a Needs-you card has been raised on the board |

### sessions:start extension (Phase 2)

No new channel. When `sessions:start` is called for a project with an existing `artifact_dir`, the main process runs the session with a real working directory and full tools enabled instead of `tmpdir()` / `allowedTools: []`. Request/response shapes are unchanged. The extension is transparent to the renderer.

---

## Phase 3 — IPC Channels (Point and Fix)

All new channels follow the same patterns as prior phases: typed in `ipc-schemas.ts`, registered in `src/main/ipc/`, exposed via contextBridge.

### Invoke channels (renderer → main, returns result)

| Channel | Request | Success response | Error conditions |
|---------|---------|-----------------|-----------------|
| `comments:create` | `{ projectId, type, x, y, elementSelector?, screenshotDataUrl?, text }` | `Comment` | Project not found; invalid type; DB write failure |
| `comments:list` | `{ projectId }` | `Comment[]` | Project not found; DB read failure |
| `comments:get` | `{ commentId }` | `Comment` | Comment not found |
| `comments:resolve` | `{ commentId, sessionId }` | `Comment` | Comment not found; already resolved |
| `comments:start-fix-session` | `{ commentId }` | `{ sessionId: string }` | Comment not found; project not found; fix session already active |

### Comment type

```
comments (id TEXT PK, project_id TEXT FK, type TEXT -- 'comment'|'bug'|'tweak',
          x REAL, y REAL, element_selector TEXT,
          screenshot_data_url TEXT, text TEXT,
          status TEXT -- 'open'|'in_progress'|'resolved',
          session_id TEXT FK, created_at INTEGER, resolved_at INTEGER)
```

### Push channels (main → renderer, no reply)

| Channel | Payload | When emitted |
|---------|---------|-------------|
| `comment:update` | `{ projectId, comment: Comment }` | When a comment status changes (open → in_progress → resolved) |

---

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
