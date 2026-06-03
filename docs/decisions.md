> Agent context — not for human reading.

# Technical Decisions — Helm

**Electron as desktop shell** — Why: Node runs natively in Electron's main process; Claude Agent SDK (Node/TypeScript) wires directly without a bridge or subprocess hack. Alternatives: Tauri (Rust core would require SDK sidecar + IPC complexity); browser app (user explicitly chose double-click desktop).

**Claude Agent SDK over Anthropic REST API** — Why: runs on user's existing Claude subscription; free for the user; aligns with bring-your-own-subscription hard constraint. Alternatives: paid REST API would charge per token, breaking the free/open-source constraint.

**SQLite via better-sqlite3** — Why: synchronous API fits Electron main process; zero-config; single file is easy to back up; no server required. Alternatives: PostgreSQL (overkill, requires running server); IndexedDB (renderer-only, inaccessible from main process where agents run).

**Vite for frontend build** — Why: standard Electron + React pairing; fast HMR in dev; straightforward production build. Alternatives: CRA (deprecated); webpack (slower, more config overhead).

**Zustand for state management** — Why: minimal boilerplate; works without React context providers; easy to split into slices. Alternatives: Redux (too much ceremony for a single-user app); Jotai (atom model less intuitive for board-shaped state).

**Typed IPC channels via contextBridge** — Why: renderer stays sandboxed; Zod validates every message crossing the process boundary. Alternatives: `nodeIntegration: true` — security risk; harder to validate message shapes.

**Phase 1, Task Group 1 = engine wire-up** — Why: surfaces SDK plumbing problems (pathToClaudeCodeExecutable, auth, streaming, tool-call events) on day one before design work accumulates. Known risk: musl binary mis-selection gotcha (see tech-stack.md Non-Obvious Engine Constraint). Alternatives: deferring to a later group — would let visual work stack up against an unverified engine contract.
