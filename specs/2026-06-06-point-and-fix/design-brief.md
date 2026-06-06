# Design Brief — Helm, Phase 3: Point and Fix
**Track:** external-pencil
**Brief type:** lean (external tool)
**Design file:** extend `pencil/v0.2-p2.pen` → new frames F36–F48+ (see Screen Checklist)

---

## Design intent

"It saw what I saw." Trust is the north star. The comment box showing the user's exact snapshot — a cropped thumbnail of the element they clicked — is the proof that the system truly captured their intent. The design plays up this captured evidence: the thumbnail should feel like physical evidence being logged, not a UI widget. The user never describes location or context in code terms; the UI visibly demonstrates that it already understood. Every visual decision should be weighed against this: does it reinforce that the system was right there with them when they pointed?

---

## Product context — full vision

Helm is a single macOS desktop window that replaces the terminal for non-developer builders. The entry is a sentence — "What do you want to build?" — and from there the user steers, approves, and watches, never touching code. The build-spine board is the home screen: an ordered list of every item (features, bugs, decisions, comments) with clear status. The main area is context-sensitive: a scoped session feed when a session is running, the live running app (Live Preview) when one is ready.

At end-state, the product is a super-team of one: the user leaves comments on running screens, submits changes, and everything spawns its own context-loaded agent session running in parallel. Results land back on the board as resolved items. Helm is not an IDE, not a terminal replacement for developers — it is a project management dashboard where "the project" happens to be a software build, and the user's job is direction and decision, not execution.

Phase 3 adds the first direct manipulation surface: the user can click any element in the live running app, leave a note, and a focused agent picks it up. This is the first time the user's finger is literally on the product being built. The design must honour that directness — no dialogs, no forms, no developer language. The annotation layer is surgical.

What this product is NOT: a browser devtools, an IDE, a code review surface, a screenshot tool, a bug tracker with forms. The closest reference feel is a screensharing annotation tool crossed with a project board — but with none of the noise.

The operator's day: open Helm, the board shows what was built yesterday and what's queued. The live app is visible. Something looks off — they click the crosshair, hover over the broken element, click to lock, type three words, hit submit. They go back to the board; a new "REPORTED" card is there, and a fix session spins up automatically. They watch the narration feed for thirty seconds, see a checkpoint, approve it. The preview refreshes. Done.

---

## Patterns to avoid

**Developer-tool aesthetic.** Red error badges, monospace everywhere, "selector: .btn-primary" visible to the user, DOM-tree-style highlighting. Helm hides all of this. The annotation layer must feel like a sticky note on a real physical screen, not like browser inspect.

**Generic bug-tracker form.** A modal dialog with "Title", "Description", "Priority", "Assignee" fields is the wrong shape. The comment box is minimal — thumbnail, note, type. No more.

**Cluttered overlay.** The point-mode overlay sits on top of the live running app. The user's app must still be legible through it. Highlights should be delicate — a ring, not a filled box. Pins should be small and clear, not loud.

**Fragile / clinical visual treatment.** Pins on a real-app canvas could easily read as QA software or design-review tools (Loom, Markup, BugHerd). Helm's pins should feel like the board's own design language — warm, calm, using the v4 Maximalist palette (cream, ink, semantic accents) rather than flat red/blue circles.

**Checkpoint as modal.** The fix-session checkpoint (approve/reject) is already designed as a checkpoint block in the session feed. It is NOT a new modal or dialog. Do not redesign it — reuse the Phase 1/2 checkpoint surface exactly.

---

## Roadmap at a glance

1. **Phase 1 — The Executive Dashboard** ✓ COMPLETE: App shell, build-spine board, scoped session feed, decision/checkpoint prompts wired to live Claude SDK.
2. **Phase 2 — Watch It Get Made** ✓ COMPLETE: Live running app embedded in the Helm window as a full webview stage inside the F32 clean canvas.
3. **Phase 3 — Point and Fix** ← **[CURRENT]**: The user clicks any element in the running app, leaves a note, a fix session picks it up and fixes exactly that element.
4. **Phase 4 — The Super-Team**: Every action spawns its own parallel context-loaded session. Side tabs (Decisions Log, Progress Timeline, Docs View) become functional. All sessions run simultaneously.

---

## Current phase scope

Phase 3 adds two stacked capabilities on top of the Phase 2 live preview. First: a point-mode toggle that lets the user hover-highlight and click-to-select any element in the running app, then file a note comment — the element's context (thumbnail, selector) is captured invisibly, and the comment lands as a new card on the board. Second: starting a fix from that card opens a focused agent session that runs to a checkpoint — approve to refresh the preview, reject with a note to retry.

At the end of Phase 3, the user can: toggle point mode, hover over anything in their running app, click to lock, type a note, submit — then watch a fix session run, approve it, and see the preview refresh. No code, no description of location, no forms.

Daily-use slice: user opens the board. Spots something in the live preview. Clicks the crosshair in the preview header. Hovers over the broken element (it highlights). Clicks to lock. Types "this button is the wrong colour". Submits. The board gains a REPORTED card. They click "Start Fix". They're taken into the session feed. They watch the narration. A checkpoint appears. They click Approve. The preview refreshes.

---

## Forward-compatibility callouts

- **Parallel fix sessions (Phase 4).** Phase 4 allows multiple fix sessions to run simultaneously. The "queued" display state for a card (designed in Phase 3 as a badge) must be extensible — Phase 4 may show a queue position number. The board REPORTED section should accommodate N cards in building/queued states simultaneously, not just one at a time.

- **Clicking a pin to jump to its card (Phase 4).** Pins are non-interactive in Phase 3 — the card is how the user acts. Phase 4 wires pin-click → navigate to card. Design pins as interactive-feeling affordances even though they don't respond to clicks yet. A pill shape with a small icon already reads as "tappable" without adding a hover state that would mislead.

- **Decisions Log, Progress Timeline, Docs View tabs (Phase 4).** These three tabs are visible stubs today (Phase 1). Phase 4 populates them. The tab bar must not be crowded by Phase 3's new surfaces — the Phase 3 changes are to the board and the preview stage layer, not to the tab bar.

- **Drag-to-region selection (Phase 4+).** Phase 3 is element-click-only. A region-drag variant lands later. The point-mode overlay should not preclude adding a rubber-band selection affordance later — the toggle button or overlay header can grow a second affordance without redesigning the overlay.

- **Reject → Discard path (Phase 4+).** Phase 3 reject always retries. A future phase may add a "reject and discard" option to the checkpoint. Design the reject flow so a second action ("Discard") can be added to the checkpoint block without a layout redesign — i.e. the reject area should have lateral room for a second button.

---

## Screen groups — what each does and why

### Live Preview — Point Mode Layer

**Job.** The user spots something visually wrong in the running app and wants to flag it without stopping to describe where it is or what code is involved. Point mode is the "I'm pointing at this" moment — it should feel as low-friction as circling something on a printed page.

**Why it exists in this phase.** Without a pointing mechanism, the user has to describe elements in words (or worse, in code). Point mode + silent context capture is the whole value proposition of Phase 3, Step 1.

**User stories served.** Stories 1, 2, 3, 8.

**Key behaviors the design must encode.**
- The crosshair button in the preview header toggles point mode on and off. When OFF, the embedded app receives all pointer events normally. When ON, the overlay intercepts them. The button must read as a toggle, not a one-shot action — active vs. inactive states matter.
- In the mock web build, the user can't do real DOM injection via an iframe data: URL. A small "Simulate click on element" affordance (floating panel with 2–3 mock elements the user can "click") fires the same internal event with synthetic data. This surface is dogfood-only — design it minimal, labeled "DEMO MODE — simulate click", positioned as an overlay that doesn't compete with the main UI.
- Hover highlighting is a subtle ring/border on the element under the cursor — not a fill, not a bold color. The app underneath must still be fully legible.
- Once an element is clicked (selection locked), the hover highlight freezes (it becomes a selection ring) and the comment box appears. The rest of the app dims or gains a slight cream veil — but the selected element stays clear.
- "Esc to exit" hint appears when point mode is ON. It must not compete with content — small, secondary, positioned as a persistent floating pill or a small header annotation.
- "Comment on this page" affordance: a separate button at the bottom of the overlay (not inline with the hover detection) that opens the same comment box without an element thumbnail. Positioned persistently while point mode is ON, not on hover.

**States that surprise.**
- The comment box anchors near the selected element — but if the element is near an edge, the box must flip to the other side. Design both positions (element in upper area → box below; element in lower area → box above). Pencil does not need to design the flip logic, just show the intent with a note.
- Pins remain visible BOTH in point mode and in standard preview (point mode OFF). Pins are always there. The only thing point mode changes is whether hover/click capture is active.
- Point mode is disabled when the preview is not in `live` state — the crosshair button must show a disabled/grayed treatment. Design this state.

**Forward-compat for this group.** "Clicking a pin to jump to its card (Phase 4)" and "drag-to-region selection" callouts apply most directly here.

---

### Comment Box — Element and Page Variants

**Job.** The user has pointed at something (or at the whole page). Now they leave a note. The comment box is the single data-entry surface of Phase 3 — it should feel as low-ceremony as a sticky note. The thumbnail is the "evidence" that the system saw what they saw.

**Why it exists in this phase.** Without a note input, there's no comment. Without the type pick ("Something's broken" / "Change this"), the agent can't calibrate the fix. Without the thumbnail, the user can't confirm the system captured the right element.

**User stories served.** Stories 1, 2.

**Key behaviors the design must encode.**
- The comment box has two variants: **element variant** (has a thumbnail crop of the selected element at the top) and **page variant** (no thumbnail — triggered by "Comment on this page" affordance). The forms are otherwise identical.
- The thumbnail in the element variant should feel like physical photographic evidence — a cropped rectangle of the element, with a subtle shadow or border, not a styled card widget. The design intent is "proof it was captured." It is NOT interactive — it's display only.
- The type pick is exactly two options: "Something's broken" (bug) and "Change this" (change). Not a dropdown — a two-button toggle or toggle group. The selected type must read clearly active.
- Submit and Cancel are the only actions. No "Save draft", no "Attach", no extra controls.
- The note input is the dominant element — single-column, tall enough for 2–3 lines.

**States that surprise.**
- The box must feel anchored (near the element or near the bottom for page-level), not floating freely in the middle of the screen. Even though it "overlays" the app, it should read as positioned, not modal.

---

### Live Preview — Pins Overlay

**Job.** The user can see, at any time, which spots have already been reported — without entering point mode. Pins are the "paper trail" on the live canvas.

**Why it exists in this phase.** Without pins, the user submits multiple comments on the same element. The visual record matters.

**User stories served.** Stories 3, 8.

**Key behaviors the design must encode.**
- Pins are small, persistent, and positioned at the fractional viewport coordinates recorded at comment time. They appear both in point mode and in standard preview.
- Two pin types: bug pin (Something's broken) and change pin (Change this). They use the semantic accent color for each type (consistent with the board's type badges).
- When a fix is approved and the card resolves to `done`, its pin disappears. This is the only moment pins change — no animation is required, a clean removal is fine.
- Pins are non-interactive in Phase 3. No hover state, no click handling. But they should look tappable (a small pill or dot with an icon) so Phase 4's click-to-navigate feels natural when added.

**States that surprise.**
- A pin can land on top of the "Comment on this page" affordance — these layers stack. The affordance must not occlude pins. Consider pin z-index above the affordance strip but below the hover highlight.

---

### Board — REPORTED Section + Fix-Comment Cards

**Job.** Fix-comment cards in `waiting` status live in a new REPORTED section on the board, above PLANNED. The section visually separates "things the user pointed at in the live app" from "things the agent plans to build next." The card design extends the existing board card patterns.

**Why it exists in this phase.** The existing board sections (NEEDS YOU, UP NEXT, PLANNED, DONE) don't have a concept of "filed but not yet started." REPORTED is the waiting room for point-and-fix cards.

**User stories served.** Stories 1, 4, 7.

**Board order (top to bottom for reference when extending the board frame):**
BUILDING NOW → OFF-TRACK → NEEDS YOU → **REPORTED** (new) → UP NEXT → PLANNED → DONE

**Key behaviors the design must encode.**
- Fix-comment cards in `waiting` state have: a thumbnail crop (the element screenshot), a truncated note, a type badge ("Broken" or "Change"), and a "Start Fix" primary button.
- Fix-comment cards in `building` state: "In progress" badge, "Start Fix" button hidden, card references the running fix session (the session feed below shows the session).
- Fix-comment cards in `queued` state: "Queued" badge, "Start Fix" button hidden.
- Fix-comment cards in `done` state: resolved treatment (checkmark), no "Start Fix" button.
- The thumbnail is the same visual element as in the comment box — cropped element screenshot. In the card it is smaller (compact row treatment). For page-level comments, the thumbnail area shows a page icon or is absent.
- The type badge mirrors the board's existing badge vocabulary ("Broken" → the semantic red/orange accent; "Change" → the semantic blue/teal accent). These should reuse whatever semantic accent color the Phase 1/2 board established for bug/change states.

**States that surprise.**
- A `building` fix-comment card appears simultaneously in BUILDING NOW (the spotlight) and in REPORTED (as its "home" card). Design both views — the building spotlight is the session feed, the REPORTED card just shows its in-progress badge while the action is in the feed.
- The REPORTED section may be empty (no reported items). It should collapse or hide when empty — not leave a ghost section header.

---

### Session Feed — Fix Session

**Job.** A fix session is a build session with a narrower scope and a specific context. The feed should look and behave identically to a Phase 1/2 session feed — the user watches narration, may answer decisions if any appear, and eventually sees a checkpoint.

**Why it exists in this phase.** Fix sessions use the same `SessionOrchestrator` spine — the design difference is minimal. The session name references the comment's note (truncated). No code, no selector, no technical strings appear anywhere in the feed.

**User stories served.** Stories 4, 5, 6.

**Key behaviors the design must encode.**
- Reuse the Phase 1/2 scoped session feed exactly. No new design primitives needed here.
- The session name in the header (the "narrow build session for: [truncated note]" label) is the only Phase 3-specific element in the feed.
- The checkpoint block is Phase 1's exact checkpoint design. The only Phase 3 addition is the reject flow wiring: when the user clicks "Reject", a note input appears inline in the checkpoint block. Submit the note → the session retries. This is a state within the existing checkpoint block, not a new surface.

**States that surprise.**
- After approve, the preview refreshes (DevServerManager.restart). The feed should indicate "fix applied — preview refreshing" or simply transition to done state. The session feed doesn't show the refresh — the preview handles it. A small "Applying fix…" or done indicator in the session header is sufficient.
- After reject + note submit, the session continues in the same feed — no navigation, no modal confirm. The checkpoint block clears and narration resumes.

**Forward-compat for this group.** The reject → discard path (Phase 4+) will add a "Discard" button in the checkpoint reject area — leave lateral room.

---

## User stories

### Live Preview — Point Mode Layer
**1.** As a builder, I can toggle point mode in the live preview header, hover any element to see it highlighted, click to lock the selection, type a note, pick a type ("Something's broken" or "Change this"), and submit — and the comment lands as a card on the board with the element's visual context captured silently. [Point and Fix, Step 1]

**2.** As a builder, while in point mode I can also comment on the entire screen by clicking a "Comment on this page" affordance, for issues like "this page feels cramped." [Point and Fix, Step 1]

**3.** As a builder, I can see visible pins on already-commented spots in the live preview while in point mode, so I know what's already reported while I sweep. [Point and Fix, Step 1]

**8.** As a builder, when I submit a point-and-fix comment, the pin disappears from the live preview once the fix card resolves (approved), so the annotation layer stays clean. [Point and Fix, Step 1]

### Board — Comment Cards + Fix Sessions
**4.** As a builder, I can start the fix from a comment card on the board — I'm taken into a narrated fix session that shows me what the agent is doing, and at the end I see a checkpoint where I can approve or reject. [Point and Fix, Step 2]

**5.** As a builder, when I approve a fix at the checkpoint, the preview refreshes to show the fixed app and the card resolves to done. [Point and Fix, Step 2]

**6.** As a builder, when I reject a fix at the checkpoint with a note, the same session retries with my reason and returns to a new checkpoint. [Point and Fix, Step 3]

**7.** As a builder, if I start a second fix while one is already running, the card enters a "queued" state and auto-starts when the running fix finishes, without navigating me. [Point and Fix, Step 2]

---

## Visual style

v4 Maximalist: warm cream `#FFEFD2`, ink `#1B1208`, scarce semantic accents, editorial serif Fraunces for display, Space Grotesk for all UI copy, JetBrains Mono for literals only (and there are no literals visible in Phase 3 — no selectors, no paths, no code strings ever reach the renderer).

Phase 3 introduces no new brand tokens. The only visual additions are:
- A subtle highlight ring on hovered/selected elements in the overlay (use existing semantic accent, very low opacity fill, solid ring)
- Pin shapes in bug and change accent colors (these should reuse whatever semantic accents Phase 1/2 board badges use)
- Cream veil over the unselected area when selection is locked (use `--preview-veil-light` from Phase 2)

The design has a dual register: the F32 live-app stage is deliberately neutral (it shows the user's built app) — overlays on it must not fight the embedded app's own visuals. The board and session feed are in Helm's full v4 design language. The overlay layer should use v4 tokens but at low-opacity, so the user's app stays primary.

---

## Tone and mood

- **Surgical.** The pointing gesture is precise and targeted — the design should feel like a sniper rifle, not a fire hose. Minimal overlay, minimal comment box, nothing extraneous.
- **Trustworthy.** The thumbnail evidence is the trust signal. It should look authoritative, not like a placeholder. The moment the crop appears in the comment box, the user should feel: "yes, that's exactly it."
- **Calm.** Fix sessions can take time. The narration feed and board should never feel urgent or anxious. Status badges use measured language ("In progress", "Queued", "Resolved") — not "Fixing…!!!" or red spinners.
- **Invisible infrastructure.** The annotation layer exists to capture context, then get out of the way. Once a comment is submitted, the overlay closes, point mode turns off, and the board shows one new card. The entire flow takes under 15 seconds and leaves no residue.

---

## Palette direction

Same as Phase 1 and Phase 2 — no new palette direction. Visual canon v4 Maximalist:
- **Primary mode:** light (warm cream canvas)
- **Foundation:** warm neutrals (cream/ink axis)
- **Accent reserved for:** primary action (Submit button, "Start Fix" CTA), active state (point mode active toggle, selected element ring)
- **Saturated/semantic color:** scarce, semantic, never decorative — bug accent (warm red/orange) for "Broken" badges and bug pins; change accent (teal/blue) for "Change this" badges and change pins; these must match whatever Phase 1/2 established for bug/decision card badges

New-to-Phase-3 uses of color:
- Hover highlight ring on elements: existing accent color, low opacity fill (≈10%), solid 2px ring
- Selection lock ring: same ring, slightly more opaque, with the cream veil applied to the rest of the canvas
- Pin shapes: small, use the semantic accent for their type — consistent with board badge colors for bug/change

---

## Typography direction

No change from Phase 1/2 typography direction. Fraunces (display), Space Grotesk (UI), JetBrains Mono (literals — not present in Phase 3). For the comment box note input and the session name label, Space Grotesk at the standard UI weight. No new type styles needed.

---

## References

- **BugHerd** — pin placement pattern (small pinned dots on a live canvas); visual feel for "reported spots." Helm's version should be warmer and less clinical.
- **Loom video annotations** — minimal comment box anchored near selected element; the crop-as-evidence pattern. Helm's thumbnail should feel more physical/documentary than Loom's hover previews.

---

## Information architecture

| Element | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Left Rail | Build spine | Build spine + preview status dot | Build spine + preview status dot + fix-session indicator |
| Preview header | Tab bar (Live Preview / Decisions / Progress / Docs) | Tab bar + preview status | Tab bar + preview status + point-mode crosshair toggle |
| Preview stage (F32) | — | Live webview (clean canvas) | Live webview + pin overlay + point-mode overlay (when active) |
| Board — BUILDING NOW | Feature/bug session spotlight | Feature/bug session spotlight | Feature/bug session OR fix session spotlight |
| Board — NEEDS YOU | Decision prompt cards | Decision prompt cards | Decision prompt cards (unchanged) |
| Board — REPORTED | — | — | **New section** — fix-comment cards (waiting/queued/building/done) |
| Board — UP NEXT / PLANNED | Feature/bug/decision cards | Unchanged | Unchanged |
| Session feed | Narration + decisions + checkpoint | Unchanged | Unchanged + fix-session variant (same structure, session name references comment note) |
| Checkpoint block | Approve / Flag | Unchanged | Unchanged + inline reject note input (new state within existing block) |

---

## Screen checklist

### GROUP A — Live Preview Header (extend F32 frame or add a dedicated header-state frame)

1. Live Preview — point mode **OFF** (default) — crosshair toggle button visible in preview header, inactive state
2. Live Preview — point mode **OFF, disabled** — crosshair button grayed (preview not in `live` state)
3. Live Preview — point mode **ON** — crosshair button in active/highlighted state; "Esc to exit" hint visible

### GROUP B — Point Mode Overlay (new overlay layer on F32 canvas)

4. Live Preview — point mode ON, **hovering element** — subtle ring highlight on hovered element; hover cursor; no comment box
5. Live Preview — point mode ON, **selection locked** — ring highlight frozen on selected element; cream veil on rest of canvas; comment box visible (element variant with thumbnail)
6. Live Preview — point mode ON, **whole-page comment** — no element highlight; comment box visible (page variant, no thumbnail); triggered by "Comment on this page" affordance
7. Live Preview — point mode ON, **with existing pins** — pin dots/pills visible on canvas at recorded positions; hover highlight active over separate hovered element
8. Live Preview — point mode OFF, **with existing pins** — standard view; pins visible on canvas; no overlay; crosshair button inactive
9. Live Preview — point mode ON, **disabled "Comment on this page" affordance** — affordance strip or button at bottom of overlay; always visible when point mode is ON

### GROUP C — Comment Box (element and page variants)

10. Comment box — **element variant** — thumbnail crop of element (top of box); note input; type toggle ("Something's broken" / "Change this"); Submit + Cancel; element type unselected (default)
11. Comment box — **element variant, type selected** ("Something's broken" active)
12. Comment box — **element variant, type selected** ("Change this" active)
13. Comment box — **page variant** — same as element variant but no thumbnail; otherwise identical

### GROUP D — Mock Web Build dogfood affordance

14. Live Preview — "DEMO MODE — Simulate click on element" floating panel — minimal, labeled, lists 2–3 mock elements the user can click to fire synthetic point-and-fix data; only present in mock build

### GROUP E — Board — REPORTED section + fix-comment card states

15. Board — **REPORTED section, waiting card** — thumbnail, truncated note, type badge ("Broken" / "Change"), "Start Fix" primary button
16. Board — **REPORTED section, in-progress card** — same card face; "In progress" badge; "Start Fix" button hidden
17. Board — **REPORTED section, queued card** — same card face; "Queued" badge; "Start Fix" button hidden
18. Board — **REPORTED section, done card** — resolved treatment; checkmark; no button
19. Board — **REPORTED section, page-level card** — same as waiting card but no thumbnail; page icon or blank thumbnail area
20. Board — **REPORTED section empty** — section header hidden or collapsed (no ghost heading when no reported items)

### GROUP F — Fix Session feed (reuse; only new element)

21. Session feed — **fix session active** — same narration feed as Phase 1/2; session header shows truncated comment note as session name
22. Session feed — **checkpoint, approve-only state** — Phase 1/2 checkpoint block; no change
23. Session feed — **checkpoint, reject flow** — checkpoint block; "Reject" clicked; note input appears inline; "Submit rejection" button
24. Session feed — **done + preview refreshing** — session done indicator; small "Applying fix…" or done state in feed header

---

## Coverage notes

- **Design system anchors to maintain:** warm cream `#FFEFD2` canvas, ink `#1B1208`, Space Grotesk for all UI copy, Fraunces display only for headers/section labels. Semantic accents (bug color, change color) must be consistent with Phase 1/2 board badge colors — pick up whatever was used there and apply it to pins and type badges.
- **The F32 live stage is an overlay-ready clean canvas.** Per the Phase 2 handover: "F32 (live app) must stay an overlay-ready clean canvas — Phase 3's point-and-fix annotation layer lands directly on this surface." Phase 3 builds exactly this annotation layer. Do not redesign F32 — extend it with the overlay.
- **Checkpoint block reuse.** The checkpoint block (Approve / Reject) from Phase 1 and Phase 2 is the foundation for the fix-session checkpoint. Only the reject note input is new — design it as a state within the existing block (inline expansion below "Reject"), not a replacement.
- **Pins are non-interactive in Phase 3.** Design them to look tappable (Phase 4 will wire the click), but do not add hover states or click affordances in the Phase 3 frames.
- **JetBrains Mono is NOT used anywhere in Phase 3.** No selector strings, paths, or code ever reach the renderer. Even if a pin has an internal ID, it never appears in the UI.
- **No new font loading required.** All three fonts are already wired from Phase 1.
- **Most-forgotten surfaces:** the disabled point-mode button state (checklist item 2), the empty REPORTED section (item 20), and the post-reject inline note input (item 23) are the most likely to be missed. Call these out to the designer.
- **Board section header "REPORTED"** must be consistent in typography and spacing with the existing section headers ("BUILDING NOW", "NEEDS YOU", etc.) from Phase 1/2. Read the Phase 2 design file for the existing header pattern before designing this.

### Forward-compat reminders mapped to specific screens
- Items 1–9 (point mode overlay): leave room for drag-to-region selection in the overlay header/affordance area (Phase 4+).
- Items 15–20 (REPORTED cards): design cards to accommodate a queue position number badge (Phase 4 parallel sessions).
- Items 22–23 (checkpoint): leave lateral room in the reject area for a future "Discard" button (Phase 4+).
- Item 9 ("Comment on this page" affordance): this bottom-of-overlay affordance may grow to a second affordance (e.g., "Comment on a region") in Phase 4 — design it as an expandable or multi-item strip.
