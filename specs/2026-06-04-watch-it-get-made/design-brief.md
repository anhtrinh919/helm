# Design Brief — Helm Phase 2: Watch It Get Made

**Track:** external-pencil
**Phase:** 2
**Spec:** specs/2026-06-04-watch-it-get-made/
**Date:** 2026-06-04
**Visual source of truth:** `pencil/v0.1.pen` (v4 "Maximalist" frame set — warm cream + ink + semantic accents)

---

## Design intent

*"I can already use what I asked for."* The one thing the user should walk away feeling, the first time they watch their app get built in Helm, is **tangible payoff** — the thing they described in a sentence is right there in the window, rendered, clickable, working. Not a screenshot. Not a progress bar pretending to be the app. The actual running thing, ready to touch.

This reframes the whole pane. The Live Preview is not a *status display* — it's the **delivery**. Every other state in this phase (the calm "building…" veil, the "fixing a snag" recovery, the blocked card) exists only to protect that one feeling: when the app finally appears, it must feel finished, solid, and theirs — never fragile, never half-rendered, never technical. The in-between states are the stagehands; the running app is the show.

*Every visual decision should be weighed against: does this make the finished app feel like something I can already use — or does it make the building feel like something I have to supervise?*

---

## Product context — full vision

**What it is.** Helm is a macOS desktop application — a single window, run locally on the user's own Claude subscription — that turns building software into an executive dashboard for a non-developer. The user types a sentence describing an app, answers a few questions, approves a plan, and watches a build-spine board populate and execute. They never read code, open a terminal, or touch git. Phase 1 delivered that dashboard: the front-door sentence, the build-spine board, scoped per-item sessions with a plain-English feed, decision cards, and a thin reviewable-result checkpoint. Phase 2 is the moment the dashboard stops *describing* the work and starts *showing the work itself* — the real app, running, embedded in the same window.

**What it replaces.** Today the first user drives an SDD "/build" stack through Claude Code in a terminal. Even with Phase 1's board, the *artifact* of a build — the actual app — lived nowhere the user could see it without technical knowledge: a localhost URL in a terminal, a dev server they'd have to start themselves, a browser tab they'd have to open. Phase 2 collapses that gap. The thing being built runs inside Helm, started and managed invisibly, shown the instant it's ready. The user moves from *reading that it's done* to *using it because it's done*.

**What it explicitly isn't.** The Live Preview is **not** a code-and-preview split like Bolt.new, Lovable, or v0. Those tools pair the preview with a file tree, a code editor, and a terminal — the developer's scaffolding sits right next to the app. Helm shows **only the running app**. No address bar. No URL. No "open in browser." No devtools. No console. No file list. No build log. The closest cousin is Lovable's preview pane, but even Lovable lets the user peek at code on demand — Helm never does. If the embedded app is the chrome-less window, the rest of Helm (the board, the rail, the tabs) is the frame around it — and that frame is a calm executive product, not an engineering surface.

**The end-state form factor.** At full build-out, Helm is one macOS window: a left rail with the build-spine and per-project live status; a main area that is context-sensitive — a scoped session feed when an item is open, the **running app (Live Preview)** when there's something to show; and, from Phase 3, an annotation layer *on top of* that preview for point-and-fix. Phase 2 lights up the main-area preview. It must be designed knowing that in Phase 3 the user will hover and click *into* this exact surface to leave fix-comments — so the preview is not a sealed box, it's a surface that will soon accept a transparent interaction layer above it.

**The operator's day with this product.** The user approves a plan in the morning. The board starts executing. They switch to email. Twenty minutes later they come back, click the project, and open the Live Preview tab — and there's the app: a working sign-in screen, a list that loads, a button that does something. They click around. It works. They feel the thing they asked for is already real. A build step kicks off again; the preview shows a soft "building…" veil for a moment, then swaps back to the updated app. At one point the agent hits a snag — the preview calmly says it's being handled, and a few seconds later it's back. The user never once felt like they were watching a compiler. They felt like they were being handed a product, repeatedly, as it grew.

---

## Patterns to avoid

**The IDE preview-pane.** A preview panel framed by a code editor, file tree, terminal drawer, "Inspect"/"Console" tabs, a refresh button, a responsive-breakpoint toolbar, or — worst of all — a visible `http://localhost:3000` address bar. Every one of these reframes Helm as a developer tool. The preview is the app, full-bleed in the main area, with **zero browser or editor chrome**.

**The fake-app placeholder.** A static screenshot, a Lottie animation of a generic dashboard, or a skeleton-loader pretending to be the app. When there's nothing real yet, say so plainly and calmly ("your app will appear here as it's built") — do not fake a UI. The payoff feeling dies the moment the user realizes they're looking at a stand-in.

**The alarming build state.** Red error banners, stack traces, "Build failed" in monospace, a spinner that spins forever, a half-rendered app flickering through mid-compile. The constitution's tone is calm and never alarming — the in-between states must read as *the team is handling it*, not *something broke and you should worry*.

**The progress-bar substitute.** A percentage bar, a step counter, or a log scroll standing in for the app. Those belong to the board and the session feed (Phase 1 surfaces). The Live Preview's job is to show the running app or a calm veil — not to re-narrate build progress that's already visible elsewhere.

**Gradient-heavy "AI startup" look.** Purple-to-blue gradients, glowing orbs, glassmorphism, shimmer loaders. Helm's canon is warm cream + ink with scarce semantic accents. The "building…" veil should feel like warm paper settling, not a neon loading screen.

---

## Visual canon — v4 Maximalist (ACTIVE — inherited from Phase 1)

**Source of truth:** `pencil/v0.1.pen` (the `F#`-prefixed frames; the `v1-*` token set and any `V4 —` prefixed leftover frames are superseded).

Phase 2 introduces **no new design tokens** — it reuses the Phase 1 system entirely. New work slots into the existing visual language; it does not redefine it.

### Palette (inherited)
- **Canvas:** warm cream `#FFEFD2` — base surface. Warm, paper-like.
- **Surface:** cream `#FFF7E6` — cards / panels.
- **Ink:** `#1B1208` — primary text and high-contrast elements.
- **Soft text:** `#5C4A33` — secondary / muted.
- **Violet `#6B4BEB`** — primary / brand / scoping.
- **Blue `#3A6CFF`** — active / building. *The natural home for the "building…" veil indicator.*
- **Lime `#C8F23A` (deep `#6E8500`)** — done / success / live-and-ready.
- **Pink `#FF6F91`** — needs-you / attention. *Used when a blocking problem promotes a board card.*
- **Orange `#FF7A29`** — warning / off-track. *Used sparingly in the "snag" and "blocked" states — never as a loud red error.*
- **Confetti accents** — tied to moments only (first run, plan approval, completion). The first time a real app appears in the preview is a candidate "moment" — consider whether it earns a confetti beat (designer's call), but keep it restrained: the app is the celebration, not the chrome.

### Typography (inherited)
- **Fraunces** — display / headings (editorial serif).
- **Space Grotesk** — UI / body.
- **JetBrains Mono** — literals only, and in Phase 2 **literals never appear in the preview's user-facing copy** (no URLs, no ports, no paths shown). Keep mono out of the Live Preview states entirely.

### Mood for this phase
Calm confidence around a living thing. The frame is quiet so the app can be loud. The in-between states are warm and reassuring — paper settling, a soft pulse — never a technical loader. When the app is live, the frame nearly disappears: the running app owns the main area, edge to edge, the way a finished product owns a screen.

---

## Roadmap at a glance

1. **Phase 1 — The Executive Dashboard:** Front-door sentence, build-spine board, scoped per-item sessions with plain-English feed, decision cards, durable background sessions, thin reviewable-result checkpoint — wired to the live Claude Agent SDK. Shipped.
2. **Phase 2 — Watch It Get Made [CURRENT]:** Build sessions now write a real, runnable full-stack web app to the user's machine; the stub Live Preview tab becomes the actual running app embedded in the main area, with calm building / snag / blocked states. The user watches it get made and can click around and use it.
3. **Phase 3 — Point and Fix:** A transparent annotation layer lands *on top of* the Live Preview — the user hovers, clicks an element, leaves a comment, and a focused fix session spawns with full visual context.
4. **Phase 4 — The Super-Team:** Every action spawns its own parallel context-loaded session; side tabs (Decisions Log, Progress Timeline, Docs View) surface project history; results land back on the board.

---

## Current phase scope

Phase 2 fills the **Live Preview** surface — frame `F29` in `v0.1.pen` was the Phase 1 stub ("Unlocks in Phase 2"). It becomes a real, multi-state pane. Concretely, at the end of this phase the user can:

- Open the Live Preview tab and **see their app actually running** in the Helm window.
- **Click around and use** that running app (navigate, submit a form, press a button).
- Watch the preview **refresh to the latest working version** as build steps complete.
- See a **calm "building…" veil** during in-progress steps instead of a broken screen.
- See a **calm "fixing a snag" state** when the agent auto-recovers, with no action required.
- Get a **board card** (the existing Phase 1 Needs-you / decision surface) when a problem is truly blocking or needs their decision.

The daily-use slice: *open project → open Live Preview → the app is there, running → use it → it keeps getting better as builds complete.* That loop is the phase.

Everything else (point-and-fix annotation, parallel sessions, the functional side tabs, a browsable file/docs view) is **out of scope** and lands later — but the preview must be designed to *accommodate* the Phase 3 annotation layer (see forward-compat).

---

## Forward-compatibility callouts

- **Point-and-Fix annotation layer (Phase 3) — THE critical one.** In Phase 3 the user will hover over the running app, see elements become individually targetable, click one, and leave a comment that spawns a fix session. That interaction layer sits *directly on top of* this phase's Live Preview surface. **Design the Live Preview as a surface that can accept a transparent overlay** — do not seal it inside heavy framing, a thick bezel, or chrome that would leave no room for a hover/highlight/comment layer above it. The "live app running" state in particular should feel like a clean canvas that a layer can drop onto, not a boxed-in widget. Reserve the conceptual top-layer; leave it intentionally empty in Phase 2.

- **Per-element targeting affordance (Phase 3).** The Phase 3 layer will need to visually highlight individual elements inside the app (an outline-on-hover, a click target, a comment pin). Nothing in Phase 2 should establish a competing hover/highlight treatment on the preview area that Phase 3 would have to fight or undo.

- **Reviewable-Result Checkpoint convergence (Phase 1 → Phase 2).** Phase 1's checkpoint was a *thin* screenshot/click-through ("does this look right?"). The Live Preview is the real running app and is strictly better. Design so the live preview can eventually *be* the checkpoint surface (the user reviews the running app, not a screenshot) — keep the two visually compatible so a later phase can merge them without a redesign. Do not make the Live Preview a stylistically separate island from the checkpoint.

- **Side tabs populate (Phase 4).** The tab bar that today holds Live Preview (now real) plus stubbed Decisions Log / Progress / Docs tabs will fill in Phase 4. The Live Preview tab's selected/active treatment must work as one tab among several real tabs later — not assume it's the only live tab. Keep the tab affordance part of a *set*.

- **Project persistence is user-visible only as "it's still here" (ongoing).** When the app reopens and the preview resumes, there's no "restoring…" technical state to design — it should simply be there, or calmly "nothing to show yet." Don't introduce a restore/loading screen that a future phase would have to remove.

---

## Screen groups — what each does and why

### Live Preview pane (the whole phase)

- **Job.** The user comes here to *see and use the app they're having built*. This is the delivery surface — where the abstract "build" becomes a concrete, usable product they can touch.
- **Why it exists in this phase.** Phase 1 could only describe progress (cards, feed). Phase 2 makes the artifact itself visible and interactive. Without this pane, "watch it get made" is just status text.
- **User stories served.** Stories 2, 3, 4, 5, 6 (primary: 2 and 3). Story 7 reuses the Phase 1 board surface; Story 1 and 8 are engine/persistence and surface here only as "the app is real and it's still here."
- **Key behaviors the design must encode:**
  - The pane has **five distinct states** and transitions between them *automatically* — the user never clicks "refresh" or "run". State changes arrive on their own.
  - **Building veil ↔ live app** is the core transition: while a step runs, the veil; when it finishes and the app is ready, the app — swapped in cleanly, no flicker of a broken intermediate.
  - The **live app fills the pane edge-to-edge with no chrome** — it must look like the app owns the space, not like an app inside a viewer.
  - **Snag** is a *transient, self-healing* state — it appears, reassures, and resolves back to live on its own. It is not a dead-end.
  - **Blocked** is the only state that *hands control back to the user*, and it does so through the **existing board card**, not a new modal in the preview. The preview itself just shows a calm "paused, needs you" rest state while the board card carries the action.
- **States that surprise:**
  - *"Nothing to show yet"* before the first runnable build — easy to forget; must be calm and confident, not an empty-error.
  - *Snag auto-recovery* — a state that exists only briefly and undoes itself; designers often only draw success and failure and miss the self-healing middle.
  - *Blocked-in-preview vs. card-on-board* — the blocking problem shows in **two places at once** (a calm rest state in the preview + an actionable card on the board). Both must be designed; they're a pair.
- **Forward-compat for this group.** The Point-and-Fix layer (Phase 3) lands on the *live app running* state above all — keep that state a clean, overlay-ready canvas.

---

## User stories

### Live Preview pane
**1. Real artifact:** As a builder, when my build session runs, the agent writes a real, runnable full-stack web app to my machine — not a narration — so something usable is actually being created. *(Steer the build, Step 2)*
**2. See it running (PRIMARY):** As a builder, I can open the Live Preview tab and see the app I'm building actually running in the Helm window, so I can watch it get made. *(Steer the build, Step 2)*
**3. Use it (PRIMARY):** As a builder, I can click around and use the running app inside the Live Preview pane, so I can try what's been built so far. *(Steer the build, Step 2)*
**4. Calm building veil:** As a builder, while a build step is mid-flight, the preview shows a calm "building…" veil instead of a broken or half-rendered screen, so it never feels alarming. *(Steer the build, Step 2)*
**5. Refresh to latest:** As a builder, the preview refreshes to the latest working version when a build step completes, so I always see the most current progress, not a stale version. *(Steer the build, Step 2)*
**6. Auto-recovering snag:** As a builder, when the build hits a snag the agent can fix itself, the preview calmly shows it's being handled and then recovers automatically, so I do not have to intervene. *(Steer the build, Step 2)*

### Build-Spine Board (reused Phase 1 surface)
**7. Blocking problem → board card:** As a builder, when the build hits a truly blocking problem or one that needs my decision, it appears as a card on the board I can act on — using the same Needs-you / decision card surface from Phase 1 — so I stay in control. *(Steer the build, Step 3)*

### Engine / persistence (surface only as "it's real" and "it's still here")
**8. Auto-save & resume:** As a builder, my project is saved automatically to my machine without my seeing files or paths, and reopening Helm resumes the project and its preview, so everything persists between sessions. *(Steer the build, Step 1)*

---

## Visual style

**Operator's executive dashboard — but with the spotlight handed to the product.** Phase 1 established a dense, expressive, product-grade dashboard. Phase 2's Live Preview is the one surface where the dashboard *gets out of the way*: when the app is live, the Helm frame recedes and the running app owns the main area. This is a **dual register** within one screen — the warm, expressive Helm chrome (board, rail, tabs) frames a neutral, chrome-less stage where someone else's app lives. The two must not bleed into each other: the Helm frame stays warm-cream-and-ink; the app stage is a clean, neutral surround that lets any app's own colors read true. Don't tint the running app or wrap it in Helm's palette — it's a stage, not a frame-within-a-frame.

---

## Tone and mood

- **Calm** — because the whole point is that the user is *not* supervising a compiler; the in-between states reassure rather than alert.
- **Confident** — because the payoff feeling ("I can already use this") requires the app to feel finished, not beta.
- **Warm** — because the Helm frame is paper-and-ink, and even "building…" should feel like settling, not loading.
- **Restrained** — because the app is the loud thing; the chrome around it is deliberately quiet.
- **Tangible** — because the user should feel they can reach out and touch the result, not watch it behind glass.

---

## Palette direction

- **Primary mode:** light (warm cream canvas — inherited; no dark mode).
- **Foundation:** warm neutrals (cream + ink), unchanged from Phase 1.
- **Accent reserved for:** the *building* indicator leans on **blue** (active/building, already the Phase 1 building color); *snag/blocked* lean on **orange** used sparingly and calmly — never a saturated red error; a *live-and-ready* beat may touch **lime** (done/success). Pink stays reserved for the needs-you board card (Story 7), consistent with Phase 1.
- **Saturated/semantic color reserved for:** state signaling on the *Helm chrome* only — scarce, semantic, never decorative. **The running-app stage itself stays neutral** so the embedded app's own colors aren't competing with Helm's. Discipline: Helm's accents live on Helm's frame, never painted onto the app stage.

---

## Typography direction

Inherited unchanged: Fraunces for any display/heading text in the pane's empty/veil states; Space Grotesk for any UI/body copy ("Your app will appear here as it's built", "Building…", "Fixing a snag"). **No monospace anywhere in the Live Preview** — no URLs, ports, or paths are ever shown, so JetBrains Mono has no role here. Keep veil/state copy minimal and confident — a short line, not a paragraph.

---

## References (optional)

- **Lovable's preview pane** — closest cousin for the *embedded-running-app* feel, but Helm must go further: Lovable still exposes code on demand; Helm shows only the app. Reference the *cleanliness of the running-app surface*, not the surrounding tooling.
- **Avoid referencing** Bolt.new / v0 / Replit layouts — they all pair the preview with editor + terminal + file tree, which is exactly the IDE aesthetic to pattern *away* from.

---

## Information architecture

| Element | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| Left rail (build-spine) | Live | Live (unchanged) | Live | Live |
| Main area — scoped session | Live | Live (unchanged) | Live | Live |
| Main area — Live Preview tab | Stub ("Unlocks in Phase 2") | **Live (5 states)** | Live + annotation layer | Live |
| Tab bar (Preview / Decisions / Progress / Docs) | Preview stub + 3 stubs | **Preview real** + 3 stubs | Preview real + 3 stubs | All real |
| Point-and-Fix overlay (on preview) | — | — (reserve room) | Live | Live |
| Needs-you / decision card (board) | Live | **Reused for blocking build errors** | Live | Live |

---

## Screen checklist

**THIS PHASE ONLY.** Every item must appear in the returned design.

```
GROUP A — Live Preview pane (main area, F29 stub becomes real)
1. Live Preview — "nothing to show yet" (before first runnable build): calm, confident empty rest state; no error, no spinner
2. Live Preview — "building…" veil (a build step is mid-flight): soft overlay, calm animated indicator, no technical text, no app flicker-through
3. Live Preview — live app running: full-bleed embedded running app, NO Helm/browser chrome inside the stage, user can interact directly
4. Live Preview — "fixing a snag" (auto-recovering): calm reassurance state, no action needed, designed to resolve back to #3 on its own
5. Live Preview — blocked rest state (truly blocking problem): calm "paused — needs you" rest state in the pane, PAIRED with the board card in #6

GROUP B — Blocking problem on the board (REUSE Phase 1 surface, do not invent new)
6. Build-Spine Board — Needs-you / decision card raised by a blocking build error: reuse F12 (Needs-You Headline) / F22 (Single Question Headline) / F25–F26 (Decision Prompt) patterns; this is the actionable half of state #5
```

---

## Coverage notes

- **Constitution constraints (all screens):** light mode only, warm-cream canvas; macOS desktop window (~1440×900 design reference, resizable); **no code, no terminal, no file paths, no URLs, no git** ever shown — this applies *especially* to the Live Preview, which is the one place a stray `localhost:3000`, console line, or build log could leak. Scrub all of them from every state.
- **Design system anchors:** the *running-app stage* is a reusable neutral surround that any built app sits inside — design it once, cleanly, so it works whether the embedded app is a colorful consumer app or a plain form. The veil / snag / blocked overlays should share one calm-overlay shape so they read as a family.
- **Most-forgotten surfaces:** (a) the *"nothing to show yet"* empty state — easy to skip, but it's the first thing a user sees before any build produces something; (b) the *snag auto-recovery* state — the self-healing middle that's neither success nor failure; (c) the *paired* nature of the blocked state — it must be drawn in **both** the preview (rest) and the board (action), not just one.
- **Forward-compat reminder mapped to screens:** Screen #3 (live app running) is where the Phase 3 point-and-fix overlay lands — keep it a clean, overlay-ready canvas with no competing hover/highlight chrome. Screens #1–#2, #4–#5 are Helm-chrome states and stay in the warm-cream register; only screen #3 hands the stage to the app.
