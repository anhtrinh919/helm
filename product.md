# Product — Helm

## End-State Vision
At end-state, Helm is a single macOS desktop window that replaces the terminal entirely for non-developer builders. The left rail shows the project board — a live list of features, bugs, and decisions, each as a card with a clear status. The main area is context-sensitive: during a build it shows a live session feed (the agent working); once a phase is done it shows the running app itself. The user never reads code, never opens a terminal, and never touches git. They read cards, make decisions, and watch the board change. The experience is dense but not cluttered — every piece of visible information is actionable or load-bearing. Parallel sessions in Phase 4 make the board feel like a team arriving at answers simultaneously.

## Screen Inventory

| Screen | Purpose | Phase |
|--------|---------|-------|
| Project Board | See all features, bugs, and decisions at a glance; primary home screen | Ph1 |
| New Project Wizard | Describe idea, answer agent questions, approve plan before build starts | Ph1 |
| Session Feed | Watch a named, scoped agent session work in real time (streaming output, tool activity, questions) | Ph1 |
| Decision Prompt | Answer an agent-surfaced question or approve a plan — rendered as a structured card, not raw chat | Ph1 |
| Live Preview | The actual running app embedded in the Helm window, not a prototype | Ph2 |
| Point-and-Fix Overlay | Click any element in the Live Preview, leave a comment or bug, spawn a targeted fix session | Ph3 |
| Decisions Log | Read-only log of every decision made, with reasoning captured | Ph4 |
| Progress Timeline | Visual history of what was built, when, and what changed | Ph4 |
| Docs View | Auto-generated living documentation for the project being built | Ph4 |

## Navigation Structure

Project Board → [start new project] → New Project Wizard → [approve plan] → Session Feed
Project Board → [click feature/bug card] → Session Feed (scoped to that item)
Project Board → [agent asks question] → Decision Prompt → [answer] → back to Project Board
Session Feed → [phase complete] → Live Preview (embedded, same window)
Live Preview → [click element] → Point-and-Fix Overlay → [submit] → Session Feed (fix session)
Project Board → [decisions tab] → Decisions Log (Ph4)
Project Board → [progress tab] → Progress Timeline (Ph4)
Project Board → [docs tab] → Docs View (Ph4)

## Core Feature Surface

- **Project Board:** see all features (to-do / in-progress / done), bugs, and pending decisions as cards; the primary view the user lives in
- **Scoped Named Sessions:** each task (feature, bug fix, decision) runs as its own isolated agent session with the right context loaded — no cross-contamination between tasks
- **Live Session Feed:** watch the active agent work in real time — streaming output, tool calls, and any questions it needs answered
- **Decision Cards:** agent questions surface as structured prompts (buttons, approval cards) not raw chat — the user clicks, not types, for routine decisions
- **Live Preview (Ph2):** the actual app being built runs inside Helm — not a screenshot, not a link, the real local app
- **Point-and-Fix (Ph3):** click any element in the live preview, annotate it, spawn a targeted agent session that has full visual context
- **Parallel Sessions (Ph4):** each action on the board spawns its own context-loaded session; all run simultaneously; results land back as resolved cards

## Named Flows

- **Start a project:** Describe idea (Ph1) → Agent grills and plans (Ph1) → Approve the plan (Ph1) → Agent builds, board updates live (Ph1)
- **Steer the build (core loop):** Watch the board — done / in-progress / left (Ph1) → Review what's made (Ph1 board, Ph2 live preview) → Make a decision when prompted (Ph1) → Agent continues (Ph1)
- **Fix something:** Spot an issue in live preview or as a bug card (Ph2 preview + Ph3 point-and-fix) → Point at it and leave a comment (Ph3) → Focused agent picks it up and fixes (Ph3) → Verify resolved (Ph3)
- **Run many at once:** Each action spawns a separate context-loaded scoped session (Ph3 + Ph4) → All sessions fix/build in parallel (Ph4) → Results land back on the board (Ph4)

## Phase 1 Skeleton Scope

- **Project Board** — live (full Phase 1 implementation: feature cards, bug list, status states, pending decisions)
- **New Project Wizard** — live (full Phase 1: idea input, agent Q&A, plan approval)
- **Session Feed** — live (full Phase 1: streaming agent output, tool-call activity, inline decision prompts)
- **Decision Prompt** — live (full Phase 1: structured question cards, approval buttons)
- **Live Preview** — stubbed (Phase 2: shell placeholder in the board; no embedded app yet)
- **Point-and-Fix Overlay** — stubbed (Phase 3: not designed in Phase 1)
- **Decisions Log** — stubbed (Phase 4: tab visible but empty)
- **Progress Timeline** — stubbed (Phase 4: tab visible but empty)
- **Docs View** — stubbed (Phase 4: tab visible but empty)
