# Roadmap — Helm

## Phases

1. **Phase 1 — The Executive Dashboard** ✓ COMPLETE: Delivers the real, polished desktop app shell with scoped named sessions and a visible project board (features, bugs, decisions) at a glance, with the first session wired to the live Claude Agent SDK so the user can actually drive a build. This is the day-one switch trigger: a non-developer can start a project, watch the board update, and answer decision prompts — all without a terminal. Proves the engine plumbing as a byproduct (first task group wires a real session end-to-end before any further design work stacks up).

2. **Phase 2 — Watch It Get Made** ✓ COMPLETE: The actual app being built runs live inside the Helm window — not a prototype, not a demo, the real local app embedded as a Live Preview pane. The user can see what they're getting as it gets built, not just read card statuses.

3. **Phase 3 — Point and Fix** ← NEXT: The user clicks any element in the live preview, leaves a comment or bug report, and a focused agent session picks it up and fixes just that element. The fix session has full visual context (which element, what it looks like) — the user does not need to describe location or describe the problem in code terms.

4. **Phase 4 — The Super-Team:** Every user action (comment, bug report, tweak, feature request) spawns its own context-loaded scoped session, all running in parallel, results landing back on the board as resolved cards. Side tabs (Decisions Log, Progress Timeline, Docs View) surface the full project history. The "super-team" feeling is purely visual — parallel sessions, not team-management overhead.

## Global Out of Scope

- Code editor or IDE panel — Helm never shows code to the user
- Terminal panel — all agent output is rendered as structured session feed, never raw terminal
- Exposing git, branches, diffs, or pull requests to the user — these are hidden scaffolding
- Charging money, paid API subscription, or paid tier — free and open-source, bring-your-own-subscription
- Cloud hosting, multi-tenant SaaS, or any user accounts — local-only
- Auto-deploy to production hosting — the built app runs locally; Helm does not push to any provider
- Any form of multi-user or team collaboration — single-user desktop app
