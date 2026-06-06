# Watch It Get Made — Validation

This is the test contract for `/sdd-review`. Every check listed here must pass before Phase 2 is approved.

## Automated Checks

Run from `app/`. Each must exit 0.

- **TypeScript:** `npx tsc --noEmit -p tsconfig.json` — zero type errors across main, renderer, preload, and shared
- **Unit tests — event-transformer (gate extension):** `npx vitest run event-transformer` — all tests pass including new Write/Edit/Bash real-path suppression cases and `stripCode` utility
- **Unit tests — DB (migration 3):** `npx vitest run db` — all tests pass; `build_steps` table exists with correct columns; `artifact_dir` and `dev_pid` columns exist on `projects`
- **Unit tests — dev server manager:** `npx vitest run dev-server-manager` — all state-machine tests pass: start → live; crash → snag → restart → live; double crash → blocked; stop → none; resume with alive PID → live; resume with dead PID → restart attempt
- **Unit tests — session orchestrator (extended):** `npx vitest run session-orchestrator` — all existing tests pass (narration-only path unchanged); new tests for real-pipeline path pass (artifact_dir created, build_step created, DevServerManager.restart called on finish)
- **Unit tests — preview store:** `npx vitest run preview-store` — state transition tests pass
- **IPC contract tests:** `npx vitest run contract-flow` — all existing contract tests pass; new tests for `preview:get-state`, `devserver:start`, `devserver:stop` pass covering success and all named error conditions
- **Full test suite:** `npx vitest run` — all tests pass

## Manual Verification

Viewport: 1280px desktop (Electron window). All checks are pass/fail.

**Live Preview tab — no preview state (before any build):**
- [ ] Open Helm, open a project with no completed build session → Live Preview tab shows calm "nothing to show yet" state — no error, no spinner, no broken content
- [ ] The Live Preview tab is reachable from the tab bar without being greyed or locked

**Live Preview tab — building veil:**
- [ ] Start a build session for a card → the Live Preview tab immediately shows the "Building…" veil (calm, animated indicator, no technical text)
- [ ] The veil persists while the session is active; no partial app flickers through

**Live Preview tab — live app running (PRIMARY FLOW — stop criterion):**
- [ ] A build session completes → the "Building…" veil transitions automatically to the live embedded app — no page reload or user action required
- [ ] The embedded app displays a real rendered UI (not a blank page, not an error page, not a Helm chrome element)
- [ ] The user can click a button or link inside the running app and the app responds (navigation, form submit, or interactive element — any one is sufficient)
- [ ] No Helm chrome (header, nav, board elements) is visible inside the embedded webview area
- [ ] No file paths, terminal output, command text, or code appears anywhere in the Helm window during or after the build

**Live Preview tab — snag / auto-recovery:**
- [ ] Simulate a dev server crash (or trigger one via the smoke test): preview transitions to "Hit a snag, fixing it" state — calm, no alarming copy
- [ ] After auto-restart succeeds: preview transitions back to live app without user action
- [ ] No error banner or technical message appears during the snag recovery

**Live Preview tab — blocked state:**
- [ ] Simulate a double crash (server fails twice): preview shows blocked overlay AND the board simultaneously shows a Needs-you / decision card
- [ ] Answering the board card resolves the blocked state; preview resumes

**Build pipeline — real artifacts:**
- [ ] After a build session completes: `artifact_dir` for the project is a real directory that exists on disk (verify via `DevServerManager` internals in the smoke test — not user-facing)
- [ ] `helm.json` exists in `artifact_dir` with valid `startCommand` and `port` fields (verified by smoke test)
- [ ] An HTTP GET to the dev server URL returns HTTP 200 (verified by smoke test)

**Hard gate — no raw output to renderer:**
- [ ] During a real build session (tools enabled), open the Helm Developer Tools (View menu) → inspect the `feed:event` IPC payloads in the console → confirm no FeedEvent.text contains a file path (e.g. `/Users/`), a code block (` ``` `), a tool-call argument, or raw shell output
- [ ] The scoped session feed shows only friendly narration ("Writing the database schema", "Setting up the routes") — never tool names or commands

**Persistence on reopen:**
- [ ] Start a project with a live preview → quit the Helm app → relaunch → open the same project → Live Preview tab shows the live app (dev server restarted automatically on relaunch)
- [ ] If the dev server cannot restart (artifact broken): preview shows "nothing to show yet" state — not an error — and no file paths are shown

**Existing Phase 1 regression (must not break):**
- [ ] Create a new project, go through the wizard, approve a plan → the build-spine board populates normally
- [ ] Start a build session → the scoped session feed shows narration (the narration-only path still works)
- [ ] Decision prompt → answer from board → session resumes → board updates
- [ ] "Needs you" headline promotion still works correctly
- [ ] Project switcher background status still updates while on a different project

## Primary Flow (Must-Pass — stop criterion)

Phase 2 **fails** if this flow does not pass:

1. Open Helm with an existing project (or create one and run one build session).
2. Open the Live Preview tab.
3. The running local app is visible in the embedded preview — a real rendered UI.
4. Click an interactive element in the app (a button, a link, a form).
5. The app responds to the click.

All five steps must pass. If any step fails, Phase 2 is not approved, regardless of all other checks.

## Definition of Done

This phase is complete when ALL of the following are true:

- [ ] All automated checks pass (exit 0)
- [ ] All manual verifications pass
- [ ] Primary flow (must-pass) passes
- [ ] Hard gate verified: no raw tool output reaches the renderer during a real build session
- [ ] Frontend compliance check passes (handover covers all Live Preview tab states)
- [ ] UX review passes — no blocking issues
- [ ] User explicitly approves
- [ ] Living docs updated: README status, WIKI learnings, docs/api.md, CHANGELOG.md
