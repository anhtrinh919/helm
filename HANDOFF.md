# Helm — Session Handoff (Phase 1 → Phase 2)

Read this before starting a new session. It captures the non-obvious things that
aren't visible from the code or git log. Phase 1 (The Executive Dashboard) is
complete and committed; `.build-state.json` is at `phase-complete`. Run `/build`
to update docs and start **Phase 2 — Watch It Get Made** (Live Preview).

---

## 1. The one that will bite you first: better-sqlite3 has TWO ABIs

`better-sqlite3` is a native module. The Node ABI and the Electron ABI are
different binaries, and there is only one `node_modules`.

- **Running the unit/integration tests** (`vitest`) needs the **Node** build:
  `cd app && npm rebuild better-sqlite3`
- **Running the real desktop app** (`electron-vite dev`) needs the **Electron**
  build: `cd app && npm run rebuild` (this is `electron-rebuild -f -w better-sqlite3`)

Switching between "run the tests" and "run the app" means rebuilding. If tests
explode at `new Database(path)` with a NODE_MODULE_VERSION mismatch, that's this.
A running app already has the binary loaded in memory, so rebuilding the file for
tests won't crash a live app — but the app's **next launch** needs the Electron
build restored. Always leave it on the Electron build when you hand back to the user.

## 2. Verify the renderer on a production preview, not the dev server

Vite HMR fragments the Zustand stores after many edits (a subscription writes one
store instance, a component reads another) — events look stuck even though the
push fired. Always confirm UI behavior on `npx vite build --config vite.web.config.ts`
+ `npx vite preview --config vite.web.config.ts`, never the HMR dev server.

## 3. Two dogfood surfaces — know which one you're looking at

- **Real app:** `cd app && npm run dev` → desktop Electron window, live Claude
  Agent SDK on the user's own subscription, real DB at `app.getPath('userData')/helm.db`.
  Needs the Electron ABI (see #1).
- **Mock web build:** `npx vite preview --config vite.web.config.ts --host` →
  browser-testable, scripted `mock-bridge.ts` data, no native module, no SDK cost.
  This is what `/browse` can drive and what the dogfood server serves
  (currently port 4317, PID in `.build-state.json` `dogfoodPid`).
  Mock timing is StrictMode-flaky — clicks may not route under headless automation.

## 4. The hard gate is real — don't add a second feed-writing path

`src/main/sdk/event-transformer.ts` is the single chokepoint that turns raw SDK
messages into user-safe `FeedEvent`s. No code, file paths, tool args, or terminal
text may cross it. Tool calls become a friendly label (never the tool name/args);
non-decision JSON is dropped (never narrated). Every renderer-facing feed string
goes through `makeFeedEvent`. Keep it that way.

## 5. Wizard and build sessions parse agent text differently — keep them apart

Both run on the SDK, but:
- **Build sessions** use `transform()` → hard gate + decision detection. Decisions
  are the marker `{"decision":{"question":"...","options":["A","B"]}}` (options
  optional → free text). `splitJson` strips all JSON from narration.
- **The wizard** uses `assistantText()` (raw concatenated text) because it must
  keep its own JSON intact to parse: `{"ask":{question,type,options?}}` for a
  scoping question, `{"plan":{name,steps}}` for the finished plan.

They were deliberately decoupled (a shared transform that strips JSON would break
the wizard). Don't re-merge them. Shared helpers live in `sdk/json-extract.ts`.

## 6. Phase 1 sessions are text-only — there are no project files yet

Build sessions run with `allowedTools: []` and `cwd: tmpdir()`. The agent narrates
but does **not** write a real app. So "where does my project live?" has no answer
yet — there are no artifacts on disk to browse. That becomes real only when a later
phase wires an actual build pipeline that writes files. Keep this in mind before
promising any file/artifact browsing.

## 7. Build-spine invariants (enforced, not conventional)

- **One Building spotlight per project** — enforced in `SessionOrchestrator.start()`;
  a second concurrent start returns `session_already_active`.
- **Transitions** live in `db/cards.ts`. Note `building → up_next` was added so a
  user **Stop** returns the card to a resumable state.
- **Decisions** pause the build and promote the card to `needs_you` (board headline).
- **Checkpoints** gate the next card's promotion to `up_next`.
- Contract error codes (`not_awaiting_decision`, `session_already_active`,
  `no_checkpoint`, `cannot_reopen`, `invalid_transition`) are all reachable and tested.

## 8. The 'stopped' state (added during dogfood)

A user Stop is a distinct, calm end-state — NOT an error. `SessionStatus` and
`FeedEventKind` both gained `'stopped'`. The orchestrator marks intent in an
`interrupted` set BEFORE aborting, so the resulting close/error routes to a clean
`halt()` (emits a `stopped` feed event, card → up_next), never the failure path.

---

## Verify / test commands (from `app/`)

- Tests (needs Node ABI — see #1): `npx vitest run` — 67 tests
- Strict types: `npx tsc --noEmit -p tsconfig.json`
- Full Phase-1 gate: `bash verify-group-8.sh`
- Live SDK smoke (uses the real `claude` binary): `npx tsx scripts/verify-group-1.ts`

## Repo state

- Branch `phase-1-the-executive-dashboard`, ~17 commits ahead of `main`.
- **No git remote configured** — everything is local. Set one up before relying on push.
- `specs/2026-06-03-the-executive-dashboard/` holds requirements / plan / validation —
  `requirements.md` is the contract.

---

## Deferred from Phase 1 dogfood (carry into planning)

- **File/artifact browser ("where does my project live?").** The user wants a
  lite browser for non-code artifacts (constitution, specs, docs). **Recommendation:
  fold this into the already-planned Phase 4 "Docs View" tab — complement the
  Decisions Log, don't replace it.** They answer different questions (Decisions Log
  = "what did I decide and why"; Docs View = "show me the written artifacts"). It
  only becomes meaningful once a real build pipeline writes artifacts to disk
  (Phase 2+), so it is correctly a later-phase feature, not a Phase 1 gap.

## Next: Phase 2 — Watch It Get Made

The real app being built runs live inside the Helm window as a **Live Preview**
pane (the stub tab that currently says "Unlocks in Phase 2"). This is where the
text-only build sessions of Phase 1 must grow into a real pipeline that produces
something embeddable. Expect the "no project files yet" reality from #6 to be the
first thing that changes.
