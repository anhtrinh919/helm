# The Executive Dashboard Requirements

---
phase: 1
type: initial
ui: true
---

## Phase type

**`initial`** — first build of a new product area. No existing UI patterns to honor. Greenfield behavior.

## Scope

Phase 1 delivers a working Helm desktop application. The entry is a single sentence — "What do you want to build?" — that leads through an agent conversation, an approved plan, and into a build-spine board. The board is an ordered, dependency-aware sequence of items — not a kanban — with states Planned, Up next, Building (spotlight), Needs you, Failed/off-track, and Done. Each in-flight item opens into its own scoped conversation where the user can watch the agent work and steer mid-build. When the agent needs a genuine decision, "Needs you" rises to the top of the board. When an item finishes, the user sees a reviewable checkpoint ("here's what I built — does this look right?"). Sessions are durable background processes: they survive project-switch, window-refresh, and app quit/relaunch; background work stays visible in the rail. The engine is wired live to the Claude Agent SDK on the user's own Claude subscription. Later-phase areas are visible but unlock progressively — never shown as dead/locked UI. On completion, a non-developer can start a project, drive a build, steer it mid-flight, answer decision prompts, review real results, and see the board reflect real progress — all without opening a terminal or reading code.

## User Stories

1. As a builder, I can see my projects in a simple list and open any one — and see each project's live background status while I'm looking elsewhere — so I can pick what to work on and stay oriented.
   [Steer the build (core loop), Step 1]

2. As a builder, I can start a new project by describing my idea in a single sentence and going through a thorough back-and-forth scoping conversation — rendered as clickable decision cards with a text box where a choice needs my own words — so the resulting plan reflects what I actually want.
   [Start a project, Steps 1–2]

3. As a builder, I can review and edit the proposed plan and must approve it before any building starts, so I stay in control.
   [Start a project, Step 3]

4. As a builder, I can see my project as an ordered build-spine — items in states Planned / Up next / Building (spotlight, one at a time in Phase 1) / Needs you / Failed/off-track / Done — at a glance, so I always know where the project is without keeping notes elsewhere.
   [Steer the build (core loop), Step 1]

5. As a builder, the board is auto-seeded as a build-spine from the approved plan AND I can add my own items anytime, so the board reflects both the build and my own asks.
   [Steer the build (core loop), Step 1]

6. As a builder, I can open any in-flight item into its own scoped session and watch the agent work in a plain-English live feed (friendly narration + readable activity labels, never raw terminal or code), so I can follow what's happening.
   [Steer the build (core loop), Steps 1–2]

7. As a builder, the build pauses and surfaces a structured decision card (buttons, plus a text box where needed) only for genuine decisions; obvious/routine choices are handled quietly without interrupting me, so I'm interrupted only when it matters.
   [Steer the build (core loop), Step 3]

8. As a builder, when I answer a decision the session resumes and the board updates, so I see my input take effect.
   [Steer the build (core loop), Steps 3–4]

9. As a builder, I see the later-phase areas (Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View) as tabs that unlock with each phase — never as greyed-out dead/locked icons — so I can see where the product is going without them functioning yet.
   [Steer the build (core loop), Step 2]

10. As a builder, my projects, boards, and in-progress sessions persist when I close and reopen Helm — including sessions that were running in the background — so I never lose my work or my place.
    [Steer the build (core loop), Step 1]

11. As a builder, the entry to a new project is a single plain-language prompt — "What do you want to build?" — not a form, so starting feels immediate.
    [Start a project, Step 1]

12. As a builder, done items collapse to quiet history so the board stays focused on what's active, not a wall of completed tasks.
    [Steer the build (core loop), Step 1]

13. As a builder, I can steer a running item mid-build — interrupt it, redirect it ("do it this way instead"), or ask it to look closer at something — via a steering input inside the item's scoped session, so I'm not locked out once a session starts.
    [Steer the build (core loop), Step 3]

14. As a builder, when the agent is blocked on a genuine decision, "Needs you" is the most prominent element on screen — not a badge or a buried card — and I can answer directly from the board without opening the item, so I never miss a blocked build.
    [Steer the build (core loop), Step 3]

15. As a builder, when an item fails or goes off-track, I see a plain-English description of what went wrong and a clear next action ("Try again" or "Tell me more"), so I'm never left staring at a silent error.
    [Steer the build (core loop), Step 3]

16. As a builder, when an item finishes, I see a reviewable checkpoint — a screenshot or click-through of what was actually built — with a "Looks good, continue" or "Something's off" choice, so I judge real results, not percentages.
    [Steer the build (core loop), Step 4]

17. As a builder, agent questions for any item form a visible queue with state (pending / answered), and I can re-open an already-answered question, so decisions are not immutable.
    [Steer the build (core loop), Step 3]

## UI Requirements

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Front-door / Project Switcher | First run (no projects) | Single large plain-language prompt "What do you want to build?", confetti accent, no other chrome | Type idea and submit |
| Project Switcher | Populated | Scrollable project list (name + last-opened + live background status), "New build" button, active highlight | Click project to open its board; click "New build" |
| New Project Wizard | Sentence entry | Large text prompt ("What do you want to build?"), submit button, minimal chrome | Type sentence and submit |
| New Project Wizard | Scoping Q&A | Sequential decision cards; each shows agent question; response options as click buttons; free-text box where needed; "Step N of M" progress label; no Back button | Click button or type answer; each answer submits and next card appears |
| New Project Wizard | Plan review | Rendered plan as editable blocks (plain language, no code); "Approve plan" CTA; "Back to questions" secondary | Edit plan text; click Approve |
| New Project Wizard | Approving | Spinner overlay; "Getting your plan ready…" label | Wait |
| New Project Wizard | Error | Friendly error message ("Something went wrong — try again"); retry button | Retry or return to sentence entry |
| Build-Spine Board | Empty (new project, no items) | Board header (project name), one-line orientation sentence, empty spine, "+ Add item" button, stub tabs | Click "+ Add item" or wait for plan auto-seed |
| Build-Spine Board | Planned / Up-next | Items in Planned and Up-next states; dependency legibility (what each item depends on visible); "Step N of M: <name>" labels | Read spine; click item to open scoped session |
| Build-Spine Board | Building spotlight | One item in full spotlight (Building); remaining items condensed; no Needs-you present; live per-item status indicator | Watch board; click Building item to open scoped session |
| Build-Spine Board | Needs-you headline | "Needs you" block rises to most prominent position; full question text shown; answer buttons inline; re-open link on prior decided questions visible | Answer directly from board |
| Build-Spine Board | Failed/off-track | One item in Failed state; plain-English description of what went wrong; "Try again" or "Tell me more" CTA | Click next action |
| Build-Spine Board | Done items collapsed | Completed items in condensed quiet-history rows at bottom; active items above | Read history; start next item |
| Build-Spine Board | Stub tab active | "Unlocks in Phase N" placeholder; never locked/greyed; reads as invitation | View; no action available |
| Scoped Session | Active | Item header ("Step N of M: <name>"), streaming plain-English narration, readable activity labels ("Building the sign-in form" not "wiring sign-in form"), working indicator, steering input visible | Watch; use steering input to interrupt, redirect, or look closer |
| Scoped Session | Paused for decision | Narration paused; inline decision card; "Waiting for your call" label; question queue visible; steering input still available | Answer decision card |
| Scoped Session | Steering active | Interrupt/redirect/look-closer options visible; mid-build steering in progress | Submit steering direction |
| Scoped Session | Question queue | Queue of agent questions with state badges (pending / answered); "Re-open" link on answered questions | Re-open a decided question; answer pending questions |
| Scoped Session | Done with checkpoint | Narration ends; "Here's what I built — does this look right?" block; screenshot or visual preview; "Looks good, continue" + "Something's off" CTAs | Click Looks good or Something's off |
| Scoped Session | Error | Friendly error label ("Something went wrong building this — let's try again"); retry; back to board | Retry or return to board |
| Decision Prompt | Pending (button variant) | Card with agent's question text; 2–4 labeled buttons representing choices; optional explanatory sub-text | Click a button |
| Decision Prompt | Pending (free-text variant) | Card with question text; single text input; "Submit" button | Type answer and submit |
| Decision Prompt | Pending (plan-approval variant) | Editable plan block + "Approve" + "Edit" | Edit or approve |
| Decision Prompt | Answered (Decided) | Card with question + chosen answer shown dimmed; non-interactive; "Re-open" link | Click Re-open to reconsider |

## Data Model

```
projects
- id:          TEXT PRIMARY KEY  — UUID
- name:        TEXT NOT NULL     — project display name
- created_at:  INTEGER NOT NULL  — Unix epoch ms
- updated_at:  INTEGER NOT NULL  — Unix epoch ms
- plan:        TEXT              — JSON-serialised plan blocks (set after wizard approval)
- status:      TEXT NOT NULL     — 'planning' | 'building' | 'done'
```

```
cards
- id:             TEXT PRIMARY KEY  — UUID
- project_id:     TEXT NOT NULL     — FK → projects.id
- type:           TEXT NOT NULL     — 'feature' | 'bug' | 'decision'
- title:          TEXT NOT NULL     — plain-language display title (no jargon, no IDs)
- status:         TEXT NOT NULL     — 'planned' | 'up_next' | 'building' | 'needs_you' | 'failed' | 'done'
- source:         TEXT NOT NULL     — 'plan_seed' | 'user_added' | 'agent_raised'
- position:       INTEGER NOT NULL  — sort order within the build-spine
- step_label:     TEXT              — plain-language label e.g. "Step 2 of 8: Build sign-in form"
- depends_on:     TEXT              — JSON array of card IDs this item depends on (nullable)
- created_at:     INTEGER NOT NULL  — Unix epoch ms
- updated_at:     INTEGER NOT NULL  — Unix epoch ms
- session_id:     TEXT              — FK → sessions.id (null if not yet worked on)
- decision_prompt: TEXT             — JSON: { type: 'buttons'|'freetext'|'plan_approval', question, options?, answer? }
- checkpoint:     TEXT              — JSON: { screenshotPath?: string, status: 'pending'|'approved'|'flagged', flagNote?: string }
```

```
sessions
- id:           TEXT PRIMARY KEY  — UUID
- project_id:   TEXT NOT NULL     — FK → projects.id
- card_id:      TEXT              — FK → cards.id (null for wizard scoping session)
- name:         TEXT NOT NULL     — display name (plain-language item title or "Scoping: <project>")
- status:       TEXT NOT NULL     — 'active' | 'paused_for_decision' | 'done' | 'error' | 'failed'
- started_at:   INTEGER NOT NULL  — Unix epoch ms
- ended_at:     INTEGER           — null while active
- resumed_at:   INTEGER           — Unix epoch ms of most recent resume after app relaunch (null if never relaunched)
```

```
feed_events
- id:           TEXT PRIMARY KEY  — UUID
- session_id:   TEXT NOT NULL     — FK → sessions.id
- kind:         TEXT NOT NULL     — 'narration' | 'activity' | 'decision_prompt' | 'steering' | 'checkpoint' | 'summary' | 'error'
- text:         TEXT NOT NULL     — plain-English display text (never raw agent output)
- raw_payload:  TEXT              — JSON of original SDK event (stored for debugging; never shown to user)
- created_at:   INTEGER NOT NULL  — Unix epoch ms
```

```
question_queue
- id:           TEXT PRIMARY KEY  — UUID
- session_id:   TEXT NOT NULL     — FK → sessions.id
- prompt:       TEXT NOT NULL     — JSON DecisionPrompt
- status:       TEXT NOT NULL     — 'pending' | 'answered' | 'reopened'
- answer:       TEXT              — user's answer (null while pending)
- position:     INTEGER NOT NULL  — order within the session's question queue
- created_at:   INTEGER NOT NULL  — Unix epoch ms
- answered_at:  INTEGER           — null while pending
```

## API Contracts

This is an Electron app with no HTTP server. All IPC uses named channels via contextBridge. Each channel below is a typed IPC call from renderer → main (invoke/handle pattern) or a main → renderer event push.

### projects:list
- **Direction:** renderer invokes → main handles
- **Request:** `{}` (no params)
- **Success response:** `{ projects: Project[] }` — array ordered by updated_at DESC; each project includes `backgroundStatus: 'idle' | 'active' | 'needs_you' | 'failed'`
- **Error responses:**
  - `{ error: 'db_unavailable', message: string }` — SQLite not accessible

### projects:create
- **Direction:** renderer invokes → main handles
- **Request:** `{ name: string }`
- **Success response:** `{ project: Project }` — the newly created project
- **Error responses:**
  - `{ error: 'validation_failed', field: 'name', message: string }` — name empty or > 200 chars
  - `{ error: 'db_write_failed', message: string }` — write error

### projects:get
- **Direction:** renderer invokes → main handles
- **Request:** `{ projectId: string }`
- **Success response:** `{ project: Project, cards: Card[] }` — cards ordered by position ASC
- **Error responses:**
  - `{ error: 'not_found' }` — no project with that id
  - `{ error: 'db_unavailable', message: string }`

### cards:create
- **Direction:** renderer invokes → main handles
- **Request:** `{ projectId: string, type: 'feature' | 'bug', title: string }`
- **Success response:** `{ card: Card }` — new card with status='planned', source='user_added'
- **Error responses:**
  - `{ error: 'not_found' }` — project not found
  - `{ error: 'validation_failed', field: string, message: string }` — title empty or > 300 chars; type invalid
  - `{ error: 'db_write_failed', message: string }`

### cards:update-status
- **Direction:** renderer invokes → main handles
- **Request:** `{ cardId: string, status: string }`
- **Success response:** `{ card: Card }` — updated card
- **Error responses:**
  - `{ error: 'not_found' }` — card not found
  - `{ error: 'invalid_transition', from: string, to: string }` — status machine violation
  - `{ error: 'db_write_failed', message: string }`

### cards:approve-checkpoint
- **Direction:** renderer invokes → main handles
- **Request:** `{ cardId: string, verdict: 'approved' | 'flagged', flagNote?: string }`
- **Success response:** `{ card: Card }` — card checkpoint updated; if approved, triggers next item to become 'up_next'
- **Error responses:**
  - `{ error: 'not_found' }` — card not found
  - `{ error: 'no_checkpoint' }` — card has no pending checkpoint
  - `{ error: 'db_write_failed', message: string }`

### sessions:start
- **Direction:** renderer invokes → main handles (starts Claude Agent SDK session)
- **Request:** `{ projectId: string, cardId: string }`
- **Success response:** `{ session: Session }` — session created with status='active'; SDK session started
- **Error responses:**
  - `{ error: 'not_found' }` — project or card not found
  - `{ error: 'session_already_active', sessionId: string }` — card already has a running session
  - `{ error: 'sdk_init_failed', message: string }` — Claude Agent SDK failed to start
  - `{ error: 'db_write_failed', message: string }`

### sessions:answer-decision
- **Direction:** renderer invokes → main handles
- **Request:** `{ sessionId: string, questionId: string, answer: string }`
- **Success response:** `{ session: Session, question: QuestionQueueItem }` — session status changed back to 'active'; question status changed to 'answered'
- **Error responses:**
  - `{ error: 'not_found' }` — session or question not found
  - `{ error: 'not_awaiting_decision' }` — session status is not 'paused_for_decision'
  - `{ error: 'db_write_failed', message: string }`

### sessions:reopen-question
- **Direction:** renderer invokes → main handles
- **Request:** `{ sessionId: string, questionId: string }`
- **Success response:** `{ question: QuestionQueueItem }` — question status set to 'reopened'; session notified
- **Error responses:**
  - `{ error: 'not_found' }` — session or question not found
  - `{ error: 'cannot_reopen' }` — question is pending (not yet answered)
  - `{ error: 'db_write_failed', message: string }`

### sessions:steer
- **Direction:** renderer invokes → main handles
- **Request:** `{ sessionId: string, mode: 'interrupt' | 'redirect' | 'look_closer', text: string }`
- **Success response:** `{ session: Session }` — steering input forwarded to running SDK session; feed event emitted
- **Error responses:**
  - `{ error: 'not_found' }` — session not found
  - `{ error: 'session_not_active' }` — session is not in 'active' state
  - `{ error: 'db_write_failed', message: string }`

### sessions:get-feed
- **Direction:** renderer invokes → main handles
- **Request:** `{ sessionId: string, afterId?: string }` — afterId for pagination
- **Success response:** `{ events: FeedEvent[], questions: QuestionQueueItem[] }` — events ordered by created_at ASC; questions ordered by position ASC
- **Error responses:**
  - `{ error: 'not_found' }` — session not found

### wizard:start-scoping
- **Direction:** renderer invokes → main handles
- **Request:** `{ projectId: string, ideaText: string }`
- **Success response:** `{ session: Session, firstQuestion: DecisionPrompt }` — scoping session created; first question ready
- **Error responses:**
  - `{ error: 'validation_failed', field: 'ideaText', message: string }` — empty or > 5000 chars
  - `{ error: 'sdk_init_failed', message: string }`
  - `{ error: 'db_write_failed', message: string }`

### wizard:answer-question
- **Direction:** renderer invokes → main handles
- **Request:** `{ sessionId: string, answer: string }`
- **Success response (next question):** `{ type: 'question', question: DecisionPrompt }`
- **Success response (plan ready):** `{ type: 'plan_ready', plan: PlanBlock[] }`
- **Error responses:**
  - `{ error: 'not_found' }` — session not found
  - `{ error: 'session_not_in_scoping' }` — session is not a wizard scoping session
  - `{ error: 'sdk_error', message: string }` — agent failed to produce next question or plan

### wizard:approve-plan
- **Direction:** renderer invokes → main handles
- **Request:** `{ projectId: string, sessionId: string, editedPlan: PlanBlock[] }`
- **Success response:** `{ project: Project, cards: Card[] }` — project.plan set; board cards auto-seeded from plan as build-spine; project status → 'building'
- **Error responses:**
  - `{ error: 'not_found' }` — project or session not found
  - `{ error: 'validation_failed', message: string }` — empty plan
  - `{ error: 'db_write_failed', message: string }`

### feed:event (push — main → renderer)
- **Direction:** main pushes to renderer (webContents.send)
- **Payload:** `{ sessionId: string, event: FeedEvent }` — one event per emission
- **Renderer action:** append event to session feed store; if event.kind === 'decision_prompt', update session status to 'paused_for_decision' and surface decision card; if event.kind === 'checkpoint', surface reviewable-result checkpoint block

### board:update (push — main → renderer)
- **Direction:** main pushes to renderer after any card status change
- **Payload:** `{ projectId: string, cardId: string, card: Card }` — updated card
- **Renderer action:** update card in board store; re-render the affected spine position; if card.status === 'needs_you', trigger Needs-you headline promotion

### project:background-status (push — main → renderer)
- **Direction:** main pushes to renderer when a background session's status changes for a project that is NOT the currently-viewed project
- **Payload:** `{ projectId: string, backgroundStatus: 'idle' | 'active' | 'needs_you' | 'failed' }` — updated background status
- **Renderer action:** update project row in the project switcher / rail without leaving the current view

## Constraints & Business Rules

- **Build-spine, not kanban.** Cards are ordered sequentially by `position` and carry `status` from the set `planned | up_next | building | needs_you | failed | done`. There are no free-form "columns." Dependency legibility: each card may declare `depends_on` (a list of card IDs it requires to be done first); the UI renders this dependency visibly on the card row.
- **One Building spotlight at a time (Phase 1).** Only one card may be in `building` status simultaneously. The next card automatically becomes `up_next` when the spotlight card reaches `done` or `failed`.
- **Needs-you promotion.** When any card transitions to `needs_you`, the board view promotes the Needs-you block to the most visually prominent position. The full question text and answer buttons are shown inline — the user does not have to open the item to answer.
- **Decisions are re-openable.** A `QuestionQueueItem` in `answered` state can be set to `reopened` via `sessions:reopen-question`. The session notifies the agent; the agent may continue or request clarification. Re-opening is never destructive.
- **Reviewable-result checkpoint.** When a session reaches `done`, the main process generates a checkpoint event (screenshot or structured visual summary). The card's `checkpoint.status` is set to `pending`. The user must respond (`approved` or `flagged`) before the next spine item becomes `up_next`. If `flagged`, the user's `flagNote` is forwarded to the session as a steering input and the card returns to `building`.
- **Durable background sessions.** Sessions run as background processes managed by the main process. A session that is `active` when the app quits is persisted with status `active` and `resumed_at` set on next launch. The renderer subscribes to the session's feed on open — it does not initiate the session. Background work (any project not currently viewed) remains visible in the project rail via `project:background-status` pushes.
- **Plain language everywhere (hard gate).** All user-facing text must pass these rules: (1) No internal IDs or codes visible (no "CFP-08", no card UUIDs, no raw model names). (2) Phase/step labels use the format "Step N of M: <plain-name>" — never "Phase 1/4". (3) Agent model name is never shown. (4) Activity labels are natural English ("Building the sign-in form") — no jargon ("wiring sign-in form") or raw tool-call names ("tool_use: write_file"). (5) Future-phase tabs say "Unlocks in Phase N" — not "Coming soon" and not locked/greyed.
- **No raw agent output ever crosses the IPC boundary.** All SDK events are transformed in the main process before any event reaches the renderer. The renderer never sees code, file paths, git output, branch names, diffs, or terminal text. This is a hard gate, not a best-effort filter.
- **The Claude Agent SDK requires `options.pathToClaudeCodeExecutable`** on every call site — resolved via `execSync('which claude')` on init. A missing path guard silently fails. Every session start call must include this guard independently.
- **Persistence is SQLite via better-sqlite3.** DB file at `app.getPath('userData')/helm.db`. Migrations run on app launch before any IPC handler is registered.
- **Smart-pausing logic.** The main process decides whether an agent question is a genuine decision or a routine choice. Genuine decisions have branching product impact (architecture choice, feature toggle, design direction, user-facing wording). Routine choices (file naming, standard library micro-choices within the approved stack) are auto-answered silently and logged as `activity` feed events. The bar is "would a non-developer care?" If no, auto-answer.
- **Scoped named sessions.** Each card runs as its own SDK session with a scoped system prompt that includes only that card's context. No shared state between sessions. The wizard scoping session is a separate session type.
- **Board auto-seeding.** When `wizard:approve-plan` runs, it parses `PlanBlock[]` and creates one `feature` card per top-level item, status=`planned`, source=`plan_seed`, positioned in insertion order, with `step_label` generated as "Step N of M: <item title>".
- **IPC messages are validated with Zod on both sides of the boundary.** Renderer schemas in `src/renderer/ipc-types.ts`, main schemas in `src/main/ipc-handlers.ts`.
- **Strict TypeScript (`"strict": true`); all npm deps pinned exactly (no `^` or `~`).**
- **Tone of the feed.** Plain English, first-person narration from the agent's perspective ("I'm reading the project structure", "I just finished building the route"). Never "Executing tool: read_file". Never code snippets.
- **Phase 1 is macOS only.** No Windows/Linux compatibility work required.

## Excluded from This Phase

- Live Preview (embedded running app) — Phase 2
- Point-and-Fix Overlay — Phase 3
- Decisions Log, Progress Timeline, Docs View (functional) — Phase 4
- Parallel sessions (multiple sessions running simultaneously) — Phase 4
- Electron auto-update / .dmg packaging / distribution — post-Phase 1
- Any git, branch, PR, or diff surface — globally excluded
- Windows or Linux builds — globally excluded
- Multi-user or team features — globally excluded
- Telemetry, analytics, crash reporting — globally excluded
- Paid API or any monetization hook — globally excluded
