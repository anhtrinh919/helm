# The Cockpit & the Journey — Implementation Plan

Each group is independently reviewable and verifiable. Groups 1–5 are the design-independent data/IPC foundation (`/build` Step 4b can build them while the design is in progress). Groups 6–14 are the design-dependent UI, sequenced so Chunk 1 (front door + journey + shelf + celebration + signal) is shippable before Chunk 2 (cockpit board + outcome-on-card + inline edit + project mgmt). Two story-walk groups close each chunk.

This phase is **presentation + guidance only**: no change to the build engine (sessions, agent, live preview, point-and-fix capture mechanism, DB engine, parallel runs). All net-new persisted state is one migration (**Migration 6**) plus reskin tokens.

## Ground rules for this file

- Design-agnostic. No hex, no Tailwind classes, no pixels, no fonts — those live in the design file + frame index in `handover.md`.
- Reuse existing modules; extend, never duplicate. Existing data-layer for modes, rail state, shelf, fix-comments, point-capture is complete and is wired *up* to UI here, not rebuilt.
- Each group names its files/components/IPC channels/DB columns and gives a one-line Verify.

---

## Group 1: Migration 6 — card `outcome` column + project `position` column
**Delivers:** Persisted storage for the outcome each card delivers (shown on every card face) and a stable per-project ordering field that reorder writes to.
**Depends on:** none — schema scaffold (current `user_version` is 5; this is the 6th idempotent migration fn).
**Design-dependent:** no
**Verify:** `cd app && npm rebuild better-sqlite3 && npx vitest run src/main/db/__tests__/db.test.ts`

1. In `app/src/main/db/migrations.ts`, append migration index 5 (Migration 6): `ALTER TABLE cards ADD COLUMN outcome TEXT;` (nullable — no default) and `ALTER TABLE projects ADD COLUMN position INTEGER;`.
2. Backfill `projects.position`: set `position = rowid` for existing rows so legacy projects get a deterministic insertion-order initial order inside the same migration transaction. (Use `rowid` specifically — not `created_at` — for determinism.)
3. Add an index supporting ordered project reads: `CREATE INDEX idx_projects_position ON projects(position);`.
4. Add a `db.test.ts` case asserting `user_version === 6` post-migrate, that the migration is idempotent (re-running leaves version at 6, no error), and that both new columns exist and are queryable.

## Group 2: Outcome plumbing — mapper, schema, plan seeding, set-outcome channel
**Delivers:** The card's outcome flows end-to-end from the wizard plan (`PlanBlock.detail`) into the persisted card row and back out through reads, so every card carries plain-language "what it's for"; plus a channel to set/edit it later.
**Depends on:** Group 1
**Design-dependent:** no
**Verify:** `cd app && npm rebuild better-sqlite3 && npx vitest run src/main/db src/main/ipc/__tests__`

1. `app/src/shared/ipc-schemas.ts`: add `outcome: z.string().nullable()` to the `Card` schema (so every `cards:list`/card read carries `outcome`). Add channel `cardsSetOutcome: 'cards:set-outcome'` to `CH` and `SetCardOutcomeRequest = z.object({ cardId: z.string(), outcome: z.string() })`.
2. `app/src/main/db/mappers.ts`: add `outcome: string | null` to `CardRow`; map `outcome: row.outcome ?? null` in `toCard`.
3. `app/src/main/db/cards.ts`: extend `seedCardsFromPlan` to write `outcome` from each `PlanBlock.detail` (INSERT + column list gain `outcome`); add an optional `outcome` param to `createCard` (defaults null) and a `setCardOutcome(db, id, outcome)` setter.
4. `app/src/main/ipc/` (cards/board bridge): register the `cards:set-outcome` handler (parse → `setCardOutcome` → `{ ok: true }`; unknown card → `{ ok: false, error: 'card_not_found' }`). Expose `cards.setOutcome` in `bridge-api.ts` + preload.
5. `app/src/main/db/__tests__/db.test.ts`: assert a card seeded from a plan with `detail` set returns that string as `card.outcome`, a card with no detail returns `null`, and `cards:set-outcome` round-trips.

## Group 3: Project reorder — DB op + IPC channel + bridge-api
**Delivers:** The ability to persist a new project order (drag-to-reorder), exposed as a typed IPC call the project-management UI consumes.
**Depends on:** Group 1
**Design-dependent:** no
**Verify:** `cd app && npm rebuild better-sqlite3 && npx vitest run src/main/db src/main/ipc/__tests__`

1. `app/src/main/db/projects.ts`: add `reorderProjects(db, orderedIds: string[])` — assign sequential `position` values to the given ids inside one transaction; update `listProjects` to `ORDER BY position ASC, updated_at DESC, rowid DESC` (position primary, existing tiebreakers retained; NULL positions sort last via `COALESCE`).
2. `app/src/shared/ipc-schemas.ts`: add `ReorderProjectsRequest = z.object({ orderedIds: z.array(z.string()) })` and channel `projectsReorder: 'projects:reorder'`.
3. `app/src/main/ipc/project-management-bridge.ts`: register the `projectsReorder` handler (parse → validate ids are complete + known → `reorderProjects` → `{ ok: true }`; unknown id → `{ ok: false, error: 'unknown_project', id }`; incomplete list → `{ ok: false, error: 'incomplete_list' }`), reusing the existing `mapError`.
4. `app/src/shared/bridge-api.ts` + `app/src/preload/index.ts`: add `projects.reorder(req)`.

## Group 4: Shelf IPC completeness + remove channel
**Delivers:** A fully UI-ready shelf surface — list/add/promote already exist; add the remove (dismiss-parked) path and confirm the `shelf:updated` push fires on every mutation so the shelf panel stays live.
**Depends on:** none (shelf data layer is complete)
**Design-dependent:** no
**Verify:** `cd app && npm rebuild better-sqlite3 && npx vitest run src/main/ipc/__tests__/contract-flow.test.ts`

1. `app/src/shared/ipc-schemas.ts`: add `shelfRemove: 'shelf:remove'` channel and `RemoveShelfItemRequest = z.object({ itemId: z.string() })`.
2. `app/src/main/ipc/shelf-bridge.ts`: register `shelfRemove` → `removeShelfItem` (already in `db/shelf.ts`), then push `shelf:updated`. Audit that `shelf:add`, `shelf:promote`, and `shelf:remove` each emit `shelf:updated` with the project's current list. Unknown item → `{ ok: false, error: 'not_found' }`.
3. `app/src/main/db/shelf.ts` + `shelf-bridge.ts`: extend `promoteShelfItem` so the created board card's `title` AND `outcome` are both set from the parked request text (so promoted cards satisfy "outcome on every card"); card lands at status `up_next` appended to the spine; return the card. Return `card_create_failed` on card insert failure.
4. `app/src/shared/bridge-api.ts` + preload: add `shelf.remove(req)`.
5. Contract test: add/promote/remove round-trip leaves the shelf empty and emits `shelf:updated` each time; a promoted card carries the request text as its `outcome`.

## Group 5: Inline-text-edit capture — main-process extension of point-capture
**Delivers:** A text-edit capture mode that, when the user edits text in place in the live app, reports the targeted element selector + old/new text to main and routes the change through the existing fix-session mechanism — no code editor, no new fix pipeline.
**Depends on:** none (extends the complete Phase 3 point-capture + fix-sessions surface)
**Design-dependent:** no
**Verify:** `cd app && npm rebuild better-sqlite3 && npx vitest run src/main/sdk/__tests__/point-capture-service.test.ts src/main/sdk/__tests__/fix-session.test.ts`

1. `app/src/main/sdk/point-capture-service.ts`: add a second injected script (`TEXT_EDIT_INSTALL_SCRIPT`/`REMOVE`) that makes the pointed element `contentEditable`, captures original text on focus and new text on blur/commit, and logs `__HELM_TEXTEDIT__{selector, oldText, newText}` over the same prefix-guarded console channel. Add `activateTextEdit/deactivateTextEdit` and a `consumePendingTextEdit` mirroring the existing capture lifecycle.
2. `app/src/shared/ipc-schemas.ts`: add channels `pointsTextEditActivate: 'points:text-edit-activate'`, `pointsTextEditDeactivate: 'points:text-edit-deactivate'`, `pointsRegisterTextEdit: 'points:register-text-edit'`, and `RegisterTextEditRequest = z.object({ projectId: z.string(), selector: z.string(), oldText: z.string(), newText: z.string() })`.
3. `app/src/main/ipc/points-bridge.ts`: register the activate/deactivate handlers + `points:register-text-edit` — atomically creates a selector-anchored `fix_comment` card (reusing `createFixComment`) whose note is a generated "change the text on this element from «oldText» to «newText»" instruction, then spawns the fix via `fix-sessions:start`; if the spawn fails, delete the just-created card (no orphan) and return `session_error`. Returns the card on success. No new card type or table. `newText === oldText` → `{ ok: false, error: 'no_change' }`; missing selector/newText → `{ ok: false, error: 'invalid_input' }`; activate when preview not `live` → `{ ok: false, error: 'webview_not_ready' }`.
4. `app/src/shared/bridge-api.ts` + preload: expose `points.activateTextEdit/deactivateTextEdit/registerTextEdit`.
5. Unit test: a simulated `__HELM_TEXTEDIT__` console line yields a pending edit; registering it produces a `fix_comment` card carrying the selector and the change instruction; identical text yields `no_change`.

---

*Chunk 1 UI begins here — front door, journey, shelf, celebration, signal. All design-dependent.*

## Group 6: Two-door front door
**Delivers:** The front door offers "Build something new" (starts the guided journey, `mode='build'`) and "Iterate on an app" → a second choice of "Start fresh" (`mode='iterate'`, the existing one-step combined scaffold+feature) or "Bring an existing app" (visible but "coming soon", inert).
**Depends on:** none beyond existing data (`StartScopingRequest.mode` already supports `'iterate'`).
**Design-dependent:** yes
**Verify:** `cd app && npx vitest run src/renderer && tsc -p app --noEmit`

1. Restructure `app/src/renderer/src/components/FrontDoor.tsx` from single idea-input into the two-door layout; "Build something new" and "Iterate on an app" as primary choices.
2. Wire "Build something new" → existing wizard entry with `mode='build'`; "Start fresh" under Iterate → wizard entry with `mode='iterate'`.
3. Render the "Bring an existing app" door with a "coming soon" affordance, non-actionable (no import wiring — Phase 5's real work).
4. Reskin per the design frame index in `handover.md`.

## Group 7: Journey-progress visualization (step N of M + checkpoint)
**Delivers:** On top of the existing rail data (`project.railStep`, `project.plan`, `card.stepLabel`, `card.checkpoint`), a journey view showing the ordered milestone list, current "step N of M", and the per-step testable checkpoint hard-stop ("try it, then continue").
**Depends on:** none new (rail data complete via `projects:set-rail-step`, checkpoint via `cards.updateCheckpoint`).
**Design-dependent:** yes
**Verify:** `cd app && npx vitest run src/renderer && tsc -p app --noEmit`

1. New component(s) under `app/src/renderer/src/components/journey/` (e.g. `JourneyRail.tsx`, reusing the existing `session/CheckpointBlock.tsx`) rendering the ordered plan milestones with step N of M and an active-step checkpoint gate. The milestone copy follows the grounding principle (idea → scope → plan → look → function → review, in plain language).
2. Drive the gate off `card.checkpoint.status` (`pending` → hard-stop with a "try it" affordance; `approved` advances `railStep` via `projects:set-rail-step`; `flagged` keeps the user on-step). The advance is **edge-triggered**: `JourneyRail` fires `projects:set-rail-step` exactly once on the `pending`→`approved` transition of the active step, never on re-render — so re-renders cannot double-advance or stall. Add a journey failed-step state (session errors before checkpoint) and a checkpoint next-step-spawn-failure state, both with retry, per requirements' Edge Cases.
3. Keep the existing dark nav `Rail.tsx` as navigation; journey progress is a distinct view, not a repurpose of the nav sidebar.
4. Reskin per design frames.

## Group 8: For-Later shelf panel + mid-journey triage + escape hatch
**Delivers:** The shelf UI (list parked items, promote-to-card, dismiss) plus mid-journey triage (a request during the journey is either done now or parked on the shelf) and the escape hatch that leaves the rail for the freeform board and flips the project to iterate mode early.
**Depends on:** Group 4 (shelf remove channel), Group 7 (journey view to triage from).
**Design-dependent:** yes
**Verify:** `cd app && npx vitest run src/renderer && tsc -p app --noEmit`

1. New `app/src/renderer/src/components/shelf/ShelfPanel.tsx` consuming `helm.shelf.list/add/promote/remove` and subscribing to `shelf:updated`; add a small `store/shelf.ts` if state coordination is needed.
2. Mid-journey triage affordance in the journey view: "small → do now" routes to a card; "large → park" calls `shelf.add`. (Agent-side classification already emits the `parked` feed kind; the UI surfaces both outcomes distinctly.)
3. Escape hatch control: calls `projects:set-mode('iterate')`, leaves the rail, opens the board (the board redesign lands in Chunk 2; for Chunk 1 it lands on the existing board).
4. Reskin per design frames.

## Group 9: Celebration → collapse-to-strip → free iteration + "Running on your Claude subscription" signal
**Delivers:** Journey-complete celebration that collapses the journey to a compact strip and opens free iteration (`markRailComplete` → `mode='iterate'`), plus the subtle persistent "Running on your Claude subscription" signal shown across the app shell.
**Depends on:** Group 7 (journey view), Group 8 (escape/iterate transition path).
**Design-dependent:** yes
**Verify:** `cd app && npx vitest run src/renderer && tsc -p app --noEmit`

1. Celebration UI fired when `railStep` reaches `plan.length` (the "past the last step" trigger already legal in `projects:set-rail-step`); reuse `components/Confetti.tsx`. On dismiss, apply `markRailComplete` semantics (mode → iterate) and collapse the journey to a strip pinned at the board header.
2. Persistent "Running on your Claude subscription" element in the app shell (`App.tsx` / shared chrome) — static signal, never a token meter, never dismissable, never a nag.
3. Reskin per design frames.

## Group 10: Story-walk — Chunk 1 (end-to-end build journey)
**Delivers:** Proof that a user can start "Build something new" at the two-door front door, move through the ordered-milestone journey testing at each checkpoint, triage a mid-journey request (do-now vs park-to-shelf), use the escape hatch, and reach the celebration → strip → free iteration — under the new visual language.
**Depends on:** Groups 1–9.
**Design-dependent:** yes
**Verify:** `cd app && npm run rebuild && npx playwright test tests/e2e/build-journey.spec.ts`

1. Add a Playwright (electron) E2E spec walking: front door → build journey → checkpoint approve → advance → park a request to shelf → promote it → celebration → collapse-to-strip → board.
2. Assert "step N of M" copy, the persistent Claude-subscription signal, and shelf round-trip are all present.

---

*Chunk 2 UI begins here — cockpit board, outcome-on-card, inline edit, project mgmt, remaining reskin. All design-dependent.*

## Group 11: Cockpit Board redesign + outcome-on-card face
**Delivers:** The free-iteration cockpit where every card always shows in plain language what it's for (its `outcome`) next to the live app, with completed work quieted into history.
**Depends on:** Group 2 (outcome plumbing), Group 9 (iterate-mode entry).
**Design-dependent:** yes
**Verify:** `cd app && npx vitest run src/renderer && tsc -p app --noEmit`

1. Redesign the board surface (`components/board/ProjectBoard.tsx` + `SpineItem.tsx` + `SectionHeader.tsx`) so the card face renders `card.outcome` prominently next to `LivePreviewPane.tsx`. Cards with `outcome === null` render the design's empty-state, not a blank.
2. Quiet done work to history (existing done/condensed states + Progress/Decisions/Docs panels reskin only).
3. Reskin per design frames.

## Group 12: Point-and-fix inline edit UI + project management UI
**Delivers:** Click any element in the live app and either describe a fix or edit its text in place; plus rename/delete/reorder projects with truthful Live status and a working stop, behind consistent nav.
**Depends on:** Group 5 (inline-text-edit capture), Group 3 (reorder IPC), Group 11 (board surface).
**Design-dependent:** yes
**Verify:** `cd app && npx vitest run src/renderer && tsc -p app --noEmit`

1. Extend the point-mode UI (`board/PointModeOverlay.tsx`, `PointCommentBox.tsx`): on selecting a text-bearing element, offer both "Describe a fix" (existing) and "Edit text here" (drives `points.activateTextEdit` → in-place contentEditable → `points.registerTextEdit`); non-text elements show only "Describe a fix".
2. Project management UI: rename/delete (existing `projects:rename/delete`) + drag reorder (`projects:reorder` from Group 3) on `ProjectSwitcher.tsx`/`Rail.tsx`; surface truthful Live status from the existing dev-server/preview status surface (`preview:get-state` / the existing dev-server status push that the Rail status dots already consume — engine unchanged) and wire a working stop to existing `sessions:stop`. The Live badge clears when the dev server exits (including external exit). Delete shows a confirm modal, stops any running session + dev server first, and removes the row immediately (no reload). On reorder error (`incomplete_list`/`unknown_project`) the UI re-fetches the authoritative list before retrying. Rename confirm-on-blur saves only a non-empty changed name.
3. Reskin per design frames.

## Group 13: Import-door stub + global reskin sweep of remaining screens
**Delivers:** The "Bring an existing app" coming-soon door finalized, and the new visual language applied everywhere it has not yet been (remaining session, wizard, decisions/progress/docs, root screens) so the whole app reads as one redesign.
**Depends on:** new `@theme` tokens in `globals.css` (design handover), Groups 6–12.
**Design-dependent:** yes
**Verify:** `cd app && npx vitest run && tsc -p app --noEmit`

1. Finalize the import door coming-soon stub (visible, inert — no `import:scan/start` wiring this phase).
2. Apply new `@theme` token values in `app/src/renderer/src/styles/globals.css` (Tailwind v4, no config file) and restructure remaining components (`session/*`, `wizard/*`, `board/{DecisionsPanel,ProgressPanel,DocsPanel}`, root) to the new language.
3. Visual-compliance check against the frame index in `handover.md`.

## Group 14: Story-walk — Chunk 2 (cockpit, outcome-on-card, point-and-fix)
**Delivers:** Proof that a user works in the redesigned cockpit where each card shows its outcome next to the live app, clicks an element and applies a described fix, edits text in place on that exact element, and renames/deletes/reorders projects with truthful Live/stop — all under the new visual language.
**Depends on:** Groups 11–13.
**Design-dependent:** yes
**Verify:** `cd app && npm run rebuild && npx playwright test tests/e2e/cockpit.spec.ts`

1. Add a Playwright (electron) E2E spec walking: iterate board with outcome-on-card visible → element select → describe fix applied → inline text edit applied to the same element → project rename/reorder/delete + stop.
2. Assert the outcome string is on every card face, the inline edit targets the exact selector, and Live status reflects real session state.

---

## Build sequencing notes

- **Design-independent foundation (Groups 1–5)** can be built by `/build` Step 4b in the background while the Pencil design is in progress. All are `Design-dependent: no`.
- **All design-dependent groups (6–14) require the design handover first** — the new Tailwind `@theme` token values and frame index in `handover.md`. This applies to every Group 6–14, not only Group 13's reskin sweep; none of the UI groups can be finished before the design exists (they may be scaffolded, but visual treatment + structure come from the design).
- **Chunk 1 (Groups 6–10)** ships and is dogfooded before Chunk 2 begins.
- **Chunk 2 (Groups 11–14)** depends on Chunk 1 + the foundation.
- The `markRailComplete`/`projects:set-mode('iterate')` transition is shared by both the escape hatch (Group 8) and the celebration (Group 9).

## Latent decisions

1. Project ordering uses a nullable `position INTEGER` backfilled to `rowid` (not a fractional rank or separate table); `reorderProjects` rewrites the full sequence in one transaction — fine at per-user project counts.
2. Inline text edit reuses the `fix_comment` card + `fix-sessions:start` pipeline (no new card type, table, or direct DB text mutation); the edit becomes a generated "change text from X to Y on this selector" instruction the agent applies.
3. Text-edit capture is a second injected script sharing the existing prefix-guarded console channel in `point-capture-service.ts` (`__HELM_TEXTEDIT__` prefix), keeping selector/screenshot main-only and mirroring the Phase 3 capture lifecycle.
4. `card.outcome` is sourced from `PlanBlock.detail` with a `setCardOutcome` setter for later edits; cards with no detail render `null` so the design owns the empty-state.
5. The escape hatch in Chunk 1 lands on the existing board; the redesigned cockpit (Group 11) is Chunk 2 — so escape-to-freeform is testable at Chunk-1 ship. Same `projects:set-mode('iterate')` transition is reused by escape hatch and celebration.
6. `shelf:remove` is added as a net-new channel (the `removeShelfItem` data op exists but no channel exposes it); all three mutating shelf channels emit `shelf:updated` so the panel stays live without polling.
7. Inline text edit is offered only on elements containing text nodes; non-text elements (images, empty containers) get only "Describe a fix".
