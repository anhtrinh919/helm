<!-- wiki-generated -->
# Project WIKI — app
*Seeded from global wiki on 2026-06-10. Relevant to: @anthropic-ai/claude-agent-sdk, better-sqlite3, ws, zod, zustand, @electron/rebuild, @tailwindcss/vite, @types/better-sqlite3, @types/node, @types/react, @types/react-dom, @types/ws, @vitejs/plugin-react, electron, electron-vite, react, react-dom, tailwindcss, tsx, typescript, vite, vitest. 30 entries.*

## Typescript

### Phase 1 frontend: external-pencil .pen read directly as JSON (schema 2.13) on macOS; design diverged → reconcile spec to canon
External-pencil track on macOS: the Pencil MCP focus-dance is WSL-specific and unreliable here — read the .pen directly as JSON (top-level version/children/variables; schema 2.13) to generate design-tokens.css and the frame index. The user's design diverged significantly from the brief (sidebar nav not top-nav, an added light Home/landing with client-computed stats despite the brief saying 'no dashboard', mobile bottom-nav+FAB, per-expense include checkboxes + editable invoice number in Reports/Create, and a leaner Setup). Lesson: when the design is canon and diverges, reconcile requirements.md/validation.md TO the design before backend (then recompute requirementsHash so no false drift warning) — but guard the FUNCTIONAL contract: the lean Setup mock dropped invoice-required fields (submitter address/phone/country/vendorId) that the existing Macquarie invoice template needs, so keep the full field set even though the mock doesn't show it. Always check the real output template (invoice xlsx) before trusting a design's field list.

---

Helm Phase 1 design came as a Claude Design handoff bundle (gzip tarball from api.anthropic.com/v1/design/h/...): README + chat transcript + HTML/JSX/CSS prototypes, copied into specs/.../design/. Canon: 'DOT-MATRIX' language — Space Mono + JetBrains Mono (all monospace), lime #C2EE2A as FILL/HIGHLIGHTER ONLY never coloured text (use --accent-text #5E6E0C for text), hard black 1.5px frames, zero radius, hard-offset shadows, dot-grid. Layout: Journey direction C (preview-dominant) + Cockpit A (spine beside live app). Front door doors renamed Build with structure / Build freely, mirrored. CRITICAL: the user's OUTPUT app (live preview) stays a normal serif/sans site — only Helm wears the terminal look. helm.css is a complete .hm- class system — port wholesale, it's class-stable and reskins every screen. The bundle was exported mid-rollout, so several states are GAPs (session states, project mgmt, some empty states, side panels) to build by extending built siblings in-language. Read the chat transcript for intent — that's where the iteration landed.

### Parallel competitor research via 3 DOM-scoped browser agents on one Chrome
To deep-research 3 authenticated web apps (Replit/Bolt/Lovable) concurrently in the user's signed-in Chrome, spawn one Sonnet agent per tab and constrain each to TAB-SCOPED claude-in-chrome tools only: read_page, get_page_text, find, javascript_tool, navigate, read_console_messages. These take a tabId and operate without focus, so 3 agents run truly in parallel. The coordinate/focus tools (computer, screenshots, form_input, file_upload) act on the shared active window and WILL collide between sibling agents — forbid them. Clicks/expands go through javascript_tool (.click()) instead. Also: with multiple browsers paired to the account, the first browser call errors until you select_browser by deviceId; pass that deviceId to each subagent so they can self-recover. Authenticated competitor research is a legit use of claude-in-chrome (gstack /browse is headless and lacks the user's sessions).

### Helm transport bus is a module-singleton: one core per process, guard double-boot
The hybrid-runtime HelmBus (app/src/main/core/transport.ts) is a module-level singleton that every bridge registers onto via the ipcMain shim (last-write-wins). This is safe ONLY because there is one core per process and the test suite serializes with bus.reset() in beforeEach. Two startCore() calls in one process would share handlers + WS clients (project A's shelf:updated broadcasts to project B's sockets) and silently clobber registrations. Mitigation taken (not a full instance-refactor): startCore sets a module-level coreRunning flag and throws on double-boot, cleared in close(). If parallel cores are ever needed (e.g. parallel Playwright fixtures), thread a bus instance through register*Bridge + startServer instead.

### Phase 4: agent→main signals ride the JSON-line protocol, not SDK custom tools
The session runner (query() wrapper) has no custom-tool registration, so the park-to-shelf triage couldn't be an SDK tool. Instead the established JSON-line protocol was extended: the build prompt teaches the agent to emit {"park":{"title":...}} on its own line, the event transformer parses it into a 'parked' feed-event kind, and the orchestrator's ingest intercepts that kind to write shelf_items and push shelf:updated. Any future agent→main signal should follow this same path (prompt convention → splitTurn parse → ingest interception) rather than reaching for SDK tooling.

### Phase 3: dogfood in real Electron revealed Stage 1 vs Stage 2 UX gap — rail metaphor replaces board for early projects
Phase 3 shipped point-and-fix cleanly (85/100 review) but the first real Electron dogfood session surfaced a deeper product problem: the freeform kanban board works well for Stage 2 (polish, additions, parallel fixes) but gives no 'on-rail' feeling during Stage 1 (building the original goal). The user's mental model is a clear Stage 1 → Stage 2 transition; the board flattens all cards into the same surface regardless of where in the journey you are. Phase 3.5 reorganizes the presentation layer: Stage 1 gets a linear rail of prerequisite-ordered milestones, Stage 2 keeps the board. Key BA lesson: dogfood surface matters — the mock web build (used for Phases 1–3 review) masked this because the board was never populated with real sessions. Only the real Electron app with a real project populated enough cards to reveal the UX gap. Always dogfood on the real Electron app, not the web build.

### Phase 2: DevServerManager singleton + preview state machine were the two load-bearing additions
Phase 2 introduced two new abstractions that everything else hangs from: DevServerManager (singleton in main process that owns the child-process lifecycle for the dev server) and a five-state PreviewState machine (none/building/live/snag/blocked) in the renderer Zustand store. Both were non-obvious: DevServerManager was needed because the server must outlive individual build sessions; the five-state model was needed because collapsing snag+blocked into 'not-live' removes the distinction between auto-recovery and user action required. The spec correctly named both but didn't flag how central they were — future phases touching the preview layer must understand the state machine first or they will break the invariant that the renderer never starts/stops the server directly.

### Phase 2 ba: scope grill correctly bundled dogfood feedback into one phase
BA Mode 2 for Phase 2 originally pulled in 8 chat-parity items (markdown, plan, AUQ, permission, tool-grouping, attachments, slash picker, model/usage banners) plus 2 Phase 1 carry-overs. The right call was splitting on read-side (passive rendering) vs interact-side (user input + actions) — Phase 2 became read-side only, Phase 3 owns interact-side + attachments + slash picker + context-preserving stop + register/remove toasts. The split was clean because every read-side card has a static and interactive variant; static-only ships first, interactive flips a prop. Next time: when a phase has a dozen items, look for an axis-of-action split (read vs write, view vs act) before letting all items into one phase.

---

Phase 2 delivered exactly what was planned with no deviations. The central discovery that reshapes Phase 3 is the two-surface preview split: real Electron app uses a cross-process <webview> (click-capture via executeJavaScript injection is feasible), while the mock web build uses a data:-URL <iframe> (opaque origin blocks true click capture — mock needs a scripted affordance instead). Phase 3 design must handle these two paths explicitly rather than assuming a unified click-capture API. DevServerManager's restart() path already provides the fix-verify loop for free.

### Phase 16 ba: multi-user shipped clean; 16.5 chart+markdown drill-down inserted before Ph17
Phase 16 multi-user shipped cleanly on dook-preview 2026-06-05 with no scope deviations. Phase-wrap replan inserted Phase 16.5 (chart + markdown-report drill-down) before Phase 17. Key decisions locked: (1) drill-down chart/markdown artifact support with comment/agent/export parity; (2) prod ship (NEXT_PUBLIC_REPORT_MODE_ENABLED flip + deploy-prod.sh) happens at END of 16.5, not at 16 close; (3) branch merge/topology deferred to the prod-ship step; (4) old Ph15 friction backlog and drill-down polish backlog both declared closed/moot.

## Electron

### Helm hybrid transport: one bus seam swaps Electron IPC for HTTP/WS
To move Helm's helm bridge off Electron IPC without rewriting 10 bridges: introduce a module-singleton HelmBus (core/transport.ts) exposing an ipcMain-shaped shim (handle) and a synthetic HelmWindow whose webContents.send fans out to WS clients. Bridges only change their import line ('electron' -> '../core/transport') and the GetWindow type (BrowserWindow -> HelmWindow); their handler/push CODE is untouched. The HTTP server does POST /helm/<channel> -> bus.invoke; pushes ride one WebSocket. Renderer picks transport in bridge.ts: real app -> http-bridge (fetch + lazy WS, same-origin via Vite proxy), but default to the in-memory mock when import.meta.env.MODE==='test' so jsdom store tests don't try to fetch relative URLs. Existing IPC tests that did vi.mock('electron') to capture handlers migrate to a bus-backed adapter (has/get->bus.invoke, clear->bus.reset). Channel names use colons (projects:list) not dots.

### Helm browser preview proxy: parent can't read iframe console — relay via postMessage + <base href>
Helm's same-origin preview proxy serves the user's running app under /preview/<projectId>/ so click-capture + inline-edit can be injected. Gotcha: the injected scripts report over console.log('__HELM_POINT__'/'__HELM_TEXTEDIT__'), which works for Electron <webview> (main subscribes via onConsole) but a PARENT WINDOW CANNOT READ A CHILD IFRAME'S CONSOLE. So the browser path must postMessage(selector+geometry) to window.parent (target window.location.origin, and gate the listener on e.origin) — otherwise element fixes silently degrade to whole-page comments. Two more proxy gotchas: inject <base href="/preview/<id>/"> into the proxied HTML or a Vite app's root-relative assets 404 at the Helm origin; and the iframe load event is the browser counterpart of Electron's onGuestReload for tearing down a mid-edit inline editor. Consequence: the browser inline-edit selector is request-carried (renderer->core), unlike point-capture's main-only selector — document the asymmetry, don't build a pending-capture mechanism that nothing consumes.

### Annotation overlay must live in the host renderer, not injected into the webview
Phase 3 point-and-fix: the click-annotation layer is an absolute-positioned SVG in the Helm renderer, not injected into the embedded app's DOM via executeJavaScript. Injecting into the webview is fragile and app-specific (breaks on dynamic frameworks). The overlay sits above the webview at Helm's DOM level, intercepts pointer events there, and calls webview.executeJavaScript only for coordinate resolution. This keeps the embedded app unmodified and the overlay app-agnostic.

### Phase 3: 'flagged' checkpoint semantics fork by card type — audit generic handlers when adding a type
The renderer feed store's approveCheckpoint('flagged') hardcoded retry-as-new-session (helm.sessions.start). For Phase 3 fix_comment cards the main process resumes the SAME session via resumeWithRejection, so the generic path would have silently spawned a duplicate session with the wrong (build) prompt. When a new card/session type is added, every generic verdict/status handler must be audited for type-specific behavior — the bug produces no error, just two agents working at once.

## Nextjs

### Phase 17 backend friction: auto-name vs manual rename race
Auto-naming guarded on topicName===null, but manual rename only wrote threads.name — renaming before the first turn finished let auto-name clobber the user's name. Fix: updateThreadName stamps topicName too, making the null-guard a single consolidated rule for both paths. When an invariant ('X wins over Y') spans two write paths, make the winning path mark its victory in the same column the loser checks.

### Phase 17 backend: wave-dispatched homescreen rebuild
Rebuild-type phase: 10 plan groups, 4 prebuilt by a background foundation agent during the user's design wait, 5 wave-dispatched (3+1 agents), ChatCTA implemented inline after the visual gate caught a plan-vs-design gap (the design's composerCtaRow wasn't in any plan group — the handover marked CTA frames reference-only but F1 itself contained the row). Lesson: when a designer adds elements inside an approved full-page frame, the plan won't know; diff the built page against the full-page frame node tree, not just the per-component frames. Also: test/integration/api-contracts.test.ts cannot run in the report worktree (spawns next dev = Turbopack panic on symlinked node_modules) — run it from a real checkout.

### Phase 16: two-migration pattern for NOT NULL FK backfill after schema addition
When a NOT NULL FK column needs backfilling from data created by a concurrent migration (e.g. threads.user_id backfill needs the admin user row that migration 0035 just created), split into two migrations: migration N adds new tables/columns safely on empty DBs; migration N+1 backfills from the new data and tightens the NOT NULL constraint. Running both in one migration fails on fresh installs because the referenced rows don't exist yet when the ALTER runs.

### Phase 16.5 frontend: chart + MD drill-down — inline version history, passage chip portal, gallery type badges
Chart and MD drill-down use the same Frame wrapper (from DrilldownView.tsx) — refactor it to a named export rather than duplicating. Version history panel goes BELOW the main content flex-row (chart/document + agent drawer), not alongside it — a second side panel would squeeze the viewport too badly. Passage comment chip must use createPortal to document.body like DrillDownConfirm; otherwise z-index is trapped inside the document canvas stacking context. Gallery type badges are intentionally not color-coded (all three types use the same neutral treatment) to avoid decorative semantic color use. PNG drill-down chip uses bottom-right corner overlay on the <figure> element with opacity transition on hover — not top-right, which conflicts with the handle badge area.

## Drizzle

### Phase 17: drizzle renders ${col} unqualified inside select-projection sql templates
In db.select({ x: sql`EXISTS (SELECT 1 FROM messages m WHERE m.thread_id = ${threads.id})` }), drizzle rendered ${threads.id} as bare "id" — which SQLite resolved against the inner table (messages.id), silently breaking the correlation and returning EXISTS=false always. Write correlated-subquery identifiers raw and table-qualified (threads.id) instead of interpolating column objects. Caught only because a unit test asserted the 'new' status.

## Dook

### Dook send-sequence: the working panel must be unconditional during a live turn
Gating the ChatActivity working panel on 'did the turn do real work yet' (steps/thinking nonempty) created a visible gap: panel shows pre-stream, vanishes at SDK message-start (no steps yet), an empty streaming bubble shows only a blinking cursor for seconds, then the panel returns. Operator-reported as 'stale indicators'. Rule: while a turn is live, the panel renders unconditionally; the streaming answer bubble requires content.length>0; pendingSend is set optimistically at send-click (not after the POST resolves); the timer anchors to the triggering user message's createdAt with a 2-minute staleness guard for retry/regen turns whose user message is old.

## Vitest

### DevServerManager.ensureArtifactDir persists to db — failure-path tests must NULL projects.artifact_dir first
ensureArtifactDir returns the db-persisted artifact_dir when present and only attempts mkdirSync on first use. A second 'bad' DevServerManager instance sharing the same db (e.g. one pointed inside a regular file to force ENOTDIR) silently reuses the persisted path and never fails. To test the artifact_dir_failed contract, run 'UPDATE projects SET artifact_dir = NULL' after any goLive()-style setup so the bad instance actually attempts the mkdir.

### Vitest full-suite runs have load-induced rotating flaky failures — verify in isolation before chasing regressions
Running the full dook vitest suite produces rotating timing-sensitive failures in OLD untouched files (phase-1/14 story walks, instrumentation, file-tree, lc-cat TTL) that all pass when run in isolation. The pattern: different files fail on different full-suite runs, none in code the current phase touched. Before treating a full-suite failure as a regression, re-run the failing file alone (bun vitest run <file>); if it passes, it is pre-existing load flakiness, not your change.

## Gstack

### gstack browse vs React controlled inputs: 'fill' is a no-op and 'type @ref' can inject the ref text — use native setter + input event
During browse-driven dogfood of React forms: the 'fill' command does not register with React controlled inputs (state never updates), and 'type' with an @ref once injected the literal ref text into the field, polluting saved data ('@e36 Turnover...'). Reliable workaround for textareas/inputs: evaluate JS using the native value setter (Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(el, text)) then dispatch a bubbling 'input' event so React picks it up. Click-based form fills (type into focused field without ref) also worked for login.

## Zustand

### Phase 3: live-push and backfill status derivation must agree — checkpoint means done only at the feed tail
The feed store derives session status two ways: inferStatus() on backfill and per-event rules in appendEvent() on live pushes. Phase 3's reject-retry continues a session AFTER its checkpoint, which broke the old invariant 'any checkpoint event => done'. Fix on both paths: a checkpoint only means done while it is the last event; any narration/activity/steering after it returns status to active. Whenever state is derived in two code paths, a new lifecycle transition must be applied to both or reattach behavior silently diverges from live behavior.

## Sqlite

### Cards created in two steps need a re-read before pushing — LEFT-JOINed dressing is missing on the first read
Helm's Card payload carries noteType/pageLevel via a LEFT JOIN onto fix_comments. points:register creates the card row first, then the fix_comments row — so the Card object returned by createCard predates the join data. Any handler that enriches a row in a second insert must re-read (getCard) before pushing/returning, or the renderer receives the undressed shape. Symptom: toMatchObject failures on fields that 'should' be there.

## React

### React: effect keyed on an object the effect's own callback replaces = render-rate loop
A useEffect that lists a state object (e.g. 'account') in its deps AND runs a callback that calls setAccount(freshObject) re-subscribes every tick, because the new object has a new identity. If that effect also opens a resource (EventSource/socket), it tears down and reopens it each cycle — a render-rate loop plus connection churn. Fix: key the effect on a stable primitive derived from the object (account.email), not the object itself, and don't call the state-refresher from inside the effect's steady-state work.

### Streaming narration UI: re-segment the whole buffer + stable keys, don't split per-delta
When rendering a streaming LLM narration/thinking panel: tokens arrive as fragments that split mid-word AND mid-sentence, so splitting each delta into its own line breaks text at network boundaries (e.g. 'G' then 'IAO THUY' on separate lines). Fix: keep the raw concatenated buffer and re-split the WHOLE thing into sentences on every update; a trailing fragment with no terminal punctuation is the currently-streaming line. Separately, key each rendered line by its STABLE absolute index in the full list, not its index within a sliding visible window — window-relative keys remount every line when the window slides and make the lines visibly blink. Also: to collapse the panel 'when the answer starts', trigger on the report/answer phase, not on turn-end.

## Css

### SDD phase-wrap: a design token existing is not a token applied
In a local-first React app, the display-font CSS var was defined and wired to only the sidebar brand + the global h* rule, so most screen/section headings silently fell through to the body font. Nobody noticed until a dedicated fidelity pass. Lesson for any design-system phase: verify each token is actually referenced everywhere the design uses it — presence in the token map proves nothing about application. A cheap grep for the var name across components catches this before a human does.

---

On a Settings screen hosting both an autosave form and a 'Change PIN' action, invoking the PIN change remounted/reset the form and dropped the user's unsaved edits — a real bug fixed mid-phase. When one screen mixes a modal-ish action with a live autosave form, ensure the action does not unmount or re-key the form subtree. Recurs whenever auth/security controls share a page with editable settings.

## Tailwind

### Tailwind v4: use @container queries for components in fixed-width side panels, not viewport md:
A shared component (e.g. dook's ChatActivity) rendered inside a narrow fixed-width side panel must NOT use viewport breakpoints (md:flex-row) for its internal layout — on a wide viewport the md: variant fires even though the PANEL is only ~350px, overflowing/wrapping content. Fix: put '@container' on the component's outer wrapper and use container-query variants (@md:flex-row, @md:w-[220px], @md:block/@md:hidden). @md defaults to 28rem/448px, measured against the container's inline-size, so a 347px panel stays stacked while a wide chat column rows out. Tailwind v4 ships container queries with no plugin.

## Browse

### browse: synthetic .click() does not switch draggable (cursor-grab) tabs
When browse-dogfooding a UI whose tabs/buttons are drag-enabled (e.g. SheetTabBar buttons with cursor-grab for reorder), a JS 'el.click()' or a single MouseEvent does NOT trigger the React onClick — the pointer/drag handlers swallow it, so the tab never switches and you wrongly conclude the view is unchanged. Dispatch the full sequence on the exact button element: pointerdown, mousedown, pointerup, mouseup, click (all bubbles:true). Verify the switch actually happened by checking a downstream change (grid content / active-tab class), not just absence of error. This silently invalidated an earlier 'robust across sheet switches' probe.

## Node

### Stale server on a fixed port silently serves old code during integration tests
A backgrounded 'tsx server/index.ts' that fails to bind (EADDRINUSE) exits silently while an older server keeps the port. Integration probes then hit STALE code and you chase phantom bugs (saw a THB report render 'Amount (VND)' that was actually correct in current code). Before integration testing always: lsof -nP -iTCP:PORT -sTCP:LISTEN -t | xargs kill -9, then start one fresh server and confirm via the startup log line, not just /api/health.

## Vite

### Verify zustand-store UI on a production preview, not the HMR dev server
When you edit a zustand store module (and its subscribers) many times in one session, Vite HMR can fragment the store into two live instances: a subscription closure writes events into instance A while the rendered component reads instance B. Symptom: appendEvent/set is provably called (logs fire) but the UI stays frozen and state never advances — looks like a broken subscription or stale closure. It is neither. Confirm by serving the production build (npx vite preview) on a fresh port: the bug vanishes. Don't burn time debugging the dev server after heavy store edits — hard-reload or preview first. Also: React StrictMode double-invokes effects, so an open()-on-mount that mutates shared state (e.g. card.sessionId) runs twice; make such effects idempotent and backfill the feed on every (re)subscribe so a push missed during the teardown gap self-heals.
