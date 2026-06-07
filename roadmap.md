# Roadmap — Helm

## Phases

1. **Phase 1 — The Executive Dashboard** ✓ COMPLETE: Delivers the real, polished desktop app shell with scoped named sessions and a visible project board (features, bugs, decisions) at a glance, with the first session wired to the live Claude Agent SDK so the user can actually drive a build. This is the day-one switch trigger: a non-developer can start a project, watch the board update, and answer decision prompts — all without a terminal. Proves the engine plumbing as a byproduct (first task group wires a real session end-to-end before any further design work stacks up).

2. **Phase 2 — Watch It Get Made** ✓ COMPLETE: The actual app being built runs live inside the Helm window — not a prototype, not a demo, the real local app embedded as a Live Preview pane. The user can see what they're getting as it gets built, not just read card statuses.

3. **Phase 3 — Point and Fix** ✓ COMPLETE: The user clicks any element in the live preview, leaves a comment or bug report, and a focused agent session picks it up and fixes just that element. The fix session has full visual context (which element, what it looks like) — the user does not need to describe location or describe the problem in code terms. (Ad-hoc post-review: Decisions, Progress, and Docs tabs wired to real DB queries; parallel sessions enabled — previously planned as the primary Phase 4 scope.)

4. **Phase 3.5 — The Rail** ← NEXT: The presentation layer is reorganized around the Stage 1 / Stage 2 distinction. A first-time user building toward their original goal gets a linear rail — a fixed ordered spine of milestones drawn from the original build goal, shown as a journey ("3 of 5 steps to your first working app"). The rail is prerequisite-enforced: steps unlock in order. When the last rail step completes, an explicit celebration marks "Your app now does what you set out to build" — the Stage 1 → Stage 2 transition. Stage 2 users get the existing kanban board (freeform, parallel sessions, point-and-fix cards, user-driven backlog). The engine (sessions, agent, live preview, point-and-fix, DB) is unchanged — presentation-layer reorganization plus a DB marker for where Stage 1 ends. HARD REQUIREMENT: each rail phase ends at a dogfoodable checkpoint — a non-technical user can test, report bugs, request features; large/unrelated mid-rail requests are deferred (captured as backlog cards), not acted on. Bundled bug fixes: "stopped" session still shows Live with no way to stop; no background dots; no consistent back/home navigation.

5. **Phase 4 — Project Management (reduced scope):** Manage projects (rename, delete, move), remaining tab polish, generalized prerequisite support for the Stage 2 board if needed. Note: parallel sessions + real-data side tabs shipped early during Phase 3 wrap — Phase 4 is now a focused housekeeping + project-management phase.

## Global Out of Scope

- Code editor or IDE panel — Helm never shows code to the user
- Terminal panel — all agent output is rendered as structured session feed, never raw terminal
- Exposing git, branches, diffs, or pull requests to the user — these are hidden scaffolding
- Charging money, paid API subscription, or paid tier — free and open-source, bring-your-own-subscription
- Cloud hosting, multi-tenant SaaS, or any user accounts — local-only
- Auto-deploy to production hosting — the built app runs locally; Helm does not push to any provider
- Any form of multi-user or team collaboration — single-user desktop app
