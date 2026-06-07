# Design Brief — Phase 4: Build & Iterate
# Helm — External Tool Path (Pencil.dev)

---

## Design intent

*(User's words — verbatim north star)*

"A non-tech user can feel confident to start building something in Helm — they always know the 'next step' to do even without any dev experience, they can dig into the controls and find more powerful features when they feel more confident, and they can always see the exact features or changes they want come to life."

Three load-bearing clauses, each a design test:
1. **"Always know the next step"** — every screen has exactly one visually-primary action; the rail's current step is unmistakable.
2. **"Dig in and find more powerful features when confident"** — progressive disclosure is a first-class pattern: advanced controls exist but never compete with the primary path (easy to grasp, depth to master).
3. **"See the exact features they want come to life"** — the live preview and the result-checkpoints stay visually central; what the user asked for and what got built are always visibly connected.

*Every visual decision should be weighed against this.*

---

## Product context — full vision

**What it is.** Helm is a single-window macOS desktop app for non-developer builders. The user's Claude subscription provides the AI engine — Helm is the cockpit layer on top of it. It is distributed as a `.dmg`, runs entirely locally (no cloud backend, no user accounts, no telemetry), and is Apache/MIT open-source. The user brings their own Claude subscription; Helm costs nothing to run.

**What it replaces.** The target user today drives AI-assisted software development through a terminal chat — typically Claude Code in a terminal window. The workflow is powerful but opaque: the user types, waits, reads wall-of-text output, and mentally tracks progress in their head. Helm replaces that experience with a cockpit: every decision, every status, every result is a visible, actionable surface. The user never opens a terminal. They never read code. They never manage a git branch. They describe what they want, approve what the agent produces, and point at what to fix.

**What it explicitly isn't.** Helm is not an IDE, not a code editor, not a project management tool (like Linear or Jira), and not an AI chat interface. It is not a no-code drag-and-drop builder. The user never sees code, diffs, or branches — those are hidden below the surface. It is not a SaaS product and does not run in a browser. Design references from productivity SaaS tools (Notion, Linear, Figma) are useful for *feel*, but Helm is a desktop-native, single-user cockpit — not a web app wearing a desktop wrapper.

**The end-state form factor.** At completion of the roadmap, Helm is a two-column desktop window: a narrow left rail (project switcher + brand mark) and a main area that is fully context-driven. When a project is in Build mode, the main area is the ordered rail — milestones in sequence, the current step expanded with its live session feed, locked future steps visible but muted. When a project is in Iterate mode, the main area is the freeform board — cards by status, parallel sessions visible, the live preview of the actual running app sharing the view. A side-tab strip (Decisions, Progress, Docs) gives access to project metadata without leaving the main flow. The Live Preview pane is embedded — not a link, not a screenshot, the actual app running in an iframe-equivalent. There is no global navigation bar, no breadcrumb trail, no hamburger menu. Navigation is implicit in the structure: you are always on your project, always in your mode.

**The operator's day.** The user opens Helm in the morning, glances at the project switcher (left rail), picks their project. If they're in Build mode, they see the current milestone — maybe it finished overnight, with a checkpoint waiting. They test the feature, report a bug if needed, click "Continue." The next step begins. They come back at noon and see two things: the current step is in progress (session feed updating), and one item appeared on the "For later" shelf from something they typed last week. In the evening they hit the celebration screen — the goal they described two weeks ago now does what they set out. They click "Start iterating" and the board opens with their parked items as a backlog.

---

## Patterns to avoid

**The v4 Maximalist system (the immediately prior look — retired in Phase 4).** The previous visual system used warm cream (#FFEFD2), ink (#1B1208), chunky 2px borders, offset drop shadows (the "brut" style), Fraunces as a display font, and confetti-like decorative elements. The user's own words: "too playful, kid-like." Every one of these decisions is explicitly reversed in Phase 4:
- No warm cream backgrounds — neutrals are cool-leaning stone/white, never papyrus
- No chunky outlines or offset shadows — borders are hairlines (`1px`), shadows are elevation cues (subtle, not decorative)
- No Fraunces (or any display serif used for personality) — the font stack is Inter (UI) and JetBrains Mono (code/literals) only
- No confetti, no expressive flourishes — decoration that doesn't carry information is removed
- No `brut` or `brut-2` class conventions — those component classes are retired

**The generic AI app shell.** Many AI tools reach for the same chrome: dark sidebar, chat input at bottom, streaming text in the middle. Helm is not a chat app. The Board is not a chat history. The session feed is information about what the agent is doing — it lives inside a named milestone card, not as the primary surface. Resist any layout that makes Helm look like a coding assistant with a thin wrapper.

**The project management tool aesthetic.** Helm is not Linear or Jira. The board has cards, but it is not a kanban tool — it is a status display for a build in progress. Resist the impulse to give every card an avatar, a due date chip, a priority flag, or a progress bar. Information should be load-bearing, not decorative.

**Dashboard overload.** The user is non-technical. The experience should feel like managing a project, not reading a monitoring dashboard. Avoid: hero metrics in large bold numbers, chart widgets, dense data tables, status grids. Every number on screen should be human-readable in plain English (not `7 tasks / 4 done / 3 remaining` — just let the visual state of the rail speak).

**Generic empty states with illustrations.** The empty-state pattern of a centered illustration + header + CTA button is the category reflex for consumer apps. Helm's empty states should be confident and structural — they feel like the product waiting for content, not a marketing page explaining the product.

---

## Roadmap at a glance

```
1. Phase 1 — The Executive Dashboard ✓ COMPLETE
   Board + scoped sessions + live Claude Agent SDK wired. The shell, the engine, and the
   decision-surface are all proven. Left the live preview and visual refinement for later.

2. Phase 2 — Watch It Get Made ✓ COMPLETE
   Live Preview pane: the actual app runs inside Helm. The iframe-equivalent is wired.
   Left point-and-fix for Phase 3.

3. Phase 3 — Point and Fix ✓ COMPLETE
   Click any element in the live preview, leave a bug/comment, targeted fix session spins up.
   Decisions, Progress, and Docs tabs wired to real DB. Parallel sessions enabled.

4. Phase 4 — Build & Iterate ← [CURRENT]
   Total UI redesign (calm, sleek, modern — the maximalist system is retired). Two explicit
   project modes — Build (ordered rail, checkpoint-gated) and Iterate (existing board,
   reframed). Import an existing AI-built app. Project management (rename, delete). Ships as
   two dogfoodable chunks.

5. Phase 5+ (not yet scoped)
   Dark mode (token system is already designed to support it — light-mode-only in Phase 4).
   Possible: multi-project comparisons, team view, cloud sync.
```

---

## Current phase scope

Phase 4 is the complete visual redesign of Helm plus two new structural modes. By the end of Phase 4, the user can:

- Open Helm and see a redesigned front door that presents two explicit mode choices (Build / Iterate)
- Start a goal-driven Build rail: ordered milestones toward a stated objective, each ending at a hard-stop checkpoint they must explicitly pass
- Park mid-rail requests on the "For later" shelf; nothing is lost, nothing derails the current step
- Complete the Build goal and see the celebration screen, then transition to freeform Iterate mode with their parked items as a backlog
- Import an existing AI-built local web app and iterate on it like any Helm project
- Rename and delete projects from the project switcher
- See a consistent back/home navigation and truthful Live badge across every screen

**The design must cover both chunks (delivered separately but designed together):**
- **Chunk 1:** New token system + reskin of all core screens + Build mode (rail, checkpoint, shelf, celebration, transition)
- **Chunk 2:** Two-door front entrance redesign + Iterate mode surfaces (scratch, import flow) + Project management (rename, delete) + remaining reskin

**Chunk 1 daily slice:** The builder opens Helm, sees the redesigned rail for their project, notices a checkpoint waiting from yesterday's session. They test the feature in the embedded live preview, leave a bug comment (it becomes a board card), and click "Continue." The next step unlocks and the session feed begins. They see a "Saved for later" note appear when they type a large unrelated feature request.

---

## Forward-compatibility callouts

- **Dark mode (Phase 5).** The Phase 4 token system is explicitly designed to support dark mode in a future phase. Every semantic token name (`--color-bg`, `--color-surface`, `--color-ink`, etc.) must be designed with a future dark-mode counterpart in mind. Do not use token names that are light-mode-specific (`--light-bg`, `--white-surface`). The token names in the spec are the canonical names — the design should use these exactly. Leave room in the layout for a future dark/light toggle affordance (e.g., a slot in the project switcher header or window chrome) without designing the toggle itself.

- **Multi-project comparisons (Phase 5+).** The left-rail project switcher currently shows a list. A future phase may introduce a comparison or overview panel in the main area. The switcher's visual language should feel like a nav rail, not a full-bleed page — it must be flanked by main content, not the primary visual statement.

- **Collaborative / shared view (Phase 5+).** Not in scope, but the design should not assume single-user-only affordances baked into the visual language (e.g., a large "My Projects" heading that would need to change to "Team Projects" later). Neutral labels and neutral chrome age better.

- **Richer celebration / milestone history (Phase 5+).** The Build→Iterate Celebration screen introduces the concept of a "journey strip" — a collapsed history of the completed rail. In future phases, this strip could expand into a full Progress Timeline. Do not treat the journey strip as a throwaway; design it as a compressed but legible artifact that a future phase can unfold.

- **Session-level diff / review (Phase 5+).** A possible future feature is reviewing what changed in each session (diff-style, but human-readable). The session feed area within the Build Rail should be designed to accommodate a future "What changed" panel below or beside the feed — avoid layouts that seal the session feed into a fixed-height container with no room to grow.

---

## Screen groups — what each does and why

### Group A: Front Door (Two Doors)

**Job.** The user's first decision in Helm is mode selection: do they want to build something new from scratch (goal-driven rail) or iterate on something that exists (freeform board, fresh or imported)? This screen is the product's front door and must make that choice completely clear — not as a form, not as a menu, but as a legible fork in the road.

**Why it exists in Phase 4.** Phases 1–3 used a single entry point: one input field ("What do you want to build?"). Phase 4 introduces two structurally different modes with different user flows. The front door must communicate the difference between them — a user should understand "Build" vs "Iterate" without reading documentation.

**User stories served.** C1-S1, C2-S1

**Key behaviors the design must encode.**
- The initial state shows two large, clearly differentiated option areas — not a dropdown or a tab bar. Each option should have enough visual weight to feel like a destination, not a filter.
- Clicking "Iterate on an app" does NOT navigate away — it reveals two sub-options inline (Start fresh / Bring an existing app). This is a secondary choice within the same view, not a full navigation change.
- No text input on this screen — the mode choice comes first; the input (goal sentence or first feature) comes after the choice is made.
- The brand mark is visible here (this is the "brand" moment — logo, app name, maybe a one-line descriptor).

**States that surprise.**
- After clicking "Iterate on an app": the view reveals sub-options. This could be an expand/reveal, a slide-out, or a secondary panel — the design owns the pattern, but it must not navigate away.
- Empty state is N/A — this screen is always shown to new users or users who explicitly navigate to it.

**Forward-compat for this group.** If future phases add a third mode or a "Recent projects" shortcut at the front door, the layout must accommodate it without a redesign. Design the two doors as a pattern that scales to three — not a pair of large fixed tiles that can't absorb a third.

---

### Group B: Build Rail

**Job.** Once the user picks "Build something new" and describes their goal, the agent generates a rail of ordered milestones toward that goal. This is the user's primary home screen while in Build mode: they see where they are in the sequence, watch the current step's session run, and know what's coming next. Nothing happens out of order. The sequence is the product.

**Why it exists in Phase 4.** Phases 1–3 used an unordered board (items in status columns). Phase 4's Build mode replaces that with a linear rail for goal-driven work — the rail communicates progress toward a stated goal, not just "what's done and what isn't."

**User stories served.** C1-S2, C1-S3, C1-S5, C1-S6, C1-S8, C1-S9, C1-S10, C1-S11, C1-S12, C1-S13

**Key behaviors the design must encode.**
- The rail is a vertically ordered list of milestone steps. Each step has: step label ("Step N of M"), title, status indicator.
- **Current step:** expanded — shows the live session feed embedded within it. The session feed is the same feed component used in the Scoped Session screen (reskinned, not redesigned).
- **Locked steps:** collapsed, visually muted, with a lock indicator. The user can see them but not interact.
- **Completed steps:** collapsed, checkmark, visually quiet.
- The "For later" shelf is a collapsible panel beside or below the rail. It is visible when it has items, collapses entirely when empty (no visible affordance when empty).
- Steering input (the user can type to the agent mid-step) is available within the current step. This is the same input that triggers triage — small fixes go now, large/unrelated requests park on the shelf with a "Saved for later" note.
- The two-column layout persists from prior phases: narrow left rail (project switcher) + main area (build rail). The Build Rail is the main area content.
- **Session stop:** a Stop action is reachable from within the session feed of the current step.
- **Live badge:** visible on the project in the left rail only when the dev server is actually running and healthy. Must disappear when the server is stopped.
- **Navigation:** there is always a clear way to navigate back to the project switcher / front door from within the Build Rail.

**States that surprise.**
- When the user types a large feature request: a "Saved for later" toast or inline note appears — the input was accepted but parked. The rail step did not change.
- When the current step's session fails: the step shows a failed state with retry option inside the expanded step area.
- **Wizard Q&A state persistence:** if the user built the rail by answering a Q&A wizard (the goal-scoping phase), switching projects and returning must restore exactly the wizard state they left. This is a bug fix for Phase 4 — the design must show that state is always present, never lost or reset.
- When all steps are complete: the Celebration overlay appears (see Group D).

**Forward-compat for this group.** The journey strip (a compact collapsed version of the rail) appears after the celebration screen and will be visible in Iterate mode as a "what we built" reference. Design the step history within the rail as a pattern that can collapse to a strip — each step is a node, not a unique snowflake shape.

---

### Group C: Rail Checkpoint

**Job.** After each milestone step completes, the agent stops and waits. The user must test the feature, optionally report bugs, and explicitly click "Continue" to advance. This is a hard stop — the agent does not proceed on its own. The checkpoint screen communicates: "Something was just built. You need to verify it before the next thing starts."

**Why it exists in Phase 4.** The prior flow (Phases 1–3) had a Reviewable-Result Checkpoint for individual board items. Phase 4's rail checkpoint is the equivalent for a milestone-level build step — bigger scope, same hard-stop philosophy. Without it, the Build mode loses its core guarantee (nothing proceeds without the user's approval).

**User stories served.** C1-S4

**Key behaviors the design must encode.**
- Checkpoint UI appears within the current step's expanded area — not a modal, not a full-page navigation. It overlays or replaces the session feed within the step.
- Shows: what was built (screenshot if available from the embedded live preview, otherwise a text summary from the session), a "Report a bug" input, and a prominent "Continue to the next step →" button.
- "Continue" is the ONLY way to advance — there is no auto-advance, no timeout.
- Bug reporting: a bug typed into the checkpoint input appears as a card on the board (board = the existing card system, wired to the session). The checkpoint remains open after a bug is reported — the user can report multiple bugs, then continue.

**States that surprise.**
- The checkpoint appears after the session feed. The transition from "session running" to "checkpoint shown" must be clear — the user needs to know the step is done and it's their turn now.
- Multiple bugs reported: the checkpoint shows a running list of reported bugs, each confirmed as a board card. The "Continue" button is always present — the user is not blocked by open bug reports.

**Forward-compat for this group.** The checkpoint is a milestone-level gate. Future phases may add richer review artifacts (diff summary, decision log for this step). The checkpoint area should feel like a flexible container, not a fixed-height panel.

---

### Group D: For-Later Shelf

**Job.** When the user types a request during a rail step and the agent triages it as "large, unrelated, or scope-expanding," the request is parked here. The shelf is a visible, persistent record that nothing is lost. The user can see parked items at any time during Build mode.

**Why it exists in Phase 4.** Rail-focused work creates a tension: the user may think of feature ideas mid-build, but acting on them would derail the current step. The shelf resolves this tension — type anything, the agent decides, and if it parks the request, you can see it and trust nothing was discarded.

**User stories served.** C1-S5, C1-S6

**Key behaviors the design must encode.**
- Collapsible panel beside (or below) the Build Rail — visible when it has items, invisible (collapsed entirely) when empty.
- Items shown as a simple list: item title + a faint "Saved for later" label. Visually distinct from rail steps.
- Items are NOT interactive during Build mode (they're not cards the user can act on yet). They carry over automatically to the Iterate board when the mode transitions.
- When a new item is parked: a brief "Saved for later" note appears (could be inline, could be a toast, design owns the pattern) — so the user knows their input was heard.

**States that surprise.**
- Empty state: the panel is completely hidden — no "Your shelf is empty" message, no empty container. It only exists visually when it has content.
- Items carry over: when the celebration completes and the project transitions to Iterate mode, the shelf items appear on the Iterate board as backlog cards. The shelf itself is no longer shown in Iterate mode.

---

### Group E: Build→Iterate Celebration

**Job.** The moment when the user completes their last rail step and approves the checkpoint, the product must mark the transition explicitly. This is a reward, a punctuation mark, and a mode change all in one. The experience should feel earned — the user set a goal and achieved it.

**Why it exists in Phase 4.** Mode transitions in Helm are structural. Without an explicit celebration, the user would not know that the project moved from "I'm building toward a goal" to "I'm maintaining and extending." The celebration makes this legible.

**User stories served.** C1-S7, C1-S8

**Key behaviors the design must encode.**
- Full-screen overlay (not a panel, not a banner — it takes over the window temporarily).
- Large, centered text: "Your app now does what you set out to build."
- A compact journey strip appears below the text — the collapsed rail history. Each completed step is a node. This is a visual record of what was built.
- A single CTA: "Open your app →" or "Start iterating →" (the spec allows either — design picks the copy and visual weight).
- After the CTA: the overlay dismisses, the project transitions to Iterate mode, the freeform board loads with "For later" items as backlog cards. The rail collapses to the journey strip (visible but compact in the main area or a dedicated history surface).

**States that surprise.**
- The journey strip must be legible as a record but not dominate the Iterate board. Design it to feel like a footer note — present, meaningful, not competing with the active board.
- After the CTA, there is no back — the user is now in Iterate mode permanently for this project. The design should not include an undo or "go back to Build" affordance.

---

### Group F: Import Flow

**Job.** An existing AI-built local web app can be brought into Helm for iteration. The user points Helm at a folder; Helm scans it, derives how to run it, shows a preview, and puts the project on the Iterate board. This is a 4-step flow: pick folder → scan results → live preview → board.

**Why it exists in Phase 4.** Phase 4's "Iterate on an app" mode has two entries: start fresh (scaffold as first step) and bring an existing app. Many users already have apps built via terminal + Claude Code that they want to continue iterating on inside Helm. Import is the bridge.

**User stories served.** C2-S3, C2-S4

**Key behaviors the design must encode.**
- Step 1: folder picker triggers the native OS dialog — this is a standard `<input type="file">` or Electron `dialog.showOpenDialog`. The design shows the trigger affordance, not the dialog itself.
- Step 2: after scan, Helm shows what it found — detected start command, detected port, confidence indicator. If `confidence: 'low'`, the UI pauses for user confirmation (don't auto-proceed). If `found: false`, show manual override fields (enter start command and port manually).
- Step 3: Helm starts the dev server and shows the live preview. The same Live Preview pane from Phase 2 is used — this is a reskin, not a new component.
- Step 4: board opens in Iterate mode — same board as Phase 3, reskinned.
- Error states: "no manifest found" → manual override form; "start failed" → human-readable error message with retry and cancel.

**States that surprise.**
- Confidence "low": the scan found something, but it's not certain. The UI must communicate this clearly — not just a badge, but a sense that the user's confirmation matters before Helm starts the server.
- Manual override: the user types a start command and port. Helm validates by actually attempting to start. This is a multi-step async validation — the design must show an in-progress state between "user submits command" and "server confirmed running."

---

### Group G: Project Switcher (Redesigned)

**Job.** The left rail shows the list of projects, each with their mode badge, background status, and last-updated time. The user can open a project, rename it inline, or delete it (with confirmation). This is the navigation anchor of the entire app.

**Why it exists in Phase 4.** The project switcher existed in Phase 1 but was a minimal component. Phase 4 adds: mode badges (Build/Iterate), project rename, project delete with confirmation, and a full reskin to the new token system.

**User stories served.** C2-S5, C2-S6, C2-S7, C2-S8, C1-S10, C1-S11, C1-S12

**Key behaviors the design must encode.**
- Each project entry in the left rail shows: name, mode badge (Build/Iterate), background status dot (Live = dev server running), last-updated time.
- **Rename:** clicking a project name enters inline edit. No modal, no separate settings page.
- **Delete:** a delete action appears on hover or via context menu. Clicking it shows a confirmation — the design must make the confirmation feel appropriately cautious (this is irreversible).
- **Live badge:** only shown when the project's dev server is actually running and healthy. This is a bug fix from Phase 3 — the badge previously showed even when no server was running.
- **Mode badge:** shows "Build" or "Iterate" for each project. Existing pre-modes projects (pre-Phase 4): unfinished plan → "Build" at the matching step; finished → "Iterate."
- **Session stop:** the stop control is reachable from within the session view (Group B or the existing Scoped Session screen), not from the project switcher. The switcher shows status — it doesn't control the session.
- **Empty state:** the switcher is only shown when projects exist. Empty-project users go directly to the Front Door.

**States that surprise.**
- Rename mode: the project name becomes an editable input inline in the rail. Clicking away or pressing Enter commits. The rail must handle long names gracefully — either truncate with a tooltip or allow wrapping.
- Delete confirmation: must be designed to feel irreversible. A separate confirm button (not an "undo" pattern) — "Delete project" with a destructive color signal.
- Mode badge for migrated projects: a pre-Phase 4 project's mode is computed from its state. The badge must match reality immediately — no stale state.

**Forward-compat for this group.** Future phases may add: sorting/filtering projects, project grouping (tags or folders), or a more expanded project overview panel. The left rail switcher should be designed as a collapsible component — its visual language should support being narrowed to icon-only (if the product ever adds a full left-panel expansion for project details).

---

### Group H: Reskinned Existing Screens

**Job.** Every screen from Phases 1–3 must be reskinned to the new token system by the end of Phase 4. No behavioral changes — only the visual treatment changes. The token swap is the whole task for each of these screens.

**Why it exists in Phase 4.** The Phase 4 redesign is total. A partially reskinned product (some screens warm cream + Fraunces, others clean Inter) would feel incoherent. All screens must converge on the same token system.

**Screens to reskin (all behavioral constraints unchanged):**
- Build-Spine Board (board tab, session cards, spine items)
- Scoped Session (feed, steering input, question queue)
- Decision Prompt (structured card)
- Live Preview Pane (chrome/surround)
- Point-and-Fix Overlay
- Decisions / Progress / Docs panels

**Key behaviors the design must encode.** These screens have no new behaviors in Phase 4. The only design decision is the token mapping — how each existing element maps to the new token system. The design brief's palette and typography direction below applies uniformly to all of these.

---

## User stories

### Front Door (Two Doors)

**C1-S1:** As a first-time user opening Helm, I see a calm, modern front door that presents two clear options — "Build something new" and "Iterate on an app" — without any playful or maximalist visual noise. [Front Door (Two Doors), Step 1]

**C2-S1:** As a user at the front door who picks "Iterate on an app", I see two sub-options: "Start fresh" and "Bring an existing app." [Front Door (Two Doors), Step 1]

### Build Rail

**C1-S2:** As a builder who picks "Build something new", I describe my goal in a sentence and see an ordered rail of milestones generated toward it, labeled "Step N of M to your first working app." [Start in Build mode, Step 1–2]

**C1-S3:** As a builder watching my rail, I see steps locked in order — the next step only unlocks when the current step's checkpoint has been explicitly passed. I can never skip ahead. [Start in Build mode, Step 3]

**C1-S5:** As a builder who types a request mid-rail, the agent triages it: small fixes and questions are handled immediately in the current session; large, unrelated, or scope-expanding requests are parked on the "For later" shelf automatically. A visible note appears: "Saved for later." [Start in Build mode, Step 4]

**C1-S6:** As a builder, I can see the "For later" shelf beside the rail at any time — nothing I typed is lost, even if it was triaged out. [Start in Build mode, Step 4]

**C1-S8:** As a builder whose celebration ends, my project transitions to Iterate mode and the freeform board opens with any parked "For later" items already on the backlog. [Start in Build mode, Step 5]

**C1-S9:** As a user viewing any screen, I see the new calm, sleek visual language: neutral tokens, clean typography, deliberate use of accent color (guiding, bold where it counts), no chunky outlines, no maximalist palette. Every previously shipped screen is reskinned. [product.md — Total Redesign]

**C1-S10:** As a user on any screen, the "Live" badge on a project in the side rail shows only when that project's dev server is actually running and healthy. [product.md — Project Management, session stop bug]

**C1-S11:** As a user running a session, I can stop it. A "Stop" action is reachable from the session view. After stopping, the session's status updates and the Live badge clears if applicable. [product.md — session stop bug]

**C1-S12:** As a user on any screen, I can navigate back to the board or home via a consistent navigation control — there is no screen where I'm stuck without a way back. [product.md — back/home navigation bug]

**C1-S13:** As a builder mid-rail who switches to another project and comes back, the wizard Q&A state (my answers, current question) is exactly as I left it — nothing is lost. [Start in Build mode, Step 2 — wizard state bug]

### Rail Checkpoint

**C1-S4:** As a builder whose current step finishes, I land at a hard-stop Rail Checkpoint screen — I test what was just built, report any bugs, and must explicitly click "Continue to the next step" to advance. The agent does not advance on its own. [Start in Build mode, Step 3]

### Build→Iterate Celebration

**C1-S7:** As a builder who completes the last rail step and approves its checkpoint, I see the Build→Iterate Celebration screen — "Your app now does what you set out to build." The rail collapses to a compact journey strip. [Start in Build mode, Step 5]

### Import Flow

**C2-S3:** As a user who picks "Bring an existing app", I point Helm at a local folder that contains an AI-built web app. Helm scans the folder, derives a run manifest (start command + port), shows me what it found, and starts the live preview. [Start in Iterate mode — import, Step 1–2]

**C2-S4:** As a user who imported an existing app, I can iterate on it like any Helm project: the board, sessions, and point-and-fix all work exactly as they do for a project started in Helm. [Start in Iterate mode — import, Step 3]

### Project Switcher / Project Management

**C2-S5:** As a user looking at the project switcher, I can rename a project. [product.md — Project Management]

**C2-S6:** As a user looking at the project switcher, I can delete a project. A confirmation is shown before deletion. [product.md — Project Management]

**C2-S7:** As an existing Helm user (pre-modes) whose project had an unfinished plan, I open Helm and my project is in Build mode, positioned at the correct rail step matching my progress. [product.md — Two Modes, existing projects]

**C2-S8:** As an existing Helm user (pre-modes) whose project was done, I open Helm and my project is in Iterate mode on the freeform board. [product.md — Two Modes, existing projects]

### Iterate Mode — Scratch

**C2-S2:** As a user who picks "Start fresh", my first feature request and the app scaffold are built as a single step — I do not see a blank canvas or a separate setup screen before the build begins. When it completes, the freeform Iterate board is ready. [Start in Iterate mode — scratch, Step 1–2]

---

## Visual style

The Phase 4 Helm redesign lives in a specific register: **dense-enough to feel like serious software, clean enough to feel calm**. This is not editorial minimalism (which would feel too sparse for a tool where real-time build status matters) and not dashboard density (which would overwhelm a non-technical user). The target is the "executive cockpit" register: calm authority, clear hierarchy, deliberate information density. Every element that exists does so because it carries information — nothing is decorative.

The primary register is **product UI** (not brand, not editorial). The brand moment is the front door and the celebration screen — those can carry more visual weight. Everything else is a tool surface: clear, functional, confident. The Live Preview pane is its own embedded world — it deliberately shows the user's app unmodified, so the Helm chrome around it must recede (thin border, no drop shadow on the preview frame itself).

The two-column layout (narrow left rail + main area) creates a natural dual register: the left rail is compact, dense, navigational; the main area is breathing, focused, expansive. The left rail should feel like a nav sidebar; the main area should feel like the workspace, not a panel.

---

## Tone and mood

- **Calm.** The user is often mid-build, waiting for results, or making decisions under uncertainty. The design must not add to that cognitive load. Every surface should feel settled — nothing blinking, flashing, or screaming for attention unless something genuinely needs it.
- **Guiding.** The experience should always make the next action obvious. Empty states, locked steps, progress indicators — all of these are guidance devices. The accent color (guiding blue) carries this responsibility: it appears on primary CTAs, active states, and "what to do next" affordances.
- **Trustworthy.** The user is delegating real work to an AI. The design must radiate reliability — clean type, honest status indicators, nothing that looks like it might lie about the current state. The Live badge being truthful (C1-S10) is a microcosm of this: if the badge is wrong, trust erodes.
- **Earned depth.** Surface-level simplicity with discoverable power below. The shelf collapses when empty. Locked steps are muted but visible. The journey strip is compact but present. The tool earns the right to show more information over time — it doesn't front-load it.

---

## Palette direction

The token set is defined in `requirements.md` as the canonical Phase 4 token system. The design must implement these exact tokens (they are not suggestions — they are the spec):

**Primary mode:** Light mode only (dark mode is Phase 5+, but the token names are designed to support it).

**Foundation:** Cool-leaning stone neutrals. The page background (`--color-bg: #F8F7F5`) is off-white with a slight warm undertone — not pure white (too cold), not cream (too warm). Card surfaces (`--color-surface: #FFFFFF`) are pure white, creating a gentle layer separation. Nested surfaces (`--color-surface-raised: #F2F1EF`) are slightly darker than the page background.

**Accent reserved for:** Primary action, active states, links, and navigation "you are here" indicators. The accent color (`--color-accent: #2563EB`) is guiding blue — saturated enough to be clear, not so electric that it feels urgent or alarming. It should appear precisely: CTAs, step "in progress" indicators, active nav items, "Continue →" buttons. Everywhere the design needs to say "this is what to do next."

**Semantic colors used sparingly and precisely:**
- Success green (`--color-success: #16A34A`): completion states, checkmarks, the celebration screen. Not used for "active" or "selected" — only for "done."
- Warning amber (`--color-warn: #D97706`): needs-attention states, low-confidence scan results. Not used for decoration.
- Danger red (`--color-danger: #DC2626`): error states, delete confirmation. Not used for emphasis outside these contexts.
- Soft washes (`--color-accent-soft`, `--color-success-soft`, etc.): background tints for status chips and inline callouts. Not used for large-area fills.

**Border discipline:** Hairline borders only (`1px`, `--color-border: #E4E2DE`). No `2px` or chunky outlines. No drop shadows on borders. Elevation uses the shadow tokens (`--shadow-sm/md/lg`), not borders. The retired `brut`/`brut-2` classes used chunky outlines — Phase 4 does not.

---

## Typography direction

**UI text (everything except code/paths):** Sans-serif only. Inter is the UI font family — it is part of the token spec (`--font-ui`). It should be used at its most legible weights: Regular (400) for body and secondary text, Medium (500) for labels and UI controls, Semibold (600) for headings and strong emphasis. Bold (700) is reserved for moments of high hierarchy — the large text in the celebration screen, a step label that needs to stand out. No display serif. No handwritten or expressive typefaces.

**Code/paths/literals:** JetBrains Mono (`--font-mono`). Used for: detected start commands in the import flow, port numbers in the import scan results, any file path shown to the user. Never used for decorative monospace aesthetic.

**Hierarchy discipline:** The design tool should build hierarchy via scale and weight contrast, not color. The accent color can be used for links and active states — not as a primary hierarchy signal (the hierarchy signal is size × weight). A step label ("Step 3 of 5") sits above a step title — the label is smaller and lighter (ink-3), the title is larger and heavier (ink).

**Retired fonts:** Fraunces (Phase 3 display serif) and Space Grotesk are both retired. Any Phase 3 file that uses these as reference — do not carry them forward.

---

## References

- **Linear** — for layout density discipline and the "serious software for serious people" register. Linear's card hierarchy (compact row + status chip) and left-rail navigation are the closest feel match for Helm's board and switcher. NOT a reference for color (Linear is dark-mode-first; Helm is light-mode).
- **Notion** — for the calm, structured feel of a workspace tool. Notion's use of whitespace as hierarchy (not decoration) and its neutral-heavy palette are close to the Phase 4 target. NOT a reference for feature richness or sidebar complexity.
- **Vercel dashboard** — for the "production status at a glance" feel of the project switcher and the Live badge / status dot pattern. Vercel's status indicators (deployment status, live vs. failed) are a reference for the Live badge's visual language.

---

## Information architecture

| Element | Phase 1–3 | Phase 4 (Build mode) | Phase 4 (Iterate mode) |
|---------|-----------|---------------------|------------------------|
| Left rail | Brand + project switcher (simple list) | Brand + project switcher (mode badges, status dots, rename/delete) | Same |
| Main area | Build-Spine Board (kanban columns) | Build Rail (ordered step list) | Freeform Board (same kanban, reskinned) |
| Session view | Scoped session — full-screen replace | Embedded in current step of rail | Same as Ph1–3 (full-screen or panel) |
| Live Preview | Ph2: right half of main area | Still accessible; checkpoint uses it | Same |
| Top of main area | — | Step progress label ("Step N of M") | Mode label ("Iterate" + journey strip if applicable) |
| Side tabs | Decisions / Progress / Docs (Ph3) | Same tabs, accessible in Build mode | Same |
| Front door | Single input ("What do you want to build?") | Two-door mode choice | — (returns to two-door if no project) |
| Celebration | — | Full-screen overlay (Build → Iterate transition) | — |
| For-later shelf | — | Collapsible panel within Build Rail | — (items promoted to board backlog) |

---

## Screen checklist

Every item below must appear in the returned design file. The checklist is the coverage contract.

### GROUP A — Front Door
1. Front Door — default state (two options: Build / Iterate)
2. Front Door — after "Iterate on an app" is clicked (sub-options: Start fresh / Bring an existing app)

### GROUP B — Build Rail
3. Build Rail — default state (current step expanded with session feed; prior steps completed; next steps locked)
4. Build Rail — step in progress (session feed running, steering input available)
5. Build Rail — step locked (muted, lock indicator)
6. Build Rail — step completed (collapsed, checkmark)
7. Build Rail — "Saved for later" note appears (triage result: large request parked)
8. Build Rail — For-later shelf visible (has items)
9. Build Rail — For-later shelf empty (panel fully collapsed)
10. Build Rail — step session failed (failed state within expanded step, retry option)
11. Build Rail — wizard Q&A state restored (returning to project mid-Q&A, state intact)

### GROUP C — Rail Checkpoint
12. Rail Checkpoint — default state (what was built, Report a bug input, Continue button)
13. Rail Checkpoint — bug reported (bug confirmed as board card, checkpoint remains open)
14. Rail Checkpoint — multiple bugs reported (running list, Continue always present)

### GROUP D — Build→Iterate Celebration
15. Celebration — default state (full-screen overlay, large text, journey strip, CTA)
16. Celebration — after CTA (overlay dismissed, Iterate board loads, parked items as backlog)

### GROUP E — Import Flow
17. Import Flow — Step 1: folder picker trigger
18. Import Flow — Step 2: scan results, confidence high (auto-proceed path)
19. Import Flow — Step 2: scan results, confidence low (confirmation required)
20. Import Flow — Step 2: no manifest found (manual override form)
21. Import Flow — Step 3: starting dev server (in-progress state)
22. Import Flow — Step 3: live preview loaded
23. Import Flow — Error: start failed (human-readable error, retry + cancel)

### GROUP F — Project Switcher (Redesigned)
24. Project Switcher — default state (project list with mode badges, status dots, last-updated)
25. Project Switcher — rename inline (project name as editable input)
26. Project Switcher — delete confirmation
27. Project Switcher — Live badge active (dev server running)
28. Project Switcher — Live badge absent (no dev server or stopped)
29. Project Switcher — session stop control (accessible from session view)

### GROUP G — Reskinned Existing Screens
30. Build-Spine Board — reskinned (new tokens, no old classes)
31. Scoped Session — reskinned (feed, steering input, question queue)
32. Decision Prompt — reskinned
33. Live Preview Pane — reskinned chrome/surround
34. Point-and-Fix Overlay — reskinned
35. Decisions / Progress / Docs panels — reskinned

---

## Coverage notes

**Constitution constraints:**
- Desktop-only Electron app — no mobile breakpoints, no responsive layout required.
- Light mode only in Phase 4 — token names support future dark mode, but no dark-mode variants are designed in this phase.
- No code, terminal output, git UI, or diff view is ever shown to the user — any screen that might surface these must hide them at the Electron main-process layer.

**Design system anchors:**
- The status dot (Live badge / session status indicator) is a shared primitive — it appears in the project switcher left rail AND potentially on step cards in the Build Rail. Design it once as a reusable shape.
- The session feed is the same component used in the Scoped Session screen AND embedded inside the current Build Rail step. Design it as a reusable panel, not a screen-specific element.
- The checkpoint "Continue →" button is the most prominent CTA in the product during Build mode. Its visual weight (accent color, size, placement) is a design anchor — every other CTA in the product should feel appropriately subordinate to it.
- Card shape in the board: used at full-card size (Build-Spine Board), as a compact row (project switcher), and as a collapsed strip (journey strip). Design the card shape to survive all three scales.

**Most-forgotten surfaces:**
- The For-later shelf empty state (must fully collapse — no ghost container).
- The rail step in its "completed, collapsed" state (must be visually quiet but still scannable — not invisible).
- The session feed in "stopped" state (the session was stopped by the user — status updates, feed freezes).
- The journey strip in Iterate mode (compact, legible, not competing with the board — easy to forget this exists after the celebration).
- Import Flow Step 2 "confidence low" state (a nuanced state that's easy to miss — the user needs to understand why Helm is pausing).

**Forward-compat reminders mapped to specific screens:**
- Screens 1–2 (Front Door): design the two options as a scalable pattern — a future Phase may add a third mode or a "Recent projects" shortcut.
- Screens 3–11 (Build Rail): leave room in the session feed area for a future "What changed" panel (Phase 5+).
- Screen 15 (Celebration / Journey Strip): design the strip to unfold into a fuller history — it should feel like a compressed timeline, not a fixed decoration.
- Screen 24 (Project Switcher): design the left rail to support future narrowing to icon-only (if Phase 5+ adds an expanded project overview panel).
