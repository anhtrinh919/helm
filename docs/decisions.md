> Agent context — not for human reading.

# Technical Decisions — Helm

**Electron as desktop shell** — Why: Node runs natively in Electron's main process; Claude Agent SDK (Node/TypeScript) wires directly without a bridge or subprocess hack. Alternatives: Tauri (Rust core would require SDK sidecar + IPC complexity); browser app (user explicitly chose double-click desktop).

**Claude Agent SDK over Anthropic REST API** — Why: runs on user's existing Claude subscription; free for the user; aligns with bring-your-own-subscription hard constraint. Alternatives: paid REST API would charge per token, breaking the free/open-source constraint.

**SQLite via better-sqlite3** — Why: synchronous API fits Electron main process; zero-config; single file is easy to back up; no server required. Alternatives: PostgreSQL (overkill, requires running server); IndexedDB (renderer-only, inaccessible from main process where agents run).

**Vite for frontend build** — Why: standard Electron + React pairing; fast HMR in dev; straightforward production build. Alternatives: CRA (deprecated); webpack (slower, more config overhead).

**Zustand for state management** — Why: minimal boilerplate; works without React context providers; easy to split into slices. Alternatives: Redux (too much ceremony for a single-user app); Jotai (atom model less intuitive for board-shaped state).

**Typed IPC channels via contextBridge** — Why: renderer stays sandboxed; Zod validates every message crossing the process boundary. Alternatives: `nodeIntegration: true` — security risk; harder to validate message shapes.

**Phase 1, Task Group 1 = engine wire-up** — Why: surfaces SDK plumbing problems (pathToClaudeCodeExecutable, auth, streaming, tool-call events) on day one before design work accumulates. Known risk: musl binary mis-selection gotcha (see tech-stack.md Non-Obvious Engine Constraint). Alternatives: deferring to a later group — would let visual work stack up against an unverified engine contract.

---

### Phase 1 Decisions (implementation-time)

**`stopped` as a distinct session status and feed event kind** — Why: when a user kills a session mid-flight via the Stop button, the feed was left in an ambiguous state (last event = activity "thinking…", session status = "active"). A calm `stopped` terminal state makes the end-state legible and avoids the feed looking like a crash. Alternatives: map to `error` — rejected because `stopped` is user-intentional, not a failure.

**Card transitions `building → up_next` on Stop, not `building → failed`** — Why: if the user stops a session, the work is paused, not failed. Moving the card back to `up_next` lets the user restart it. `failed` implies the agent could not complete the work; `stopped` means the user chose to end the session. This distinction is observable in the board.

**`allowedTools: []` for Phase 1 sessions (no real file writes)** — Why: Phase 1's goal is the dashboard shell, not a working build pipeline. Running with no tools keeps the event-transformer gate simple (all output is text, no file-path or code artifacts to strip). Intentional constraint — reversed in Phase 2.

**Wizard scoping conversation runs its own session, separate from the build session** — Why: the wizard needs a conversational Q&A loop (ask → answer → ask → plan). Running it as a separate session means it has its own feed, its own IPC lifecycle, and does not pollute the board feed when the actual build session starts. Alternatives: a single session for both — rejected because wizard output (clarifying questions) is different in character from build output (narration, activities, decisions).

**`json-extract.ts` for structured data extraction from LLM text** — Why: the wizard orchestrator and session orchestrator both need to parse structured data (plan blocks, decision prompts) from SDK streaming text. Rather than regex per call site, a shared `json-extract.ts` extracts the first valid JSON object from a text blob. Fragile at the edges but sufficient for the controlled prompt surface — the SDK output is predictable enough that the extractor works in practice.

**Smart-pausing: session suspends after emitting a `decision_prompt`, resumes on `answer-decision`** — Why: if the agent asks a question and the user doesn't answer, the session should wait rather than time out or continue without an answer. The session orchestrator holds a Promise that resolves when the question is answered; the IPC handler for `sessions:answer-decision` resolves it. Alternatives: fire-and-forget (agent continues without waiting) — rejected because unanswered decisions could produce wrong build output.

---

### Phase 2 Decisions (implementation-time)

**`<webview>` tag chosen over `BrowserView` for Live Preview embedding** — Why: `<webview>` runs in the renderer process, can be positioned and sized via CSS/Flexbox alongside other React components, and integrates cleanly with the preview store's state machine. `BrowserView` requires main-process coordinate math to keep it aligned with the renderer layout — fragile on window resize. Constraint: `<webview>` must have `nodeIntegration: false` and `contextIsolation: true` to prevent the embedded app from reaching Helm's internals.

**`DevServerManager` as a singleton main-process class, not inline spawn per session** — Why: the dev server outlives any individual build session — it keeps running while the preview is live between sessions. A class with explicit `start()` / `stop()` / `restart()` methods and a PID registry makes lifecycle management auditable. Alternatives: inline `child_process.spawn` in the session orchestrator — rejected because the server would be tied to session lifecycle and stop when the session ended.

**Snag auto-recovery attempts one restart before escalating to `blocked`** — Why: most dev server crashes during a live build are transient (file not written yet, port binding race). One restart attempt covers the majority of cases without user interruption. Two or more retries risk a tight crash loop that looks worse than the `blocked` state. Alternatives: immediate `blocked` on first crash — rejected because it surfaces too many non-issues to the user.

**`artifact_dir` path uses `app.getPath('userData')/projects/<projectId>/`** — Why: `userData` is the correct Electron path for app-managed persistent data (not user-visible documents). Using a stable UUID-based subdirectory means the path survives app reinstall as long as the SQLite DB (also in `userData`) is preserved. Alternatives: `~/Helm Projects/<project-name>/` — more user-visible, but name changes would break path stability.

**`helm.json` contract file as the agent's single I/O handshake** (continued above)

---

### Phase 3 Decisions (implementation-time)

**Fix sessions reuse the existing session-orchestrator stack — no new session type.**
Why: the point-and-fix session is a scoped build session with a richer context payload (which element, screenshot, comment text). Creating a parallel session type would duplicate the orchestrator, runner, and event-transformer maintenance surface. The correct design is one engine with type-discriminated context loading at session start. Alternatives: a `FixSessionOrchestrator` class — rejected because it would need to stay in sync with every future change to `SessionOrchestrator`.

**Annotation layer mounted in Helm renderer, not injected into the `<webview>`.**
Why: injecting click handlers into the embedded app's DOM via `executeJavaScript` is fragile and app-specific. The overlay is an absolute-positioned SVG layer in the Helm renderer that sits above the `<webview>`, intercepts pointer events at the Helm DOM level, and uses `webview.executeJavaScript` only for coordinate resolution. This keeps the embedded app unmodified. Alternatives: in-page injection — rejected because it requires the embedded app to be in a known framework and breaks if the app renders dynamically.

**Comment cards land in the same Kanban columns as build cards, distinguished by type-discriminated visual treatment.**
Why: a separate "fix queue" column or list would add board complexity the user doesn't need — "planned / building / done" applies equally to fixes and features. The distinction is visual: border color and icon per card type. Alternatives: a parallel fix board — rejected because the user shouldn't need two boards to understand one project's state.

**Ad-hoc Phase 4 deliverables (real history tabs, parallel sessions) shipped on the Phase 3 branch post-review.**
Why: the review at 85/100 cleared the Phase 3 scope; the ad-hoc work (wiring Decisions/Progress/Docs tabs to real DB queries, removing one-at-a-time session queue) was bounded and did not touch the reviewed code paths. Landing it on the same branch before merge preserved a clean git history and avoided a partial Phase 4 branch. Alternatives: a separate `phase-4-partial` branch — rejected because the scope was small, DB-layer-only, and could be verified without a new review cycle. — Why: the build agent reads `helm.json` on entry (gets context: what to build, what's been built, what directory to use) and writes `helm.json` on exit (records: what it built, what dev command to run). This two-way file contract keeps the session orchestrator decoupled from the agent's internal reasoning — it only needs to read the output file to know what to do next. Alternatives: embed structured output in the agent's final narration text — rejected because it ties the orchestrator to prompt engineering and makes the gate harder to maintain.
