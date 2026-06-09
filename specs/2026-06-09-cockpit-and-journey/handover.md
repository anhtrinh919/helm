# Handover — Phase 1: The Cockpit & the Journey

## Design file — source of truth
**The build must recreate the design from the pack at `specs/2026-06-09-cockpit-and-journey/design/`.** Visual details live in those files, not in this doc.
- **Token + component system (THE canon):** `design/project/helm.css` — a complete, self-contained `.hm-` class system (tokens + every component: shell, rail, top bar, buttons, chips, steps, work card, preview, doors, panels, shelf, inputs). Port these classes into the app's stylesheet; recreate markup to match.
- **Shared kit:** `design/project/helm-kit.jsx` — `ClaudeSignal`, `SideRail`, `TopBar`, `WorkCard`, `DoneRow`, `Step`, `FakeApp` (the placeholder "Reading Room" app). These map onto the app's existing components.
- **Screens:** `design/project/screens-*.jsx` (see frame index below).
- **Assembled reference:** `design/project/Helm - Phase 1.html` (loads helm.css + the screen files; the full deliverable).
- **Intent (read for the "why"):** `design/chats/chat1.md` — the full user↔designer transcript and where they landed.

Medium is HTML/CSS/JS prototype. Recreate pixel-perfectly in the app's React + the ported `helm.css`. Don't render/screenshot — read the source.

## Locked decisions (canon — do not re-litigate)
- **Design language: DOT-MATRIX** (final, user-chosen after several rounds). Terminal/retro-graphic: **Space Mono** for display/headings, **JetBrains Mono** for all UI/body (everything monospace). Hard black 1.5px frames, **sharp corners (zero radius everywhere)**, hard-offset shadows (e.g. `4px 4px 0 ink`) on focal items only, dot-grid texture on guiding surfaces.
- **Lime (`#C2EE2A`) is a FILL / HIGHLIGHTER ONLY — never coloured text on light** (illegible). For coloured text/cues on light use `--accent-text` (`#5E6E0C` olive-lime). The designer hit and fixed these contrast traps; honor the rule.
- **Layout: Journey direction C** (split / preview-dominant — the journey is continuous with the live preview) + **Cockpit direction A** (card spine beside the live app, collapsed journey strip on top in build mode).
- **Front door: two mirrored doors, renamed** — **"Build with structure"** (guided journey; primary, inked door with lime hard-offset shadow) and **"Build freely"** (freeform). Both halves share the **same** components and each ends in an identical lime CTA button, bottom-aligned (the left must NOT read as mere description). "Bring an existing app" is a coming-soon sub-door. Same components drive the returning-user front door.
- **The user's OUTPUT app (live preview / `FakeApp`) stays a normal serif/sans website — NOT terminal-styled.** Only Helm itself wears Dot-Matrix. This separation is load-bearing: Helm is the tool; the thing it builds is not.
- **Semantics are scarce & square:** sage `--success` = done, amber `--needs` = needs-you, terracotta `--fail` = couldn't-finish, slate `--parked` = parked. Each distinct from lime.
- **Reserved Publish slot** (Phase 2) sits visibly-empty in the cockpit top bar (`.hm-slot-reserved`, dashed) — don't fill it.
- **Light mode only** this phase (a dark mode can come later; CRT direction was explored but not chosen).

## Design tokens
`specs/2026-06-09-cockpit-and-journey/design-tokens.css` (generated from `helm.css :root`). Import it (or fold into the app's `globals.css` `@theme`) so components consume the tokens. The full `.hm-` component classes in `helm.css` are the higher-leverage port — bring them in wholesale; they're class-name-stable and reskin every screen.

## Fonts required
- **Space Mono** (400, 700) — display/headings
- **JetBrains Mono** (400, 500, 700) — UI/body/mono
- **Phosphor icons** (regular) — use a normal Phosphor integration; the prototype's raw-glyph injection workaround is a sandbox quirk, NOT needed in the app.

## Frame index (requirements UI state → design source)
Every state from requirements.md → its design file/component. States marked **GAP** were not built by the designer (the export happened mid-rollout); build them in the locked Dot-Matrix language by extending the nearest built sibling.

| Requirements state | Design source |
|---|---|
| Front Door — default (two doors, import coming-soon, Claude signal) | `screens-frontdoor.jsx` (doors = `.hm-door`/`.hm-subdoor` in helm.css; renamed Build with structure / Build freely) |
| Front Door — returning user | `screens-frontdoor.jsx` (returning variant; `.hm-recent` rows) |
| Wizard — idea input | `screens-wizard.jsx` (`.hm-input--lg`) |
| Wizard — scoping Q&A (thinking) | `screens-wizard.jsx` (`.hm-thinking`) |
| Wizard — scoping Q&A (question ready, "QUESTION N OF M", back) | `screens-wizard.jsx` (`.hm-progresslabel--wizard`, framed options) |
| Wizard — plan review (+ revising) | `screens-wizard.jsx` |
| Wizard — error | GAP — extend wizard with an `.hm-callout--fail` error + retry |
| Journey — active "Step N of M" (Journey C) | `screens-journey.jsx` (Journey C; `.hm-step` rail, lime=current/ink=done) |
| Journey — checkpoint (hard stop) | `screens-journey.jsx` (checkpoint; "what I built" + live-try) |
| Journey — mid-journey fixing-now / parked | `screens-journey2.jsx` (triage) |
| Journey — step failed mid-step | `screens-journey2.jsx` (`.hm-callout--fail`) |
| Journey — checkpoint next-step won't start | GAP — sibling of step-failed; retry callout |
| Journey — escape hatch confirm | `screens-journey2.jsx` (escape modal) |
| Journey — degenerate / couldn't-plan | GAP — extend with retry |
| For-Later Shelf — items present / empty | `screens-journey2.jsx` (`.hm-shelfitem`; "Your shelf is clear") |
| Journey complete — celebration | `screens-journey2.jsx` (oversized "YOUR APP NOW DOES WHAT YOU SET OUT TO BUILD" + single CTA) |
| Journey complete — collapsed strip | `screens-journey2.jsx` (strip above cockpit) |
| Cockpit Board — build mode (strip + cards + live app, Cockpit A) | `screens-cockpit.jsx` (Cockpit A) |
| Cockpit Board — iterate mode | `screens-cockpit.jsx` (note: board-grid direction B was dropped; iterate uses the Cockpit A spine without the strip) |
| Cockpit Board — building / needs-you / failed / empty | `screens-cockpit.jsx` + `screens-foundations.jsx` (card states); empty states are GAP — build in language |
| Work card — all states (planned/up-next/building/needs/done-condensed) + outcome on face | `helm-kit.jsx` `WorkCard`/`DoneRow` + `.hm-card*` in helm.css + `screens-foundations.jsx` |
| Scoped Session — active / waiting / stopped / error | GAP — reskin existing session components in Dot-Matrix (feed, steering, question queue) |
| Live Preview — live / building / no-app / snag | `screens-cockpit.jsx` (`.hm-preview*`); building/no-app/snag partly GAP |
| Point-and-Fix — idle / selected(text) / selected(non-text) / describe / inline-edit / fix-in-progress | `screens-cockpit.jsx` (point-and-fix state, in-place text edit); some sub-states GAP |
| Project list — default / rename / delete / empty | GAP — build in language (rail `.hm-projpill` + a switcher; rename inline, delete confirm modal) |
| Decisions / Progress / Docs panels | GAP — reskin existing panels in Dot-Matrix (foundations panels show the language) |
| "Running on your Claude subscription" signal | `helm-kit.jsx` `ClaudeSignal` + `.hm-claude` (calm, persistent, never a meter) |
| Global nav / back-home | `helm-kit.jsx` `TopBar` + `.hm-top` |
| STUBS — Publish (P2) / Data (P3) / Error-recovery (P4) / History (P4) / Import (P5) | Reserved-slot + soon-tags shown (`.hm-slot-reserved`, `.hm-soontag`, `.hm-subdoor.is-soon`); build shell + "Coming in Phase N" |

## Reusable components (design → React)
- `ClaudeSignal` → reuse/add a `ClaudeSignal` component (app shell). `SideRail` → the existing `Rail.tsx` reskinned + a "Data — Phase 3" soon item. `TopBar` → existing board `TopBar.tsx` reskinned + reserved Publish slot. `WorkCard`/`DoneRow` → the existing `SpineItem.tsx` (add the outcome line on the face). `Step` → the new Journey rail component. `FakeApp` → not ported (it's just the placeholder; the real preview is the live webview/proxied app).

## Deviations from requirements
- Cockpit direction B (board grid) was explored then dropped — iterate mode uses the same Cockpit A spine, just without the journey strip. (Requirements' "board" = this spine, not a kanban grid.)
- Front-door labels changed from "Build something new / Iterate on an app" to **"Build with structure" / "Build freely"** (user instruction). Update the outcome-card-facing copy accordingly in UI; the underlying modes (build/iterate) are unchanged.

## Layout / IA notes a pattern-match would miss
- **Zero border-radius everywhere** — the app currently uses rounded corners; the reskin makes everything square.
- **Hard-offset shadows, not soft** — `4px 4px 0 ink`, no blur.
- **Lime never as text** — enforce via the token split (`--lime` = fill, `--accent-text` = text). A reviewer should grep for lime-as-color-on-text.
- **Two registers, one system:** guiding surfaces (front door, journey, checkpoint, celebration) get the dot-grid + a touch of ceremony (Space Mono, larger); working surfaces (cockpit, session) stay calm-dense — but both use the same tokens/classes.

## API contracts expected from backend
Per requirements.md "API Contracts (the `helm` bridge)" — operations ride the local HTTP/WebSocket `helm` API (hybrid runtime, Group 0). New/changed: `cards:set-outcome`, `projects:reorder`, `shelf:remove`, `shelf:promote` (sets card outcome), inline-text-edit (`points:text-edit-activate/deactivate`, `points:register-text-edit`), and `outcome` on card reads. (The DB/schema layer for these shipped in the foundation commit.)
