# Tech Stack — Helm

## Choices
- **Language:** TypeScript (strict mode from commit 1)
- **Frontend framework:** React + Tailwind CSS (design-led; component library TBD by /frontend)
- **Desktop shell:** Electron (main process = Node, which runs the Claude Agent SDK natively — no bridge needed)
- **Backend framework:** None (no separate server; Electron main process handles all agent orchestration and local state)
- **Database:** SQLite via better-sqlite3 (local-only; stores project state, session history, decisions, board state)
- **Hosting / Deployment:** None — local desktop app, distributed as a macOS .dmg via GitHub Releases
- **Key libraries:**
  - `@anthropic-ai/claude-agent-sdk` (TypeScript/Node) — the Claude engine
  - `better-sqlite3` — local state persistence
  - `electron-builder` — packaging and .dmg distribution
  - `vite` — frontend build (fast HMR in dev; Electron + Vite is the standard pairing)
  - `zustand` — client-side state management (lightweight, no boilerplate)
  - `zod` — schema validation for IPC messages and DB records
- **Testing:** Vitest (unit); Playwright with `electron` driver (E2E for critical flows)
- **IPC pattern:** Electron contextBridge + typed ipcRenderer/ipcMain channels (no `nodeIntegration: true`; renderer is sandboxed)

## Constraints & Non-Negotiables
- Strict TypeScript from commit 1 — `"strict": true` in tsconfig, no `any` without an explicit cast comment
- All npm dependencies pinned exactly — no `^` or `~` prefixes (strip them after every install)
- The user never sees code, files, diffs, branches, or terminal output — these are hidden at the Electron main-process layer, never passed to the renderer
- Bring-your-own-subscription: the Claude engine authenticates via the user's existing Claude Code subscription (same auth as Claude Code CLI), NOT the paid Anthropic REST API — this is a hard product constraint
- Local-only: no network calls except to Anthropic's API via the SDK; no telemetry, no cloud sync
- Free and open-source: Apache 2.0 or MIT license; no monetization hooks
- Phase 1, Task Group 1 MUST wire one real scoped session to the live Claude Agent SDK — this is the engine plumbing de-risk, not optional

## Explicit Exclusions
- **Paid Anthropic REST API (as default path):** Excluded — the product runs on the user's Claude subscription via the Claude Agent SDK. Using the paid API would make the app cost money to run, violating the bring-your-own-subscription constraint.
- **Cloud hosting / multi-tenant SaaS:** Excluded — everything runs locally on the user's machine. No server, no cloud database, no user accounts.
- **Code editor / IDE panel:** Excluded — Helm never shows code. An editor pane would reframe the product as a developer tool.
- **Terminal panel:** Excluded — same reasoning as code editor. All agent output is rendered as structured session feed, not raw terminal.
- **Exposing git / branches / PRs to the user:** Excluded — git is hidden scaffolding. The user sees features, bugs, and decisions, not commits or pull requests.
- **Charging money / paid subscription model:** Excluded — the app is free and open-source.
- **Auto-deploy to production:** Excluded from all phases — the built app runs locally; Helm does not push to any hosting provider.
- **Electron `nodeIntegration: true`:** Excluded — security constraint; renderer is sandboxed, all Node access goes through contextBridge IPC.

## Key Technical Decisions

| Decision | Why | Alternatives Rejected |
|----------|-----|-----------------------|
| Electron as desktop shell | Node runs natively in main process — Claude Agent SDK (Node/TypeScript) wires directly without a bridge or subprocess hack | Tauri (Rust core — SDK would need a sidecar subprocess, adding IPC complexity); browser app (user explicitly chose double-click desktop over browser page) |
| Claude Agent SDK (not Anthropic REST API) | Runs on user's existing Claude subscription; free for the user; aligns with bring-your-own-subscription constraint | Paid REST API — would charge per token, breaking the free/open-source constraint |
| SQLite via better-sqlite3 | Synchronous API fits Electron main process; zero-config; single file = easy backup; no server | PostgreSQL (overkill, requires a running server); IndexedDB (renderer-only, can't be accessed from main process where agents run) |
| Vite for frontend build | Standard Electron + React pairing; fast HMR in dev; straightforward production build | CRA (deprecated); webpack (slower, more config overhead) |
| Zustand for state management | Minimal boilerplate; works without React context providers; easy to split into slices | Redux (too much ceremony for a single-user app); Jotai (atom model less intuitive for board-shaped state) |
| Typed IPC channels via contextBridge | Keeps renderer sandboxed; Zod validates every message crossing the process boundary | Raw ipcRenderer with `nodeIntegration: true` — security risk; would also make it harder to validate message shapes |
| Phase 1 engine wire-up as first task group | Surfaces any SDK plumbing problems on day one (pathToClaudeCodeExecutable, auth, streaming) — the known gotcha (musl binary mis-selection) must be caught before design work accumulates | Deferring to a later task group — would let visual work stack up against an unverified engine contract |

## Non-Obvious Engine Constraint

The `@anthropic-ai/claude-agent-sdk`'s `query()` resolves its bundled native binary and mis-selects the linux-x64-musl variant on non-musl hosts. On macOS this is less likely to occur, but the SDK still requires `options.pathToClaudeCodeExecutable` to be set to the system `claude` binary (resolved via `execSync('which claude')`). Every new SDK call site must include this guard independently — a missing guard on one entry point will silently fail while others work. Phase 1 Task Group 1 must verify this end-to-end.

Open question (treated as settled by product direction, to be verified in Phase 1 Task Group 1): whether the Claude Agent SDK can surface streaming output, tool-call activity, AskUserQuestion-as-buttons, and slash-command/skill invocation outside the terminal in a custom Electron GUI. If the SDK does not expose these events at the right granularity, Phase 1 Task Group 1 will surface this before design work accumulates.
