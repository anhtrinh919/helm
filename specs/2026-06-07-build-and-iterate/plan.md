# Phase 4 Plan — Build & Iterate

> **Design note for backend:** The design file lives at `specs/2026-06-07-build-and-iterate/design-brief.md` + the Pencil `.pen` file produced by `/frontend`. Read the design file before implementing any visual component — token names, spacing, and shape choices come from there. This plan describes *what* each group delivers; the design file specifies *how it looks*.

---

## CHUNK 1: New Visual Language + Build Mode

---

### Group 1 — Design Tokens + Tailwind Reset
**Delivers:** The new token system is the single source of truth for every color, font, radius, and shadow used in all subsequent groups. All old tokens are removed. No component is visually changed yet — this group only rewrites the token layer.

**Sub-tasks:**
1. In `app/src/renderer/src/styles/globals.css`: replace the entire `@theme` block with the new token set from `requirements.md § Design Tokens`. Remove the `brut` and `brut-2` utility classes. Remove `@keyframes helmslide` if it was specific to the old building animation (keep if reused).
2. In `tailwind.config.ts` (or the Vite Tailwind plugin config): verify the theme extension references the new CSS custom properties. Add any aliases needed for the new semantic token names (e.g., `bg: var(--color-bg)`, `surface: var(--color-surface)`, etc.).
3. Remove font imports for Fraunces and Space Grotesk from `index.html`; add Inter (Google Fonts or local). JetBrains Mono stays.
4. After the replace, run `tsc --noEmit` — the TypeScript layer should be clean (no type changes in this group).

**Depends on:** nothing
**Verify:** `npm run typecheck` exits 0; `npm run dev` renders without CSS errors in the Electron console; `brut` class no longer applies any styling (confirm with devtools).

---

### Group 2 — Core Component Reskin (Rail, TopBar, TabStrip, SpineItem, SectionHeader)
**Delivers:** The persistent chrome — the left-rail sidebar, the board's top bar, the tab strip, and the spine item card — is fully reskinned to the new token system. Behavior is unchanged; only CSS class values change. This makes every screen that uses the board feel like the new design.

**Sub-tasks:**
1. `Rail.tsx`: replace `bg-ink`, `bg-canvas`, `bg-lime`, `bg-pink`, `bg-railcard`, `brut`, `brut-2`, `font-display` with new token equivalents. The active project highlight switches from lime-on-dark to `--color-accent` on `--color-surface`. The "LIVE" badge truthfulness fix goes here (see Group 3).
2. `TopBar.tsx`: reskin. Remove any playful labels; use new typography scale (Inter, weight 500–600 for labels).
3. `TabStrip.tsx`: reskin. Active tab indicator uses `--color-accent`.
4. `SpineItem.tsx`: reskin all status states (building, planned, up_next, failed, done, needs_you). Remove `brut`/`brut-2`; replace with `border border-[--color-border]` and `--shadow-sm`. Status dots use the new semantic colors (success, warn, danger, accent).
5. `SectionHeader.tsx`: reskin pill badges using semantic colors.
6. `NeedsYouHeadline.tsx`: reskin — this is a high-visibility component; use `--color-warn-soft` background with `--color-warn` accent.

**Depends on:** Group 1
**Verify:** Start the Electron app; navigate to any project board — all listed components use new tokens; no old hex colors visible in devtools; typecheck passes.

---

### Group 3 — Session Stop + Live Badge Fix
**Delivers:** Two Phase 3 carry-over bugs fixed: (1) sessions can be stopped by the user; (2) the "Live" badge in the rail shows only when the dev server is actually running.

**Sub-tasks:**
1. Add `sessions:stop` IPC channel to `CH` in `ipc-schemas.ts`. Add `StopSessionRequest = z.object({ sessionId: z.string() })`.
2. In `session-bridge.ts`: register `ipcMain.handle(CH.sessionsStop, ...)`. Handler calls `orchestrator.stop(sessionId)` — adds sessionId to `interrupted` set, calls `handle.cancel()`, updates session status to `'stopped'`, pushes `backgroundStatus` update.
3. Add `stop(sessionId: string): boolean` method to `SessionOrchestrator`. Returns false if session not found or already done.
4. In the renderer bridge (`bridge.ts`): add `helm.sessions.stop(sessionId)`.
5. In `ScopedSession.tsx`: add a "Stop session" button (secondary, destructive styling using `--color-danger`). Visible when session status is `active` or `paused_for_decision`. On click: calls `helm.sessions.stop`, updates local UI state.
6. Live badge fix: in `Rail.tsx`, the "LIVE" badge currently shows when `backgroundStatus === 'active'`. Instead, it should show only when `backgroundStatus === 'active'` AND the project has a live dev server (i.e., a non-null `devPid` on the project row or a `PreviewStatus === 'live'` push from `preview:update`). Listen for `preview:update` in the projects store and surface a `previewStatus` per project. Badge condition: `previewStatus === 'live'`.

**Depends on:** Group 2
**Verify:** 
- Start a session; Stop button is visible. Click it — session moves to `stopped`, Live badge disappears.
- Start a project without a dev server — Live badge never appears.
- `tsc --noEmit` passes.

---

### Group 4 — Wizard State Persistence Fix + Navigation Fix
**Delivers:** Two more carry-over bugs fixed: (1) switching away from the wizard and back no longer loses Q&A state; (2) every screen has a working back/home navigation control.

**Sub-tasks:**
1. **Wizard state persistence:** The wizard Zustand store (`store/wizard.ts`) loses state when the user navigates away because `view` changes and the wizard's in-memory state is not re-attached. Fix: persist wizard state per projectId to the project row. Options:
   - Preferred: add a `wizard_state TEXT` column in Migration 5 (or as a separate migration 5.1), store the current wizard JSON (step, question, answers so far) as a JSON blob on the project. Restore on `openWizard(projectId)`.
   - If too heavy: store in `sessionStorage` keyed by projectId on the renderer side (acceptable for this phase, marked as tech-debt).
   Implement whichever fits the migration pattern already established. The fix must survive a full view switch (board → wizard → board → wizard same project).
2. **Back/home navigation:** Audit every view component (`FrontDoor`, `ProjectSwitcher`, `WizardScreen`, `ScopedSession`, `ProjectBoard`) for presence of a back/home affordance. Add where missing:
   - `WizardScreen`: already has a route back via `backToSwitcher` — ensure a visible back button calls it.
   - `ScopedSession`: already has `onBack` — ensure the back button is visible and uses `--color-ink-2` (secondary, not prominent).
   - `FrontDoor` (when there are existing projects): "Your builds" button already exists — keep it, reskin.
3. Update `CH` and bridge if Migration 5 adds the wizard_state column.

**Depends on:** Group 3
**Verify:**
- Open wizard, answer 2 questions, switch to a different project's board, switch back to the wizard — the question answered so far is still visible.
- From every screen, there is a back or home button. No screen is a dead end.
- `tsc --noEmit` passes.

---

### Group 5 — DB Migration 5 + Project Mode + Shelf IPC
**Delivers:** The database grows to support Build/Iterate mode, rail step tracking, shelf items, and project rename/delete. All new IPC channels from requirements.md are registered and wired.

**Sub-tasks:**
1. Add Migration 5 to `migrations.ts` (exactly as specified in `requirements.md § Data Model`):
   - `ALTER TABLE projects ADD COLUMN mode TEXT NOT NULL DEFAULT 'build'`
   - `ALTER TABLE projects ADD COLUMN rail_step INTEGER`
   - `ALTER TABLE projects ADD COLUMN rail_complete INTEGER NOT NULL DEFAULT 0`
   - `ALTER TABLE projects ADD COLUMN import_folder TEXT`
   - `CREATE TABLE shelf_items (...)`
2. Add `mode`, `railStep`, `railComplete`, `importFolder` fields to the `Project` Zod schema in `ipc-schemas.ts` and to `ProjectRow` mapper in `mappers.ts`.
3. Add DB functions in `projects.ts`: `setProjectMode`, `setRailStep`, `markRailComplete`, `deleteProject`, `renameProject`.
4. Add DB functions in a new `db/shelf.ts`: `addShelfItem`, `listShelfItems`, `removeShelfItem`, `promoteShelfItem` (creates a `Card` from the shelf item and deletes the shelf item).
5. Register new IPC channels in a new `ipc/project-management-bridge.ts`: `projects:rename`, `projects:delete`, `projects:set-mode`, `projects:set-rail-step`.
6. Register new IPC channels in a new `ipc/shelf-bridge.ts`: `shelf:list`, `shelf:add`, `shelf:promote`.
7. Add all new channels to `CH` in `ipc-schemas.ts`.
8. Wire new bridges in `index.ts` (main process entry).
9. Extend `bridge.ts` and `bridge-api.ts` in the renderer with the new channel calls.

**Depends on:** Group 4 (for the Migration 5 wizard_state column if chosen in Group 4)
**Verify:**
- `migrate()` runs cleanly on a fresh DB and on an existing Phase 3 DB (additive migrations only).
- `projects:rename` returns the updated project; `projects:delete` cascades and returns `ok: true`.
- `shelf:add` then `shelf:list` returns the added item; `shelf:promote` creates a card and removes the shelf item.
- `tsc --noEmit` passes.

---

### Group 6 — Front Door Redesign (Two Doors)
**Delivers:** The FrontDoor component becomes the Two-Door front door: "Build something new" and "Iterate on an app" as two distinct choices, with the Iterate choice expanding to sub-options "Start fresh" / "Bring an existing app." The mode choice is the first decision — there is no text input on this screen.

**Sub-tasks:**
1. Rewrite `FrontDoor.tsx`. Remove the single sentence input and "Start" button (moved to Build mode entry within the wizard). Replace with two large option areas. Use new token system throughout. Brand mark stays.
2. "Build something new" onClick: navigate to wizard view as before (`openWizard` after `helm.projects.create`). The wizard is now explicitly the Build mode entry — ensure the created project gets `mode: 'build'` via `projects:set-mode` right after creation (or set the default in the DB, which is already `'build'`).
3. "Iterate on an app" onClick: expand inline to show two sub-options: "Start fresh" and "Bring an existing app." These are secondary choices within the same screen — no full navigation change.
4. "Start fresh" sub-option: navigates to wizard view as a special entry. The wizard in this mode creates an Iterate-mode project and skips Build rail generation (the wizard's plan approval instead immediately begins the scaffold+feature build as one step). This requires a mode flag passed to the wizard — add `iterateEntry?: boolean` to wizard store's `begin()` to differentiate.
5. "Bring an existing app" sub-option: navigates to the Import Flow view (new view — see Group 10, Chunk 2). For Chunk 1, this sub-option can be visible but show "Coming in Chunk 2" placeholder if Group 10 is not yet complete — but it must not throw.
6. Add `view: { name: 'import-flow' }` to the `View` union in `store/projects.ts` (even if the screen is stubbed for now).

**Depends on:** Group 5
**Verify:**
- On cold launch with no projects, the Two-Door front door is shown (not the old sentence input).
- "Build something new" creates a project and navigates to the wizard.
- "Iterate on an app" expands to show two sub-options without navigating away.
- typecheck passes.

---

### Group 7 — Build Rail + Rail Checkpoint
**Delivers:** The Build Rail and Rail Checkpoint screens are implemented. Builders who started a project via "Build something new" see the ordered milestone rail, with steps unlocking in sequence. Each completed step hard-stops at the checkpoint. The wizard's plan approval now populates the rail (not just the flat board).

**Sub-tasks:**
1. Create `src/renderer/src/components/rail/BuildRailView.tsx` — the main Build mode layout. Left: existing `Rail` sidebar (reskinned). Center: ordered list of rail steps drawn from the project's `plan` array with `railStep` as the cursor. Each step: collapsed (planned/done) or expanded (current). Current step: shows embedded session feed for the step's card.
2. Each step renders using the existing `SpineItem` and `ScopedSession` components as sub-components — do not rebuild the session feed from scratch. The BuildRailView composes them.
3. `RailCheckpoint.tsx` — when a step's session emits a `checkpoint` feed event (kind `'checkpoint'`, existing type), the expanded step transitions to checkpoint mode: show checkpoint content (screenshot path if present, otherwise summary text), a "Report a bug" input (opens `AddItemModal` or an inline simple input), and the "Continue to next step →" primary button. The Continue button calls `projects:set-rail-step` with `step + 1`. If it's the last step, it calls `projects:set-rail-step` with `step + 1` (out of bounds triggers celebration — see Group 8).
4. Wire `App.tsx`: when `view.name === 'board'` and the project's `mode === 'build'` and `rail_complete === 0`, render `<BuildRailView>` instead of `<ProjectBoard>`.
5. Wire `view.name === 'board'` to choose between `ProjectBoard` (Iterate mode or rail_complete) and `BuildRailView` (Build mode, not yet complete) using the project's `mode` field.

**Depends on:** Group 6
**Verify:**
- A "Build something new" project shows the BuildRailView with steps ordered as the plan.
- Clicking into the current step shows the session feed.
- After a checkpoint event, the checkpoint UI appears; Continue advances the rail step in the DB.
- A done (iterate-mode) project still shows `ProjectBoard`.
- `tsc --noEmit` passes.

---

### Group 8 — For-Later Shelf + Agent Triage + Build→Iterate Celebration
**Delivers:** The "For later" shelf panel in the Build Rail is wired to the shelf IPC. The agent's session system prompt gains a triage instruction. The celebration overlay shows when the last rail step is approved.

**Sub-tasks:**
1. `ForLaterShelf.tsx` — a collapsible panel within `BuildRailView`. Fetches `shelf:list` on mount and subscribes to a new push event `shelf:updated` (main pushes this when `shelf:add` is called so the UI stays live). Renders shelf items as a compact list. Empty shelf = panel collapses.
2. Add `shelf:updated` to `CH`; main pushes it from `shelf-bridge.ts` after every add/remove.
3. Session triage: extend the session system prompt for Build mode sessions (in `session-orchestrator.ts` or a new prompt builder). When `mode === 'build'`, append: "If the user sends a request that is small and fits within the current step, handle it now. If it is large, unrelated, or would expand scope, respond with a tool call to `park_to_shelf` with the item title, then tell the user: 'Saved for later.' Do not incorporate it into the current step." Define the `park_to_shelf` tool in the session runner's tool list (it calls the `shelf:add` IPC under the hood — implement as a main-process tool handler hooked into the agent's tool call stream).
4. `CelebrationOverlay.tsx` — full-screen overlay. Shown when: the project's `rail_step` is pushed past the last plan step (i.e., `step >= plan.length`). Content: "Your app now does what you set out to build." + journey strip (list of completed steps, read-only, collapsed). CTA: "Start iterating →". On CTA: calls `projects:set-mode({ projectId, mode: 'iterate' })` then `helm.projects.get(projectId)` to refresh, then navigates to the board (which now shows `ProjectBoard` in Iterate mode).
5. Journey strip: a compact horizontal scroll of the completed plan steps as small chips. Reuses plan data from the project.

**Depends on:** Group 7
**Verify:**
- In Build mode, submit a mid-rail request. The agent triages it — small requests are handled in the current session; large requests produce a "Saved for later" message and the shelf panel shows the item.
- After the last step's checkpoint is continued, the celebration overlay appears.
- After clicking "Start iterating →", the project is in Iterate mode and the board shows `ProjectBoard`.
- `tsc --noEmit` passes.

---

### Chunk 1 Story Walk
**Group 9 — Chunk 1 Integration + Story Walk**
**Delivers:** Every Chunk 1 user story (C1-S1 through C1-S13) is verified end-to-end in the real Electron app. Bugs found during the story walk are fixed in this group.

**Sub-tasks:**
1. Run through C1-S1: cold launch, see two-door front door with new visual language.
2. C1-S2: pick "Build something new", describe goal, approve plan, see Build Rail.
3. C1-S3: verify steps are locked; cannot click an unstarted step's session.
4. C1-S4: start a step's session; reach checkpoint; verify Continue is the only way to advance.
5. C1-S5 + C1-S6: submit a large mid-rail request; verify shelf gets it.
6. C1-S7 + C1-S8: complete all steps; verify celebration; verify transition to Iterate board with shelf items as backlog cards.
7. C1-S9: open every screen; visually confirm new token system.
8. C1-S10 + C1-S11: start a session with a dev server; verify Live badge; stop the session; verify badge clears.
9. C1-S12: navigate through every screen; verify back/home is always reachable.
10. C1-S13: open wizard, answer 1 question, switch projects, come back — Q&A is intact.
11. Fix any bugs found during the walk, re-verify the affected story.

**Depends on:** Groups 1–8
**Verify:** All C1-S1 through C1-S13 pass manually. `npm run typecheck` passes. `npm run test` passes.

---

## CHUNK 2: Iterate Mode + Import + Project Management

---

### Group 10 — Import Flow
**Delivers:** A user can point Helm at an existing AI-built local web app folder. Helm scans it, derives or accepts a run manifest, and starts the live preview. The project appears in Iterate mode on the board.

**Sub-tasks:**
1. `ImportFlowView.tsx` — a 4-step UI (folder pick → manifest review → starting preview → board). Rendered when `view.name === 'import-flow'`. Step 1: a "Choose folder" button that opens the native OS folder picker via Electron's `dialog.showOpenDialog`. Step 2: shows scan result — auto-detected `startCommand` + `port` with confidence badge, or "Not found" with manual override form. Step 3: loading state while dev server starts. Step 4: success → auto-navigate to board.
2. Add `ipcMain.handle(CH.importScan, ...)` in a new `ipc/import-bridge.ts`. The scan logic: look for `helm.json` (highest confidence), then `package.json` scripts (`dev`, `start`, `preview`), then `vite.config.*`, `next.config.*`. Return `{ found, startCommand, port, confidence }`.
3. Add `ipcMain.handle(CH.importStart, ...)` in `import-bridge.ts`. This reuses `DevServerManager.startServer()` with the given manifest. Also calls `setArtifactDir(db, projectId, folderPath)` and `setProjectMode(db, projectId, 'iterate')` and `setImportFolder(db, projectId, folderPath)`.
4. Wire the import bridge in `index.ts`.
5. Wire `CH.importScan` and `CH.importStart` in `bridge.ts`/`bridge-api.ts`.
6. Wire "Bring an existing app" in `FrontDoor.tsx` to navigate to `view: { name: 'import-flow' }` (removing the "Coming in Chunk 2" stub from Group 6).
7. Add `importFolder` to the `Project` Zod type if not already done in Group 5.

**Depends on:** Group 9 (Chunk 1 complete)
**Verify:**
- "Bring an existing app" → folder picker opens. Point it at a folder with a `helm.json` — the manifest is detected and confidence is "high."
- Point at a folder with `package.json dev` script — detected with confidence "low," manual override fields pre-filled with best guess.
- Point at a folder with no known patterns — shows manual override form.
- Fill in manual override, click "Start" — dev server starts, preview loads, board opens in Iterate mode.
- `tsc --noEmit` passes.

---

### Group 11 — Start Fresh (Iterate Entry)
**Delivers:** "Start fresh" from the Iterate front door creates a project and builds the scaffold + first feature as one step, then opens the freeform board.

**Sub-tasks:**
1. Extend `wizard-orchestrator.ts` to accept a `mode: 'iterate'` option (via an options object on `startScoping`). When `mode === 'iterate'`, the scoping prompt changes: instead of generating a step-by-step plan, it generates one combined "scaffold + first feature" task (a single `PlanBlock`). The project is created with `mode: 'iterate'` from the start.
2. In `WizardScreen.tsx`, detect the Iterate entry (via a flag on the wizard store or the project's mode). On plan approval, seed a single card and immediately start its session (vs. Build mode which waits for the user to click into a step). Open the board in Iterate mode.
3. Wire "Start fresh" in `FrontDoor.tsx` to call `begin(idea, { mode: 'iterate' })`.
4. Ensure the Iterate board (`ProjectBoard`) shows for the new project after wizard approval.

**Depends on:** Group 10
**Verify:**
- "Iterate → Start fresh" → describe an app → wizard shows the scoping Q&A but with a single combined plan step → approve → board opens in Iterate mode with one card in Building state.
- The session immediately starts (no manual click to begin).
- `tsc --noEmit` passes.

---

### Group 12 — Existing Project Mode Mapping
**Delivers:** Pre-Phase 4 projects (no `mode` column) are correctly mapped to Build or Iterate mode on app launch.

**Sub-tasks:**
1. Migration 5 sets `mode = 'build'` as the default for all projects (it applies to pre-existing rows too, since `ALTER TABLE ... ADD COLUMN ... DEFAULT 'build'` back-fills).
2. On app launch (in `index.ts` after `migrate()`), run a one-time check: for each project, if `status === 'done'` and `rail_complete === 0`, set `rail_complete = 1` and `mode = 'iterate'` (these projects finished before modes existed — they belong in Iterate).
3. For projects with `status === 'building'` and an incomplete plan (`plan` has steps with mixed status), set `rail_step` to the index of the first non-done step. This places them at the right rail position.
4. Add a `mapLegacyProjects(db: Db): void` function in `db/projects.ts` and call it from `index.ts` after migration.

**Depends on:** Group 11
**Verify:**
- Launch with a Phase 3 test DB that has a done project — it appears in Iterate mode on the board.
- A project with an in-progress plan appears in Build mode at the right rail step.
- `tsc --noEmit` passes.

---

### Group 13 — Project Management (Rename, Delete)
**Delivers:** Users can rename and delete projects from the redesigned Project Switcher.

**Sub-tasks:**
1. `ProjectSwitcher.tsx`: redesign the main area to be a project grid/list. Each project card shows: name, mode badge (`Build` or `Iterate`), background status, last-updated. Reskin to new tokens (this is the full Chunk 2 reskin of the switcher).
2. Add inline rename: clicking the project name (or a pencil icon) makes it editable. On blur/Enter: calls `helm.projects.rename(projectId, name)`. On Escape: cancel.
3. Add delete: a trash icon or "..." menu on each card. Click → confirmation dialog (`window.confirm` or a simple inline confirmation row). Confirm → calls `helm.projects.delete(projectId)` → project removed from the list.
4. Bridge calls: `helm.projects.rename` and `helm.projects.delete` are already wired in Group 5's bridge extension.
5. Reskin `Rail.tsx` project list items with mode badges (small "Build" / "Iterate" chip using the accent soft colors).

**Depends on:** Group 12
**Verify:**
- Rename a project inline → name persists on reload.
- Delete a project → confirmation shown → deleted → project gone from rail and switcher → cascade verified (no orphan sessions/cards in DB).
- `tsc --noEmit` passes.

---

### Group 14 — Full Reskin Pass (Remaining Screens)
**Delivers:** Every screen not yet reskinned in Chunk 1 gets the new token system. After this group, no old token names, hex values, or `brut`/`brut-2` classes remain in any component file.

**Sub-tasks:**
1. `WizardScreen.tsx`, `ScopingQA.tsx`, `PlanReview.tsx`: reskin using new tokens. Wizard is a key onboarding moment — it should feel calm and focused, not playful.
2. `ScopedSession.tsx`, `FeedEventRow.tsx`, `QuestionQueue.tsx`, `DecisionCard.tsx`, `CheckpointBlock.tsx`, `SteeringInput.tsx`, `WhatYouReported.tsx`: reskin.
3. `LivePreviewPane.tsx`, `PointCommentBox.tsx`, `PointModeOverlay.tsx`: reskin the chrome around the live preview and point-and-fix.
4. `DecisionsPanel.tsx`, `ProgressPanel.tsx`, `DocsPanel.tsx`: reskin the side panel surfaces.
5. `AddItemModal.tsx`, `FixCommentCard.tsx`, `BrandMark.tsx`, `Confetti.tsx` (retire confetti — the v4 maximalist confetti is retired in the new design; if a celebration moment needs animation, a simple fade is sufficient): reskin or retire.
6. Audit: `grep -r 'brut\|bg-canvas\|bg-cream\|bg-ink\|bg-pink\|bg-lime\|bg-violet\|bg-orange\|font-display\|text-soft\|railcard\|Fraunces' app/src/renderer/src/` — expect zero matches after this group.

**Depends on:** Group 13
**Verify:**
- The grep audit above returns zero matches.
- Every screen in the app is visually in the new language.
- `tsc --noEmit` passes.
- `npm run test` passes.

---

### Group 15 — Chunk 2 Integration + Story Walk
**Delivers:** Every Chunk 2 user story (C2-S1 through C2-S8) is verified end-to-end in the real Electron app. Bugs found are fixed in this group.

**Sub-tasks:**
1. C2-S1: "Iterate on an app" expands to two sub-options.
2. C2-S2: "Start fresh" → first feature request builds scaffold as one step → board in Iterate mode.
3. C2-S3: "Bring an existing app" → folder picker → scan → manifest shown → dev server starts → live preview → board in Iterate mode.
4. C2-S4: point-and-fix and sessions work on an imported project.
5. C2-S5: rename a project inline.
6. C2-S6: delete a project with confirmation.
7. C2-S7: load a Phase 3 in-progress DB → project appears in Build mode at correct step.
8. C2-S8: load a Phase 3 done DB → project appears in Iterate mode.
9. Fix any bugs found; re-verify affected stories.

**Depends on:** Groups 10–14
**Verify:** All C2-S1 through C2-S8 pass manually. `npm run typecheck` passes. `npm run test` passes.
