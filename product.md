# Product — Helm

## End-State Vision
At end-state, Helm is a single desktop window that replaces Replit/Bolt/Lovable for a non-developer. The entry is two doors: build something new (a guided journey) or iterate on an app (fresh or imported). The cockpit wraps the live app in context: a board of features and their status on one side, the running app on the other, with the outcome each piece is meant to deliver always in view. The user never reads code, opens a terminal, sees a token meter, or touches git. They describe what they want, steer the build, point at what's wrong, give the app real logins and data, and ship it to a live URL — and every change is a checkpoint they can roll back. Parallel sessions make the board feel like a team arriving at results at once. The whole thing runs locally on the user's own Claude subscription.

## Screen Inventory

| Screen | Purpose | Phase |
|--------|---------|-------|
| Front Door (Two Doors) | Entry point: "Build something new" (guided journey) vs "Iterate on an app" (fresh or import) | P1 |
| New Project Wizard | Sentence → Helm understands the goal (Q&A) → approve the plan → board/journey seeds | P1 |
| Build Journey (Rail) | Ordered, prerequisite-aware spine of milestones drawn from the goal; "step N of M to your working app" | P1 |
| Journey Checkpoint | Per-step stop — test what was just built, report anything off, explicitly continue | P1 |
| For-Later Shelf | Visible shelf for parked (triaged-out) requests — nothing lost, nothing derails the journey | P1 |
| Journey Complete Celebration | "Your app now does what you set out to build"; journey collapses to a compact strip; free iteration opens | P1 |
| Cockpit Board | The home surface: feature/bug/decision cards with status and the outcome each delivers; preview alongside | P1 |
| Scoped Session | Watch a named card's session work in plain English; steer mid-build; see the question queue | P1 |
| Decision Prompt | Answer a question or approve a plan as a structured card, not raw chat; re-openable after answered | P1 |
| Live Preview | The actual running app embedded in the window — real local app, not a prototype | P1 (exists) |
| Point-and-Fix Overlay | Click any element in the live app, say what's wrong, spawn a targeted fix session with visual context | P1 (exists) |
| Decisions / Progress / Docs | Living log of decisions, build history, and auto-generated docs — from real data | P1 (exists) |
| Project Management | Rename, delete, organize projects; truthful Live status; consistent back/home nav | P1 |
| Publish / Ship Panel | One-click put the running app on `<slug>.ta-infra.uk`; show URL, who can reach it, stop/restart status | P2 |
| Data & Accounts Setup | Ask for logins/saved data in plain language; Helm provisions local auth + database + storage and wires it | P3 |
| Data Browser | A plain-language view of what the app has stored (rows as records, no SQL) — optional inspect surface | P3 |
| Error Recovery Prompt | Helm detects a broken screen/build and offers a one-click fix — the user never finds a console error | P4 |
| Version History / Rollback | Every change is a checkpoint with a plain-language label; preview any past state; one-click revert | P4 |
| Import Flow | Point Helm at an app started elsewhere (Lovable/Bolt/Replit export or any local web app); scan → run → live preview → iterate | P5 |

## Navigation Structure

Front Door → [Build something new] → New Project Wizard → Build Journey
Front Door → [Iterate → start fresh] → first feature request (scaffold + feature as one step) → Cockpit Board
Front Door → [Iterate → bring existing] → Import Flow → Live Preview + Cockpit Board
Build Journey → [step completes] → Journey Checkpoint (stop) → [continue] → next step unlocks
Build Journey → [mid-journey request] → triage → fixed now OR parked on For-Later Shelf
Build Journey → [all steps complete] → Journey Complete Celebration → [continue] → Cockpit Board (free iteration; journey collapses to strip)
Cockpit Board → [click in-flight card] → Scoped Session
Scoped Session → [blocks on decision] → Needs-you headline on board → answer inline → resumes
Live Preview → [click element] → Point-and-Fix Overlay → [submit] → Scoped Session (fix session)
Live Preview → [Helm detects break] → Error Recovery Prompt → [accept] → fix session
Cockpit Board → [Publish] → Publish / Ship Panel → [confirm] → live URL
Cockpit Board → [ask for accounts/data] → Data & Accounts Setup → provisioned → app wired
Cockpit Board → [history] → Version History → [revert] → state restored
Cockpit Board → [decisions / progress / docs tabs] → respective living views
Project Switcher → [click project] → Cockpit Board (or Journey, if still building)

## Core Feature Surface

- **Two Doors:** every project starts explicitly as a guided **Build** journey or free **Iterate**; the journey transitions to free iteration at completion. Imported and from-scratch projects start in Iterate.
- **Build Journey (Rail):** an ordered, prerequisite-aware spine of milestones toward the stated goal; steps unlock in order; a hard-stop checkpoint per step (test, report, continue); the agent triages mid-journey requests — small fixes now, large/unrelated parked.
- **For-Later Shelf:** a visible home for parked requests; carried into the Iterate board as backlog at transition.
- **Cockpit Board:** features, bugs, and decisions as cards with status (Planned / Up next / Building / Needs you / Failed / Done) **and the outcome each is meant to deliver** — the answer to "did it build what I asked?" is always on screen. Done items collapse to quiet history.
- **Scoped Named Sessions:** each card runs as its own isolated session with the right context loaded; a steering input allows mid-build interrupt/redirect/look-closer; questions queue with pending/answered state and are re-openable.
- **Needs-You Headline:** a genuine blocking decision rises to the top of the board; the user answers without opening the card.
- **Live Preview:** the real local app runs inside Helm — not a screenshot, not a link.
- **Point-and-Fix:** click any element in the live app, annotate it, spawn a targeted session with full visual context — at least as direct as Lovable's visual edit, and the bar is to feel even more immediate.
- **Proactive Error Recovery:** Helm watches the running app for breaks (blank screen, build/runtime errors) and offers a one-click fix; the user never has to find or paste an error. This is the universal non-dev gap none of the competitors close.
- **Version History / Rollback:** every change is a checkpoint with a plain-language label; preview any past state and revert in one click.
- **Local Backend:** ask for logins or saved data in plain language; Helm provisions a local auth + database + file storage and wires the app to them — no cloud account, no code shown. A plain-language Data Browser lets the user see what's stored.
- **Ship It:** one click publishes the locally-running app to a real URL on the user's own Cloudflare domain (`<slug>.ta-infra.uk`) via a tunnel — the app keeps running locally; stop/restart/status from the same panel.
- **Import:** bring an app started elsewhere (Lovable/Bolt/Replit export or any local web app) — scanned, run, previewed live, iterated like any Helm project.
- **Parallel Sessions:** each action spawns its own context-loaded session; all run at once; results land back on the board.
- **Free on your Claude:** no token meter, no second subscription, always Claude — surfaced honestly in the UI as a standing property, not an upsell.
- **Project Management:** rename, delete, organize; truthful Live status with a real stop control; consistent back/home navigation.
- **Visual language:** calm, sleek, modern, guiding — bold where it counts; easy to grasp, depth to master; applied across every screen.

## Named Flows

- **Build something new:** Pick "Build something new" → describe the goal → Helm understands it, lays out the journey → steps unlock in order, checkpoint each → mid-journey requests triaged now/parked → celebration → free iteration.
- **Iterate — from scratch:** Pick "Iterate → start fresh" → first feature request scaffolds the app as one step → freeform board from then on.
- **Iterate — import:** Pick "Iterate → bring existing" → point at the folder → Helm scans + figures out how to run it → live preview + board.
- **Steer the build:** Watch the board (done / building / left, each with its outcome) → review via checkpoint → answer decisions from the Needs-you headline → steer mid-build → continue.
- **Fix something:** Spot an issue or get a Helm-flagged break → point at it / accept the offered fix → focused session resolves it → verify, roll back if needed.
- **Give it logins and data:** Ask in plain language → Helm provisions local auth + DB + storage and wires the app → inspect via the Data Browser.
- **Ship it:** Click Publish → app goes live at `<slug>.ta-infra.uk` while running locally → manage URL/access/status.
- **Run many at once:** Each action spawns a scoped session → all run in parallel → results land on the board.

## Already-Shipped Foundation (Phase 0)
The no-code cockpit engine already exists and is the floor every new phase builds on: the desktop shell, scoped named sessions wired to the live Claude engine, the project board, the embedded Live Preview, the Point-and-Fix overlay, the real-data Decisions/Progress/Docs views, durable background sessions, and parallel sessions. The data-layer foundation for modes, the journey/rail, the For-Later shelf, session stop, wizard persistence, and import-scan also exists but is not yet surfaced in the redesigned UI — Phase 1 makes it visible. (Roadmap Phase 0.)
