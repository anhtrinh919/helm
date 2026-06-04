# Product — Helm

## End-State Vision
At end-state, Helm is a single macOS desktop window that replaces the terminal entirely for non-developer builders. The entry is a single sentence — "What do you want to build?" The left rail shows the build-spine — an ordered, dependency-aware sequence of items, each with a clear status. The main area is context-sensitive: when an item is open it shows its own scoped session feed; once a phase is done it shows the running app itself (Live Preview). The user never reads code, never opens a terminal, and never touches git. They type a sentence, steer the build, and watch the spine update. The experience is dense but not cluttered — every visible element is actionable or load-bearing. Parallel sessions in Phase 4 make the spine feel like a team arriving at results simultaneously.

## Screen Inventory

| Screen | Purpose | Phase |
|--------|---------|-------|
| Front-Door Sentence | "What do you want to build?" — the app's entry point for new projects | Ph1 |
| Project Switcher | Switch between active projects; see live background status per project | Ph1 |
| Build-Spine Board | See all items in order (Planned / Up next / Building / Needs you / Failed / Done); primary home screen | Ph1 |
| New Project Wizard | Sentence → agent grills → approve plan → board seeds | Ph1 |
| Scoped Session | Watch a named item's agent session work in real time; steer mid-build via interrupt/redirect/look-closer; see question queue | Ph1 |
| Decision Prompt | Answer an agent question or approve a plan — rendered as a structured card, not raw chat; re-openable after answered | Ph1 |
| Reviewable-Result Checkpoint | "Here's what I built — does this look right?" screenshot/click-through per finished item | Ph1 |
| Live Preview | The actual running app embedded in the Helm window, not a prototype | Ph2 |
| Point-and-Fix Overlay | Click any element in the Live Preview, leave a comment or bug, spawn a targeted fix session | Ph3 |
| Decisions Log | Read-only log of every decision made, with reasoning captured | Ph4 |
| Progress Timeline | Visual history of what was built, when, and what changed | Ph4 |
| Docs View | Auto-generated living documentation for the project being built | Ph4 |

## Navigation Structure

Front-Door Sentence → New Project Wizard → [approve plan] → Build-Spine Board
Project Switcher → [click project] → Build-Spine Board
Build-Spine Board → [click in-flight item] → Scoped Session
Scoped Session → [agent blocks on decision] → Needs-you headline on board
Build-Spine Board → [Needs-you headline] → answer inline → build resumes
Scoped Session → [item completes] → Reviewable-Result Checkpoint → [approve] → next item Up next
Live Preview → [click element] → Point-and-Fix Overlay → [submit] → Scoped Session (fix session)
Build-Spine Board → [decisions tab] → Decisions Log (Ph4)
Build-Spine Board → [progress tab] → Progress Timeline (Ph4)
Build-Spine Board → [docs tab] → Docs View (Ph4)

## Core Feature Surface

- **Build-Spine Board:** see all items in dependency order (Planned / Up next / Building spotlight / Needs you / Failed / Done); done items collapse to quiet history; the primary view the user lives in
- **Front-Door Sentence:** "What do you want to build?" — a single sentence starts a project, not a form
- **Scoped Named Sessions:** each item (feature, bug fix, decision) runs as its own isolated agent session with the right context loaded — no cross-contamination between items; includes a steering input for mid-build interrupts, redirects, and look-closer requests
- **Question Queue:** agent questions for each session form a visible queue with pending / answered state; answered questions are re-openable — decisions are not immutable
- **Needs-You Headline:** when the agent is blocked on a genuine decision, it rises to the most prominent position on the board — the user can answer directly without opening the item
- **Reviewable-Result Checkpoint:** when an item finishes, the user sees what was actually built (screenshot/click-through) and approves or flags it before the next item starts
- **Durable Background Sessions:** sessions are background processes that survive project-switch, window-refresh, and app quit/relaunch; background work stays visible in the rail
- **Live Preview (Ph2):** the actual app being built runs inside Helm — not a screenshot, not a link, the real local app
- **Point-and-Fix (Ph3):** click any element in the live preview, annotate it, spawn a targeted agent session that has full visual context
- **Parallel Sessions (Ph4):** each action on the board spawns its own context-loaded session; all run simultaneously; results land back as resolved items

## Named Flows

- **Start a project:** Type a sentence (Ph1) → Agent grills and plans (Ph1) → Approve the plan (Ph1) → Agent builds, spine updates live (Ph1)
- **Steer the build (core loop):** Watch the spine — done / building / left (Ph1) → Review what's made via checkpoint (Ph1) → Make a decision when prompted from the Needs-you headline (Ph1) → Steer mid-build via interrupt/redirect/look-closer (Ph1) → Agent continues (Ph1)
- **Fix something:** Spot an issue via checkpoint or as a failed item (Ph1) → Point at it in live preview and leave a comment (Ph3) → Focused agent picks it up and fixes (Ph3) → Verify resolved (Ph3)
- **Run many at once:** Each action spawns a separate context-loaded scoped session (Ph3 + Ph4) → All sessions fix/build in parallel (Ph4) → Results land back on the spine (Ph4)

## Phase 1 Skeleton Scope

- **Build-Spine Board** — live (full Phase 1: items in Planned/Up-next/Building/Needs-you/Failed/Done states; one Building spotlight at a time; Needs-you headline; done items collapsed; dependency legibility; step labels in "Step N of M: <name>" format)
- **Front-Door Sentence** — live (full Phase 1: single sentence prompt as the entry for new projects)
- **New Project Wizard** — live (full Phase 1: sentence → agent Q&A → plan approval → board seeds with step labels)
- **Scoped Session** — live (full Phase 1: per-item plain-English feed, steering input with interrupt/redirect/look-closer, question queue with re-open)
- **Decision Prompt** — live (full Phase 1: structured question cards, re-openable after answered)
- **Reviewable-Result Checkpoint** — live (thin slice, Phase 1: screenshot/click-through per finished item; approve or flag)
- **Durable Background Sessions** — live (full Phase 1: sessions persist across quit/relaunch; background project status visible in rail)
- **Live Preview** — stubbed (Phase 2: shell placeholder; "Unlocks in Phase 2")
- **Point-and-Fix Overlay** — stubbed (Phase 3: not designed in Phase 1; "Unlocks in Phase 3")
- **Decisions Log** — stubbed (Phase 4: tab visible; "Unlocks in Phase 4")
- **Progress Timeline** — stubbed (Phase 4: tab visible; "Unlocks in Phase 4")
- **Docs View** — stubbed (Phase 4: tab visible; "Unlocks in Phase 4")
