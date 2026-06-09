# Tech Stack — Helm

## Choices
- **Language:** TypeScript (strict mode from commit 1)
- **Frontend framework:** React + Tailwind CSS (design-led; component library TBD by /frontend)
- **Desktop shell:** Electron (main process = Node, which runs the Claude Agent SDK natively — no bridge needed)
- **Backend framework (Helm itself):** None (no separate server; Electron main process handles all agent orchestration and local state)
- **Database (Helm itself):** SQLite via better-sqlite3 (local-only; stores project state, session history, decisions, board state)
- **Generated-app backend (Phase 3, local-first):** Helm provisions a *local* backend for the apps it builds — a local server process + SQLite (or local Postgres if a project needs it) for data, local file storage on disk, and a self-hosted auth approach (e.g. a local auth library / session store). No rented cloud backend, no third-party managed DB; the app's data lives on the user's machine. The agent wires the generated app to these; the user only ever asks for "logins" or "saved data" in plain language.
- **Hosting / Deployment of Helm:** local desktop app, distributed as a macOS .dmg via GitHub Releases
- **Publishing built apps (Phase 2):** Cloudflare Tunnel (`cloudflared`) exposes the locally-running app to a public URL on the user's own Cloudflare domain (`<slug>.ta-infra.uk`). The app keeps running on the user's machine — the tunnel is the only thing that goes to the network; Helm does not host the app or its data. DNS/route management for `ta-infra.uk` is via the Cloudflare API with the user's own credentials.
- **Key libraries:**
  - `@anthropic-ai/claude-agent-sdk` (TypeScript/Node) — the Claude engine
  - `better-sqlite3` — local state persistence
  - `electron-builder` — packaging and .dmg distribution
  - `vite` — frontend build (fast HMR in dev; Electron + Vite is the standard pairing)
  - `zustand` — client-side state management (lightweight, no boilerplate)
  - `zod` — schema validation for IPC messages and DB records
  - `cloudflared` — Cloudflare Tunnel client for publishing built apps to `<slug>.ta-infra.uk` (Phase 2; spawned/managed from the Electron main process, never shown to the user)
- **Testing:** Vitest (unit); Playwright with `electron` driver (E2E for critical flows)
- **IPC pattern:** Electron contextBridge + typed ipcRenderer/ipcMain channels (no `nodeIntegration: true`; renderer is sandboxed)

## Constraints & Non-Negotiables
- Strict TypeScript from commit 1 — `"strict": true` in tsconfig, no `any` without an explicit cast comment
- All npm dependencies pinned exactly — no `^` or `~` prefixes (strip them after every install)
- The user never sees code, files, diffs, branches, or terminal output — these are hidden at the Electron main-process layer, never passed to the renderer
- Bring-your-own-subscription: the Claude engine authenticates via the user's existing Claude Code subscription (same auth as Claude Code CLI), NOT the paid Anthropic REST API — this is a hard product constraint. No token meter, no usage wall, no second subscription is ever introduced.
- Local-first: Helm and the apps it builds run on the user's machine. Network egress is limited to (a) Anthropic's API via the SDK, (b) the Cloudflare Tunnel + Cloudflare API for publishing (Phase 2, user's own credentials/domain). No telemetry, no Helm-hosted cloud sync, no Helm-managed app hosting.
- Free and open-source: Apache 2.0 or MIT license; no monetization hooks
- The Claude Agent SDK engine plumbing (scoped sessions, streaming output, AskUserQuestion-as-cards, tool-call activity, the `pathToClaudeCodeExecutable` guard) is shipped and proven in Phase 0 — every new SDK call site must still set `pathToClaudeCodeExecutable` independently (see Non-Obvious Engine Constraint).

## Explicit Exclusions
- **Paid Anthropic REST API (as default path):** Excluded — the product runs on the user's Claude subscription via the Claude Agent SDK. Using the paid API would make the app cost money to run, violating the bring-your-own-subscription constraint.
- **Helm-hosted / multi-tenant SaaS / Helm-managed app hosting:** Excluded — Helm runs locally and never hosts the user's app or data. "Publishing" (Phase 2) exposes the locally-running app via the user's own Cloudflare Tunnel + domain; it does not move the app onto Helm's servers.
- **Rented / managed cloud backend for built apps:** Excluded — the Phase 3 backend is local-first (local server + local DB + local file storage). No Supabase-style managed backend, no cloud database bills.
- **Helm user accounts:** Excluded — Helm is a single-user local desktop app. (The *apps Helm builds* may have their own accounts as a Phase 3 capability; Helm itself does not.)
- **Code editor / IDE panel:** Excluded — Helm never shows code. An editor pane would reframe the product as a developer tool.
- **Terminal panel:** Excluded — same reasoning as code editor. All agent output is rendered as structured session feed, not raw terminal.
- **Exposing git / branches / PRs to the user:** Excluded — git is hidden scaffolding. The user sees features, bugs, and decisions, not commits or pull requests.
- **Charging money / paid subscription model / token meter:** Excluded — the app is free and open-source and adds zero marginal cost on top of the user's Claude subscription.
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
