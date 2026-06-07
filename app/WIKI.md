<!-- wiki-generated -->
# Project WIKI — app
*Seeded from global wiki on 2026-06-06. Relevant to: @anthropic-ai/claude-agent-sdk, better-sqlite3, zod, zustand, @electron/rebuild, @tailwindcss/vite, @types/better-sqlite3, @types/node, @types/react, @types/react-dom, @vitejs/plugin-react, electron, electron-vite, react, react-dom, tailwindcss, tsx, typescript, vite, vitest. 30 entries.*

## Typescript

### Phase 2: DevServerManager singleton + preview state machine were the two load-bearing additions
Phase 2 introduced two new abstractions that everything else hangs from: DevServerManager (singleton in main process that owns the child-process lifecycle for the dev server) and a five-state PreviewState machine (none/building/live/snag/blocked) in the renderer Zustand store. Both were non-obvious: DevServerManager was needed because the server must outlive individual build sessions; the five-state model was needed because collapsing snag+blocked into 'not-live' removes the distinction between auto-recovery and user action required. The spec correctly named both but didn't flag how central they were — future phases touching the preview layer must understand the state machine first or they will break the invariant that the renderer never starts/stops the server directly.

### Phase 2 ba: scope grill correctly bundled dogfood feedback into one phase
BA Mode 2 for Phase 2 originally pulled in 8 chat-parity items (markdown, plan, AUQ, permission, tool-grouping, attachments, slash picker, model/usage banners) plus 2 Phase 1 carry-overs. The right call was splitting on read-side (passive rendering) vs interact-side (user input + actions) — Phase 2 became read-side only, Phase 3 owns interact-side + attachments + slash picker + context-preserving stop + register/remove toasts. The split was clean because every read-side card has a static and interactive variant; static-only ships first, interactive flips a prop. Next time: when a phase has a dozen items, look for an axis-of-action split (read vs write, view vs act) before letting all items into one phase.

---

Phase 2 delivered exactly what was planned with no deviations. The central discovery that reshapes Phase 3 is the two-surface preview split: real Electron app uses a cross-process <webview> (click-capture via executeJavaScript injection is feasible), while the mock web build uses a data:-URL <iframe> (opaque origin blocks true click capture — mock needs a scripted affordance instead). Phase 3 design must handle these two paths explicitly rather than assuming a unified click-capture API. DevServerManager's restart() path already provides the fix-verify loop for free.

### Phase 1 frontend: external-pencil .pen read directly as JSON (schema 2.13) on macOS; design diverged → reconcile spec to canon
External-pencil track on macOS: the Pencil MCP focus-dance is WSL-specific and unreliable here — read the .pen directly as JSON (top-level version/children/variables; schema 2.13) to generate design-tokens.css and the frame index. The user's design diverged significantly from the brief (sidebar nav not top-nav, an added light Home/landing with client-computed stats despite the brief saying 'no dashboard', mobile bottom-nav+FAB, per-expense include checkboxes + editable invoice number in Reports/Create, and a leaner Setup). Lesson: when the design is canon and diverges, reconcile requirements.md/validation.md TO the design before backend (then recompute requirementsHash so no false drift warning) — but guard the FUNCTIONAL contract: the lean Setup mock dropped invoice-required fields (submitter address/phone/country/vendorId) that the existing Macquarie invoice template needs, so keep the full field set even though the mock doesn't show it. Always check the real output template (invoice xlsx) before trusting a design's field list.

### Phase 1: event-transformer hard gate is load-bearing — extend, don't weaken, for Phase 2 tool calls
Helm Phase 1 built a mandatory event-transformer.ts that sits between raw SDK output and the Electron IPC boundary — all SDK events pass through before reaching the renderer, stripping code/paths/terminal text and mapping to 7 human-readable kinds (narration, activity, decision_prompt, steering, checkpoint, summary, error, stopped). Phase 2 will introduce real tool calls at volume (file writes, bash, computer use) producing far more raw output. The gate must not be bypassed or weakened — add a translation layer that maps tool-call activity to executive narration ('writing the login screen…') on top of the existing strip logic. The gate is what makes Helm feel like a product dashboard, not a terminal wrapper.

### Dexie field rename needs the old field readable during the upgrade() backfill
Renaming Profile.homeCurrency -> baseCurrency: the v2 upgrade() reads p.homeCurrency to seed baseCurrency then deletes it. Backup import does the same via a migrateProfile() that reads a (Profile & {homeCurrency?}) cast, because old .mqx files still carry the old field. Also backfill onboardingComplete:true for existing records so returning users skip the new first-run wizard — a fresh emptyProfile() sets it false.

### Phase 1: SDD subagents freeze on permission prompt via remote-control UI — run sub-skills inline
When driving /build over the Claude Code remote-control UI, spawning sub-skills (e.g. /spec) via the Agent tool hung twice with 'tool result missing due to internal error' — the subagent stalled on a permission prompt the remote UI couldn't surface/answer. Workaround that worked: run the sub-skill INLINE in the main loop (read its SKILL.md + schemas directly, produce the artifacts yourself) instead of via Agent. The .build-state.json currentSubStep crash-anchor made the retry clean (nothing was written by the frozen runs). For this environment, prefer inline execution of /spec, /frontend, /backend, /sdd-review over subagent spawning until the remote-UI permission path is fixed.

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

## Electron

### Phase 3: 'flagged' checkpoint semantics fork by card type — audit generic handlers when adding a type
The renderer feed store's approveCheckpoint('flagged') hardcoded retry-as-new-session (helm.sessions.start). For Phase 3 fix_comment cards the main process resumes the SAME session via resumeWithRejection, so the generic path would have silently spawned a duplicate session with the wrong (build) prompt. When a new card/session type is added, every generic verdict/status handler must be audited for type-specific behavior — the bug produces no error, just two agents working at once.

### Phase 1: text-only narration gap means Phase 2 must build a real pipeline, not extend Phase 1 sessions
Phase 1 sessions ran with allowedTools:[] and cwd:tmpdir() — the agent narrated a build but wrote no real files to disk. This was the right choice to de-risk the SDK engine plumbing, but it means there are literally no artifacts on disk to preview or browse at phase end. The central architectural shift of Phase 2 is not 'add a preview pane' — it is growing the build pipeline from narration into a real pipeline that writes an actual local app, then embedding it. Any BA or spec that treats Phase 2 as purely a UI change (adding a webview) will miss the pipeline work. Always confirm whether the current build sessions write real artifacts before scoping a preview phase.

### Helm dogfood: real Electron app needs better-sqlite3 rebuilt for Electron ABI
The Helm test suite runs under vitest (node ABI) so better-sqlite3 works there, but the real desktop app launched via electron-vite dev loads better-sqlite3 in the Electron main process, which uses a different ABI. Without running the rebuild step (npm run rebuild -> electron-rebuild -f -w better-sqlite3) the app crashes on first DB access. For dogfooding the UX without that rebuild, serve the production mock web build (vite preview --config vite.web.config.ts --host) which runs the renderer with a mock bridge and no native module. The live-SDK experience requires the real app, so the rebuild must run before electron-vite dev. Watch for this whenever a native module is shared between node-side tests and the Electron runtime.

### IPC handler that parses payloads without try/catch throws across the boundary
In Electron, ipcMain.handle that calls Schema.parse(raw) outside a try/catch will throw an uncaught error across the IPC boundary on a malformed payload, rejecting the renderer invoke() promise instead of returning a typed error response. The Group 1 feed bridge had this gap; later bridges wrapped parse in try/catch and mapped to a typed IpcError. Fix: every handler wraps parse + logic in try/catch returning mapError(e). Catch it with a fuzzing test that fires null/number/string/array/wrong-shape at every channel and asserts each returns an object with an error field and never throws. This is invisible until you actually send bad input.

## Zustand

### Phase 3: live-push and backfill status derivation must agree — checkpoint means done only at the feed tail
The feed store derives session status two ways: inferStatus() on backfill and per-event rules in appendEvent() on live pushes. Phase 3's reject-retry continues a session AFTER its checkpoint, which broke the old invariant 'any checkpoint event => done'. Fix on both paths: a checkpoint only means done while it is the last event; any narration/activity/steering after it returns status to active. Whenever state is derived in two code paths, a new lifecycle transition must be applied to both or reattach behavior silently diverges from live behavior.

### URL sync bug: Zustand recurringView stays stale when navigating to mode=recurring fresh
Zustand store persists recurringView='create' across navigations. When AppShell reads URL on mount and sees mode=recurring with no template param, it must call setRecurringView('list') explicitly — setMode('recurring') alone doesn't reset the view. When template param is present, must call setRecurringView('run') so direct URL navigation lands on the run screen.

## React

### React: effect keyed on an object the effect's own callback replaces = render-rate loop
A useEffect that lists a state object (e.g. 'account') in its deps AND runs a callback that calls setAccount(freshObject) re-subscribes every tick, because the new object has a new identity. If that effect also opens a resource (EventSource/socket), it tears down and reopens it each cycle — a render-rate loop plus connection churn. Fix: key the effect on a stable primitive derived from the object (account.email), not the object itself, and don't call the state-refresher from inside the effect's steady-state work.

### Streaming narration UI: re-segment the whole buffer + stable keys, don't split per-delta
When rendering a streaming LLM narration/thinking panel: tokens arrive as fragments that split mid-word AND mid-sentence, so splitting each delta into its own line breaks text at network boundaries (e.g. 'G' then 'IAO THUY' on separate lines). Fix: keep the raw concatenated buffer and re-split the WHOLE thing into sentences on every update; a trailing fragment with no terminal punctuation is the currently-streaming line. Separately, key each rendered line by its STABLE absolute index in the full list, not its index within a sliding visible window — window-relative keys remount every line when the window slides and make the lines visibly blink. Also: to collapse the panel 'when the answer starts', trigger on the report/answer phase, not on turn-end.

### Sorting a grid with positional cell-ref annotations: reorder display, not data
When a table keys comments/edits by positional cell ref (RrCc) and you add column sort, never reorder the underlying rows — that desyncs every saved ref. Keep the grid array fixed and sort a separate displayOrder: number[] of original row indices; render in that order but keep all selection/comment/edit coordinates in original indices. Cell refs, comment dots, and the edit log stay correct; the only cost is that a drag-selected visual range maps to a logical (original-index) range, which is an acceptable edge case. Used in dook's drill-down ReportTable.

## Css

### SDD phase-wrap: a design token existing is not a token applied
In a local-first React app, the display-font CSS var was defined and wired to only the sidebar brand + the global h* rule, so most screen/section headings silently fell through to the body font. Nobody noticed until a dedicated fidelity pass. Lesson for any design-system phase: verify each token is actually referenced everywhere the design uses it — presence in the token map proves nothing about application. A cheap grep for the var name across components catches this before a human does.

---

On a Settings screen hosting both an autosave form and a 'Change PIN' action, invoking the PIN change remounted/reset the form and dropped the user's unsaved edits — a real bug fixed mid-phase. When one screen mixes a modal-ish action with a live autosave form, ensure the action does not unmount or re-key the form subtree. Recurs whenever auth/security controls share a page with editable settings.

## Tailwind

### Tailwind v4: use @container queries for components in fixed-width side panels, not viewport md:
A shared component (e.g. dook's ChatActivity) rendered inside a narrow fixed-width side panel must NOT use viewport breakpoints (md:flex-row) for its internal layout — on a wide viewport the md: variant fires even though the PANEL is only ~350px, overflowing/wrapping content. Fix: put '@container' on the component's outer wrapper and use container-query variants (@md:flex-row, @md:w-[220px], @md:block/@md:hidden). @md defaults to 28rem/448px, measured against the container's inline-size, so a 347px panel stays stacked while a wide chat column rows out. Tailwind v4 ships container queries with no plugin.

## Node

### Stale server on a fixed port silently serves old code during integration tests
A backgrounded 'tsx server/index.ts' that fails to bind (EADDRINUSE) exits silently while an older server keeps the port. Integration probes then hit STALE code and you chase phantom bugs (saw a THB report render 'Amount (VND)' that was actually correct in current code). Before integration testing always: lsof -nP -iTCP:PORT -sTCP:LISTEN -t | xargs kill -9, then start one fresh server and confirm via the startup log line, not just /api/health.

## Vite

### Verify zustand-store UI on a production preview, not the HMR dev server
When you edit a zustand store module (and its subscribers) many times in one session, Vite HMR can fragment the store into two live instances: a subscription closure writes events into instance A while the rendered component reads instance B. Symptom: appendEvent/set is provably called (logs fire) but the UI stays frozen and state never advances — looks like a broken subscription or stale closure. It is neither. Confirm by serving the production build (npx vite preview) on a fresh port: the bug vanishes. Don't burn time debugging the dev server after heavy store edits — hard-reload or preview first. Also: React StrictMode double-invokes effects, so an open()-on-mount that mutates shared state (e.g. card.sessionId) runs twice; make such effects idempotent and backfill the feed on every (re)subscribe so a push missed during the teardown gap self-heals.

## Wsl

### Pencil desktop on WSLg needs --ignore-gpu-blocklist (WebGL2 blocked)
Launching Pencil's desktop binary under WSLg shows 'Failed to start Pencil' as a full-window error screen (not a dismissable dialog). The renderer logs LOOK normal — IPC server inits, files load, theme/session notifications flow — but the GPU process logs 'ContextResult::kFatalFailure: WebGL2 blocklisted' from gpu/command_buffer/service/context_group.cc. WSLg's virtual GPU is on Chromium's WebGL2 blocklist and Pencil's canvas refuses to start without it. Fix: launch with '--no-sandbox --ignore-gpu-blocklist'. Applies to any Electron app on WSLg whose renderer requires WebGL2.

## Bun

### Dook: bun run db:migrate fails under Bun — verify migrations via vitest, not the CLI
In the dook repo, 'bun run db:migrate' (bun run src/db/migrate.ts) crashes with ERR_DLOPEN_FAILED / 'better-sqlite3 is not yet supported in Bun' — better-sqlite3 is a native Node module Bun can't dlopen. Migrations actually apply two ways: (1) auto on first getDb() under the Next.js/Node runtime, (2) in the vitest harness, where src/db/test-helpers.ts createTestDb() reads and exec's the raw NNNN_*.sql migration files with foreign_keys=ON against an in-memory DB. So to VERIFY a new migration, run its query test under vitest (proves the SQL applies + FK/cascade/checks work) — do NOT trust 'bun run db:migrate' (it always fails under Bun regardless of the migration). plan.md verify commands that say 'bun run db:migrate' should be read as 'run the vitest suite'.

## Sdd

### Phase 15.3 review: validation.md test paths must match actual test file paths
The EditScreen tests were specified in validation.md as 'bun vitest run src/components/recurring/EditScreen' but no EditScreen.test.tsx existed — the KnobLayoutEditor tests covered the same behavior under a different path. Always match the validation.md test paths exactly when writing test files during backend implementation.

## Cloud

### Bootstrap script pattern for getting an app cloud-agent-ready
To make a Next.js + native-module app pickup-able by a cloud Claude Code sandbox, ship four pieces in the repo: (1) AGENTS.md at the root with bootstrap commands + dogfood creds + what-works-where matrix, (2) a single ./scripts/cloud-bootstrap.sh that does install → native-module rebuild fallback → user seed → print handoff, (3) a CI workflow that typechecks + tests every push so remote commits are validated before pulling, (4) gitignore !.env.example exception for future templates. Native modules (bcrypt, better-sqlite3) need an ABI rebuild fallback because the prebuilt may not match the cloud sandbox's Node ABI — call npm rebuild --build-from-source if a smoke require() fails.

## Nextjs

### Phase 15.3 frontend: polish-pass inline handover beats Pencil round-trip — zero new tokens, 3 mockup files
Phase 15.3 is a display-layer polish pass on 5 existing components (TemplateCard, RunScreen header, KnobLayoutEditor, empty state). Used claude-code-impeccable with inline mockups. Zero new design tokens — all components used existing token stack plus two component-scoped derived variables. The two-column card body grid (1fr 96px) with a thumbnail column is the structural pattern that unlocks instant scan-speed legibility without adding a new design primitive. Native <details>/<summary> for the technical-detail disclosure requires zero JS and is the right call for a power-user-path toggle that defaults closed. Key: when a polish phase has no new screens and no new tokens, write mockups directly in HTML — reserve Pencil passes for phases introducing new visual language.

## Nodejs

### npm rebuild better-sqlite3 silently re-downloads the same prebuilt binary — force a source build to fix ABI mismatch
After a Node ABI bump (e.g. Node 22 → 24), better-sqlite3 fails with 'NODE_MODULE_VERSION X requires NODE_MODULE_VERSION Y' and ERR_DLOPEN_FAILED at runtime. The obvious fix — npm rebuild better-sqlite3 — appears to succeed but is a silent no-op: better-sqlite3's install hook runs 'prebuild-install || node-gyp rebuild --release', prebuild-install fetches a prebuilt .node that happens to be byte-identical to the cached one (still wrong ABI), and npm reports 'rebuilt dependencies successfully'. The .node file's mtime never changes. To force a real compile against the running Node: rm -rf node_modules/better-sqlite3/build && (cd node_modules/better-sqlite3 && npm run build-release). Verify by checking the new mtime on node_modules/better-sqlite3/build/Release/better_sqlite3.node.
