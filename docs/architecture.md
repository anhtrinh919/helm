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
│  Components: FrontDoor, Rail, ProjectSwitcher,          │
│              Board, SessionFeed, Wizard                 │
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
│  └── wizard-bridge.ts    (scoping, approve)            │
│                                                         │
│  SDK layer                                              │
│  ├── session-runner.ts   (wraps SDK query(), streams)  │
│  ├── session-orchestrator.ts  (smart-pausing, steer)   │
│  ├── wizard-orchestrator.ts   (scoping Q&A loop)       │
│  ├── event-transformer.ts     (HARD GATE — strips code)│
│  └── json-extract.ts          (structured data from LLM│
│                                                         │
│  DB layer                                               │
│  ├── connection.ts       (better-sqlite3, migrations)  │
│  ├── migrations.ts       (schema v1)                   │
│  ├── projects.ts         (CRUD)                        │
│  ├── cards.ts            (CRUD + status transitions)   │
│  ├── sessions.ts         (CRUD + feed events)          │
│  ├── feed-events.ts      (append + backfill)           │
│  ├── question-queue.ts   (enqueue + answer)            │
│  └── mappers.ts          (DB row → IPC-safe shape)     │
└─────────────────────────────────────────────────────────┘
              │
              │ SDK calls (pathToClaudeCodeExecutable required)
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

### Main Process

| Module | Role |
|--------|------|
| `event-transformer.ts` | Hard gate: strips all developer-facing content; maps SDK events to feed event kinds |
| `session-orchestrator.ts` | Manages session lifecycle: start → smart-pause on decision → resume on answer → end |
| `wizard-orchestrator.ts` | Drives scoping Q&A: prompt → stream → extract question or plan → reply to IPC |
| `session-runner.ts` | Thin SDK wrapper: calls `query()` with correct `pathToClaudeCodeExecutable`, streams events |
| `json-extract.ts` | Extracts first valid JSON object from LLM streaming text |
