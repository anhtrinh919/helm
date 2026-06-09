# The Cockpit & the Journey — Validation

The test contract for `/sdd-review`. Every check must pass before Phase 1 is approved. Manual checks run in the **real `localhost` web UI** backed by the live local core (the real thing, not a stub) — with a final pass in the packaged Electron app. Day-to-day dogfood is the localhost UI.

## Automated Checks

Run these; each must exit 0. (With the hybrid runtime, the `helm` bridge is HTTP/WebSocket, so contracts can be verified by unit tests on the handlers/DB functions AND by HTTP calls against a running core. Tests run against the Node ABI: `cd app && npm rebuild better-sqlite3` first; the Electron ABI (`npm run rebuild`) is only needed when packaging.)

- **Hybrid runtime boots:** `cd app && npm rebuild better-sqlite3 && npx vitest run src/main/ipc/__tests__` — the core's `helm` HTTP/WS layer answers a sample operation and relays a sample push; the `helm` client (`fetch`+WS) round-trips against it. (Group 0.)

- **TypeScript:** `cd app && tsc -p . --noEmit` — zero type errors across renderer, main, preload; strict; no `any` escapes.
- **Migration 6 version bump + idempotency:** `cd app && npx vitest run src/main/db/__tests__/db.test.ts` — `PRAGMA user_version` is 6 after migration; re-running the migration leaves it at 6 with no error; both new columns (`cards.outcome`, `projects.position`) exist.
- **cards.outcome round-trip:** covered in `db.test.ts` — a card seeded from a plan whose step has `detail` returns that string as `card.outcome`; a card with no detail returns `null`; `cards:set-outcome` updates it and reads back.
- **projects.position / reorder round-trip:** covered in `db.test.ts` + `src/main/ipc/__tests__` — three projects; `projects:reorder` with a reversed ID array; read back asserts positions match the new order; `listProjects` returns them in that order.
- **projects:reorder error paths:** `cd app && npx vitest run src/main/ipc/__tests__` — incomplete array → `{ ok: false, error: 'incomplete_list' }`; unknown ID → `{ ok: false, error: 'unknown_project' }`.
- **shelf:remove handler:** `cd app && npx vitest run src/main/ipc/__tests__` — valid item removed from DB and `shelf:updated` emitted; unknown ID → `{ ok: false, error: 'not_found' }`.
- **cards:set-outcome handler:** `cd app && npx vitest run src/main/ipc/__tests__` — valid card+outcome → `{ ok: true }`; unknown card → `{ ok: false, error: 'card_not_found' }`; empty/whitespace-only outcome → `{ ok: false, error: 'invalid_input' }`.
- **shelf:promote sets outcome:** covered in `src/main/ipc/__tests__` — promoting a parked item produces a board card on the same project whose `outcome` equals the parked request text; card insert failure → `{ ok: false, error: 'card_create_failed' }`.
- **inline text edit (points:register-text-edit):** `cd app && npx vitest run src/main/sdk/__tests__ src/main/ipc/__tests__` — a simulated `__HELM_TEXTEDIT__` capture line yields a pending edit; `points:register-text-edit` with distinct old/new text produces a selector-anchored `fix_comment` card carrying the change instruction and returns it; identical text → `{ ok: false, error: 'no_change' }`; a forced session-spawn failure deletes the card (no orphan) and returns `{ ok: false, error: 'session_error' }`.
- **Parked-feed → shelf wiring:** `cd app && npx vitest run src/main/ipc/__tests__` — when a `parked` feed event is ingested for a project, a shelf item is created and `shelf:updated` is pushed; an ordinary in-session fix event creates no shelf item. (Tests the UI/data contract for triage, not the agent's classification, which is engine-side.)
- **Build journey E2E (full walk, not just smoke):** `cd app && npm run rebuild && npx playwright test tests/e2e/build-journey.spec.ts` — picks "Build something new", completes the wizard, asserts the journey renders with "Step 1 of N", the For-Later shelf badge, and the escape hatch; drives a step to its checkpoint; asserts the checkpoint renders a "Looks good — continue" button AND that the counter STILL reads "Step 1 of N" at this point (proving no auto-advance on completion); only then presses Continue and asserts the counter becomes "Step 2 of N".
- **Iterate — start fresh (E2E):** `cd app && npx playwright test tests/e2e/front-door.spec.ts` (scenario) — picks "Iterate → Start fresh", submits a first request, asserts the board renders with a card in a building state and NO wizard/journey UI visible.
- **Inline text edit (E2E round-trip):** `cd app && npm run rebuild && npx playwright test tests/e2e/inline-text-edit.spec.ts` — opens a live preview with a known text element, activates "Edit text here", submits a changed value, and asserts (synchronously, no live-Claude dependency) that a board fix card referencing the change appears and a fix session is spawned. The "live preview shows the updated text" assertion is a MANUAL outcome check (it depends on a real fix-session completion), not part of this E2E.
- **Two-door front door (E2E):** `cd app && npx playwright test tests/e2e/front-door.spec.ts` — two door options visible; "Bring an existing app" shows a "coming soon" indicator and is not clickable.

## Manual Verification

Run in the real `localhost` web UI (backed by the live core). The packaged Electron app gets a final smoke pass at phase end.

**Hybrid runtime (do first)**
- [ ] Starting the core and opening `localhost` in a browser shows the real app (not a stub): real projects load, a session can run, the live preview works — all over the `helm` HTTP/WS bridge.
- [ ] The same UI, launched via the packaged Electron app, behaves identically (final distribution check).

### Chunk 1 — Front Door & Build Journey

**Front Door**
- [ ] Opening the app shows two distinct doors: "Build something new" (leading) and "Iterate on an app" (with "Start fresh" and "Bring an existing app" sub-options).
- [ ] "Bring an existing app" shows a visible "coming soon" indicator; clicking it does nothing (no navigation, no error).
- [ ] The "Running on your Claude subscription" signal is visible on the front door — not a modal, not hover-only, not a nag.

**Wizard (reskinned)**
- [ ] Picking "Build something new" opens the idea input; submitting a goal transitions to scoping Q&A (one question at a time, with progress); approving the plan transitions to the journey view.
- [ ] If Helm cannot reach Claude, a plain-English error appears (no stack trace, no code).

**Build Journey**
- [ ] A "Step N of M" counter correctly reflects the current step and total.
- [ ] Each step shows the current milestone's plain-language title and purpose.
- [ ] Completed / current / locked steps are visually distinct.
- [ ] The journey milestones read as the build-stack practice in plain language (understand the idea → scope → plan → build the look → build the function → review/try), not as opaque technical steps.
- [ ] The For-Later shelf is accessible from the journey view; its badge shows a count when items are parked.
- [ ] An escape hatch ("Leave the journey") is visible; clicking it shows a confirmation before transitioning to the board.
- [ ] Quit the app mid-journey (a step in progress), relaunch, and re-open the project — the journey resumes at the same step with the correct "Step N of M" counter, no data re-entry required.

**Checkpoint**
- [ ] When a step completes, the journey enters a hard-stop checkpoint showing what was built in plain language and prompting the user to test the preview.
- [ ] "Looks good — continue" is the only way to advance; no automatic advancement.
- [ ] Submitting optional feedback records it and shows a confirmation before continuing.

**Mid-journey triage**
- [ ] A small/direct fix request during the journey shows "Fixing now" inline without opening the shelf.
- [ ] A large or unrelated request shows a clear "parked" notification; the For-Later shelf count increments immediately.

**For-Later Shelf**
- [ ] The shelf lists parked requests with the original request text.
- [ ] An empty shelf shows the placeholder (no phantom entries).
- [ ] Promoting an item creates a board card on the same project's board (carrying the request text as its outcome) and removes it from the shelf.
- [ ] Dismissing an item removes it without creating a board card.

**Journey Complete**
- [ ] Completing the final checkpoint shows a celebration screen displaying the exact phrase "Your app now does what you set out to build" AND a single continue CTA button.
- [ ] After continuing, the board is in free iteration mode.
- [ ] The journey collapses to a compact strip pinned at the top of the board, showing the original goal title + a "Completed" indicator.
- [ ] Clicking the strip expands it to show the journey milestone history.
- [ ] Re-opening the project from the project list (after completion) lands on the Cockpit Board with the collapsed strip — not a journey-resume screen.

**"Running on your Claude subscription"**
- [ ] The signal is visible in the wizard, journey, cockpit board, and scoped session views.
- [ ] At no point does it resemble a token meter, usage warning, or upgrade prompt.

**Iterate — start fresh**
- [ ] Picking "Iterate on an app → Start fresh" and submitting a first request transitions directly to the board with a building card visible — no wizard, no journey.

### Chunk 2 — Cockpit Board, Point-and-Fix, Project Management

**Outcome on every card**
- [ ] Every card on the board shows a plain-language outcome (e.g. "lets a visitor book a slot") in addition to title and status.
- [ ] A card with no outcome set shows the design's empty-state for that field (the outcome area is not hidden).
- [ ] After a session completes and a card's outcome is updated, the new text appears on the card face without reloading the app.

**Point-and-Fix — describe a fix (existing, reskinned)**
- [ ] Clicking an element in the live preview highlights it; "Describe a fix" submits and a fix card appears/updates on the board.

**Point-and-Fix — inline text edit (NET-NEW)**
- [ ] Clicking a text element shows both "Describe a fix" AND "Edit text here".
- [ ] "Edit text here" makes the element's text editable in-place in the preview (not a separate input), pre-filled with current text.
- [ ] Submitting the inline edit closes edit mode, spawns a fix session, and a board card referencing the change appears.
- [ ] Submitting unchanged text shows a "no change" message and spawns no session.
- [ ] Clicking a non-text element shows only "Describe a fix" (no "Edit text here").

**Project management**
- [ ] The project list shows a reorder affordance; reordering persists after navigating away and back.
- [ ] The overflow menu has "Rename" and "Delete".
- [ ] "Rename" makes the name an inline input; Enter/blur saves, Escape cancels.
- [ ] "Delete" shows a confirmation modal naming the project; confirming removes the row from the list immediately (no app reload), after stopping any running session/dev server.
- [ ] Reordering persists across an app restart (not just panel reopen).
- [ ] Reordering while a session is building still persists correctly.
- [ ] A project running a dev server shows a "Live" indicator; the "Stop" control calls `sessions:stop` and the indicator clears within a few seconds.

**Remaining reskin (spot-check)**
- [ ] Scoped Session, Decisions/Progress/Docs panels, and Live Preview chrome all use the new visual language (no maximalist/playful tokens visible).

## Outcome Checks

One per primary outcome on `outcome-card.md` (same order). Each is binary and demonstrable on screen by a non-technical person.

- [ ] **Outcome 1 — Guided journey:** Starting "Build something new" + a goal produces a visible ordered milestone list with "Step N of M"; completing a step lands on a hard-stop checkpoint with a "Continue" button; parking a large mid-journey request makes it appear on the For-Later shelf (not on the board, not lost).
- [ ] **Outcome 2 — Outcome always on card:** Every card on the Cockpit Board shows a plain-language description of what it is for, with no card requiring the user to open it to learn its purpose, shown alongside the live app.
- [ ] **Outcome 3 — Point and fix (describe + inline text):** Clicking an element presents "Describe a fix" and (for text elements) "Edit text here"; choosing "Edit text here" makes the text editable in-place and submitting it makes a fix card referencing that element appear on the board immediately AND, within ~30 seconds of the fix session completing, the live preview reloads showing the updated text — without the user writing a description or naming a file.

## Definition of Done

- [ ] All automated checks pass (exit 0) — TypeScript, all unit tests, both E2E specs
- [ ] All Chunk 1 manual verifications pass
- [ ] All Chunk 2 manual verifications pass
- [ ] Outcome Check 1 passes — guided journey with milestone list, checkpoint, and For-Later shelf working
- [ ] Outcome Check 2 passes — every cockpit card shows its plain-language outcome on the card face
- [ ] Outcome Check 3 passes — inline text edit in the live preview works end-to-end
- [ ] Frontend compliance check passes — design file coverage matches all UI requirements
- [ ] UX review passes — no blocking issues from the reviewer fleet
- [ ] User explicitly approves the phase at the dogfood handoff (on the real `localhost` web UI; packaged Electron app smoke-passes too)
- [ ] Living docs updated: `CHANGELOG.md` entry; `docs/decisions.md` updated with Migration 6 rationale and the latent decisions resolved during build
