# Design Brief — Helm Phase 1: The Executive Dashboard

**Track:** external-pencil
**Phase:** 1
**Spec:** specs/2026-06-03-the-executive-dashboard/
**Date:** 2026-06-03
**Visual source of truth:** pencil/v0.1.pen

---

## Design intent

*"I approved the plan, and then it just started getting built."* The user should feel like a CEO who arrived at a meeting, made three clear decisions, and left knowing their team is executing. Not a power user configuring a tool — a principal directing a build. The board is the scoreboard: dense, live, authoritative. The feed is the build-cam: streaming, readable, never alarming. Every visual decision should be weighed against: does this feel like watching something get made by a team I trust, or does it feel like a terminal I'm managing?

---

## Product context — full vision

**What it is.** Helm is a macOS desktop application — a single window, downloaded and run locally — that turns building software into an executive dashboard for non-developers. The user is a product thinker, not a developer. They can already get an AI to write code in a chat session, but lose the thread in a 200-message terminal scroll. Helm replaces that chat with a project board: features, bugs, and decisions as cards with statuses, a live feed of what the agent is doing, and structured decision prompts when something genuinely needs the user's call. The user never opens a terminal, reads a file path, or sees a branch name. They read cards and make decisions.

**What it replaces.** Today's first user drives an SDD ("/build") stack via Claude Code in a macOS terminal. The "app" is a conversation thread. Status tracking is mental or kept in external notes. When a decision comes up it's buried in a streaming text wall. When the build is done there's no artifact they can inspect without technical knowledge. Helm replaces the terminal session with a board, the text wall with a plain-English feed, and scattered notes with decision cards that resolve on click.

**What it explicitly isn't.** Helm is not an IDE, a code editor, a terminal emulator, or a project-management SaaS. It doesn't look like Linear, Jira, Cursor, or Claude.ai. It doesn't show code, diffs, branches, commit hashes, or file paths. It does not have a global chat input. The entry surface is a single sentence — "What do you want to build?" — not a form. The board is the result of that conversation, not the starting point.

**The end-state form factor.** At full build-out (Phase 4), Helm is a single macOS window with: a left rail showing the project board (cards in build-spine order, statuses, the active session indicator per project); a main area that is context-sensitive — when a card is selected it shows the scoped session for that card, when the last session finished it shows the running app itself (Live Preview); a right area for point-and-fix annotation (Phase 3). Phase 1 establishes the left rail and main area. The left rail must be designed as a permanent fixture — not a sidebar that appears only during builds. The main area must be designed as a panel that can be flanked on both sides later.

**A typical day.** The user opens Helm, sees their three active projects listed. They click the one they care about. The board shows 12 feature cards in build-spine order: 8 done (collapsed to quiet history), 3 planned, 1 building (spotlight, full presence on screen). One "Needs you" block is the most prominent element — it floats to the top. They read the agent's question — "Should the export be CSV or PDF?" — click a button, and watch the card resolve to "Decided." Thirty seconds later a feature card moves from "Building" to "Done." No terminal. No code. No context-switching.

---

## Patterns to avoid

**The dev-tool aesthetic.** Dark theme with monospace body text, sidebar file trees, status bar bottom chrome, window chrome that resembles VS Code or Cursor. Helm must read as a product app, not an engineering tool.

**The generic AI-app template.** A centered chat input at the bottom, a conversation thread as the primary surface, a "thinking…" spinner replacing structure. The feed IS present in Helm (scoped inside each item), but it's not the whole app. The board — not the feed — is the hero.

**The bloated project-management SaaS aesthetic.** Crowded toolbars, heavy left sidebars with 20 nav items, "sprint" and "backlog" vocabulary, Jira-shaped color coding. Helm's board has one build-spine with six states. That's it.

**The over-friendly onboarding screen.** Illustrated mascots, "Welcome to Helm!" hero headers. The front door is a single confident sentence — not a tutorial. The user is a professional.

**Gradient-heavy "AI startup" look.** Purple-to-blue gradients, glowing orbs, glassmorphism. Helm's v4 canon is warm cream + ink — expressive but grounded, not ethereal.

---

## Visual canon — v4 Maximalist (ACTIVE)

**Source of truth:** `pencil/v0.1.pen`

The approved visual direction is the v4 "Maximalist" Pencil design. This supersedes all prior calm/Linear-style direction in this brief. Any earlier palette or tone notes that conflict with the below are overridden.

### Palette
- **Canvas:** Warm cream `#FFEFD2` — the base surface. Not white. Not neutral gray. Warm, paper-like, inviting.
- **Ink:** `#1B1208` — primary text and high-contrast UI elements. Near-black with warmth.
- **Pink (feature / primary action):** `#FF6F91`
- **Violet (planning / scoping):** `#6B4BEB`
- **Lime (done / success):** `#C8F23A`
- **Blue (active / building):** `#3A6CFF`
- **Orange (warning / needs attention):** `#FF7A29`
- **Confetti accents:** playful scattered marks used in empty states and the front-door sentence screen — never decorative for its own sake, always tied to a moment (first run, plan approval, phase completion).

### Mood
Dense, expressive, product-grade. The interface has personality without being noisy. Color is semantic — each accent has one job. The warm cream canvas gives warmth and visual mass; bright accents punch on it without needing dark mode to look premium. Typography is heavy and confident. Cards have clear visual weight. The "Needs you" headline state is unmissable — it's the loudest thing on screen when it appears.

### Typography direction
A confident, slightly expressive sans-serif — not Inter (too generic). High weight contrast: card titles heavy, metadata light. Feed narration at comfortable reading size with generous line-height. No monospace in user-facing copy.

---

## Roadmap at a glance

1. **Phase 1 — The Executive Dashboard [CURRENT]:** Delivers the polished desktop app shell — the front-door sentence entry, build-spine board, scoped conversation inside each in-flight item, durable background sessions, and the reviewable-result checkpoint per finished item — wired to the live Claude Agent SDK. The day-one switch trigger: a non-developer can start a project, drive a build, steer mid-build, answer decision prompts, and see results without a terminal.

2. **Phase 2 — Watch It Get Made:** The actual running app is embedded as a Live Preview pane inside the main area, replacing the placeholder stub tab. The user sees what they're getting as it gets built.

3. **Phase 3 — Point and Fix:** The user clicks any element in the Live Preview, annotates it, and a focused agent session spawns to fix exactly that element.

4. **Phase 4 — The Super-Team:** Every action spawns its own parallel context-loaded session; all run simultaneously; results land back on the board as resolved cards.

---

## Current phase scope

Phase 1 delivers everything the user touches to go from zero to a live build:

- **The front-door sentence** — first-run and "Start a new build" both open with a single large plain-English prompt: "What do you want to build?" The New Project Wizard is the dominant entry surface, not a corner button.
- **The build-spine board** — the hero screen. An ordered, dependency-aware sequence of items: Planned → Up next → Building (spotlight, one at a time in Phase 1) → Needs you → Failed/off-track → Done. Done items collapse to quiet history.
- **Scoped conversation inside each item** — clicking a Building or Needs-you item opens its own plain-English session feed plus a steering input. The user can interrupt, redirect ("do it this way instead"), or look closer. Agent questions form a queue with state (pending / answered / re-openable).
- **Needs-you as headline** — when the agent is blocked on the user, that is the most prominent element on screen (not buried bottom-right).
- **Reviewable-result checkpoint** — each finished item gets a "here's what I built — does this look right?" checkpoint with a screenshot or click-through. The non-developer judges real results, not percentages.
- **Durable background sessions** — sessions are background processes the views subscribe to. They survive project-switch, rail-collapse, window-refresh, and app quit/relaunch. Background work stays visible in the rail.

Five tabs (Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View) are visible but stubbed — each unlocks with its phase. Tabs are never shown as greyed-out dead/locked UI; they reveal as their phase unlocks.

---

## Forward-compatibility callouts

- **Live Preview pane (Phase 2).** The main content area must be designed as a panel, not a full-width single surface. In Phase 2, the main area hosts an embedded webview.
- **Right annotation panel (Phase 3).** The main window layout must accommodate a right panel that does not yet exist. Design Phase 1's main area as something that can be flanked on the right.
- **Board left rail permanence (all phases).** The build-spine is permanent. In Phase 4 it becomes a live parallel-session scoreboard. Design it as the primary navigation surface, not a "sidebar."
- **Parallel session indicators (Phase 4).** Cards will eventually show simultaneous active sessions. Phase 1 has one active spotlight at a time, but the card design must accommodate a future "multiple active" state.
- **Stub tabs → active tabs (Phases 2–4).** Tab strip is permanent. Each stub must read as "coming soon" — not absent, not broken. Tabs appear gradually as phases unlock, never as a graveyard of locked icons.
- **Decision Prompt card reuse (all phases).** Used in three Phase 1 contexts: in-item scoped feed, board Needs-you headline, and New Project Wizard. In later phases it appears in Point-and-Fix annotation. The card must work as a portable component at board-headline size, feed-inline size, and wizard-step size.

---

## Screen groups — what each does and why

### Front-Door Sentence / Project Switcher

**Job.** This is the app's entry point. First-run and every "Start a new build" show a single large plain-language prompt: "What do you want to build?" The user types a sentence and the agent takes it from there. The New Project Wizard (idea → agent grilling via decision cards → editable plan → board populates) is the dominant entry experience, not a secondary corner button.

**Why it exists in Phase 1.** The board is the result of the entry conversation. There's no board without the sentence. The switcher also lets the user navigate between projects already started.

**User stories served.** Stories 1, 2, 11 (sentence entry).

**Key behaviors.** The empty state has a single large text prompt, not a form. The populated state lists existing projects ordered by last-opened. "New build" always visible. A project row shows its live background status (even when looking at another project). On hover, show "Open" only — no delete, no rename in Phase 1.

**States that surprise.** Empty = confident invitation, not a tutorial. Populated = a scoreboard of projects, not a folder list. Active project is visually highlighted.

---

### Project Board (Build-Spine)

**Job.** The hero screen. An ordered, dependency-aware build-spine. States: Planned → Up next → Building (spotlight) → Needs you → Failed/off-track → Done. The board auto-seeds from the approved plan. The user reads the spine and acts when required.

**Why it exists.** The board is the reason Helm exists. Everything else feeds into or out of it.

**User stories served.** Stories 4, 5, 7, 8, 9, 12 (build-spine), 14 (Needs-you headline), 15 (Failed/off-track), 16 (reviewable checkpoint).

**Key behaviors.** One item is in "Building" spotlight at a time in Phase 1. "Needs you" rises to the most prominent position on screen — not buried. Done items collapse to quiet history (condensed row, not full card). Dependencies are legible (items referencing what they depend on). Phase/step labels use plain names, never "Phase 1/4" codes or CFP-style IDs. Step label format: "Step N of M: <name>". Board has a one-line orientation sentence so the user always knows where they are.

**States that surprise.** Empty board (new project) = the spine exists but no items yet. Building state = exactly one spotlight item, rest Planned. All-done = complete history, no active session. "Needs you" = the most visually prominent state in the entire app.

**Forward-compat.** Main content area must read as a panel (Phase 2 adds Live Preview). Left rail must accommodate multiple-active indicators (Phase 4).

---

### New Project Wizard (Entry Conversation)

**Job.** The user types "What do you want to build?" and the wizard turns their idea into a structured, approved plan. The flow: sentence input → agent grilling via decision cards → editable plan → board populates. Each step is a decision card. The user should feel like they're being interviewed by a thorough, friendly expert.

**Why it exists.** Without the entry conversation there's no plan, and without a plan there's no board. The wizard is the entry point to the entire build loop.

**User stories served.** Stories 2, 3, 11.

**Key behaviors.** Single-sentence input is the only thing on screen at first. After submission, sequential decision cards: one at a time, agent question shown, response options as buttons, free-text box where needed. Progress label shows "Step N of M" not "Question 3/8." After Q&A, plan displays as editable blocks. "Approve plan" is primary CTA. On approval, spinner overlay ("Getting your plan ready…" — not "Locking in your plan"). Errors show a friendly message with retry.

**States that surprise.** Plan review is the most complex — must feel like reviewing a document, not a wall of text. Inline editing must be obvious. The approving spinner blocks re-edits.

---

### In-Flight Item — Scoped Conversation

**Job.** Every in-progress item opens into its own scoped conversation: a plain-English session feed (the build-cam for that item) plus a steering input. The user can interrupt, redirect ("do it this way instead"), or look closer. This is NOT a global chat sidebar — it's scoped to exactly one work item.

**Why it exists.** Without the scoped conversation, the board is opaque. Cards change status but the user has no visibility into what's happening or any way to steer.

**User stories served.** Stories 6, 7, 8, 13 (steering).

**Key behaviors.** Session name header shows the item title and "Step N of M: <name>" — never a raw ID. Feed streams in plain English, no code, no file paths. Activity labels are readable ("Building the sign-in form" not "wiring sign-in form" — never jargon). When the agent needs a decision, narration pauses and a decision card appears inline — this is also reflected as "Needs you" on the board. Agent model name is hidden; never shown. Steering input allows: interrupt, redirect ("do it this way instead"), or look-closer requests. Agent questions form a queue with state: pending / answered / re-openable. Already-answered questions have a visible "Re-open" path.

**States that surprise.** The steering input must be clearly separate from the feed — not a chat thread. The question queue must be scannable. Re-opening a decided question must not be destructive.

---

### Needs-You Headline State

**Job.** When the agent is blocked on the user for a genuine decision, that becomes the most prominent element on screen. It is not a notification badge, not a bottom-right card — it is the headline.

**Why it exists.** Buried decision prompts mean blocked builds. The user must see that the build is waiting for them the moment they look at the app.

**User stories served.** Story 14.

**Key behaviors.** The "Needs you" state visually dominates the board view — it rises above the build-spine items. The question is shown directly (not just "1 decision waiting"). Answering buttons are in the headline block itself. Already-decided questions show a "Re-open" affordance — decisions are not immutable.

**States that surprise.** Multiple simultaneous "Needs you" states are possible in later phases — design the headline block to accommodate a list, not just one question.

---

### Reviewable-Result Checkpoint

**Job.** When an item completes, the user sees a "here's what I built — does this look right?" checkpoint. This is a screenshot or click-through of the actual result, not a percentage or a status badge. The non-developer judges real output.

**Why it exists.** A status badge moving from "Building" to "Done" tells you nothing about what was actually produced. The checkpoint gives the user a moment to approve or flag the result before the next item begins.

**User stories served.** Story 16.

**Key behaviors.** Checkpoint appears inline in the scoped conversation feed when an item completes. Shows a screenshot or visual preview. Primary CTA: "Looks good, continue" (advances to next item). Secondary: "Something's off" (opens a steering input to redirect). If the user navigates away and returns, the checkpoint is still visible and actionable.

---

### Failed/Off-Track State

**Job.** When an item fails or goes off-track, the board surfaces this clearly — not as a buried error badge but as a distinct state that requires the user's attention.

**Why it exists.** Failures that are invisible lead to wasted time and confusion. The user needs to know something is broken and what to do next.

**User stories served.** Story 15.

**Key behaviors.** Failed item is visually distinct from Needs-you (different color/treatment — orange accent). Shows a plain-English description of what went wrong ("The sign-in form couldn't be completed — the database connection isn't set up yet"). Primary action: "Try again" or "Tell me more." No stack traces.

---

### Decision Prompt Card (component)

**Job.** The structured answer interface for any agent question that requires a genuine human choice. Used in three Phase 1 contexts: Needs-you headline on the board, inline in the scoped session feed, and in the New Project Wizard.

**User stories served.** Stories 2, 3, 7, 8, 14.

**Key behaviors.** Three variants: button choice (2–4 buttons), free-text (text input + submit), plan-approval (editable plan + Approve + Edit). Answered state shows question + chosen answer, dimmed, non-interactive. Re-open affordance visible on answered cards. The card reads as "a structured question from a trustworthy agent" — not a form, not a chat bubble.

**States that surprise.** The re-open path on answered cards is a new requirement. It must be visible but not alarming — a quiet "Re-open" link, not a prominent button.

---

## User stories

### Project Switcher / Front Door
**1.** As a builder, I can see my projects in a simple list and open any one, and I can also see their live background status while I'm looking elsewhere, so I can pick what to work on and stay oriented. [Steer the build, Step 1]
**10.** As a builder, my projects, boards, and in-progress sessions persist when I close and reopen Helm — including sessions that were running in the background — so I never lose my work or my place. [Steer the build, Step 1]
**11.** As a builder, the entry to a new project is a single sentence — "What do you want to build?" — not a form, so starting feels immediate and natural. [Start a project, Step 1]

### Project Board (Build-Spine)
**4.** As a builder, I can see my project as an ordered build-spine — items in states Planned / Up next / Building / Needs you / Failed / Done — at a glance, so I always know where the project is without keeping notes elsewhere. [Steer the build, Step 1]
**5.** As a builder, the board is auto-seeded as a build-spine from the approved plan AND I can add my own items anytime, so the board reflects both the build and my own asks. [Steer the build, Step 1]
**7.** As a builder, the build pauses and surfaces a structured decision card only for genuine decisions; obvious/routine choices are handled quietly, so I'm interrupted only when it matters. [Steer the build, Step 3]
**8.** As a builder, when I answer a decision the session resumes and the board updates, so I see my input take effect. [Steer the build, Steps 3–4]
**9.** As a builder, I see the later-phase areas (Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View) as tabs that unlock with each phase — never as dead locked icons — so I can see where the product is going. [Steer the build, Step 2]
**12.** As a builder, done items collapse to quiet history so the board stays focused on what's active, not a wall of green checkmarks. [Steer the build, Step 1]
**14.** As a builder, when the agent is blocked on me, "Needs you" is the most prominent element on screen — not buried — so I never miss that the build is waiting. [Steer the build, Step 3]
**15.** As a builder, when an item fails or goes off-track, I see a plain-English description of what went wrong and a clear next action, so I'm never left staring at a silent error. [Steer the build, Step 3]
**16.** As a builder, when an item finishes, I see a "here's what I built — does this look right?" checkpoint with a real visual result, so I can approve or redirect before the next item starts. [Steer the build, Step 4]

### New Project Wizard
**2.** As a builder, I can start a new project by describing my idea and going through a thorough back-and-forth scoping conversation — rendered as clickable decision cards — so the resulting plan reflects what I actually want. [Start a project, Steps 1–2]
**3.** As a builder, I can review and edit the proposed plan and must approve it before any building starts, so I stay in control. [Start a project, Step 3]

### Scoped Session / Steering
**6.** As a builder, I can open any in-flight item into its own scoped session and watch the agent work in a plain-English live feed — never raw terminal or code — so I can follow what's happening. [Steer the build, Steps 1–2]
**13.** As a builder, I can steer a running item mid-build — interrupt it, redirect it ("do it this way instead"), or ask it to look closer — so I'm not locked out once a session starts. [Steer the build, Step 3]

### Decision Queue
**17.** As a builder, agent questions for any item form a visible queue with state (pending / answered), and I can re-open an already-answered question, so decisions are not immutable. [Steer the build, Step 3]

---

## Visual style

**Direction: v4 Maximalist (see palette above).** Warm cream canvas, ink text, bright semantic accents. Dense, expressive, product-grade. The interface has personality without being noisy. The register is **product** (not brand): the UI serves the user's work, not Helm's identity.

---

## Tone and mood

- **Confident.** The entry sentence is a prompt, not a form. The board is a scoreboard, not a to-do list.
- **In-control.** Every state gives the user clarity: what is happening, what they can do, what comes next.
- **Legible.** Information density is high, but every item is readable. Cards have hierarchy. The feed has typographic rhythm.
- **Expressive but grounded.** The v4 palette is warm and bright — not minimal, not corporate. Confetti accents appear at moments that earn them (plan approved, phase complete). Not sprinkled everywhere.
- **Never alarming.** Even "Needs you" and "Failed" states are urgent without being panicked.

---

## References

- **v4 Pencil file** (`pencil/v0.1.pen`) — canonical visual reference for all Phase 1 frames.
- **Linear** — information density on a card list, status-driven state changes. Legibility reference only, not the visual direction.
- **Vercel Dashboard** — calm status dashboard energy: builds running, deploys succeeding.

---

## Information architecture

| Element | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---------|---------|---------|---------|---------|
| Front-door sentence | Full (single prompt, wizard entry) | Unchanged | Unchanged | Unchanged |
| Project Switcher | Full (list + empty + new, with live rail status) | Unchanged | Unchanged | Unchanged |
| Project Board header | Project name + nav tabs (5, unlock progressively) | Unchanged | Unchanged | Unchanged |
| Build-spine board | Planned/Up-next/Building-spotlight/Needs-you/Failed/Done | Unchanged | Unchanged | Parallel indicators added |
| Tab strip | Board (active) + 4 stubs (unlock per phase) | Live Preview unlocks | Point-and-Fix unlocks | All 5 active |
| Scoped session (in-item) | Full (feed + steering + question queue) | Unchanged | Unchanged | Multi-session switching |
| Needs-you headline | Full (dominant position, re-open path) | Unchanged | Used in annotation | Unchanged |
| Reviewable-result checkpoint | Thin slice (screenshot/click-through per finished item) | Full live preview replaces | Unchanged | Unchanged |
| Failed/off-track state | Full (plain-English description + next action) | Unchanged | Unchanged | Unchanged |
| Right panel | None | None | Annotation panel added | Unchanged |
| New Project Wizard | Full (sentence → Q&A → plan → board) | Unchanged | Unchanged | Reused for "start feature" |
| Decision Prompt card | Full (button, free-text, plan-approval + re-open) | Unchanged | Used in annotation | Unchanged |

---

## Screen checklist

All 30 states below are the Phase 1 coverage contract. Every state must appear as its own frame in the Pencil file (`pencil/v0.1.pen`).

**GROUP A — Front-Door Sentence / Project Switcher**
1. Front-door — First run: single large sentence "What do you want to build?" on warm cream canvas, confetti accent, no other chrome
2. Project Switcher — Populated: scrollable project list with live background status per project, active highlight, "New build" button

**GROUP B — New Project Wizard (Entry Conversation)**
3. Wizard — Sentence entry: large plain-language text prompt, submit; no form fields
4. Wizard — Scoping Q&A (button-choice card): agent question, 2–4 choice buttons, "Step N of M" progress label
5. Wizard — Scoping Q&A (free-text card): agent question, text input + submit, step progress
6. Wizard — Plan review: editable plan blocks, "Approve plan" CTA, "Back to questions" secondary
7. Wizard — Approving: spinner overlay, "Getting your plan ready…" label
8. Wizard — Error: friendly error message, retry button

**GROUP C — Build-Spine Board**
9. Build-Spine — Empty (new project, no items): spine exists but empty; one-line orientation; "Start building" CTA
10. Build-Spine — Planned/Up-next view: items in Planned and Up-next states, clear dependency legibility
11. Build-Spine — Building spotlight: one item in full Building spotlight, rest condensed; no Needs-you present
12. Build-Spine — Needs-you headline: "Needs you" block is the most prominent element; question shown inline; answer buttons present; re-open visible on prior answered decisions
13. Build-Spine — Failed/off-track: one item in Failed state with plain-English description and next-action CTA
14. Build-Spine — Done items collapsed: completed items in quiet condensed history at the bottom of the spine
15. Build-Spine — Stub tab active: "Unlocks in Phase N" placeholder (applies to all stub tabs)

**GROUP D — Scoped Session / Steering**
16. Scoped session — Active: item header with "Step N of M: <name>", streaming plain-English feed, activity labels, working indicator, steering input visible
17. Scoped session — Paused for decision: narration paused; inline decision card; "Waiting for your call" label; steering input available
18. Scoped session — Steering input active: interrupt/redirect/look-closer options visible; mid-build steering in progress
19. Scoped session — Question queue: queue of agent questions with state badges (pending / answered); "Re-open" on answered questions
20. Scoped session — Done with checkpoint: narration ends; "Here's what I built — does this look right?" block with screenshot/preview; "Looks good" + "Something's off" CTAs
21. Scoped session — Error: friendly error label, "Something went wrong building this — let's try again"; retry; back to board

**GROUP E — Needs-You (standalone / board-level)**
22. Needs-you — Single question headline: question text, answer buttons, re-open path on prior decided question; Needs-you visually dominates the board view

**GROUP F — Reviewable-Result Checkpoint (component)**
23. Checkpoint — Result shown: visual preview (screenshot frame), plain-English "Here's what I built" label, "Looks good, continue" + "Something's off" CTAs
24. Checkpoint — Flagged: "Something's off" flow open; steering input; "Tell me what to fix" prompt

**GROUP G — Decision Prompt card (component states)**
25. Decision Prompt — Pending (button variant): question text, 2–4 labeled buttons, optional sub-text
26. Decision Prompt — Pending (free-text variant): question text, text input, "Submit" button
27. Decision Prompt — Pending (plan-approval variant): editable plan block, "Approve" + "Edit" buttons
28. Decision Prompt — Answered / Decided: question + chosen answer shown, dimmed, non-interactive, "Re-open" link

**GROUP H — Stub screens**
29. Live Preview stub (board tab): shell with "Unlocks in Phase 2" — not locked/greyed, reads as invitation
30. Decisions Log stub (board tab): shell with "Unlocks in Phase 4" — same treatment

*(Note: Point-and-Fix Overlay is not designed in Phase 1. Two representative stubs cover the pattern for all stub tabs.)*

---

## Coverage notes

- **macOS desktop, single window.** No mobile breakpoints. Design at 1440 × 900px; minimum comfortable 1200 × 800px.
- **Light mode only in Phase 1.** Dark mode is not in scope.
- **Accessibility minimums.** WCAG AA contrast on all text. Never rely on color alone to convey state (all status elements use color + label or icon).
- **Plain language everywhere.** No jargon in any user-facing label. "Step 1 of 4: Build the sign-in form" not "Phase 1/4" or "CFP-08." Model names are hidden. Raw activity descriptions like "wiring sign-in form" become "building the sign-in form."
- **Design system anchor — the build-spine item.** The spine item is the most-reused primitive. Design it to work at three sizes: full spotlight (Building), standard row (Planned/Up-next), and condensed history row (Done).
- **Decision Prompt card portability.** One card shape works in all three contexts (board headline, feed inline, wizard). Context determines the container.
- **Most-forgotten surfaces.** (1) The re-open path on answered decision cards. (2) Done items in collapsed history — it's easy to only design the active states. (3) The question queue with multiple pending items. (4) The reviewable-result checkpoint after scrollback. (5) The Failed/off-track state.
- **Forward-compat reminders:**
  - All board frames → main content area reads as a panel (Phase 2 adds Live Preview).
  - All board frames → left rail must accommodate multiple-active indicators (Phase 4).
  - Stub tabs → must look like deliberate invitations, not 404s.
  - Decision Prompt cards (frames 25–28) → portable-component spec; reused in Phase 3.
