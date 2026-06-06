# Watch It Get Made — Implementation Plan

Each group is independently reviewable and maps to one slice of the feature. Groups are a **sequence of work**, not a visual spec. Code-harness implements and verifies each group before moving to the next.

## Ground rules for this file

- **Design-agnostic.** No hex values, no Tailwind classes, no pixel sizes, no font declarations. Those live in `design-tokens.css` and the frame index in `handover.md`.
- **Behavior and sequence only.** Each group describes what it delivers (capability, data path, API surface, integration point) and which earlier groups it depends on.
- **Components are named, not described visually.** The design frame tells the visual half.
- **Each group has a verify line.** The command that proves it's done.

---

## Group 1: Gate extension — verify hard gate handles real tool calls

**Delivers:** Confidence that `event-transformer.ts` correctly suppresses file paths, tool arguments, and raw command output under real build-session conditions. This is the verify-early risk: the gate was proven with narration-only sessions; Phase 2 introduces high-volume real file-writing and shell calls. Group 1 must pass before any real-pipeline work stacks up.

**Depends on:** none — operates on the existing gate

**Verify:** `npx vitest run event-transformer` — all event-transformer tests pass including new cases for Write/Edit/Bash with real-path arguments and raw shell output.

1. Extend `src/main/sdk/__tests__/event-transformer.test.ts` with test cases covering:
   - `tool_use` events for `Write`, `Edit`, `MultiEdit`, `Bash` with real file paths in input (e.g. `/Users/foo/bar/index.ts`) — must produce a friendly `activity` label, never expose the path
   - `assistant` messages that include code blocks, file contents, or shell commands in text — must strip or suppress the code, never pass raw to narration
   - A `result` message with `subtype: 'success'` after a real file-writing sequence — must emit the friendly "Done." summary
2. Confirm `TOOL_LABELS` in `event-transformer.ts` covers all tools the real build agent will use (`Write`, `Edit`, `MultiEdit`, `Bash`, `Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`, `TodoWrite`, `Task`). Add any missing entries with friendly labels.
3. Add a utility `stripCode(text: string): string` in `event-transformer.ts` that removes fenced code blocks and inline backtick spans from assistant narration text before emitting a `narration` FeedEvent. Apply it inside `transform()` for the `assistant`/`text` branch. Update tests to cover the strip.

---

## Group 2: DB migration — project artifact tracking

**Delivers:** Schema changes that let the main process track where a project's built files live and whether its dev server is running. Two new columns on `projects`; one new `build_steps` table.

**Depends on:** none — schema-only change

**Verify:** `npx vitest run db` — all DB tests pass; `npx tsx -e "import { migrate } from './src/main/db/migrations'; import Database from 'better-sqlite3'; const db = new Database(':memory:'); migrate(db); console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all())"` prints all expected table names including `build_steps`.

1. Add migration 3 to `src/main/db/migrations.ts`:
   - `ALTER TABLE projects ADD COLUMN artifact_dir TEXT` — nullable; null until first session
   - `ALTER TABLE projects ADD COLUMN dev_pid INTEGER` — nullable; PID of running dev server or null
   - `CREATE TABLE build_steps` with columns: `id TEXT PRIMARY KEY`, `project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE`, `session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE`, `card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE`, `status TEXT NOT NULL`, `started_at INTEGER NOT NULL`, `completed_at INTEGER`, `dev_url TEXT`
   - Add indexes: `CREATE INDEX idx_build_steps_project ON build_steps(project_id, started_at)`; `CREATE INDEX idx_build_steps_session ON build_steps(session_id)`
2. Add DB accessor functions in `src/main/db/build-steps.ts`:
   - `createBuildStep(db, projectId, sessionId, cardId): BuildStep` — inserts with status `'running'`
   - `completeBuildStep(db, buildStepId, devUrl): BuildStep` — sets `completed_at`, `dev_url`, `status = 'complete'`
   - `failBuildStep(db, buildStepId): BuildStep` — sets `completed_at`, `status = 'failed'`
   - `snaggingBuildStep(db, buildStepId): BuildStep` — sets `status = 'snag'`
   - `getLatestBuildStep(db, projectId): BuildStep | null` — latest by `started_at`
3. Add DB accessor functions in `src/main/db/projects.ts` (extends existing file):
   - `setArtifactDir(db, projectId, dir: string): void`
   - `setDevPid(db, projectId, pid: number | null): void`
   - `getArtifactDir(db, projectId): string | null`
4. Update `Project` Zod schema in `src/shared/ipc-schemas.ts` to include `artifactDir: z.string().nullable()` — this field is carried on the `Project` type but never displayed in the UI. Add `BuildStep` Zod schema and `PreviewState` discriminated union to `ipc-schemas.ts`.

---

## Group 3: Dev server manager — child-process lifecycle

**Delivers:** A `DevServerManager` class in `src/main/sdk/dev-server-manager.ts` that starts, stops, and monitors the per-project dev server as a child process. The manager is the only place that owns `artifact_dir` path resolution and `dev_pid` tracking. It emits preview state changes via a callback so the orchestrator can push `preview:update` to the renderer.

**Depends on:** Group 2 (DB columns, build-steps accessor)

**Verify:** `npx vitest run dev-server-manager` — unit tests pass, including: start → emits `live` state with URL; crash → emits `snag` then auto-restart → emits `live`; second crash after restart → emits `blocked`; stop → emits `none`; already running → returns existing URL.

1. Create `src/main/sdk/dev-server-manager.ts` with class `DevServerManager`:
   - Constructor takes `db: Db`, `getWindow: () => BrowserWindow | null`, a `onStateChange: (projectId: string, state: PreviewState) => void` callback
   - `start(projectId: string): Promise<string>` — resolves the project's `artifact_dir`, reads the app's declared start command (from a `helm.json` manifest the agent writes to `artifact_dir`), spawns the child process, polls for the dev URL to become bindable (HTTP 200), stores the PID via `setDevPid`, emits `live` state, returns the URL
   - `stop(projectId: string): void` — kills the child process, clears PID via `setDevPid(null)`, emits `none` state
   - `restart(projectId: string): Promise<string>` — calls `stop` then `start`; on failure after one retry, emits `blocked`
   - `handleCrash(projectId: string): void` — called when the child process exits unexpectedly; emits `snag`, attempts one auto-restart; if restart fails, emits `blocked`
   - `isRunning(projectId: string): boolean` — checks whether the stored PID is still alive (`process.kill(pid, 0)`)
   - `getState(projectId: string): PreviewState` — returns the current state for a project (without network I/O)
2. Create `src/main/sdk/__tests__/dev-server-manager.test.ts` with unit tests using a fake child-process stub (injectable via constructor) covering the states listed in the Verify line above.
3. Define `helm.json` manifest shape (internal to main process only): `{ startCommand: string, port: number }`. This file is written by the build agent into `artifact_dir`. The `DevServerManager` reads it to know how to start the server. Add a Zod schema for it in `src/main/sdk/dev-server-manager.ts` (not exported to renderer).

---

## Group 4: Real build pipeline — session orchestrator extension

**Delivers:** `SessionOrchestrator` extended to run real build sessions — real working directory, full tools enabled — and to coordinate with `DevServerManager` after each session completes. The existing narration-only path (empty `allowedTools`, `cwd: tmpdir()`) is preserved as a fallback for projects with no `artifact_dir` yet, so Phase 1 sessions still work.

**Depends on:** Groups 2 and 3

**Verify:** `npx vitest run session-orchestrator` — all existing tests pass (narration-only path unchanged); new tests covering: real-pipeline start sets `artifact_dir` on first session; `finish()` calls `DevServerManager.restart()`; `fail()` calls `DevServerManager.handleCrash()`.

1. Extend `SessionOrchestrator.start()` in `src/main/sdk/session-orchestrator.ts`:
   - If `project.artifactDir` is null (first session for this project): create the artifact directory at `app.getPath('userData')/projects/<projectId>/`, call `setArtifactDir(db, projectId, dir)`, and persist.
   - Start the SDK session with `cwd: artifactDir`, `allowedTools: undefined` (all tools enabled), and an updated `buildPrompt` that instructs the agent to write a real full-stack web app and produce a `helm.json` manifest file declaring the dev server start command and port.
   - Call `createBuildStep(db, projectId, sessionId, cardId)` and store the returned `buildStepId`.
   - Push `preview:update` with `status: 'building'` immediately when a real-pipeline session starts.
2. Extend `SessionOrchestrator.finish()`:
   - Call `completeBuildStep(db, buildStepId, null)` (URL comes from the dev server manager).
   - Call `DevServerManager.restart(projectId)` — on success, the manager pushes `preview:update` with `status: 'live'`.
   - Only after the dev server is live does the existing checkpoint logic run (emit the "Here's what I built" checkpoint event).
3. Extend `SessionOrchestrator.fail()`:
   - Call `failBuildStep(db, buildStepId)`.
   - Call `DevServerManager.handleCrash(projectId)` to transition preview state.
4. Inject `DevServerManager` into `SessionOrchestrator` via constructor (keeps the class testable). Update `src/main/index.ts` to wire the manager in.
5. Update `buildPrompt(card)` to include instructions for real file-writing when `artifactDir` is set: tell the agent to write a complete runnable full-stack web app with a standard package.json-based `npm run dev` start command and to output a `helm.json` at the project root with `{ "startCommand": "npm run dev", "port": <chosen port> }`.

---

## Group 5: IPC — preview channels

**Delivers:** The `preview:get-state` and `devserver:start` / `devserver:stop` IPC channels, wired end-to-end (schema → preload → bridge → handler). The renderer can now query and control the preview.

**Depends on:** Groups 3 and 4

**Verify:** `npx vitest run ipc` — contract-flow tests pass; `npx tsc --noEmit -p tsconfig.json` — zero errors.

1. Add to `src/shared/ipc-schemas.ts`:
   - `PreviewStatus` enum: `z.enum(['none', 'building', 'live', 'snag', 'blocked'])`
   - `PreviewState` discriminated union (the five states from requirements.md API Contracts)
   - `PreviewUpdatePush`: `z.object({ projectId: z.string(), state: PreviewState })`
   - `GetPreviewStateRequest`: `z.object({ projectId: z.string() })`
   - `StartDevServerRequest`: `z.object({ projectId: z.string() })`
   - `StopDevServerRequest`: `z.object({ projectId: z.string() })`
   - Add channel constants to `CH`: `previewGetState`, `devserverStart`, `devserverStop`, `previewUpdate`
2. Add `src/main/ipc/preview-bridge.ts` with IPC handlers:
   - `preview:get-state` → calls `DevServerManager.getState(projectId)`, returns `{ state: PreviewState }`
   - `devserver:start` → calls `DevServerManager.start(projectId)`, returns `{ url }` or error
   - `devserver:stop` → calls `DevServerManager.stop(projectId)`, returns `{ stopped: true }` or error
3. Register `preview-bridge.ts` handlers in `src/main/index.ts`.
4. Expose new channels in `src/preload/index.ts` via contextBridge: `previewGetState`, `devserverStart`, `devserverStop`.
5. Add typed wrappers in `src/renderer/src/bridge.ts` for the three invoke channels.
6. Add `preview:update` push listener in `src/renderer/src/bridge.ts` (same pattern as `feed:event`).
7. Add IPC contract tests in `src/main/ipc/__tests__/contract-flow.test.ts` for all three invoke channels, covering success and each named error condition.

---

## Group 6: Preview store — renderer state

**Delivers:** A Zustand `previewStore` in the renderer that tracks `PreviewState` per project, populated from `preview:get-state` on tab open and updated via `preview:update` pushes. The Live Preview tab reads from this store.

**Depends on:** Group 5

**Verify:** `npx tsc --noEmit -p tsconfig.json` — zero errors; `npx vitest run preview-store` — store tests pass (state transitions: none → building → live → building → live; snag → live; blocked).

1. Create `src/renderer/src/store/preview.ts` — Zustand store with:
   - `states: Record<string, PreviewState>` — keyed by `projectId`
   - `setPreviewState(projectId, state)` — updates the map
   - `getPreviewState(projectId): PreviewState` — returns current state or `{ status: 'none' }` as default
2. In the renderer's app entry (or the existing bridge setup), subscribe to `preview:update` push and call `setPreviewState`.
3. On Live Preview tab mount: invoke `previewGetState` and call `setPreviewState` with the result.

---

## Group 7: Live Preview tab — embed and state machine

**Delivers:** The Live Preview tab (formerly stub F29) becomes a functional pane. It renders the correct state view (no preview / building veil / live webview / snag / blocked) based on `previewStore`. When `status === 'live'`, it embeds the dev server URL in an Electron `<webview>` (or a `BrowserView` if the main process manages it). The user can interact with the running app.

**Depends on:** Group 6

**Verify:** `npx tsc --noEmit -p tsconfig.json` — zero errors; manual verification per validation.md primary flow (the dogfood gate).

1. Identify the current Live Preview stub component in `src/renderer/src/` (the tab that renders F29 placeholder content). Replace its body with a state-machine render:
   - `none` → `<LivePreviewEmpty />` — calm "nothing to show yet" illustration and label
   - `building` → `<LivePreviewBuilding />` — veil with "Building…" label and animated indicator
   - `live` → `<LivePreviewActive url={url} />` — full-area webview embed
   - `snag` → `<LivePreviewSnag />` — "Hit a snag, fixing it" overlay
   - `blocked` → `<LivePreviewBlocked />` — calm blocked state; board card handles the user action
2. Implement `<LivePreviewActive>`:
   - Uses `<webview src={url} />` with `nodeintegration={false}` and `contextIsolation={true}`
   - Full-area fill within the tab content region; no Helm chrome inside the webview
   - On tab mount when `status === 'live'`: call `devserverStart` if no URL is live yet (idempotent — `already_running` error is treated as success and the existing URL is used)
3. On tab unmount (user navigates away): do NOT stop the dev server. The server should keep running while the project is open. Server is stopped only on project close or app quit.
4. Handle `webview`'s `did-fail-load` event: if the webview fails to load, push preview state to `snag` via IPC to trigger the snag overlay (rather than showing a browser error page).
5. Wire the Live Preview tab into the existing tab router so it no longer renders the stub placeholder when a project is open with `status !== 'none'`.

---

## Group 8: Persistence on reopen — dev server resume

**Delivers:** On app launch, for any project with `artifact_dir` set, the main process checks whether the previously-running dev server is still alive and either reconnects or restarts it. The renderer sees a `preview:update` push on reconnect.

**Depends on:** Groups 3 and 5

**Verify:** `npx vitest run dev-server-manager` — resume test: simulate app relaunch with a known-alive PID → `getState` returns `live`; with a dead PID → manager restarts and emits `live` or `none`.

1. In `src/main/index.ts`, after migrations run and IPC handlers are registered, iterate over all projects with non-null `artifact_dir`:
   - Call `DevServerManager.isRunning(projectId)`.
   - If alive: push `preview:update` with `status: 'live'` (the renderer, once it connects, will receive the current state via `preview:get-state`).
   - If dead: attempt one restart via `DevServerManager.restart(projectId)`. On failure, log internally and leave state as `none`.
2. Ensure `setDevPid(null)` is called for all projects on clean app quit (`app.on('before-quit')`), so stale PIDs do not accumulate.

---

## Group 9: Story walk — end-to-end validation

**Delivers:** Every user story verified end-to-end. The primary flow (real app running live in preview, user can interact) is the stop criterion. If this group does not pass, Phase 2 is not done.

**Depends on:** Groups 1–8

**Verify:** `bash verify-group-9.sh` exits 0 (runs tsc, vitest, and a one-step smoke: agent writes a minimal full-stack app → dev server starts → webview loads a real page).

1. Run `npx tsc --noEmit -p tsconfig.json` — zero errors.
2. Run `npx vitest run` — all tests pass (including Groups 1–8 new tests).
3. Create `app/verify-group-9.sh`: build the app in production mode (`npx electron-vite build`), confirm no TS/bundle errors.
4. Write `app/scripts/verify-group-9.ts` as a smoke test:
   - Start the app in test mode with a temp DB.
   - Create a project, run one real build session (agent writes a minimal "Hello World" Express + static frontend app to `artifact_dir`).
   - Confirm `helm.json` appears in `artifact_dir` with a valid `startCommand` and `port`.
   - Confirm `DevServerManager.start()` succeeds and returns a URL.
   - Confirm an HTTP GET to that URL returns 200.
5. Manual validation: open the Live Preview tab with a running project → webview shows the real app → user clicks a button in the app → the app responds.
