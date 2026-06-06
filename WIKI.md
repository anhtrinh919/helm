> Agent context — not for human reading.

# Project WIKI

## Tech Stack Notes

*(Added per phase)*

## Phase 1 — The Executive Dashboard Learnings

**Claude Agent SDK requires `pathToClaudeCodeExecutable` at every call site independently.**
The SDK's `query()` resolves its bundled native binary and can mis-select the wrong variant. Setting `options.pathToClaudeCodeExecutable = execSync('which claude').toString().trim()` must be applied at each SDK call site (session-runner, wizard-orchestrator, any future orchestrator). A missing guard on one entry point silently fails while others work — and there is no SDK-level warning.

**The event-transformer hard gate is the product's load-bearing safety net.**
Phase 1 implemented a mandatory `event-transformer.ts` that sits between raw SDK output and the IPC boundary. Every text, activity, decision, and checkpoint event passes through it. The gate strips code snippets, file paths, terminal output, and developer-facing metadata before anything reaches the renderer. Do not weaken or bypass this gate in Phase 2 even though tool calls at volume will produce much more raw output — the gate is what makes Helm feel like a product, not a terminal wrapper.

**Vite HMR fragments Zustand stores after heavy store edits — always verify on a production preview.**
After multiple edits to a Zustand store module and its subscribers, HMR can split the store into two live instances (subscription writes to A, component reads B). Symptom: state mutations fire (console logs confirm) but UI stays frozen. Fix: `npm run build && npx electron-vite preview`. Never spend more than 10 minutes debugging a "broken subscription" without first ruling out HMR fragmentation.

**The `stopped` state and `building → up_next` transition were organic dogfood additions — neither was in the original spec.**
Both emerged from the first real run: (1) killing a session mid-flight left the feed in an ambiguous state, so a `stopped` calm end-state (distinct from `error`) was added; (2) stopping a session while a card was `building` should move it back to `up_next`, not leave it stuck. These are correct scope additions, not drift. Future phases will surface similar organic fixes — build time for one dogfood-driven correction per group.

**`better-sqlite3` migrations must run synchronously before any IPC handler is registered.**
The DB migration chain (`connection.ts → migrations.ts`) runs in the Electron main process at startup. If any IPC handler fires before `applyMigrations()` resolves, it queries a schema that may not exist. Order: connect → migrate → register IPC handlers → create the Electron window. Do not parallelize any of these.

**Scoped sessions with `allowedTools: []` produce no real artifacts — Phase 2 must change this.**
Phase 1 ran sessions with an empty allowed-tools list and `cwd: os.tmpdir()`, which kept the event-transformer gate simple (no file writes to filter). Phase 2 must enable real tools (`computer`, bash, file ops) and route writes to `~/Helm Projects/<project-name>/`. The event-transformer will need a new layer that translates tool-call activity into executive-friendly narration ("writing the login screen…") rather than stripping it entirely.

## Phase 2 — Watch It Get Made Learnings

**DevServerManager must own the full child-process lifecycle — the renderer is never allowed to manage it directly.**
Phase 2 introduced `DevServerManager` as the single authoritative owner of the dev server child process. Any attempt to start/stop/restart from the renderer side (even via IPC) creates split-brain: the main process loses track of the PID and `dev_pid` in SQLite drifts from reality. The contract: renderer calls `devserver:start` / `devserver:stop`; main fires `preview:update` push events. Everything that touches the process stays in main.

**The preview state machine has five states, not two — model them explicitly or they collapse into `live` vs `not-live`.**
The five-state model (`none` → `building` → `live` / `snag` → `blocked`) is load-bearing. Without explicit state tracking in the Zustand preview store, two failure cases (snag and blocked) get silently merged and the user sees no distinction between "agent is auto-recovering" and "agent needs my input." Phase 3 (point-and-fix) must read this state to know whether the preview is in a stable-enough state to accept click annotations.

**Event-transformer extension for real tool calls: add a `TOOL_LABELS` pass first, then strip — do not strip-then-label.**
When real tools fire (Write, Edit, Bash), the raw event contains both a tool name and argument blobs. The gate must match the tool name to a friendly label first, emit the narration ("writing the login screen…"), and only then discard the argument blob. If the strip runs first, the tool name can be wiped before the label lookup runs, producing silent tool events with no user-facing narration. Verified during G1 — the existing `TOOL_LABELS` map covers all standard tool names as of Phase 2.

**`artifact_dir` is created lazily on first session start, not on project creation — downstream callers must handle null.**
The per-project working directory is only created the first time a build session starts (`sessions:start` → main process → `app.getPath('userData')/projects/<projectId>/`). Any code path that runs before the first session (preview state init, app-resume logic) will encounter `artifact_dir: null` in the DB. Phase 3 point-and-fix must guard against this: if `artifact_dir` is null, the fix session cannot target the project's working tree.

**Dev-server resume-on-reopen checks PID liveness, not just non-null `dev_pid`.**
On app launch, `dev_pid` in the DB may be stale (process died between sessions). The reopen logic checks `process.kill(pid, 0)` to confirm the process is actually alive before pushing a `live` preview update. If the liveness check fails, the preview falls back to `none` — a build session will restart the server. A false "server is live" push when the PID is dead causes the webview to load a URL that isn't listening, which surfaces as a blank preview with no error chrome.

## From Global WIKI — claude-agent-sdk

**Claude Agent SDK: always pass `pathToClaudeCodeExecutable`**
The SDK's `query()` resolves its bundled native binary and can mis-select the wrong variant on the host (e.g. musl vs glibc on Linux). Fix: pass `options.pathToClaudeCodeExecutable` set to the system `claude` binary via `execSync('which claude')`. This must be applied at every new SDK call site independently — a single missing guard silently fails while other call sites work. Phase 1, Task Group 1 must verify this end-to-end as its first action.
