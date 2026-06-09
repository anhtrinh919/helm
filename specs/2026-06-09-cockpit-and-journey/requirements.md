---
phase: 1
type: initial
ui: true
---

# The Cockpit & the Journey — Requirements

## Phase type

**`initial`** — total UI redesign replacing the existing playful/maximalist visual language. Existing component structure is extended and reskinned; existing UI patterns are NOT honored where they conflict with the new visual language. The engine (sessions, agent, live preview, point-and-fix mechanism, DB, parallel sessions) is unchanged.

## Scope

Phase 1 gives Helm its new identity — a calm, modern cockpit — and ships in two dogfoodable chunks. Chunk 1 delivers: a redesigned two-door front door ("Build something new" / "Iterate on an app"), the full guided Build Journey (ordered milestones with step-N-of-M progress, per-step hard-stop checkpoints, mid-journey request triage with a visible For-Later shelf, an escape hatch to freeform, and a journey-complete celebration that collapses to a strip and opens free iteration), and a persistent "Running on your Claude subscription" reassurance. Chunk 2 delivers: the redesigned Cockpit Board where every card always shows its plain-language outcome, point-and-fix extended with inline text editing in the live app, project management UI (rename, delete, reorder), a truthful Live status with a working stop control, and a reskin of all remaining screens. On completion, a non-developer can open Helm, pick a door, move through a guided journey toward a working app with testable checkpoints, and always see — in plain language — what each card is for, what the live app is doing, and whether it matches what they asked. The guided journey mirrors the real build-stack practice Helm itself is built with (pressure-test the idea → scope → plan → build the look → build the function → review & try it), translated into plain non-technical steps.

## User Stories

**Chunk 1**

- As a non-developer, I can open Helm and see two distinct doors — "Build something new" and "Iterate on an app" — so that I know immediately which path is right for me. [Chunk 1] [Build something new, step 1]
- As a non-developer, I can pick "Build something new", describe my goal, answer Helm's scoping questions, and approve a plan, so that Helm understands what I want before it builds anything. [Chunk 1] [Build something new, step 2]
- As a non-developer, I can see my build goal broken into an ordered list of milestones with a "Step N of M" counter, so that I know how much is left and where I am at all times. [Chunk 1] [Build something new, step 3]
- As a non-developer, I can hit a hard-stop checkpoint after each milestone — test what was built, report anything off, and explicitly press "Continue" — so that I'm never rushed past something I haven't seen working. [Chunk 1] [Build something new, step 3]
- As a non-developer, I can make a mid-journey request that Helm triages: small fixes happen immediately, and large or unrelated requests are parked on a visible For-Later shelf, so that nothing derails the journey and nothing is lost. [Chunk 1] [Build something new, step 4; Steer the build]
- As a non-developer, I can open the For-Later shelf at any time and see every parked request, so that I know nothing I asked for has been discarded. [Chunk 1] [Build something new, step 4]
- As a non-developer, I can use an escape hatch during the journey to leave the rail and enter the freeform board at any time, so that I'm not locked into guided mode if my needs change. [Chunk 1] [Build something new, step 5]
- As a non-developer, I can see a journey-complete celebration when the last step passes its checkpoint, so that I know my goal has been met before free iteration opens. [Chunk 1] [Build something new, step 5]
- As a non-developer, I can see a persistent, calm "Running on your Claude subscription" signal at all times, so that I never wonder about cost or model quality while building. [Chunk 1]
- As a non-developer, I can pick "Iterate on an app → start fresh" and have my first request scaffold the app and build the first feature in one step, so that I go from zero to a running app without a wizard. [Chunk 1] [Iterate — from scratch, step 1]
- As a non-developer, I can see the "Bring an existing app" door clearly at the front door (in a "coming soon" state), so that I know the import path exists even though it isn't active yet. [Chunk 1] [Iterate — import, door visible]

**Chunk 2**

- As a non-developer, I can see, on every cockpit card, a plain-language description of what that card is for (the outcome it delivers), so that I can always answer "did it build what I asked?" without opening the card. [Chunk 2] [Steer the build]
- As a non-developer, I can click any text element in the live app and edit its text in place — directly in the preview — so that I correct copy by pointing at it, not by describing it. [Chunk 2] [Fix something, step 2]
- As a non-developer, I can click any element in the live app and describe a fix, so that a focused session repairs exactly that element with full visual context. [Chunk 2] [Fix something, step 2–3]
- As a non-developer, I can rename any project from the project list, so that my projects are organized by names I chose. [Chunk 2] [Steer the build — project management]
- As a non-developer, I can delete a project and have Helm ask me to confirm before removing it, so that I don't lose work accidentally. [Chunk 2] [Steer the build — project management]
- As a non-developer, I can reorder projects in the project list, so that my most important work is always at the top. [Chunk 2] [Steer the build — project management]
- As a non-developer, I can see a truthful "Live" status on any project running a dev server, and stop it with a single control, so that I know exactly what is running on my machine. [Chunk 2] [Steer the build — project management]

## UI Requirements

Behavior and key elements only — no visual treatment (colors, pixels, fonts, spacing come from the design file).

### Front Door

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Front Door | Default | Two door choices: "Build something new" and "Iterate on an app" (with sub-options "Start fresh" and "Bring an existing app → coming soon"); "Running on your Claude subscription" signal | Pick a door |
| Front Door | "Bring an existing app" sub-option | Import sub-option shows a "coming soon" label and is non-interactive | — |
| Front Door | No projects yet | Two doors are the hero content; project list omitted/empty | Pick a door |
| Front Door | Projects exist | Project list available for quick re-entry; each shows name, mode (Build/Iterate), Live status | Re-enter a project |

### New Project Wizard (reskin of existing WizardScreen / ScopingQA / PlanReview)

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Wizard — Idea Input | Default | Single focused input: describe your goal; Claude-subscription signal | Submit goal |
| Wizard — Scoping Q&A | Loading | Progress indicator while Helm processes the goal | Wait |
| Wizard — Scoping Q&A | Questions ready | One question at a time; "Question N of M"; back control | Answer |
| Wizard — Plan Review | Default | Ordered list of planned milestones (each with its plain-language purpose); approve / revise | Approve plan |
| Wizard — Plan Review | Revising | Input to describe changes; re-generates plan | Submit revision |
| Wizard | Error | Plain-language error ("Helm couldn't reach Claude — check your subscription"); retry | Retry |

### Build Journey (NET-NEW progress visualization)

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Build Journey | Active — step in progress | "Step N of M" counter; current milestone title + plain-language outcome; prior/current/locked step states; For-Later shelf access (count badge); escape hatch ("Leave the journey") | Watch / steer |
| Build Journey | Mid-journey request (small fix) | Inline "Fixing now"; no shelf interaction | Wait |
| Build Journey | Mid-journey request (large/unrelated) | Inline "Parked on your For-Later shelf"; shelf count increments | — |
| Build Journey | Hard-stop checkpoint | What was just built (plain language); "test it in the preview" prompt; optional feedback input; "Looks good — continue" button | Test then continue |
| Build Journey | Checkpoint — feedback submitted | Confirmation feedback is recorded; build continues; milestone marked done | — |
| Build Journey | Step failed mid-step | Plain-language error for the failed step; "Retry this step" + escape-hatch actions; no auto-advance | Retry or leave |
| Build Journey | Checkpoint — next step won't start | "Helm couldn't start the next step — retry"; railStep not advanced | Retry |
| Build Journey | Journey complete — celebration | "Your app now does what you set out to build"; celebration motion; single continue CTA | Continue |
| Build Journey | Journey complete — collapsed strip | Journey strip pinned at top of board: goal title + "Completed"; tappable to expand history | — |
| Build Journey | Escape hatch used | Confirmation: "Leave the guided journey? Your For-Later shelf carries over." confirm/cancel | Confirm or cancel |
| Build Journey | Empty / 0 steps (degenerate) | Error: "Helm couldn't plan the journey — describe your goal again"; retry | Retry |

### For-Later Shelf

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| For-Later Shelf | Items present | Panel listing parked requests in order added; each: request text, date parked; promote-to-board action; dismiss action | Promote or dismiss |
| For-Later Shelf | Empty | "Nothing parked — mid-journey requests that are too big or off-track will appear here" | — |
| For-Later Shelf | Item promoted | Item leaves shelf; board card created; count badge decrements | — |
| For-Later Shelf | Item dismissed | Item leaves shelf; no board card created | — |

### Cockpit Board (reskin + NET-NEW outcome-on-card)

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Cockpit Board | Default (Build mode) | Collapsed journey strip at top; card spine; each card: title, status, **outcome** (plain-language what-it's-for), step label; Live Preview alongside; Needs-You headline if blocking; Claude-subscription signal | Click card / preview |
| Cockpit Board | Default (Iterate mode) | No journey strip; card spine with outcome on every card; Live Preview; add-card action | Click card / add item |
| Cockpit Board | Building | In-flight card highlighted (status "Building"); others normal | Watch / steer |
| Cockpit Board | Needs-you | "Needs you" headline pinned with one-line question + inline answer | Answer inline |
| Cockpit Board | Empty (no cards) | "Your build plan will appear here" / (Iterate) "Add your first feature to get started" | Add first item |
| Cockpit Board | Card failed | Card status "Failed" + plain-language error; retry on card | Retry |
| Cockpit Board | Preview unavailable | Preview shows last-good URL dimmed with "Building…" / "Not running" | — |

### Scoped Session (reskin only)

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Scoped Session | Active | Card name header; plain-English feed; steering input; question queue (pending/answered); Claude-subscription signal | Steer / answer |
| Scoped Session | Waiting on decision | Decision card pinned above feed; answer options | Answer |
| Scoped Session | Stopped | Feed ends with "Stopped"; restart / back | Restart or back |
| Scoped Session | Error | Feed ends with plain-language error; retry | Retry |

### Live Preview Chrome (reskin only)

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Live Preview | Live | Running app in webview/iframe; point-and-fix entry control; app title/URL | Click element to fix |
| Live Preview | Building | Last-good URL dimmed; "Building…" | Wait |
| Live Preview | No app yet | "Your app will appear here once the first step builds something" | — |
| Live Preview | Snag / blocked | "Helm hit a snag" + plain-language description (display-only; no auto-fix this phase) | Wait |

### Point-and-Fix Overlay (extend existing — add inline text edit)

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Point-and-Fix | Idle | Subtle entry affordance on the preview | Click element |
| Point-and-Fix | Element selected (text-bearing) | Selection highlight; two options: "Describe a fix" and "Edit text here" | Choose fix type |
| Point-and-Fix | Element selected (non-text) | Selection highlight; only "Describe a fix" | Describe a fix |
| Point-and-Fix — Describe fix | Comment box open | Screenshot crop of selected element; "What should change?" input; submit; cancel | Submit fix |
| Point-and-Fix — Inline text edit | Edit mode | Element text becomes editable in-place in the preview, pre-filled with current text; submit/cancel | Edit text and submit |
| Point-and-Fix | Fix submitted | Overlay closes; fix session spawns; board card appears/updates | Watch board |
| Point-and-Fix | Inline edit submitted | Edit registers; fix session spawns with element selector + old/new text | Watch board |
| Point-and-Fix | Inline edit unchanged | "No change" message; no session spawned | — |

### Project Management (NET-NEW UI — existing + new IPC)

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Project List / Switcher | Default | Project rows: name, mode badge, Live status; reorder affordance; overflow menu (rename, delete) | Click / reorder |
| Project List | Rename in progress | Name becomes inline input; confirm on enter/blur; cancel on escape | Type and confirm |
| Project List | Delete confirmation | Modal: "Delete [name]? This can't be undone." confirm/cancel | Confirm or cancel |
| Project List | No projects | "No projects yet — pick a door to build your first app" | Pick a door |
| Project List | Live project | Live status indicator active; "Stop" control visible | Stop server |

### "Running on your Claude Subscription" Signal

Persistent, calm, non-intrusive — appears in front door, wizard, journey view, cockpit board, scoped session. One consistent treatment: a small badge or line of text, never a modal, nag, or dismissable toast. Placed where competitors put a token meter or upgrade prompt.

### Import Door — Coming Soon

Visible as a sub-option of "Iterate on an app". Clear "coming soon" state: label + brief note ("Import from Lovable, Bolt, or Replit — coming in a future update"), non-interactive. No import flow UI beyond this door.

## Data Model

Delta on the existing schema — new fields only. All other tables (cards, sessions, shelf_items, projects with mode/railStep/railComplete, wizard state, fix_comments) are unchanged.

**Migration 6** bumps `PRAGMA user_version` from 5 to 6 (idempotent) and applies:

```
cards table — new column
- outcome: TEXT (nullable) — plain-language description of what this card is for / the outcome
  it delivers; shown on every card face. NULL when not set (design owns the empty-state). Sourced
  from the wizard plan's per-step detail; editable later via cards:set-outcome.

projects table — new column
- position: INTEGER (nullable, backfilled on migration to rowid) — sort order for the project list;
  reorder rewrites the full sequence. listProjects orders by position then existing tiebreakers.
```

No new tables. Existing `shelf_items`, `fix_comments`, mode/rail fields are reused as-is.

## API Contracts (the `helm` bridge)

Operations on the local `helm` API served by the core on `127.0.0.1` — request/response over **HTTP**, server→client pushes (e.g. `shelf:updated`, `point:captured`, feed events) over **WebSocket**. Every message is Zod-validated at the boundary. These keep the same logical names and request/response shapes the app already uses; only the transport moved from Electron IPC to HTTP/WebSocket (see tech-stack.md — hybrid runtime). The UI reaches the core only through this bridge, identically whether it runs in a browser or the Electron shell. "Channel" below means a `helm` operation/message name. Reuse existing operations where noted.

### Reused without change
- `projects:rename`, `projects:delete`, `projects:set-mode`, `projects:set-rail-step`
- `shelf:list`, `shelf:add`
- `sessions:stop`
- `wizard:save-state`, `wizard:get-state`
- `points:register`, `points:list`, `points:activate`, `points:deactivate`, `fix-sessions:start`
- `import:scan`, `import:start` — NOT exposed to the renderer this phase (import door is coming-soon only)

### CHANGED: `shelf:promote`
Promote a parked item into a board card (already exists; this phase documents its full contract and sets the card outcome).
- Direction: renderer → main
- Request: `{ itemId: string }`
- Success: `{ ok: true; card: <card> }` — atomically creates a board card **on the shelf item's own project** and deletes the shelf row; the new card's `title` and `outcome` are both set from the parked request text (so promoted cards satisfy "outcome on every card"); pushes `shelf:updated`. The card is appended to the board card spine (status `up_next`); in journey/build mode it appears on the board, not the rail.
- Errors: item not found → `{ ok: false; error: 'not_found' }`; board card creation failure → `{ ok: false; error: 'card_create_failed' }`; DB failure → `{ ok: false; error: 'db_error' }`. (Shelf items are project-scoped and cascade-delete with their project, so cross-project "stale context" cannot occur.)

### NEW: `cards:set-outcome`
- Direction: renderer → main
- Request: `{ cardId: string; outcome: string }`
- Success: `{ ok: true }`
- Errors: card not found → `{ ok: false; error: 'card_not_found' }`; empty/whitespace-only or over-500-char outcome → `{ ok: false; error: 'invalid_input' }`; DB failure → `{ ok: false; error: 'db_error' }`
- Note: the card outcome is normally populated at plan-approval time by `seedCardsFromPlan` (from each milestone's plan detail); `cards:set-outcome` is only for later edits, never the primary write path.

### CHANGED: card read responses include `outcome`
Every card object returned by the board/card read channels gains `outcome: string | null`. This is a contract change — all card-rendering consumers are updated.

### NEW: `projects:reorder`
- Direction: renderer → main
- Request: `{ orderedIds: string[] }` — full ordered array of ALL project IDs; main assigns `position = index` in one transaction
- Success: `{ ok: true }`
- Errors: unknown ID → `{ ok: false; error: 'unknown_project'; id: string }`; not all projects present → `{ ok: false; error: 'incomplete_list' }`; DB failure → `{ ok: false; error: 'db_error' }`

### NEW: `shelf:remove`
- Direction: renderer → main
- Request: `{ itemId: string }`
- Success: `{ ok: true }` (pushes `shelf:updated`)
- Errors: item not found → `{ ok: false; error: 'not_found' }`; DB failure → `{ ok: false; error: 'db_error' }`

### NEW: inline text edit (extends point-capture; reuses fix-sessions)
- `points:text-edit-activate` — `{ projectId: string }` → `{ ok: true }` (installs the in-place edit capture in the live app). Error: preview not live (webview not loaded / dev server not running) → `{ ok: false; error: 'webview_not_ready' }`; the UI must disable the "Edit text here" path whenever the preview state is not `live`.
- `points:text-edit-deactivate` — `{ projectId: string }` → `{ ok: true }`
- `points:register-text-edit` — `{ projectId: string; selector: string; oldText: string; newText: string }` → `{ ok: true; card: <fix_comment card> }`. Atomically: creates a selector-anchored fix_comment whose note is a generated "change the text on this element from «oldText» to «newText»" instruction, then spawns the fix via the existing `fix-sessions:start`. If the session spawn fails, the just-created fix_comment card is deleted (no orphan) and `session_error` is returned.
  - Errors: `newText === oldText` → `{ ok: false; error: 'no_change' }`; missing selector/newText → `{ ok: false; error: 'invalid_input' }`; session spawn failure (card rolled back) → `{ ok: false; error: 'session_error' }`

### Reused-channel contracts & journey wiring

The journey/cockpit UI observes and drives state through existing engine mechanisms — no new build-engine channels:

- **Step failure & card additions are observed, not pushed by new channels.** The journey view derives a step's failure from the active card's status becoming `failed` via the existing card-update subscription (the board already re-renders on card changes); a promoted shelf card appears on the board the same way (the renderer re-fetches/updates the board on `shelf:updated` and the existing card-update path). No `journey:step-failed` or `board:card-added` channel is added.
- **Advancing / starting the next step reuses the existing session-start path.** On the active checkpoint's `pending`→`approved` edge the journey fires `projects:set-rail-step` and the existing next-card session-start path runs (the same mechanism that starts any card's session today). If that start fails, it surfaces as the existing session `error` feed event + the card's `failed` status, which the journey renders as the "next step won't start — retry" state; retry re-invokes the same start path.
- **Reused mutating channels (`projects:set-rail-step`, `projects:set-mode`, `projects:rename`, `projects:delete`, `shelf:add`) return the bridges' existing `{ ok: true } | { ok: false; error }` shape via the shared `mapError`.** This phase does not change their request shapes; it only consumes them. The escape hatch calls `projects:set-mode('iterate')` after the user confirms the escape modal, then navigates to the board (mode flip precedes navigation).
- **Outcome is written at plan approval inside the existing `wizard:approve-plan` flow** (main-process `seedCardsFromPlan` populates each card's `outcome` from its plan detail in the same transaction that seeds the cards); `seedCardsFromPlan` is internal, not a renderer channel. `cards:set-outcome` is only for later edits.
- **Delete stop-timeout:** delete stops the dev server + any running session, waited up to a bounded timeout; if a stop hangs past the timeout, delete force-proceeds (the server process is killed) so the UI is never stuck on a disappeared row. The row is removed from the list immediately on confirm.
- **Inline-edit cleanup on reload:** a webview `did-start-loading`/`did-navigate` auto-fires `points:text-edit-deactivate` on the main side (without waiting for the renderer), so a mid-edit reload always tears down the injected editor.

## Edge Cases & State Transitions

- **Wizard counter vs. journey counter:** the Scoping Q&A "Question N of M" belongs only to the pre-journey setup interview and must be visually distinct from the journey's "Step N of M" milestone counter; the Q&A counter disappears before the journey view opens. They are different concepts and must not look like the same progress bar.
- **Journey re-entry after quit/relaunch:** durable background sessions already survive app quit/relaunch (existing engine). On relaunch, a Build-mode project re-opens to the journey view at its last committed `railStep`; if a session was mid-step it reattaches and continues (no data re-entry from the user). A `railComplete` project re-opens to the Cockpit Board with the journey collapsed to a strip.
- **railStep advance is edge-triggered:** the journey advances exactly once, on the transition of the active step's checkpoint to `approved` (the journey view fires `projects:set-rail-step` on that edge), never lazily on render — so re-renders cannot double-advance or stall.
- **Journey step fails mid-step (not at a checkpoint):** if the running session errors before reaching its checkpoint, the journey shows a failed-step state with a plain-language error and two actions: retry the step, or use the escape hatch. It does not silently advance.
- **Checkpoint → next-step spawn fails:** if "Looks good — continue" cannot start the next step (agent/Claude error), the checkpoint shows a "Helm couldn't start the next step — retry" error with a retry action; `railStep` is not advanced until the next step actually starts.
- **Escape hatch with a session running:** leaving the journey does not stop in-flight work — the running session continues and surfaces on the freeform board (parallel sessions are supported); the project's mode flips to `iterate`. The confirmation prompt states this.
- **Mid-journey triage signal:** the renderer learns a request was parked from the existing `parked` feed event (already rendered); a request the agent handles directly produces a normal in-session fix with no shelf entry. The UI surfaces the two outcomes distinctly ("Fixing now" vs "Parked on your For-Later shelf"); the classification itself is agent-side (engine, unchanged).
- **Point-and-fix double-submit:** once a fix is submitted for a selected element, the overlay shows an inline "Fix in progress" state and blocks a second submission for the same element until the fix card appears on the board.
- **Inline edit interrupted by reload:** if the live app navigates or hot-reloads (HMR) while inline edit mode is active, the injected editor is gone — the edit is cancelled and the UI shows "The app reloaded — your edit wasn't saved, try again."
- **Reorder conflict / error recovery:** on `incomplete_list` or `unknown_project`, the renderer re-fetches the authoritative project list and re-renders before allowing another reorder; a reorder is never retried against a stale list.
- **Delete while a session/dev-server runs:** delete first stops the project's dev server (existing behavior) and any running session, waits for them to stop, then deletes; the row disappears from the list immediately without a reload.
- **Live badge external exit:** if a dev server exits unexpectedly (OS kill, port conflict), the renderer receives the existing dev-server status change and the Live badge clears to reflect the true state — the badge is never stale-green.
- **Scoping "back":** within Q&A, "back" goes one question back preserving prior answers; from the first question, "back" returns to the Idea Input with a "you'll lose the generated questions — go back?" confirmation.
- **Rename blur with empty name:** confirm-on-blur saves only a non-empty, changed name; an empty or whitespace name on blur cancels and restores the original.
- **For-Later shelf size:** unbounded; the panel is a scrollable list (no cap, no pagination this phase).
- **Degenerate plan (0 steps):** the journey's "couldn't plan" retry re-invokes plan generation from the wizard's saved scoping state (not a return to a blank Idea Input).
- **"Running on your Claude subscription" is a static standing signal**, not a live connectivity indicator — it does not turn red on a transient Claude error (those surface as plain-language errors in the relevant view).

## Constraints & Context

- **Grounding principle (non-negotiable):** the guided journey's milestones, checkpoints, and decision moments mirror the real build-stack practice — pressure-test the idea → scope → plan → build the look → build the function → review & try it — in plain non-technical language. Every step name, checkpoint prompt, and triage decision traces to a real stage. "A guided build stack, not a one-shot."
- **No-code, no-terminal:** the user never sees code, file paths, diffs, branches, or terminal output. All errors are plain English.
- **Engine unchanged (logic), transport changed:** no new build *capability*. Sessions, agent, Claude Agent SDK, live preview, point-and-fix capture mechanism, parallel sessions, and the DB schema (beyond Migration 6) keep their logic. The one cross-cutting change this phase is the runtime move to the hybrid model — the `helm` bridge moves from Electron IPC to the local HTTP/WebSocket API, and the UI runs in a browser at `localhost` (Electron becomes the shipping shell only). This is plumbing under the existing single bridge seam, not new product capability.
- **Bring-your-own-Claude:** runs on the user's Claude subscription via the Claude Agent SDK — no token meter, no second subscription, always Claude.
- **TypeScript strict; deps pinned exact (no ^/~); Zod validates every `helm` message.** The UI is a web client with no direct Node/filesystem access; all privileged work is in the core, which binds to `127.0.0.1` only.
- **Design-dependent:** visual treatment comes from the design file; component structure follows the design tree; the frontend reads the design (and `handover.md` frame index) before implementing. Do not invent visual treatment from this spec. The design is transport-agnostic (same screens regardless of runtime).
- **Migration 6** is an idempotent numbered function bumping `user_version` to 6, adding the two columns only if absent.
- **Two-chunk split:** Chunk 1 (front door + wizard reskin + build journey + shelf UI + Claude signal) is independently dogfoodable before Chunk 2 (cockpit board + outcome-on-card + inline text edit + project management UI + remaining reskin).
- **Chunk 1 escape destination:** the redesigned Cockpit Board lands in Chunk 2, so an escape-hatch or celebration exit during the Chunk 1 dogfood cycle lands on the interim (pre-redesign) board. The board wears the new visual language from Chunk 2. This is the only screen not yet in the new language at Chunk 1 ship; the card's "new visual language across every screen" is fully met at phase end (Chunk 2).
- **Tailwind v4:** tokens live in the UI's `globals.css` `@theme` (no config file). New token values come from the design.
- **Dogfood surface is the real `localhost` web UI** backed by the live local core (not a stubbed mock — the browser UI now talks to the real core over the `helm` API, so it exercises real sessions/DB/preview). The packaged Electron app is the distribution form and gets a final check, but day-to-day dogfood is the localhost UI (this supersedes the earlier "Electron-only dogfood" rule, which existed because the old web build was a stub).
- **Point-and-fix preview proxy:** so click-capture and inline text edit work in a plain browser, the core serves the user's running app through its own origin (a preview proxy), making injection same-origin. In the Electron shell the existing `<webview>` path remains available; the proxy is what makes the browser surface work.

## Excluded from This Phase

- **P2 — Publishing/deploy:** no Cloudflare tunnel, no "Publish", no live URL generation.
- **P3 — Local backend:** no login provisioning, no database/storage setup for built apps, no Data Browser.
- **P4 — Proactive error recovery + version rollback:** no auto break-detection, no "Helm caught an error" prompt, no rollback UI. The `snag` preview state is display-only — no auto-fix offered.
- **P5 — Full import flow:** the import door is visible with a "coming soon" state only; no `import:scan`/`import:start` exposed to the renderer; no scanner, folder picker, or import UI.
- **Any new build-engine capability:** parallel sessions, the Claude Agent SDK, session orchestration, and the dev-server manager are not modified.
- **Project archiving / folders:** rename / delete / reorder only.
- **Card dependency visualization:** `depends_on` exists; no dependency-graph UI this phase.
- **Decisions / Progress / Docs panels:** reskin only — no new data, no new features.
