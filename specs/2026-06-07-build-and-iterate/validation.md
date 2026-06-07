# Phase 4 Validation — Build & Iterate

> All checks run against the real Electron app (`npm run dev` from `app/`). The mock-bridge is retired — no mock-bridge surface is used for any validation step.

---

## Automated Checks

### A1 — TypeScript typecheck (both chunks)
```bash
cd app && npm run typecheck
```
Expected: exits 0 with no errors.

### A2 — Unit tests (both chunks)
```bash
cd app && npm run test
```
Expected: exits 0, all tests pass. (Includes existing Phase 1–3 tests; no Phase 4 unit tests are strictly required but any new DB functions should have unit tests following the pattern in `app/src/main/db/__tests__/`.)

### A3 — Old token audit (end of Chunk 2, Group 14)
```bash
grep -rn 'brut\|bg-canvas\|bg-cream\|bg-ink\|bg-pink\|bg-lime\|bg-violet\|bg-orange\|font-display\|text-soft\|railcard\|Fraunces\|Space Grotesk' app/src/renderer/src/ --include="*.tsx" --include="*.ts" --include="*.css"
```
Expected: zero matches.

### A4 — Database migration smoke test
Run the app against a fresh DB, then verify the schema:
```bash
cd app && node -e "
  const Database = require('better-sqlite3');
  const db = new Database('/tmp/test-phase4.db');
  require('./dist/main/db/migrations').migrate(db);
  const cols = db.pragma('table_info(projects)').map(c => c.name);
  console.assert(cols.includes('mode'), 'mode column missing');
  console.assert(cols.includes('rail_step'), 'rail_step column missing');
  console.assert(cols.includes('rail_complete'), 'rail_complete column missing');
  console.assert(cols.includes('import_folder'), 'import_folder column missing');
  const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all().map(r => r.name);
  console.assert(tables.includes('shelf_items'), 'shelf_items table missing');
  console.log('Migration OK');
"
```
Expected: outputs "Migration OK" with no assertion errors.

### A5 — IPC channel registry completeness
```bash
grep -o "'[a-z:-]*'" app/src/shared/ipc-schemas.ts | sort | uniq
```
Manually verify that all of the following new channels appear in the output:
- `sessions:stop`
- `projects:rename`
- `projects:delete`
- `projects:set-mode`
- `projects:set-rail-step`
- `shelf:list`
- `shelf:add`
- `shelf:promote`
- `import:scan`
- `import:start`

---

## Chunk 1 — Manual Verification Checks

### Visual Language

**V1-1 — New token system applied globally (desktop, 1440px wide)**
1. Start the Electron app (`npm run dev`).
2. On every screen listed below, open devtools → Elements → inspect the `body` and main content containers.
3. Verify: `background-color` resolves to `var(--color-bg)` (#F8F7F5); no hex values from the old v4 palette (#ffefd2, #1b1208, #ff6f91, #c8f23a, #6b4beb, #ff7a29) appear in computed styles.
4. Verify: `font-family` resolves to Inter, not Space Grotesk or Fraunces.
**Screens to check:** Front Door, Project Switcher, Build Rail, Scoped Session, Decisions/Progress/Docs panels.
**Pass:** All screens use the new token system. No old colors visible.

**V1-2 — No `brut` outlines visible**
1. On any screen, inspect any card, button, or panel.
2. Verify: no element has a `3px solid` or `2px solid` border with `#1b1208` color applied via the `brut` or `brut-2` classes.
**Pass:** Zero elements use the old chunky outline pattern.

### Front Door (Two Doors)

**V1-3 — Two-door front door, cold launch**
1. Delete the app DB or launch with a clean profile.
2. Start the Electron app.
3. Verify: the front door screen shows two distinct choices — "Build something new" and "Iterate on an app" — without any text input field visible initially.
**Pass:** Two distinct choice areas visible; no sentence input on load.

**V1-4 — "Iterate on an app" expands inline**
1. From the two-door front door, click "Iterate on an app."
2. Verify: the same screen (or an immediate inline expansion) shows two sub-options: "Start fresh" and "Bring an existing app." No full-screen navigation change occurs.
3. Verify: clicking elsewhere or pressing Escape collapses back to the two-door view.
**Pass:** Sub-options appear inline; no navigation away.

### Build Mode

**V1-5 — Build something new: rail generated**
1. Click "Build something new."
2. Answer the wizard's scoping questions and approve the plan.
3. Verify: the Build Rail view opens showing the plan steps in order, labeled "Step 1 of N," "Step 2 of N," etc.
4. Verify: only Step 1 is active/expanded; all other steps are locked (visually muted, no click-to-open).
**Pass:** Ordered rail visible; Step 1 active; others locked.

**V1-6 — Rail checkpoint hard-stop**
1. Start Step 1's session. Let it run until a checkpoint event arrives (or mock one by advancing the session to done in the DB and reloading).
2. Verify: the Rail Checkpoint UI appears within the current step's area — screenshot or summary, "Report a bug" input, and "Continue to the next step →" button.
3. Verify: there is no other way to advance the step (no "Next" button elsewhere, no auto-advance).
4. Click "Continue to the next step →." Verify Step 2 unlocks (becomes active/expanded), and Step 1 collapses as done.
**Pass:** Hard-stop works; Step 2 unlocks only after explicit Continue.

**V1-7 — For-later shelf: large request parked**
1. With a Build mode project open at an active rail step, type a large scope-expanding request into the steering input (e.g., "Add a full CRM integration with Salesforce and a reporting dashboard").
2. Verify: the agent responds with a "Saved for later" message in the session feed.
3. Verify: the For-Later Shelf panel appears (or is already visible) and the request title is listed in it.
4. Verify: the current step's session continues without incorporating the parked request.
**Pass:** Shelf gains the item; session unaffected.

**V1-8 — For-later shelf is empty = collapsed**
1. Start a new Build mode project with no shelf items.
2. Verify: the For-Later Shelf panel is not visible (fully collapsed/hidden).
**Pass:** No shelf panel when there are no items.

**V1-9 — Build→Iterate Celebration and transition**
1. Complete all rail steps (or force-advance rail_step past plan.length in the DB for testing).
2. Verify: the Celebration overlay appears full-screen with the success message.
3. Verify: a journey strip of completed steps is visible.
4. Click the CTA ("Start iterating →" or equivalent).
5. Verify: the freeform board (ProjectBoard) loads in Iterate mode.
6. Verify: any shelf items that existed are now visible as backlog cards on the board.
**Pass:** Celebration shown; transition to Iterate board with shelf items promoted.

### Bug Fixes

**V1-10 — Session stop: Stop button visible and works**
1. Open any active session's Scoped Session view.
2. Verify: a "Stop session" button is visible (secondary/destructive styling).
3. Click Stop. Verify: the session status in the feed or board updates to stopped; the session does not continue generating feed events.
4. Verify: the Stop button is not visible on an already-stopped or done session.
**Pass:** Stop works; button only visible when applicable.

**V1-11 — Live badge truthfulness**
1. Start a session that launches a dev server (a project with `artifact_dir` set and a valid `helm.json`).
2. Verify: the "Live" badge appears in the Rail sidebar for that project when the dev server is running.
3. Stop the session (using the Stop button from V1-10) or kill the dev server.
4. Verify: the "Live" badge disappears from the Rail sidebar within a few seconds.
5. Start a new session for a project without a dev server (no artifact_dir). Verify: "Live" badge never appears even though the session is active.
**Pass:** Badge reflects actual dev server status.

**V1-12 — Back/home navigation: no dead ends**
1. Navigate to each of the following screens: Front Door, Project Switcher, Wizard (mid-scoping), Scoped Session, Build Rail, Project Board (Iterate mode).
2. On each screen: verify there is a visible, reachable control to go back to the previous screen or to the project switcher/front door.
**Pass:** Every screen has a working back or home navigation control.

**V1-13 — Wizard state survives project switch**
1. Click "Build something new" and answer at least one scoping question (do not approve the plan yet).
2. From the Rail sidebar, click a different project (or use the "Your builds" navigation to switch).
3. Navigate back to the wizard project (via the rail or project switcher).
4. Verify: the wizard is at the same step, showing the question already answered. No state is lost.
**Pass:** Wizard Q&A state persists across project switches.

---

## Chunk 2 — Manual Verification Checks

### Iterate Mode: Start Fresh

**V2-1 — Start fresh: scaffold and feature as one step**
1. From the front door, click "Iterate on an app" → "Start fresh."
2. Enter a description of a first feature.
3. Complete the wizard.
4. Verify: the board opens in Iterate mode (not Build mode rail) with a single card in Building state.
5. Verify: the session starts automatically — no manual "click to begin" is required.
6. Let the session complete. Verify: the board shows the card as Done.
**Pass:** One combined step; session auto-starts; board is Iterate mode.

### Iterate Mode: Import

**V2-2 — Import flow: folder picker opens**
1. From the front door, click "Iterate on an app" → "Bring an existing app."
2. Verify: the Import Flow screen opens (not the wizard, not the front door — a distinct screen with a "Choose folder" button or OS dialog trigger).
3. Click "Choose folder." Verify: the native OS folder picker opens.
**Pass:** Import flow screen shown; OS folder picker opens.

**V2-3 — Import: helm.json detection (high confidence)**
1. Create a test folder with a `helm.json` containing `{ "startCommand": "npm run dev", "port": 3000 }`.
2. In the import flow, select this folder.
3. Verify: the manifest review step shows the detected start command and port with a "high confidence" indicator.
4. Click "Start." Verify: the dev server attempt begins (it may fail if there's no actual app — that's OK; the test is that the scan succeeded and the start was attempted with the correct values).
**Pass:** helm.json detected; high confidence shown; start attempted.

**V2-4 — Import: package.json detection (low confidence)**
1. Create a test folder with a `package.json` containing `{ "scripts": { "dev": "vite", "start": "node server.js" } }` (no `helm.json`).
2. Select this folder in the import flow.
3. Verify: the manifest review step shows the detected `dev` or `start` command with a "low confidence" indicator and pre-filled manual override fields.
**Pass:** package.json detected; low confidence shown; manual fields pre-filled.

**V2-5 — Import: no detection → manual override**
1. Create a test folder with no recognizable patterns (e.g., a folder with only a README.md).
2. Select this folder in the import flow.
3. Verify: the "not found" state shows with empty manual override fields for start command and port.
4. Fill in the manual fields and click "Start." Verify: the start is attempted with the entered values.
**Pass:** No false positive detection; manual override form shows and works.

**V2-6 — Imported project: full iterate board works**
1. Import a project that actually runs (a real local web app with helm.json or package.json dev script).
2. After import, verify: the board opens in Iterate mode; the live preview loads the app.
3. Click any element in the live preview. Verify: point-and-fix overlay appears.
4. Submit a bug report. Verify: a card appears on the board as a reported fix.
**Pass:** Full iterate board (preview + point-and-fix) works on an imported project.

### Project Management

**V2-7 — Rename a project**
1. Open the Project Switcher.
2. Find a project and activate inline rename (click the name or a rename control).
3. Type a new name and confirm (Enter or blur).
4. Verify: the new name appears in the switcher and in the Rail sidebar immediately.
5. Reload the app. Verify: the new name persists.
**Pass:** Rename works and persists.

**V2-8 — Delete a project with confirmation**
1. Open the Project Switcher.
2. Find a project and click the delete control (trash icon or "..." menu → Delete).
3. Verify: a confirmation step appears before deletion (not an immediate delete).
4. Confirm deletion.
5. Verify: the project is removed from the switcher and the Rail sidebar.
6. Verify: the project does not reappear on reload.
**Pass:** Delete shows confirmation; project removed; does not reappear.

**V2-9 — Mode badges in Rail and Switcher**
1. Have at least one Build-mode project and one Iterate-mode project.
2. Verify: the Rail sidebar shows a "Build" or "Iterate" badge (or equivalent indicator) on each project's card.
3. Verify: the Project Switcher cards also show the mode badge.
**Pass:** Mode is visually distinguished in both Rail and Switcher.

### Existing Project Mapping

**V2-10 — Phase 3 done project → Iterate mode**
1. Start the app against a Phase 3 DB that has a project with `status = 'done'`.
2. Verify: the project opens in Iterate mode (freeform ProjectBoard, no rail visible).
**Pass:** Done pre-modes project lands in Iterate mode.

**V2-11 — Phase 3 in-progress project → Build mode at correct step**
1. Start the app against a Phase 3 DB that has a project with `status = 'building'` and a partially completed plan (some cards `done`, some `planned`).
2. Verify: the project opens in Build mode (BuildRailView), positioned at the first non-done step.
**Pass:** In-progress pre-modes project lands at the right rail step.

### Full Reskin

**V2-12 — Zero old tokens in production build**
Run automated check A3. Expected: zero matches.

---

## Definition of Done

Phase 4 is approved when ALL of the following are true:

1. **A1** — TypeScript typecheck exits 0
2. **A2** — Unit tests all pass
3. **A3** — Zero old token matches (post-Chunk 2)
4. **A4** — Migration smoke test passes
5. **A5** — All new IPC channels present in the registry
6. **Chunk 1 manual checks V1-1 through V1-13** — all pass
7. **Chunk 2 manual checks V2-1 through V2-12** — all pass
8. The real Electron app is the only validation surface — no mock-bridge validation
9. The primary flow user stories verified:
   - C1-S2 → C1-S4 → C1-S7 → C1-S8 (Build mode rail → checkpoint → celebration → Iterate transition)
   - C2-S3 (import existing app: folder scan → live preview → board)
