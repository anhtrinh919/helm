# The Executive Dashboard Requirements

---
phase: 1
type: initial
ui: true
---

## Phase type

**`initial`** — first build of a new product area. No existing UI patterns to honor. Greenfield behavior.

## Scope

Phase 1 delivers a working Helm desktop application: a project board where a non-developer can start a new project by describing an idea, answer a thorough back-and-forth scoping conversation rendered as decision cards, edit and approve the resulting plan, then watch the build board update in real time as an agent works — with genuine decision prompts surfacing only when a human choice is truly needed. The engine is wired live to the Claude Agent SDK on the user's own Claude subscription. Later-phase areas (Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View) are visible but stubbed. On completion a user can create a project, drive a build, answer mid-build decisions, and see the board reflect real progress — all without opening a terminal or reading code.

## User Stories

1. As a builder, I can see my projects in a simple switchable list and open any one, so I can pick what to work on.
   [Steer the build (core loop), Step 1]

2. As a builder, I can start a new project by describing my idea and going through a thorough back-and-forth scoping conversation — rendered as clickable decision cards with a text box where a choice needs my own words — so the resulting plan reflects what I actually want.
   [Start a project, Step 1–2]

3. As a builder, I can review and edit the proposed plan and must approve it before any building starts, so I stay in control.
   [Start a project, Step 3]

4. As a builder, I can see my project board — feature cards (To do / Building / Done), bug cards (Open / Fixed), and decision cards (Needs you / Decided) — at a glance, so I always know where the project is without keeping notes elsewhere.
   [Steer the build (core loop), Step 1]

5. As a builder, the board is auto-seeded as a checklist from the approved plan AND I can add my own feature or bug cards anytime, so the board reflects both the build and my own asks.
   [Steer the build (core loop), Step 1]

6. As a builder, I can open a card into a named scoped session and watch the agent work in a plain-English live feed (friendly narration + the agent's messages + readable activity labels, never raw terminal or code), so I can follow what's happening.
   [Steer the build (core loop), Steps 1–2]

7. As a builder, the build pauses and surfaces a structured decision card (buttons, plus a text box where needed) only for genuine decisions; obvious/routine choices are handled quietly without interrupting me, so I'm interrupted only when it matters.
   [Steer the build (core loop), Step 3]

8. As a builder, when I answer a decision the session resumes and the board updates, so I see my input take effect.
   [Steer the build (core loop), Steps 3–4]

9. As a builder, I see the later-phase areas (Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View) as visible-but-empty "coming soon" tabs, so I can see where the product is going without them functioning yet.
   [Steer the build (core loop), Step 2]

10. As a builder, my projects and boards persist when I close and reopen Helm, so I never lose my work.
    [Steer the build (core loop), Step 1]

## UI Requirements

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Project Switcher | Empty (no projects) | App name, "Start your first project" CTA, brief tagline | Click CTA → open New Project Wizard |
| Project Switcher | Populated | Scrollable project list (name + last-opened timestamp), "New project" button, active project highlight | Click project to open its board; click "New project" |
| Project Board | Empty (new project, no cards) | Board header (project name), empty columns (To do / Building / Done), empty bug rail, empty decisions section, "+ Add card" button, five phase-tab stubs | Click "+ Add card" or wait for plan auto-seed |
| Project Board | Building (cards present, some in Building) | Feature columns with cards showing status badges; bug rail; decision section showing "Needs you" cards; session-active indicator on in-progress card; five stub tabs visible | Read cards, click card to open session feed, click decision card to answer |
| Project Board | Populated (build done, all done/fixed) | All feature cards in Done column; bug cards Fixed; decision cards Decided; no active session | Read summary; start new card |
| Project Board | Stub tabs (any state) | Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View tabs visible; clicking any shows "Coming soon — Phase N" placeholder | View, but no action available |
| New Project Wizard | Idea input | Large text area ("Describe what you want to build"), submit button, minimal chrome | Type idea and submit |
| New Project Wizard | Scoping Q&A | Sequential decision cards: each card shows the agent's question; response options rendered as click buttons; free-text box on cards that need the user's own words; progress indicator (question N of M); "Back" disabled (scoping is forward-only) | Click button or type answer; each answer submits and next card appears |
| New Project Wizard | Plan review | Rendered plan as editable markdown-like blocks (feature list, rough steps); "Edit" mode inline; "Approve plan" CTA; "Back to questions" secondary action | Edit plan text; click Approve |
| New Project Wizard | Approving | Spinner overlay on plan review; "Locking in your plan…" label | Wait |
| New Project Wizard | Error | Friendly error message ("Something went wrong — try again"); retry button | Retry or return to idea input |
| Session Feed | Active | Session name header (card name), streaming plain-English narration lines, readable activity labels ("Checking the codebase", "Writing a file", "Running tests"), working spinner, no raw code or git output visible | Watch; optionally open board to see real-time card status change |
| Session Feed | Paused for decision | Narration paused; decision card appears inline (see Decision Prompt); "Waiting for your input" label replaces spinner | Answer decision card |
| Session Feed | Done | Narration ends; summary line ("Done — [task name] complete"); "Back to board" button | Click to return to board |
| Session Feed | Error | Friendly error label ("Something went wrong with this task"); "Back to board" button; no stack trace | Return to board |
| Decision Prompt | Pending (button variant) | Card with agent's question text; 2–4 labeled buttons representing choices; optional explanatory sub-text | Click a button |
| Decision Prompt | Pending (free-text variant) | Card with question text; single text input; "Submit" button | Type answer and submit |
| Decision Prompt | Pending (plan-approval variant) | Editable plan block + "Approve" + "Edit" | Edit or approve |
| Decision Prompt | Answered (Decided) | Card with question + chosen answer shown dimmed; non-interactive | None |

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
- id:           TEXT PRIMARY KEY  — UUID
- project_id:   TEXT NOT NULL     — FK → projects.id
- type:         TEXT NOT NULL     — 'feature' | 'bug' | 'decision'
- title:        TEXT NOT NULL
- status:       TEXT NOT NULL     — feature: 'todo'|'building'|'done'; bug: 'open'|'fixed'; decision: 'needs_you'|'decided'
- source:       TEXT NOT NULL     — 'plan_seed' | 'user_added' | 'agent_raised'
- position:     INTEGER NOT NULL  — sort order within column
- created_at:   INTEGER NOT NULL  — Unix epoch ms
- updated_at:   INTEGER NOT NULL  — Unix epoch ms
- session_id:   TEXT              — FK → sessions.id (null if not yet worked on)
- decision_prompt: TEXT           — JSON: { type: 'buttons'|'freetext'|'plan_approval', question, options?, answer? }
```

```
sessions
- id:           TEXT PRIMARY KEY  — UUID
- project_id:   TEXT NOT NULL     — FK → projects.id
- card_id:      TEXT              — FK → cards.id (null for wizard scoping session)
- name:         TEXT NOT NULL     — display name (card title or "Scoping: <project>")
- status:       TEXT NOT NULL     — 'active' | 'paused_for_decision' | 'done' | 'error'
- started_at:   INTEGER NOT NULL  — Unix epoch ms
- ended_at:     INTEGER           — null while active
```

```
feed_events
- id:           TEXT PRIMARY KEY  — UUID
- session_id:   TEXT NOT NULL     — FK → sessions.id
- kind:         TEXT NOT NULL     — 'narration' | 'activity' | 'decision_prompt' | 'summary' | 'error'
- text:         TEXT NOT NULL     — plain-English display text (never raw agent output)
- raw_payload:  TEXT              — JSON of original SDK event (stored for debugging; never shown to user)
- created_at:   INTEGER NOT NULL  — Unix epoch ms
```

## API Contracts

This is an Electron app with no HTTP server. All IPC uses named channels via contextBridge. Each channel below is a typed IPC call from renderer → main (invoke/handle pattern) or a main → renderer event push.

### projects:list
- **Direction:** renderer invokes → main handles
- **Request:** `{}` (no params)
- **Success response:** `{ projects: Project[] }` — array ordered by updated_at DESC
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
- **Success response:** `{ project: Project, cards: Card[] }` — cards ordered by position ASC within each type/status group
- **Error responses:**
  - `{ error: 'not_found' }` — no project with that id
  - `{ error: 'db_unavailable', message: string }`

### cards:create
- **Direction:** renderer invokes → main handles
- **Request:** `{ projectId: string, type: 'feature' | 'bug', title: string }`
- **Success response:** `{ card: Card }` — new card with status='todo' (feature) or 'open' (bug), source='user_added'
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
  - `{ error: 'invalid_transition', from: string, to: string }` — status machine violation (e.g. 'done' → 'todo' not allowed)
  - `{ error: 'db_write_failed', message: string }`

### sessions:start
- **Direction:** renderer invokes → main handles (starts Claude Agent SDK session)
- **Request:** `{ projectId: string, cardId: string }`
- **Success response:** `{ session: Session }` — session created with status='active'; SDK session started
- **Error responses:**
  - `{ error: 'not_found' }` — project or card not found
  - `{ error: 'session_already_active', sessionId: string }` — card already has a running session
  - `{ error: 'sdk_init_failed', message: string }` — Claude Agent SDK failed to start (auth, binary path, etc.)
  - `{ error: 'db_write_failed', message: string }`

### sessions:answer-decision
- **Direction:** renderer invokes → main handles
- **Request:** `{ sessionId: string, answer: string }`
- **Success response:** `{ session: Session }` — session status changed back to 'active'
- **Error responses:**
  - `{ error: 'not_found' }` — session not found
  - `{ error: 'not_awaiting_decision' }` — session status is not 'paused_for_decision'
  - `{ error: 'db_write_failed', message: string }`

### sessions:get-feed
- **Direction:** renderer invokes → main handles
- **Request:** `{ sessionId: string, afterId?: string }` — afterId for pagination
- **Success response:** `{ events: FeedEvent[] }` — ordered by created_at ASC
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
- **Success response:** `{ project: Project, cards: Card[] }` — project.plan set; board cards auto-seeded from plan; project status → 'building'
- **Error responses:**
  - `{ error: 'not_found' }` — project or session not found
  - `{ error: 'validation_failed', message: string }` — empty plan
  - `{ error: 'db_write_failed', message: string }`

### feed:event (push — main → renderer)
- **Direction:** main pushes to renderer (ipcMain.emit / webContents.send)
- **Payload:** `{ sessionId: string, event: FeedEvent }` — one event per emission
- **Renderer action:** append event to session feed store; if event.kind === 'decision_prompt', update session status to 'paused_for_decision' and surface decision card

### board:update (push — main → renderer)
- **Direction:** main pushes to renderer after any card status change
- **Payload:** `{ projectId: string, cardId: string, card: Card }` — updated card
- **Renderer action:** update card in board store; re-render the affected column

## Constraints & Context

- All agent output (SDK events, tool calls, raw text) is transformed in the main process before any event crosses the IPC boundary. The renderer never sees code, file paths, git output, branch names, diffs, or terminal text. Transformation is a hard gate, not a best-effort filter.
- The Claude Agent SDK requires `options.pathToClaudeCodeExecutable` on every call site — resolved via `execSync('which claude')`. A missing path guard silently fails. Every session start call must include this guard independently.
- Persistence is SQLite via better-sqlite3. The DB file lives at `app.getPath('userData')/helm.db`. Migrations run on app launch before any IPC handler is registered.
- Smart-pausing logic: the main process decides whether an agent question is a genuine decision or a routine choice. Heuristics (to be refined in Group 6): genuine decisions have branching product impact (architecture choice, feature toggle, design direction); routine choices (file naming, standard patterns, library micro-choices within the approved stack) are auto-answered silently. The bar is "would a non-developer care?" If no, auto-answer and log to feed as an activity event.
- Scoped named sessions: each card runs as its own SDK session with a scoped system prompt that includes only that card's context. No shared state between sessions. The wizard scoping session is a separate session type; it does not carry over into card build sessions.
- Board auto-seeding: when the wizard:approve-plan handler runs, it parses the approved PlanBlock[] and creates one 'feature' card per top-level item, status='todo', source='plan_seed', positioned in insertion order.
- IPC messages are validated with Zod on both sides of the boundary (renderer schemas in `src/renderer/ipc-types.ts`, main schemas in `src/main/ipc-handlers.ts`).
- Strict TypeScript (`"strict": true`); all npm deps pinned exactly (no `^` or `~`).
- Tone of the feed: plain English, first-person narration from the agent's perspective ("I'm reading the project structure", "I just finished wiring the route"). Never "Executing tool: read_file". Never code snippets.
- Phase 1 is macOS only; no Windows/Linux compatibility work required.

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
