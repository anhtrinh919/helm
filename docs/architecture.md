> Agent context — not for human reading.

# Architecture — Helm

## Tech Stack (from tech-stack.md)

- **Language:** TypeScript (strict)
- **Desktop shell:** Electron
- **Frontend:** React + Tailwind CSS
- **State management:** Zustand
- **Build tool:** Vite
- **Local database:** SQLite via better-sqlite3
- **Claude engine:** @anthropic-ai/claude-agent-sdk (bring-your-own-subscription)
- **IPC:** Electron contextBridge + typed channels; Zod validates all messages
- **Distribution:** macOS .dmg via electron-builder + GitHub Releases
- **Testing:** Vitest (unit), Playwright with electron driver (E2E)

## Process Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Renderer (React + Zustand)                             │
│  board.ts · feed.ts · projects.ts · wizard.ts stores   │
│  preview.ts store (Phase 2 — PreviewState per project) │
│  Components: FrontDoor, Rail, ProjectSwitcher,          │
│              Board, SessionFeed, Wizard,                │
│              LivePreview (<webview> + state overlays),  │
│              AnnotationLayer (SVG overlay, Ph3),        │
│              CommentPin + CommentShelf (Ph3)            │
└───────────────────┬─────────────────────────────────────┘
                    │ contextBridge (Zod-validated IPC)
                    │ ipc-schemas.ts ← single source of truth
┌───────────────────┴─────────────────────────────────────┐
│  Main Process (Node/Electron)                           │
│                                                         │
│  IPC handlers                                           │
│  ├── data-bridge.ts      (projects, cards, sessions)   │
│  ├── feed-bridge.ts      (feed events, questions)      │
│  ├── session-bridge.ts   (start, steer, answer)        │
│  ├── wizard-bridge.ts    (scoping, approve)            │
│  ├── preview-bridge.ts   (preview:get-state,           │
│  │                         devserver:start/stop)        │
│  └── fix-session-bridge.ts (comments:*, Ph3)           │
│                                                         │
│  SDK layer                                              │
│  ├── session-runner.ts   (wraps SDK query(), streams)  │
│  ├── session-orchestrator.ts  (smart-pausing, steer)   │
│  ├── wizard-orchestrator.ts   (scoping Q&A loop)       │
│  ├── event-transformer.ts     (HARD GATE — strips code)│
│  ├── json-extract.ts          (structured data from LLM│
│  └── dev-server-manager.ts    (Phase 2 — child-process │
│                                 lifecycle; PID registry;│
│                                 start/stop/restart)     │
│                                                         │
│  DB layer                                               │
│  ├── connection.ts       (better-sqlite3, migrations)  │
│  ├── migrations.ts       (schema v1, v2, v3)           │
│  ├── projects.ts         (CRUD + artifact_dir/dev_pid) │
│  ├── cards.ts            (CRUD + status transitions)   │
│  ├── sessions.ts         (CRUD + feed events)          │
│  ├── feed-events.ts      (append + backfill)           │
│  ├── question-queue.ts   (enqueue + answer)            │
│  ├── build-steps.ts      (Phase 2 — running/complete/  │
│  │                         failed/snag per session)    │
│  └── mappers.ts          (DB row → IPC-safe shape)     │
└─────────────────────────────────────────────────────────┘
              │
              │ SDK calls (pathToClaudeCodeExecutable required)
              │ + real tools (Bash, Write, Edit) → artifact_dir
              ▼
    @anthropic-ai/claude-agent-sdk
    (bring-your-own Claude subscription)
```

**The event-transformer hard gate** is the single most important architectural element in Phase 1. Every byte of SDK output that could contain code, file paths, terminal text, or developer metadata is intercepted here before reaching the renderer. The gate transforms raw SDK events into one of 7 feed event kinds: `narration`, `activity`, `decision_prompt`, `steering`, `checkpoint`, `summary`, `error`, `stopped`.

## Data Model

### Projects
```
projects (id TEXT PK, name TEXT, created_at INTEGER, updated_at INTEGER,
          plan JSON, status TEXT, background_status TEXT)
```

### Cards
```
cards (id TEXT PK, project_id TEXT FK, type TEXT, title TEXT,
       status TEXT, source TEXT, position INTEGER, step_label TEXT,
       depends_on JSON, created_at INTEGER, updated_at INTEGER,
       session_id TEXT FK, decision_prompt JSON, checkpoint JSON)
```

### Sessions
```
sessions (id TEXT PK, project_id TEXT FK, card_id TEXT FK, name TEXT,
          status TEXT, started_at INTEGER, ended_at INTEGER, resumed_at INTEGER)
```

### Feed Events
```
feed_events (id TEXT PK, session_id TEXT FK, kind TEXT, text TEXT,
             ref_id TEXT, options JSON, created_at INTEGER)
```

### Question Queue
```
question_queue (id TEXT PK, session_id TEXT FK, prompt JSON,
                status TEXT, answer TEXT, position INTEGER,
                created_at INTEGER, answered_at INTEGER)
```

### Build Steps (Phase 2)
```
build_steps (id TEXT PK, project_id TEXT FK, session_id TEXT FK,
             card_id TEXT FK, status TEXT,  -- 'running'|'complete'|'failed'|'snag'
             started_at INTEGER, completed_at INTEGER, dev_url TEXT)
```

### Comments (Phase 3)
```
comments (id TEXT PK, project_id TEXT FK, type TEXT -- 'comment'|'bug'|'tweak',
          x REAL, y REAL, element_selector TEXT,
          screenshot_data_url TEXT, text TEXT,
          status TEXT -- 'open'|'in_progress'|'resolved',
          session_id TEXT FK, created_at INTEGER, resolved_at INTEGER)
```

### Projects (Phase 2 additions)
Two new columns added via migration 3:
```
projects.artifact_dir TEXT  -- absolute path to per-project working directory (null until first build)
projects.dev_pid      INTEGER  -- PID of running dev server child process (null when not running)
```

## Key Components

### Renderer

| Component | Role |
|-----------|------|
| `FrontDoor.tsx` | Landing screen — shown when no project is active; entry point to New Project Wizard |
| `Rail.tsx` | Left-side dark rail — project list, switcher, status indicators |
| `ProjectSwitcher.tsx` | Inline project picker overlay |
| `board/` | Build-spine board — columns (planned, up_next, building, done), card rendering |
| `session/` | Session feed panel — live narration stream, decision cards, checkpoint review |
| `wizard/` | New Project Wizard — multi-step scoping conversation to a plan |
| `preview/` | Live Preview tab — `<webview>` embed + five-state overlay (none/building/live/snag/blocked) |

### Main Process

| Module | Role |
|--------|------|
| `event-transformer.ts` | Hard gate: strips all developer-facing content; maps SDK events to feed event kinds |
| `session-orchestrator.ts` | Manages session lifecycle: start → smart-pause on decision → resume on answer → end |
| `wizard-orchestrator.ts` | Drives scoping Q&A: prompt → stream → extract question or plan → reply to IPC |
| `session-runner.ts` | Thin SDK wrapper: calls `query()` with correct `pathToClaudeCodeExecutable`, streams events |
| `json-extract.ts` | Extracts first valid JSON object from LLM streaming text |
| `dev-server-manager.ts` | Singleton — owns dev server child-process lifecycle; start/stop/restart; PID registry; pushes `preview:update` on state changes |
