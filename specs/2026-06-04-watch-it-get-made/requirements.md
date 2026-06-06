# Watch It Get Made Requirements

---
phase: 2
type: feature
ui: true
---

## Phase type

**`feature`** — extends the existing Phase 1 product. Follows existing codebase patterns: typed contextBridge IPC channels in `ipc-schemas.ts`, Zustand stores in renderer, SQLite via better-sqlite3 in main process, the hard event-transformer gate. Only invents what the two new capabilities require: a real build pipeline and a live preview pane.

## Scope

Phase 2 delivers two stacked capabilities. First, build sessions now run with real tools enabled — the agent writes a genuine, runnable full-stack web app to a stable per-project directory on the user's machine. Previously sessions ran with `allowedTools: []` and wrote nothing; now they produce real artifacts. Second, the stub Live Preview tab (F29 in `pencil/v0.1.pen`, id `UlIIY`) becomes a live embedded preview of that running app: the user watches the app get built and can click around and use it, all within the Helm window. The hard event-transformer gate that prevents raw code, file paths, and tool output from reaching the renderer is extended — not weakened — to handle the new volume of real file-writing tool calls. On completion, a non-developer opens the Live Preview tab, sees the app running live, and can interact with it as it is built — the Phase 2 headline.

## User Stories

1. As a builder, when my build session runs, the agent writes a real, runnable full-stack web app to my machine — not a narration — so something usable is actually being created.
   [Steer the build (core loop), Step 2]

2. As a builder, I can open the Live Preview tab and see the app I'm building actually running in the Helm window, so I can watch it get made.
   [Steer the build (core loop), Step 2] — **PRIMARY**

3. As a builder, I can click around and use the running app inside the Live Preview pane, so I can try what's been built so far.
   [Steer the build (core loop), Step 2] — **PRIMARY**

4. As a builder, while a build step is mid-flight, the preview shows a calm "building…" veil instead of a broken or half-rendered screen, so it never feels alarming.
   [Steer the build (core loop), Step 2]

5. As a builder, the preview refreshes to the latest working version when a build step completes, so I always see the most current progress, not a stale version.
   [Steer the build (core loop), Step 2]

6. As a builder, when the build hits a snag the agent can fix itself, the preview calmly shows it's being handled and then recovers automatically, so I do not have to intervene.
   [Steer the build (core loop), Step 2]

7. As a builder, when the build hits a truly blocking problem or one that needs my decision, it appears as a card on the board I can act on — using the same Needs-you / decision card surface from Phase 1 — so I stay in control.
   [Steer the build (core loop), Step 3]

8. As a builder, my project is saved automatically to my machine without my seeing files or paths, and reopening Helm resumes the project and its preview, so everything persists between sessions.
   [Steer the build (core loop), Step 1]

## UI Requirements

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Live Preview tab | No preview yet (before first build produces a runnable app) | Calm "nothing to show yet" illustration; short label ("Your app will appear here as it's built"); no error chrome | Wait or start a session |
| Live Preview tab | Building veil (mid-flight step in progress) | Soft overlay over the embedded webview area; "Building…" label; calm, not alarming; subtle animated indicator | Watch; no action required |
| Live Preview tab | Live app running | Full-area embedded webview showing the locally running dev server; no Helm chrome inside the webview; user can interact directly with the app | Click, type, navigate inside the running app |
| Live Preview tab | Snag — auto-recovering | Overlay: "Hit a snag, fixing it" label; calm indicator; no user action needed | Watch |
| Live Preview tab | Blocked (truly blocking error) | Calm blocked-state overlay in preview; simultaneously: board promotes a needs-you / decision card (reused Phase 1 F12 / F22 surface) | Answer the board card |
| Build-Spine Board | Needs-you / decision card for blocking build error | Reuse existing Phase 1 Needs-you headline and decision prompt cards (F12, F22, F25, F26); no new surface | Answer inline from board |

## Data Model

New columns and tables added via a numbered DB migration (migration 3). Existing tables are not modified except for the two new columns on `projects`.

```
projects (extended — 2 new columns)
- artifact_dir:  TEXT    — absolute path to the per-project working directory (null until first build step runs)
- dev_pid:       INTEGER — PID of the running dev server child process (null when not running)
```

```
build_steps  (new table)
- id:            TEXT PRIMARY KEY   — UUID
- project_id:    TEXT NOT NULL      — FK → projects.id ON DELETE CASCADE
- session_id:    TEXT NOT NULL      — FK → sessions.id ON DELETE CASCADE
- card_id:       TEXT NOT NULL      — FK → cards.id ON DELETE CASCADE
- status:        TEXT NOT NULL      — 'running' | 'complete' | 'failed' | 'snag'
- started_at:    INTEGER NOT NULL   — Unix epoch ms
- completed_at:  INTEGER            — null while running or failed
- dev_url:       TEXT               — local URL of running dev server (e.g. http://localhost:3000); null until server is up
```

Note: `artifact_dir` is never surfaced to the user. All user-facing persistence signals are: the preview pane showing the running app, and the board card states.

## API Contracts

This is an Electron app. All IPC uses named channels via contextBridge. Phase 2 adds the following channels. All existing Phase 1 channels remain unchanged.

### preview:get-state

**Direction:** renderer invokes → main handles
**Purpose:** renderer requests the current preview state for a project (e.g. on tab open or app resume).
**Request:** `{ projectId: string }`
**Success response:** `{ state: PreviewState }` where `PreviewState` is one of:
- `{ status: 'none' }` — no runnable artifact yet
- `{ status: 'building' }` — a build step is in progress
- `{ status: 'live', url: string }` — dev server is running; `url` is e.g. `http://localhost:3000`
- `{ status: 'snag' }` — agent hit an auto-recoverable error; recovering
- `{ status: 'blocked' }` — truly blocking error; board card has been raised
**Error responses:**
- `{ error: 'not_found' }` — no project with that id
- `{ error: 'db_unavailable', message: string }` — SQLite not accessible

### preview:update (push — main → renderer)

**Direction:** main pushes to renderer whenever preview state changes for any project
**Payload:** `{ projectId: string, state: PreviewState }` (same `PreviewState` union as above)
**Renderer action:** update preview store for the project; if `status === 'live'`, load `url` into webview; if not live, show the appropriate veil/overlay

### devserver:start

**Direction:** renderer invokes → main handles (starts or restarts the dev server for a project)
**Request:** `{ projectId: string }`
**Success response:** `{ url: string }` — the local URL the dev server is listening on
**Error responses:**
- `{ error: 'not_found' }` — project not found
- `{ error: 'no_artifact' }` — no runnable artifact exists yet (build has not produced anything)
- `{ error: 'already_running', url: string }` — dev server already running; returns existing URL
- `{ error: 'start_failed', message: string }` — dev server process failed to start or did not bind in time

### devserver:stop

**Direction:** renderer invokes → main handles
**Request:** `{ projectId: string }`
**Success response:** `{ stopped: true }`
**Error responses:**
- `{ error: 'not_found' }` — project not found
- `{ error: 'not_running' }` — no dev server running for this project

### sessions:start (extended — same channel, extended options)

The existing `sessions:start` IPC channel is extended. In Phase 2, when `sessions:start` is called for a card under an active project (one that already has or is building an artifact), the main process starts the session with a real working directory (`artifact_dir`) and full tools enabled, instead of `tmpdir()` and `allowedTools: []`. The request and response shapes are unchanged. The extension is invisible to the renderer.

**No new channel is introduced** — this is a main-process-only behavior change gated on whether `artifact_dir` is set for the project.

**Error responses (new for Phase 2):**
- `{ error: 'artifact_dir_failed', message: string }` — could not create the working directory for the project

## Constraints & Business Rules

- **Hard event-transformer gate is extended, not weakened.** `src/main/sdk/event-transformer.ts` must handle the new volume of real file-writing tool calls (Write, Edit, Bash with real paths). The existing `TOOL_LABELS` map already covers these tool names with friendly labels. The gate must be verified explicitly with real tool-call events before build work stacks up (Task Group 1). No file paths, tool arguments, command output, or raw code may appear in any `FeedEvent.text` reaching the renderer.

- **One artifact directory per project, stable.** The per-project working directory is created once on first session start (using `app.getPath('userData')/projects/<projectId>/`) and reused across all sessions for that project. The path is stored in `projects.artifact_dir`. It is never shown to the user.

- **Real tools, first-session only for a new project.** On the first session for a project, the agent bootstraps the full-stack app from scratch. Subsequent sessions for the same project amend the existing artifact in the same directory. The agent's system prompt is updated to reflect which work directory to use, but no file paths appear in any user-facing text.

- **Build pipeline proves on one representative full-stack web app.** The Phase 2 validation milestone requires one successful end-to-end: agent writes a real full-stack web app (frontend + backend + local data store) → dev server starts → preview loads and is interactive. The technology stack of the built app is the agent's autonomous choice (subject to "runnable locally via one dev/start command"); the user does not pick a tech stack.

- **Dev server lifecycle.** The main process manages the dev server as a child process (`child_process.spawn`). Lifecycle rules: (a) start when the Live Preview tab is opened and `artifact_dir` exists; (b) stop when the project is closed or the app quits; (c) restart after a new build step completes; (d) if the server crashes, transition preview to `snag` state and attempt one automatic restart before transitioning to `blocked`. The renderer never starts or stops the server directly — it invokes `devserver:start`/`devserver:stop`.

- **Preview veil during build steps.** When a session is in `active` status for a card in `building` state, the preview shows the building veil. When the session finishes (`done`), the main process restarts the dev server and pushes `preview:update` with `status: 'live'` once the server binds. The renderer transitions from building veil to live app automatically.

- **Auto-recovery vs. blocking error split.** The agent can signal a snag via the existing decision/narration protocol. A `snag` that the agent handles without a `decision_prompt` event is auto-recovery: preview shows snag state, then recovers to live once resolved. A `decision_prompt` event (genuine blocking fork) triggers the existing Phase 1 Needs-you promotion machinery. No new user-surface is introduced.

- **Screen-less apps are out of scope.** The pipeline should only target apps with a visual web-rendered surface. If the agent builds something with no web server, the preview stays in `none` state and a board card is raised prompting the user.

- **webview / BrowserView for embedding.** The Live Preview pane uses Electron's `<webview>` tag (renderer side) or a `BrowserView` (main side) to embed the running local dev server. The choice between `<webview>` and `BrowserView` is a main-process implementation decision left to `/backend`; both options satisfy the preview contract. The webview must have `nodeIntegration: false` and `contextIsolation: true` — no elevated privileges for the embedded app.

- **Project persistence on reopen.** On app launch, for any project with a non-null `artifact_dir` and a previously-running dev server (`dev_pid` was set), the main process checks whether the PID is still alive. If not, it attempts to restart the dev server on the same port and push `preview:update` with the live URL. If restart fails, preview stays in `none` state (not an error — the app just needs a build session first).

- **No file paths, no code, no terminal text ever surface to the user.** This is the constitution-level constraint. It applies unconditionally to Phase 2 even though the engine now writes real files. `artifact_dir` is internal to the main process only. `dev_url` (e.g. `http://localhost:3000`) is the only technical string that may be used — and only internally by the webview; it is never displayed as text to the user.

- **All new IPC channels follow existing patterns.** New channels are typed in `src/shared/ipc-schemas.ts` (Zod schemas), registered in `src/main/ipc/` bridge files, exposed via `src/preload/index.ts` contextBridge, and consumed via `src/renderer/src/bridge.ts`. Zod validates on both sides.

- **Phase 2 preview is watch-and-use only.** The user can interact with the running app but cannot point at elements to request fixes (that is Phase 3). No overlay, no click-to-comment, no annotation layer.

- **Strict TypeScript (`"strict": true`); all npm deps pinned exactly (no `^` or `~`).**

- **Phase 2 is macOS only.** No Windows/Linux compatibility work required.

## Excluded from This Phase

- Point-and-Fix: clicking an element in the preview to leave a fix-comment — Phase 3
- Decisions Log, Progress Timeline, Docs View (functional) — Phase 4
- Parallel sessions / the super-team — Phase 4
- File/artifact browser showing the project directory to the user — Phase 4 (Docs View)
- Auto-deploy to production hosting — globally excluded
- Code editor, terminal panel, git/branch/PR surface — globally excluded
- Electron auto-update / .dmg packaging — post-Phase 2
