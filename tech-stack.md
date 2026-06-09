# Tech Stack — Helm

## Choices
- **Language:** TypeScript (strict mode from commit 1)
- **Frontend framework:** React + Tailwind CSS (design-led; component library TBD by /frontend)
- **Runtime architecture (hybrid):** a **local Node server** (bound to `127.0.0.1`) is the core — it runs the Claude Agent SDK, owns the SQLite state, manages dev servers, and serves the React UI + a typed HTTP/WebSocket API. The **same React UI runs in a plain browser at `localhost`** (the development + Claude-dogfoodable surface) and is **wrapped in Electron purely as the shipping shell** for double-click distribution. The UI talks to the core only through the `helm` bridge (HTTP for request/response, WebSocket for server→client push) — it never assumes Electron. Electron is a distribution detail, not an architectural dependency.
- **Backend framework (Helm itself):** a local Node server (the core process) handles all agent orchestration, state, dev-server lifecycle, and the `helm` HTTP/WebSocket API. In the packaged build, Electron's main process simply starts this same core and points its window at it.
- **Database (Helm itself):** SQLite via better-sqlite3 (local-only; stores project state, session history, decisions, board state)
- **Generated-app backend (Phase 3, local-first):** Helm provisions a *local* backend for the apps it builds — a local server process + SQLite (or local Postgres if a project needs it) for data, local file storage on disk, and a self-hosted auth approach (e.g. a local auth library / session store). No rented cloud backend, no third-party managed DB; the app's data lives on the user's machine. The agent wires the generated app to these; the user only ever asks for "logins" or "saved data" in plain language.
- **Hosting / Deployment of Helm:** local-first. Development + dogfood = run the core and open the UI at `localhost` in a browser. Distribution = the same core + UI packaged in Electron as a macOS .dmg via GitHub Releases (double-click app).
- **Publishing built apps (Phase 2):** Cloudflare Tunnel (`cloudflared`) exposes the locally-running app to a public URL on the user's own Cloudflare domain (`<slug>.ta-infra.uk`). The app keeps running on the user's machine — the tunnel is the only thing that goes to the network; Helm does not host the app or its data. DNS/route management for `ta-infra.uk` is via the Cloudflare API with the user's own credentials.
- **Key libraries:**
  - `@anthropic-ai/claude-agent-sdk` (TypeScript/Node) — the Claude engine
  - `better-sqlite3` — local state persistence
  - `electron-builder` — packaging and .dmg distribution
  - `vite` — frontend build (fast HMR in dev; the React UI builds once and runs both in a plain browser and inside the Electron shell)
  - a minimal local HTTP/WebSocket server library (e.g. a tiny `node:http` + `ws` setup, or a light framework) — serves the `helm` API + UI on `127.0.0.1`
  - `zustand` — client-side state management (lightweight, no boilerplate)
  - `zod` — schema validation for every `helm` API request/response + DB records
  - `electron` + `electron-builder` — distribution shell + .dmg packaging only
  - `cloudflared` — Cloudflare Tunnel client for publishing built apps to `<slug>.ta-infra.uk` (Phase 2; spawned/managed by the local core, never shown to the user)
- **Testing:** Vitest (unit); Playwright (E2E) driven against the `localhost` UI (and, for the packaged build, the Electron window) — the browser-served UI is the primary E2E + dogfood surface
- **Transport (the `helm` bridge):** typed HTTP for request/response + a WebSocket channel for server→client pushes (e.g. `shelf:updated`, `point:captured`, feed events). Every message validated with Zod at the boundary. The core binds to `127.0.0.1` only. This replaces the earlier Electron contextBridge/IPC transport; the renderer reaches the core exclusively through this bridge, so it is identical whether running in a browser or inside the Electron shell.

## Constraints & Non-Negotiables
- Strict TypeScript from commit 1 — `"strict": true` in tsconfig, no `any` without an explicit cast comment
- All npm dependencies pinned exactly — no `^` or `~` prefixes (strip them after every install)
- The user never sees code, files, diffs, branches, or terminal output — these are stripped at the core (server) layer and never sent over the `helm` API to the UI
- Bring-your-own-subscription: the Claude engine authenticates via the user's existing Claude Code subscription (same auth as Claude Code CLI), NOT the paid Anthropic REST API — this is a hard product constraint. No token meter, no usage wall, no second subscription is ever introduced.
- Local-first: Helm and the apps it builds run on the user's machine. The core server binds to `127.0.0.1` only (never `0.0.0.0`) — it is not reachable from the network. Network egress is limited to (a) Anthropic's API via the SDK, (b) the Cloudflare Tunnel + Cloudflare API for publishing (Phase 2, user's own credentials/domain). No telemetry, no Helm-hosted cloud sync, no Helm-managed app hosting.
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
- **UI with direct Node/filesystem access:** Excluded — the UI is a plain web client (browser or Electron window) that reaches the machine ONLY through the `helm` HTTP/WebSocket API. No `nodeIntegration`, no direct FS access from the UI; all privileged work happens in the core server. (In the Electron shell, the window loads the same localhost UI — it does not get Node access.)
- **Exposing the core server to the network:** Excluded — it binds to `127.0.0.1` only. Remote access to Helm itself is out of scope.

## Key Technical Decisions

| Decision | Why | Alternatives Rejected |
|----------|-----|-----------------------|
| Hybrid: local Node core + browser UI, Electron only to ship | Keeps every local-first advantage (SDK on the user's Claude subscription, local files, local dev servers) while making the UI a real `localhost` web app — Claude-dogfoodable via browser automation, on a standard web stack the user knows; Electron stays as a thin distribution wrapper around the same UI | Pure Electron (not live-dogfoodable; main/renderer/IPC indirection; user unfamiliar); pure cloud web app (breaks bring-your-own-Claude + local files — that's what the competitors are); Tauri (Rust core, SDK needs a Node sidecar) |
| Claude Agent SDK (not Anthropic REST API) | Runs on user's existing Claude subscription; free for the user; aligns with bring-your-own-subscription constraint | Paid REST API — would charge per token, breaking the free/open-source constraint |
| SQLite via better-sqlite3 | Synchronous API fits the single-process Node core; zero-config; single file = easy backup; no server to run | PostgreSQL (overkill, requires a running server); IndexedDB (browser-only, can't be reached by the core where agents run) |
| Vite for frontend build | Builds the React UI once; runs identically in a plain browser and inside the Electron shell; fast HMR in dev | CRA (deprecated); webpack (slower, more config overhead) |
| Zustand for state management | Minimal boilerplate; works without React context providers; easy to split into slices | Redux (too much ceremony for a single-user app); Jotai (atom model less intuitive for board-shaped state) |
| `helm` bridge over HTTP + WebSocket | One typed seam between UI and core; identical whether the UI runs in a browser or the Electron shell; Zod-validated; lets Claude dogfood the localhost UI live; the existing single `helm.*` bridge surface makes the swap from Electron-IPC a one-seam change, not a UI rewrite | Electron contextBridge/IPC (ties the UI to Electron, not browser-dogfoodable) |
| Preview proxy for point-and-fix | Serving the user's running app through the core's own origin makes click-capture injection work in a plain browser (cross-origin would otherwise block it) — the one piece Electron's `<webview>` got for free | Cross-origin iframe injection (blocked); keeping point-and-fix Electron-only (would split behavior across surfaces) |
| Phase 0 engine proven; Phase 1 surfaces it | The SDK plumbing (pathToClaudeCodeExecutable, streaming, AskUserQuestion-as-cards) is already proven; Phase 1's first foundation work is the transport swap (IPC→HTTP/WS) behind the existing bridge seam | — |

## Non-Obvious Engine Constraint

The `@anthropic-ai/claude-agent-sdk`'s `query()` resolves its bundled native binary and mis-selects the linux-x64-musl variant on non-musl hosts. On macOS this is less likely to occur, but the SDK still requires `options.pathToClaudeCodeExecutable` to be set to the system `claude` binary (resolved via `execSync('which claude')`). Every SDK call site must include this guard independently — a missing guard on one entry point will silently fail while others work. This runs in the core Node server (same as before; not Electron-specific) and was proven in Phase 0.

The SDK already surfaces streaming output, tool-call activity, AskUserQuestion-as-cards, and slash-command/skill invocation through the event-transformer gate (proven in Phase 0). The hybrid change moves the *delivery* of those events from Electron IPC to the `helm` WebSocket channel — the events themselves are unchanged; only the transport differs.

**better-sqlite3 ABI note (carried over):** tests run against the Node ABI (`npm rebuild better-sqlite3`); the packaged Electron build needs the Electron ABI (`npm run rebuild`). With the hybrid runtime, the dev/dogfood path runs the core under plain Node, so the Node ABI is the primary one; the Electron ABI is only needed when packaging.
