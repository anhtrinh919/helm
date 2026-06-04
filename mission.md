# Mission — Helm

## Purpose
Helm turns building software into an executive dashboard: a non-developer describes what they want, makes decisions, and watches it get built — never touching code.

## Target Users
Non-developers and product/project managers who can already get an AI to build things but lose the thread in a long terminal chat. First and primary user: the project owner (a non-developer who today drives an SDD "/build" stack via Claude Code in a terminal). Open-source — anyone can download and run it on their own Claude subscription.

## Vision & Tone
Calm, in-control, and legible. Helm is an executive dashboard — everything important at a glance, decisions surfaced when they're needed, the rest handled automatically. The experience is "watch it get made": a user approves a plan, the board updates in real time, and results land without any terminal output or code in sight. Nothing about the experience should feel like software development. It should feel like managing a project.

## Success Looks Like
A non-developer opens Helm, describes an app they want, answers a few questions, and watches a build board populate with features and their status — all without opening a terminal, reading a file, or making a technical decision. When something needs attention (a question, a bug, a decision), it appears as a card they can act on directly. When a build completes, they see the live app in the same window and can point at what to fix next.

## Design Tool
external-pencil

## Master User Journey

### Core Jobs (JTBD)
- When I have an idea for an app, I need to drive an AI to build it without touching code, so I can ship real software as a non-developer.
- When a build is in motion, I need to see what's done, what's left, and what's broken at a glance, so I stay in control without keeping notes on the side.
- When something looks wrong in the app, I need to point at it and ask for a fix, so I can correct it without explaining where it is.
- When I make product decisions, I need them captured and acted on, so I don't re-decide or lose the reasoning.

### Named Flows

**Start a project:**
1. Describe the idea (Ph1)
2. Agent grills & plans (Ph1)
3. Approve the plan (Ph1)
4. Agent builds — board updates live (Ph1)

**Steer the build (core loop):**
1. Watch the board — see what's done, what's in progress, what's left (Ph1)
2. Review what's been made (Ph1 board → Ph2 live preview)
3. Make a decision when prompted (Ph1)
4. Agent continues (Ph1)

**Fix something:**
1. Spot an issue in the live preview or as a bug on the board (Ph2 preview + Ph3 point-and-fix)
2. Point at it and leave a comment (Ph3)
3. A focused agent picks it up and fixes it (Ph3)
4. Verify it's resolved (Ph3)

**Run many at once:**
1. Each action (comment, bug report, tweak, feature request) spawns a separate context-loaded scoped session (Ph3 + Ph4)
2. All sessions fix/build in parallel (Ph4)
3. Results land back on the board (Ph4)
