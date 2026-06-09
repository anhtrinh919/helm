# Design Brief — Phase 1: The Cockpit & the Journey (External tool: Figma)

Hand this whole file to your design tool as context, then design every screen on the checklist at the bottom. This brief sets intent and constraints; you (the designer) own component, layout, spacing, and interaction-pattern decisions.

## Design intent

The one thing a non-tech user should feel: **"A non-tech user can feel confident to start building something in Helm — they always know the 'next step' to do even without any dev experience, they can dig into the controls and find more powerful features when they feel more confident, and they can always see the exact features or changes they want come to life."**

So: always-obvious next step; calm confidence, never overwhelm; depth that reveals itself as the user grows; and a constant, visible line from "what I asked for" to "what's now on screen." *Every visual decision should be weighed against this.*

## Product context — full vision

**What it is.** Helm is a no-code app studio for non-developers — a desktop-class app that runs locally on the user's own machine and on their own Claude subscription. The user describes what they want, watches it get built through a guided journey, points at what's wrong to fix it, gives the app real logins and data, and ships it to a live URL — never seeing code, a terminal, or a token meter. (Runtime is a local engine with a web UI; in development it's a browser at localhost, shipped it's a double-click app — but this is invisible to the user and irrelevant to the design: design one calm window.)

**What it replaces.** Replit, Bolt, and Lovable — the current "AI builds your app" tools. Helm's user is moving away from: IDEs with code in their face (Replit, Bolt), one long chat thread that becomes unreadable and loses the plot (all three), a token meter that trains you to fear prompting (Bolt especially), and a second monthly subscription on top of the AI they already pay for (all three).

**What it explicitly isn't.** Not an IDE, not a code editor, not a developer tool. Not a chat app. Not a dashboard of charts/metrics. Not a marketing site. The user manages a *project that produces software*, the way an executive manages work — they never touch the machinery.

**The end-state form factor.** One calm window. A front door with two clear doors (build new / iterate). A guided "journey" rail for new builds (an ordered spine of milestones with a testable checkpoint at each). A "cockpit" for free iteration — a board of work cards, each showing in plain language what it's *for* (its outcome), sitting right beside the live running app. Side access to Decisions / Progress / Docs. Over later phases the same window grows a Publish control, a data/accounts setup, error-recovery prompts, version history, and import — so the layout must leave room for those without rework.

**The operator's day.** Opens Helm. Picks "Build something new," types a goal in a sentence. Helm asks a few plain questions, shows a plan, and lays out a journey: step 1 of 5. Each step builds something; at its checkpoint the user tries it in the live preview, says "looks good," and continues. A stray idea mid-build ("also add a dark mode") gets parked on a visible "For later" shelf so the journey doesn't derail. At the end: a small celebration, and the journey folds into a quiet strip while the cockpit opens for free iteration — now the user points at a heading in the live app, edits the text in place, and watches it update.

## Patterns to avoid

**The outgoing Helm look (retire it completely).** The current app is "v4 Maximalist": warm cream/parchment background, chunky 2–3px black borders ("brut"), offset hard shadows, sticker-like lime/pink/violet blocks, playful display serif. It reads playful, kid-like, toy-ish. The redesign replaces this entirely — new tokens, new type, new everything. Do **not** carry over: cream/parchment fields, hard black borders on everything, offset sticker shadows, candy accent blocks, bouncy/loud treatment.

**Competitor anti-patterns (don't drift toward these):**
- **IDE density (Replit/Bolt).** File trees, code panes, terminals, tabs-of-tabs. Helm shows none of this. Resist any layout that feels like a developer workspace.
- **The opaque chat thread (all three).** A single scrolling chat as the only surface. Helm uses cards + a cockpit; chat-like feeds exist only inside a single session, never as the primary navigation.
- **Token-meter / upgrade-nag chrome (Bolt/Lovable).** Where competitors put a usage meter or "Upgrade" button, Helm puts a *calm reassurance* ("Running on your Claude subscription"). Never make it look like a meter, a warning, or a sales prompt.
- **Generic AI-app chrome.** Purple/violet gradient backgrounds, glowing borders, decorative blobs, glassmorphism-as-default, identical rounded card grids, hero-metric template. Avoid all of it.

## Roadmap at a glance

```
0. Phase 0 — Foundation (shipped): the no-code engine — sessions, board, live preview, point-and-fix, real docs, parallel work, and the data layer for modes/journey/shelf.
1. Phase 1 — The Cockpit & the Journey [CURRENT]: total redesign + two-door front door + guided build journey + the cockpit (outcome on every card) + point-and-fix incl. inline text edit + project management. Leaves room for everything below.
2. Phase 2 — Ship It: one-click publish to a real URL.
3. Phase 3 — Real Backend (local): add logins, a database, saved data in plain language.
4. Phase 4 — Stay Unstuck: Helm catches broken screens and offers a fix; version history + rollback.
5. Phase 5 — Bring It In: import an app started elsewhere and continue.
```

## Current phase scope

Phase 1 delivers Helm's whole new identity and ships in **two dogfoodable chunks**:
- **Chunk 1:** the new visual language + the two-door front door + the full guided build journey (ordered milestones with "step N of M", a hard-stop testable checkpoint per step, a visible "For later" shelf for parked detours, an escape hatch to freeform, and a journey-complete celebration that folds into a strip) + the persistent "Running on your Claude subscription" reassurance.
- **Chunk 2:** the cockpit board (every card shows its plain-language outcome, beside the live app) + point-and-fix with inline text editing + project management (rename / delete / reorder) + the reskin of every remaining screen.

At the end of Phase 1, a non-dev can: open Helm and choose how to start; move through a guided journey toward a working app, testing at each checkpoint; live in a cockpit where every card says what it's for next to the live app; and click any element in the live app to fix it or edit its text in place.

**Grounding principle (shapes the journey's content):** the guided journey is not invented — it mirrors the real build practice in plain language: *understand the idea → scope what you want → plan it → build the look → build the function → review & try it.* The journey's step names, checkpoint prompts, and helper copy should read as that practice translated for a non-dev — never as technical jargon.

## Forward-compatibility callouts

Design Phase 1 so these later additions slot in without moving things around:

- **Publish / Ship (Phase 2).** A primary "Publish" action and a ship panel (URL, who-can-reach-it, start/stop) land next phase. Reserve a clear, intentional slot in the top-level chrome of the cockpit for a primary "Publish" action — leave it visibly empty in Phase 1, don't fill it with something that must move later.
- **Data & Accounts (Phase 3).** Adding logins/saved data becomes a thing the user asks for; there will be a "Data" surface and a plain-language data browser. The side access (Decisions / Progress / Docs) should be designed as an extensible group that can gain a "Data" entry.
- **Error recovery (Phase 4).** Helm will proactively flag a broken live preview and offer a one-click fix. The live-preview area needs a place for a calm, non-alarming "something broke — fix it?" affordance to appear later (the preview's "snag" state in Phase 1 is display-only; design it so an action could be added).
- **Version history / rollback (Phase 4).** A timeline of changes with revert. Leave room near the cockpit/session for a "history" entry to appear.
- **Import (Phase 5).** The "Bring an existing app" door is shown in Phase 1 as "coming soon"; design the door so it can become active later without restructuring the front door.

## Screen groups — what each does and why

**Front door (entry).** Where the user chooses how to start. Two clear doors: "Build something new" (guided journey) and "Iterate on an app" (with "Start fresh" and a coming-soon "Bring an existing app"). Must make the *right* choice obvious for a confident non-dev. Returning users also need quick re-entry to existing projects from here. Key behavior: the import sub-door is visibly present but inert ("coming soon"). The "Running on your Claude subscription" reassurance lives here too.

**New project wizard (scope the idea).** The front of the build practice: a single sentence → a few plain scoping questions (one at a time, "Question N of M") → a reviewable plan of milestones → approve. This must feel like a friendly interview, not a form. Note: the wizard's "Question N of M" must be visually distinct from the journey's "Step N of M" — they are different things.

**Build journey (the guided spine).** The heart of Chunk 1. An ordered list of milestones with a clear "Step N of M to your working app." The current step is active; past steps are done; future steps are locked. Each step ends at a **hard-stop checkpoint**: "here's what I built — try it in the preview — looks good? continue." There is a visible "For later" shelf (a parked-requests home) and an escape hatch ("leave the journey" → freeform). States that surprise: a step can *fail mid-step* (plain error + retry/leave), a checkpoint's *next step can fail to start* (retry), and a mid-journey request can be *parked* (shows on the shelf, not the board). Forward-compat: the journey folds into a compact strip after completion — design both the full journey and the collapsed strip.

**For-later shelf.** A calm home for parked requests so nothing derails the build and nothing is lost. List of parked items; each can be promoted to the board or dismissed. Empty state should reassure, not feel broken.

**Journey complete (celebration → fold).** A genuine but tasteful moment: "Your app now does what you set out to build." Then the journey collapses to a strip and free iteration opens. Avoid garish confetti-overload; calm pride.

**Cockpit board (free iteration — Chunk 2).** The home surface after a journey, or for imported/from-scratch projects. A spine of work cards beside the live running app. **Every card shows, in plain language, what it's for (its outcome)** — e.g. "lets a visitor book a slot" — right on the card face, not hidden. Cards have states: planned / up-next / building / needs-you / done (done settles into quiet history). A blocking decision rises to a "needs you" headline. This is differentiator #4 made visible: the answer to "did it build what I asked?" is always on screen, beside the live result.

**Scoped session (watch one card work).** Opening an in-flight card shows its work in plain-English narration (not a terminal), a way to steer mid-build, and a queue of questions the agent has asked. Reskin of an existing surface.

**Live preview + point-and-fix.** The real running app embedded in the window. The user can click any element and either "describe a fix" or — for text — "edit the text right here, in place." This must feel direct and immediate (the bar to beat is Lovable's visual edit). Preview states: live / building (show last-good dimmed) / not-yet / snag (display-only this phase).

**Project management.** Rename, delete, reorder projects from the project list; a *truthful* "Live" status (only shows live when something is actually running) with a working stop control; consistent back/home navigation.

**Side access — Decisions / Progress / Docs.** Existing real-data views; reskin to the new language. Design as an extensible group (Data joins later).

**"Running on your Claude subscription" signal.** A small, calm, persistent line/badge present across the app, where competitors put a token meter or upgrade nag. Never a modal, never a meter, never dismissable.

**Stubbed (design the shell + "Coming in Phase N", no real content):** Publish/Ship panel (P2), Data & Accounts setup + Data browser (P3), Error-recovery prompt + Version history/rollback (P4), Import flow (P5). These lock the IA so later phases fill them in rather than redesign.

## User stories (verbatim — by group)

### Front door / wizard
- I can open Helm and see two distinct doors — "Build something new" and "Iterate on an app" — so I know immediately which path is right for me. [Chunk 1]
- I can pick "Build something new", describe my goal, answer scoping questions, and approve a plan, so Helm understands what I want before it builds. [Chunk 1]
- I can pick "Iterate → start fresh" and have my first request scaffold the app and build the first feature in one step. [Chunk 1]
- I can see the "Bring an existing app" door (coming-soon) so I know the path exists. [Chunk 1]

### Build journey / shelf
- I can see my goal broken into an ordered list of milestones with a "Step N of M" counter. [Chunk 1]
- I can hit a hard-stop checkpoint after each milestone — test, report, explicitly continue. [Chunk 1]
- I can make a mid-journey request that's triaged: small fixes now, large/unrelated parked on a visible For-Later shelf. [Chunk 1]
- I can open the For-Later shelf anytime and see every parked request. [Chunk 1]
- I can use an escape hatch to leave the rail for the freeform board anytime. [Chunk 1]
- I can see a journey-complete celebration when the last step passes its checkpoint. [Chunk 1]
- I can see a persistent "Running on your Claude subscription" signal at all times. [Chunk 1]

### Cockpit / point-and-fix / project mgmt
- I can see, on every cockpit card, a plain-language description of what it's for, so I always know what's been built. [Chunk 2]
- I can click any text element in the live app and edit its text in place. [Chunk 2]
- I can click any element in the live app and describe a fix. [Chunk 2]
- I can rename / delete / reorder projects; delete asks me to confirm. [Chunk 2]
- I can see a truthful "Live" status and stop it with a single control. [Chunk 2]

## Visual style

**Direction: a calm, modern "command room" for a confident non-expert.** Sleek and quietly premium — the feeling of serious software that respects you, with a guiding hand. Bold where it counts (the current step, the primary action, the live result), quiet everywhere else. Easy to grasp on first open (one obvious next action per screen), with depth that reveals itself (secondary controls, the shelf, side panels) as confidence grows. Not corporate-cold, not playful-toy — warm-neutral and assured.

**Dual register to hold in mind:** (1) *guiding/ceremonial* surfaces — front door, journey, checkpoints, celebration — which can be more spacious, focused, and a touch expressive to build confidence; (2) *working* surfaces — cockpit board, session, preview — which are denser and more utilitarian but still calm. Don't let the working surfaces become an IDE, and don't let the guiding surfaces become a marketing page.

## Tone and mood

- **Calm** — the user is a non-expert; nothing should spike anxiety (this is why there's no token meter and errors are plain-language).
- **Guiding** — there is always one obvious next step; the UI leads without condescending.
- **Assured / premium** — quietly high-craft, so the user trusts it with real work.
- **Legible** — every card, step, and state answers "what is this and what do I do" at a glance.
- **Quietly proud** — moments of accomplishment (checkpoints passed, journey complete) feel earned, not gamified.

## Palette direction

- **Primary mode:** light, warm-neutral foundation (a calm off-white/sand that is NOT the old cream-parchment, and NOT stark clinical white). A considered dark mode is welcome but light is primary. Tint the neutrals (don't use pure grey).
- **Foundation:** neutral and restrained — the canvas recedes so the live app and the active step stand out.
- **One confident accent** reserved for the guiding thread: the current step, the primary action, "this is where you are / what to do next." Use it sparingly so it always means "act here."
- **Semantic color** (success/needs-you/failed/parked) scarce and meaningful — never decorative. "Needs you" and "failed" must read instantly without shouting.
- Avoid candy-bright sticker blocks and avoid the generic-AI purple/violet gradient.

## Typography direction

- A clean, modern, humanist **sans for UI and body** — confident and legible, not techy-monospace, not playful-rounded.
- A **distinctive display/heading** treatment for the guiding surfaces (front door, journey step titles, checkpoint, celebration) to give moments weight — could be a refined serif or a strong sans; restrained, premium, not decorative.
- **Mono only** where it genuinely helps (rare; e.g. a URL) — never as the body voice.
- Hierarchy through scale + weight contrast (a clear ≥1.25 step between levels), not color tricks. The "Step N of M", the card title, and the card outcome each need a clear, distinct level.

## References (feel, not copy)

- **Linear** — for calm, premium restraint and confident hierarchy on a working surface (without its developer-ness).
- **Things / Stripe dashboard** — for legible, quiet, "serious but human" surfaces and one-clear-action focus.
Use these for *feel* (restraint, hierarchy, calm), not layout cloning.

## Information architecture

| Element | Phase 1 | Phase 2 | Phase 3 | Phase 4–5 |
|---|---|---|---|---|
| Front door (two doors) | A | A | A | A (+ import door active P5) |
| Journey rail (build mode) | A | A | A | A |
| Journey strip (after complete) | A | A | A | A |
| Cockpit board (outcome on cards) | A | A | A | A |
| Live preview + point-and-fix | A | A | A | A (+ error-recovery affordance P4) |
| Primary top action slot | empty (reserved) | Publish | Publish | Publish |
| Side group (Decisions/Progress/Docs) | A | A | A + Data | A + Data + History |
| "Running on your Claude" signal | A | A | A | A |
| Project management (rename/delete/reorder) | A | A | A | A |

## Screen checklist (Phase 1 — coverage contract)

Cover every state below. **LIVE** = design fully (all states + interactions). **STUB** = design the shell + a clear "Coming in Phase N" indicator, no real content.

```
GROUP A — FRONT DOOR & WIZARD (LIVE)
1.  Front Door — default (two doors; import sub-door "coming soon"; Claude signal)
2.  Front Door — returning user (existing projects listed for quick re-entry)
3.  Wizard — idea input
4.  Wizard — scoping Q&A (loading "thinking")
5.  Wizard — scoping Q&A (question ready, "Question N of M", back)
6.  Wizard — plan review (ordered milestones w/ plain-language purpose; approve/revise)
7.  Wizard — plan review (revising)
8.  Wizard — error (plain-language, retry)

GROUP B — BUILD JOURNEY & SHELF (LIVE)
9.  Journey — active, step in progress ("Step N of M", current/done/locked, shelf badge, escape hatch)
10. Journey — mid-journey request handled now ("Fixing now")
11. Journey — mid-journey request parked ("Parked on your For-Later shelf")
12. Journey — checkpoint (hard stop: what was built, "try it", optional feedback, "Looks good — continue")
13. Journey — checkpoint feedback submitted (confirmation, continuing)
14. Journey — step failed mid-step (plain error, retry / leave)
15. Journey — checkpoint next-step won't start (retry)
16. Journey — escape hatch confirmation ("leave the journey? shelf carries over")
17. Journey — degenerate / couldn't-plan (retry)
18. For-Later Shelf — items present (promote / dismiss)
19. For-Later Shelf — empty (reassuring)
20. Journey complete — celebration ("Your app now does what you set out to build" + single CTA)
21. Journey complete — collapsed strip (goal + "Completed", expandable to history)

GROUP C — COCKPIT, SESSION, PREVIEW, POINT-AND-FIX (LIVE)
22. Cockpit Board — build mode (collapsed journey strip + cards w/ outcome + live preview)
23. Cockpit Board — iterate mode (no strip; cards w/ outcome; add-card)
24. Cockpit Board — building (in-flight card highlighted)
25. Cockpit Board — needs-you headline (inline answer)
26. Cockpit Board — empty (build / iterate variants)
27. Cockpit Board — card failed (plain error, retry)
28. Card — the card component itself (all states: planned / up-next / building / needs-you / done-condensed) with outcome on the face
29. Scoped Session — active (plain feed, steering input, question queue, Claude signal)
30. Scoped Session — waiting on decision
31. Scoped Session — stopped
32. Scoped Session — error
33. Live Preview — live (point-and-fix entry)
34. Live Preview — building (last-good dimmed)
35. Live Preview — no app yet
36. Live Preview — snag (display-only)
37. Point-and-Fix — idle (entry affordance)
38. Point-and-Fix — element selected, text-bearing ("Describe a fix" + "Edit text here")
39. Point-and-Fix — element selected, non-text ("Describe a fix" only)
40. Point-and-Fix — describe-fix comment box (screenshot crop + input)
41. Point-and-Fix — inline text edit (in-place editable text)
42. Point-and-Fix — fix in progress (double-submit guard)

GROUP D — PROJECT MANAGEMENT & SIDE VIEWS (LIVE)
43. Project list / switcher — default (name, mode, truthful Live status, reorder, overflow)
44. Project list — rename inline
45. Project list — delete confirmation
46. Project list — no projects
47. Decisions panel (reskin; real-data + empty)
48. Progress panel (reskin; real-data + empty)
49. Docs panel (reskin; real-data + empty)

GROUP E — APP CHROME (LIVE)
50. "Running on your Claude subscription" signal (the consistent treatment, shown in context)
51. Global nav / back-home structure (consistent across surfaces)

GROUP F — FUTURE-PHASE SHELLS (STUB — shell + "Coming in Phase N")
52. Publish / Ship panel — STUB "Coming in Phase 2"
53. Data & Accounts setup + Data browser — STUB "Coming in Phase 3"
54. Error-recovery prompt — STUB "Coming in Phase 4"
55. Version history / rollback — STUB "Coming in Phase 4"
56. Import flow — STUB "Coming in Phase 5" (the front-door door is its entry)
```

## Coverage notes

- **Constitution constraints (all screens):** never show code, file paths, terminals, or git. Errors are plain English. Light mode primary (dark welcome). The "Running on your Claude subscription" signal is never a meter/nag.
- **Design system anchors:** the **work card** is the most-reused primitive — design it to work as a full card on the board AND as a compact done/history row AND as a journey milestone. The **"Step N of M" / progress** treatment recurs (journey rail + collapsed strip). The **plain-language outcome** is a first-class card element, not a caption — give it a real level in the type scale.
- **Most-forgotten surfaces:** the card's *condensed/done* state and the *empty states* (shelf empty, board empty, panels empty) — design them, they carry the "calm, not broken" feeling. The inline-text-edit state is easy to miss — it's a distinct state of the live preview, design it explicitly.
- **Forward-compat reminders mapped to screens:** reserve the primary top-action slot on the Cockpit Board (#22/#23) for Publish (P2); design the side group (#47–49) to accept a Data entry (P3); give the Live Preview (#33/#36) room for a future error-recovery action (P4).
- **The two registers:** guiding surfaces (#1–21) can breathe and carry a little ceremony; working surfaces (#22–49) stay calm-dense. Keep one type system and one palette across both.
