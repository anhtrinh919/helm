<!-- wiki-generated -->
# Project WIKI — app
*Seeded from global wiki on 2026-06-04. Relevant to: @anthropic-ai/claude-agent-sdk, better-sqlite3, zod, zustand, @electron/rebuild, @tailwindcss/vite, @types/better-sqlite3, @types/node, @types/react, @types/react-dom, @vitejs/plugin-react, electron, electron-vite, react, react-dom, tailwindcss, tsx, typescript, vite, vitest. 30 entries.*

## Vite

### Verify zustand-store UI on a production preview, not the HMR dev server
When you edit a zustand store module (and its subscribers) many times in one session, Vite HMR can fragment the store into two live instances: a subscription closure writes events into instance A while the rendered component reads instance B. Symptom: appendEvent/set is provably called (logs fire) but the UI stays frozen and state never advances — looks like a broken subscription or stale closure. It is neither. Confirm by serving the production build (npx vite preview) on a fresh port: the bug vanishes. Don't burn time debugging the dev server after heavy store edits — hard-reload or preview first. Also: React StrictMode double-invokes effects, so an open()-on-mount that mutates shared state (e.g. card.sessionId) runs twice; make such effects idempotent and backfill the feed on every (re)subscribe so a push missed during the teardown gap self-heals.

## React

### Sorting a grid with positional cell-ref annotations: reorder display, not data
When a table keys comments/edits by positional cell ref (RrCc) and you add column sort, never reorder the underlying rows — that desyncs every saved ref. Keep the grid array fixed and sort a separate displayOrder: number[] of original row indices; render in that order but keep all selection/comment/edit coordinates in original indices. Cell refs, comment dots, and the edit log stay correct; the only cost is that a drag-selected visual range maps to a logical (original-index) range, which is an acceptable edge case. Used in dook's drill-down ReportTable.

### Phase 12 review friction: star button in archive mode needed explicit stopPropagation guard
The LearningRow.tsx star button in actionMode='archive' initially lacked the correct stopPropagation and the starred indicator showed in both delete and archive modes. Fix: added actionMode==='delete' guard on the leading ★ indicator span, added explicit star button in the archive mode action cluster with e.stopPropagation(). The two-step fix pattern: guard the display element first, add the action button second. Caught by /sdd-review Step 2 UX walk, fixed in iteration 1.

## Wsl

### Pencil desktop on WSLg needs --ignore-gpu-blocklist (WebGL2 blocked)
Launching Pencil's desktop binary under WSLg shows 'Failed to start Pencil' as a full-window error screen (not a dismissable dialog). The renderer logs LOOK normal — IPC server inits, files load, theme/session notifications flow — but the GPU process logs 'ContextResult::kFatalFailure: WebGL2 blocklisted' from gpu/command_buffer/service/context_group.cc. WSLg's virtual GPU is on Chromium's WebGL2 blocklist and Pencil's canvas refuses to start without it. Fix: launch with '--no-sandbox --ignore-gpu-blocklist'. Applies to any Electron app on WSLg whose renderer requires WebGL2.

## Bun

### Dook: bun run db:migrate fails under Bun — verify migrations via vitest, not the CLI
In the dook repo, 'bun run db:migrate' (bun run src/db/migrate.ts) crashes with ERR_DLOPEN_FAILED / 'better-sqlite3 is not yet supported in Bun' — better-sqlite3 is a native Node module Bun can't dlopen. Migrations actually apply two ways: (1) auto on first getDb() under the Next.js/Node runtime, (2) in the vitest harness, where src/db/test-helpers.ts createTestDb() reads and exec's the raw NNNN_*.sql migration files with foreign_keys=ON against an in-memory DB. So to VERIFY a new migration, run its query test under vitest (proves the SQL applies + FK/cascade/checks work) — do NOT trust 'bun run db:migrate' (it always fails under Bun regardless of the migration). plan.md verify commands that say 'bun run db:migrate' should be read as 'run the vitest suite'.

### Phase 11 sdd-review: bun test vs bun run test produce different results
The validation.md check said 'bun test' but the project uses 'vitest run' (via 'bun run test' / 'npm test'). Running 'bun test' directly invokes Bun's native test runner which doesn't support vi.hoisted, better-sqlite3, or the jsdom environment — producing 341 failures. The real test command is 'bun run test' (which delegates to vitest) and produces the expected 8 pre-existing failures. Always check 'bun run test', not 'bun test', in projects using vitest.

## Typescript

### Claude Agent SDK picks musl binary on glibc — pass pathToClaudeCodeExecutable
@anthropic-ai/claude-agent-sdk's query() resolves its bundled native binary and mis-selects the linux-x64-musl variant on glibc hosts (WSL2, standard Linux), failing with 'native binary not found' even though the file exists. Fix: pass options.pathToClaudeCodeExecutable set to the system claude via execSync('which claude'). Every SDK call site needs this independently — one server module had it (ThreadManager/side-chat) while another (recurring agent-chat) didn't, so half the chat features silently failed. When adding a new SDK entry point, copy the resolveClaudePath guard.

### Extend a result schema by appending columns, not adding fields, for backward compat
When a result payload is shaped as {columns:[], rows:[{cells:{}}]} and is persisted as JSON + re-decoded with zod + consumed by an exporter, you can add derived data (e.g. comparison/prior-period + delta columns) by APPENDING new column descriptors + cell keys rather than adding new top-level schema fields. Zero schema change means old stored payloads still parse, and any consumer that iterates columns (table render, XLSX export) picks up the new columns for free. Adding required fields would break stored-row decoding.

### Phase 15.3 backend: card_description added via schema extension, not SSE sibling field
Adversarial review flagged that card_description was being plumbed as a sibling field on shape_update and proposal_update SSE events, with duplicated typeof-string extraction in two places — instead of being part of TemplateShapeSchema. The fix: extend the Zod schema with z.string().optional(), parse once via safeParse, read shape.data.card_description directly. Saves duplicated extraction blocks AND gives Zod-level validation. Pattern: when adding agent-emitted fields that always travel with an existing schema, extend the schema rather than bolt on out-of-band parsing.

### Drizzle: use db.all<T>(sql`...`) for correlated subqueries, not $client.prepare()
When a correlated subquery inside a Drizzle LEFT JOIN ON clause produces wrong parameterization, the right escape hatch is db.all<RowShape>(sql`...`) using Drizzle's tagged template — NOT (db as unknown).$client.prepare(). The $client path skips parameter binding (concat-string risk), skips row mapping (forces unsafe casts on the result), and creates two patterns for the same task across the codebase. The sql tagged template keeps parameter binding, type inference, and Drizzle's middleware/logger seam. Reference pattern: searchThreads in src/db/queries/threads.ts.

### Next.js routes using req.nextUrl break in unit tests that pass plain Request
Routes typed as (req: NextRequest) often call req.nextUrl.searchParams — but unit tests that drive route handlers directly with a plain new Request(url) lack the nextUrl property, throwing 'Cannot read properties of undefined'. Switch to new URL(req.url).searchParams in route handlers when they need to be exercisable both via Next runtime and via plain-Request unit tests. Same pattern applies for cookies, headers etc.

### Phase 14 knob refactor: opt-in scope chips + engagement flags
Phase 14 makes Stores/Dates opt-in (un-engaged by default) while keeping product-filter tabs (Categories/Suppliers/LcCat) mutually exclusive. Two non-obvious patterns: (1) PaneSection must be a discriminated union — {kind:'stores'}|{kind:'dates'}|{kind:'product',tab:FilterTab} — because Stores/Dates are local UI state but FilterTab persists to active_filter_tab; conflating them into a flat string union sneaks the wrong values into save({active_filter_tab}) at the type seam. (2) Engagement normalization (auto-disengage stores when stores=[]) MUST live inside setKnobs as a normalizeEngagement helper, not in the PUT route, otherwise direct writers (background jobs, replays, /spec migrations) skip the BR-1/BR-3 invariant. The PUT route accepts engagement fields literally; only setKnobs enforces stores_engaged ⇒ stores.length>0. Same principle for clean-slate defaults: defaultKnobs() in knob-state.ts is the sole source — every new-thread entry point spreads it (createThread + restart + replay).

### Claude Agent SDK: layer per-turn instructions via systemPrompt preset+append
To inject a per-turn instruction on top of Claude Code's default system prompt without losing it, use the SDK Options object form: `systemPrompt: { type: 'preset', preset: 'claude_code', append: 'YOUR ADDITIONAL INSTRUCTIONS' }`. The string form replaces the preset entirely; the object form layers on top. Verified in @anthropic-ai/claude-agent-sdk@0.2.138 sdk.d.ts:1776. Useful for per-thread toggles like 'fast mode' (parallel-agent fan-out) where you want to ride the default but bias behavior on the current turn only.

### Phase 8 review: 1 MEDIUM fixed (ModelChip GET endpoint missing), US4 timeline click-jump not wired — phase passes
Phase 8 (workflow-multi-model-subagents) cleared review on the second pass (1 auto-fix iteration). The only MEDIUM bug was ModelChip fetching GET /api/workspaces/:id which returned 405 — the route had no GET handler, so the chip always showed sonnet-4-6 on page load despite DB having a different value. Fix: added GET handler returning id/name/path/preferredModel/buildModeOn. Primary stories US1 (toggle ON/OFF, BuildTimeline pill rendering) and US2 (chip updates, DB persistence) both pass after fix. Secondary story US4 (timeline click-jump) is not wired — BuildTimeline dispatches the CustomEvent but no listener exists in the page or MessageList — filed as Phase 9 carry-over. Group 9 (streaming polish) intentionally skipped due to SSH timeout to dook server. 515 tests pass throughout.

---

Phase 8 (settings-i18n) cleared review in 1 auto-fix iteration. The only bug was isLocale() being imported from a 'use client' module into a server API route — causing 500 on all PATCH /api/auth/settings requests in production while tests passed (tests run under vitest which doesn't enforce the client/server boundary). Fix: extract shared utilities (Locale, LOCALES, isLocale) into i18n/shared.ts (no 'use client'); re-export from index.ts for backward compat; server routes import from shared.ts. Build clean, tsc clean, full manual browser walk passed. Lesson: test the live server against every API route in validation.md — build + tsc clean is not sufficient to catch client/server boundary violations.

## Sdd

### Phase 15.3 review: validation.md test paths must match actual test file paths
The EditScreen tests were specified in validation.md as 'bun vitest run src/components/recurring/EditScreen' but no EditScreen.test.tsx existed — the KnobLayoutEditor tests covered the same behavior under a different path. Always match the validation.md test paths exactly when writing test files during backend implementation.

## Cloud

### Bootstrap script pattern for getting an app cloud-agent-ready
To make a Next.js + native-module app pickup-able by a cloud Claude Code sandbox, ship four pieces in the repo: (1) AGENTS.md at the root with bootstrap commands + dogfood creds + what-works-where matrix, (2) a single ./scripts/cloud-bootstrap.sh that does install → native-module rebuild fallback → user seed → print handoff, (3) a CI workflow that typechecks + tests every push so remote commits are validated before pulling, (4) gitignore !.env.example exception for future templates. Native modules (bcrypt, better-sqlite3) need an ABI rebuild fallback because the prebuilt may not match the cloud sandbox's Node ABI — call npm rebuild --build-from-source if a smoke require() fails.

## Nextjs

### Phase 15.3 frontend: polish-pass inline handover beats Pencil round-trip — zero new tokens, 3 mockup files
Phase 15.3 is a display-layer polish pass on 5 existing components (TemplateCard, RunScreen header, KnobLayoutEditor, empty state). Used claude-code-impeccable with inline mockups. Zero new design tokens — all components used existing token stack plus two component-scoped derived variables. The two-column card body grid (1fr 96px) with a thumbnail column is the structural pattern that unlocks instant scan-speed legibility without adding a new design primitive. Native <details>/<summary> for the technical-detail disclosure requires zero JS and is the right call for a power-user-path toggle that defaults closed. Key: when a polish phase has no new screens and no new tokens, write mockups directly in HTML — reserve Pencil passes for phases introducing new visual language.

### Phase 14 review friction: ScopeBadge always showed date range regardless of dates_engaged
ScopeBadge.tsx always pushed the date_from→date_to pill regardless of dates_engaged flag. A un-engaged dates chip means /dook's preamble doesn't inject dates, so showing the date range in the badge misleads users into thinking their query is date-constrained. Fix: gate the pill on knobs.dates_engaged. Root cause: the badge was written before Phase 14 added engagement flags — it didn't know to distinguish engaged vs stored-but-inactive dates.

---

StorePicker was a compact dropdown designed for the KnobBar (limited space). When reused inside the FilterPane (a dedicated left-rail panel with ample space), it started closed — requiring an extra click to see the store list. The mockup showed stores directly visible. Fix: add initialOpen prop (default false preserves compact behavior); pass initialOpen to FilterPane and FiltersSheet usages. Lesson: when moving a compact component into a dedicated panel context, always check whether its default collapsed state makes sense in the new layout.

### Phase 14: opt-in engagement flag per knob is cleaner than inferring from value
Phase 14 added an 'engagement' boolean per knob to knob_state rather than inferring opt-in from whether the value is non-default. A user who explicitly chose 'no stores' would have the same empty value as one who never touched the chip — the flag makes intent explicit and prevents preamble injection on first load. Future agents adding knobs: write both the value AND an engagement bool. The preamble builder gates on engagement, not value non-emptiness.

### Phase 14 review: engagement-flag model shipped clean — ScopeBadge and StorePicker context drift were the only catches
Phase 14 (knob-refactor) introduced opt-in scope chips with engagement flags. All backend logic (preamble gating, BR-1 auto-disengage, new-thread defaults) was solid — unit tests caught issues before review. Step 2 UX review caught two MEDIUM issues: (1) ScopeBadge showed date range even when dates_engaged=false; (2) StorePicker in FilterPane started collapsed (2-click flow). Both fixed in one iteration. Health score 97/100 after fixes. Key lesson: when adding engagement flags, audit all consumer components that display the stored values — they all need to respect the engagement state, not just the preamble.

### Phase 13 ba: single merged 'report mode' phase correctly split into three — scope clarity beats schedule cleanliness
The roadmap had Phase 14 as a single merged 'report mode' phase (chat-knob refactor + report builder + dashboard). After 2+ weeks of daily use, the user split it into three: Ph14 knob UX retrofit (small), Ph15 greenfield drag-drop report builder (medium-large), Ph16 feasibility-first dashboard (large). The split surfaced because pain points were distinct — the knob preamble fights typed prompts, the report-type picker is buried, and the dashboard needs budget/refresh feasibility before scoping. Lesson: when a merged 'mode' phase covers both polish and greenfield, always split at the phase-type boundary (polish/retrofit = its own phase) so scope doesn't drift during /ba Mode 2. The feasibility-first flag on Ph16 is also a pattern to capture: when a phase is large and uncertain, roadmap it with 'feasibility-first' so /ba Mode 2 knows to spend its first pass on feasibility, not user stories.

### Phase 13 review: 3 bugs fixed (compactions key, mobile model picker, empty state copy), phase passes
Phase 13 (model-work) cleared review in 2 auto-fix iterations. Bug 1: compactions route returned 'markers' key instead of spec-contracted 'compactions' — route.ts, use-chat.ts, and the test all used wrong key; all fixed atomically. Bug 2: MobileShell.tsx called ChatPanel without currentModel/onModelChange, making the model picker invisible on mobile — MobileShell did not adopt the same useThreads hook that Workspace.tsx got. Bug 3 (LOW): side chat empty state copy diverged from spec. Pre-existing failures in Workspace.test.tsx (B2B badge assertion) and LearningsPanel.test.tsx (I18nProvider) are Phase 8 regressions not caused by Phase 13. Lesson: when adding model-related props to desktop Workspace, always check MobileShell for the identical prop gap.

### Phase 13 review friction: compactions route key mismatch (markers vs compactions)
The GET /api/threads/:id/compactions route returned { markers: [...] } but the API contract spec (requirements.md and validation.md) specified { compactions: [...] }. The client hook useCompactions also read res.markers. The unit test (route.test.ts) was written against the incorrect key and passed — meaning the test had no coverage of the spec-contracted key name. Fix: rename both route response key and client reader. Root cause: implementation named the key from the DB query helper (listCompactionMarkersByThread) rather than from the API contract.

---

MobileShell.tsx (the mobile-breakpoint shell) called ChatPanel without currentModel or onModelChange props. InputArea guards ModelPicker rendering with '{threadId && onModelChange ? ... : null}' — without onModelChange, the picker silently disappears on mobile. The bug was invisible in desktop testing and unit tests because tests use the desktop Workspace wrapper. Fix: add useThreads hook to MobileShell and pass the active thread model and updateThreadModel handler. Lesson: when adding model-picker to the desktop wrapper (Workspace.tsx), always check MobileShell.tsx for the same prop gap.

### Phase 8: i18n key coverage requires enumerating all screen × state pairs in validation.md
When 'translate all static strings' is the goal, the sdd-review pass covers only the screens enumerated in validation.md. A second dogfood pass on Phase 8 found 9 additional English strings across the mobile nav, category picker headers, and chat empty-state that were in-scope by mission but not listed in validation.md manual checks. Twelve additional i18n keys were added in a follow-up pass. Future specs with a 'translate everything' scope should enumerate every distinct screen × state combination — especially the mobile path, which surfaces distinct copy the desktop path never shows.

## Nodejs

### npm rebuild better-sqlite3 silently re-downloads the same prebuilt binary — force a source build to fix ABI mismatch
After a Node ABI bump (e.g. Node 22 → 24), better-sqlite3 fails with 'NODE_MODULE_VERSION X requires NODE_MODULE_VERSION Y' and ERR_DLOPEN_FAILED at runtime. The obvious fix — npm rebuild better-sqlite3 — appears to succeed but is a silent no-op: better-sqlite3's install hook runs 'prebuild-install || node-gyp rebuild --release', prebuild-install fetches a prebuilt .node that happens to be byte-identical to the cached one (still wrong ABI), and npm reports 'rebuilt dependencies successfully'. The .node file's mtime never changes. To force a real compile against the running Node: rm -rf node_modules/better-sqlite3/build && (cd node_modules/better-sqlite3 && npm run build-release). Verify by checking the new mtime on node_modules/better-sqlite3/build/Release/better_sqlite3.node.

## Zustand

### URL sync bug: Zustand recurringView stays stale when navigating to mode=recurring fresh
Zustand store persists recurringView='create' across navigations. When AppShell reads URL on mount and sees mode=recurring with no template param, it must call setRecurringView('list') explicitly — setMode('recurring') alone doesn't reset the view. When template param is present, must call setRecurringView('run') so direct URL navigation lands on the run screen.

## Next

### Phase 15 report-builder: drag-drop pivot builder retired after dogfood + /bad-idea + competitor browse
Phase 15 shipped a drag-drop pivot builder (field palette, drop zones, PivotTable, real BQ runs, XLSX export) through two /sdd-review iterations and two polish rounds. Post-dogfood /bad-idea Mode 1 + /browse Looker Studio comparison found the direction wrong: duplicates chat-mode capability, contradicts mission 'steering wheel for Claude, not palette-as-build-surface', adds knob bloat without new capability. Decision: retire entire report-mode UI surface; rebuild Phase 15 v2 as Recurring Reports (template-first, scope-as-runtime). Lesson: run /bad-idea after first /sdd-review iteration when convergence requires >1 round — polish rounds should not be the safety valve for a misaligned direction.

## Vitest

### Use 'bunx vitest run' for tests in this codebase, not 'bun test'
In dook (Next.js 16 + bun + vitest), use 'bunx vitest run' or the npm script 'bun run test', NOT 'bun test'. Bun's built-in test runner doesn't honor vitest's '@vitest-environment happy-dom' docblocks, so any UI test that needs a DOM environment fails opaquely with bun test. The vitest config at app/vitest.config.ts wires happy-dom per-file via the docblock — only the vitest binary picks that up. Spec docs that say 'bun test' should be read as shorthand for 'bunx vitest run'. The bun-test-related failures look like missing globals/JSDOM errors and are easy to misread as real bugs.

## Testing

### Boundary-mocked tests can mask integration bugs in transactional flows
When unit tests mock at a layer above the bug, the bug is invisible. Phase 13's architectural review caught two correctness issues that 858 unit tests didn't surface: (1) edit/retry inserted a duplicate user message because route tests mocked manager.warmUpAndSend itself, never observing the DB write, and (2) compaction markers were persisted with the wrong sequence number-space because handler tests stubbed the persistence call. The fix was to add an integration test (replay.integration.test.ts) that uses the REAL test DB + real ThreadManager + only stubs the SdkClient at the transport boundary, then asserts post-state DB invariants (e.g. user-message count stays at N after edit, marker sequence is monotonic with messages.sequence). Lesson: for transactional / multi-step flows that span DB + service + API, write at least one integration test that exercises the real chain end-to-end and asserts post-state invariants. Mock only at the unavoidable boundary (network, SDK transport).

## Dook

### Phase 12 backend: archived flag separate from visibility — single-owner default
Two near-identical boolean flags on the same row (visibility = LLM-router 'surface to next turn?' semantic; archived = wiki UI hide) silently re-conflate when their default-resolution lives in three layers (URL parser default, query-builder default, hook URL-builder gate). Fix: API forwards undefined for missing query params; only the SQL listLearnings owns the default 'false'. Toggle hooks should call refresh() after PUT instead of re-deriving the filter predicate in TS — the server's predicate is the single source of truth, and the optimistic-with-on-failure-refresh pattern was already paying half the round-trip cost.
