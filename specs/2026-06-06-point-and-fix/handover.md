# Frontend → Backend Handover — Helm, Phase 3: Point and Fix

**Design track:** external-pencil
**Design file — source of truth:** `pencil/v0.2-p3.pen`
**Design tokens:** `./design-tokens.css`
**Visual canon:** the **v4 (Maximalist)** system — warm cream canvas (`#FFEFD2`), ink text (`#1B1208`), scarce semantic accents. Inherited unchanged from Phase 1 and Phase 2; Phase 3 adds **no new brand tokens**, only clarifies semantic usage for pin and type-badge colors (derived from existing accents).

> **Backend must open `pencil/v0.2-p3.pen` and build from the F36–F59 frames.** Visual details live in the file, not in this doc. This handover is an index, not a spec. Phase 2's `pencil/v0.2-p2.pen` (F30–F35) remains the reference for the base Live Preview states — do not rebuild those.

## Design intent

*"It saw what I saw."* Trust is the north star. The element thumbnail in the comment box is physical evidence — a cropped photograph of the exact spot the user clicked, not a UI widget. Every overlay decision plays up this captured evidence: rings not fills, pins not badges, a cream veil that keeps the app readable underneath. The user should feel the system was already paying attention when they pointed.

## Design tokens

Import `./design-tokens.css` (generated from the v4 variable set in `v0.2-p3.pen`). Phase 3 introduces no new `.pen` variables — the token file is a full copy-forward of Phase 2 tokens plus named semantic aliases for the pin/badge colors (derived from existing accents `--accent-orange` and `--accent-blue`). Backend imports directly (e.g. `@import './design-tokens.css'` from the renderer's global stylesheet) — same pattern as Phase 1 and Phase 2.

**New Phase-3-specific aliases (defined in design-tokens.css):**
- `--pin-bug` / `--pin-bug-soft` — bug-type pin fill and badge background (→ `--accent-orange` / soft)
- `--pin-change` / `--pin-change-soft` — change-type pin fill and badge background (→ `--accent-blue` / soft)
- `--overlay-ring` / `--overlay-ring-fill` — point-mode hover ring (2px solid + ~10% fill)
- `--overlay-ring-locked-fill` — selection-lock ring (~20% fill)

## Fonts required

| Family | Role | Source |
|---|---|---|
| **Fraunces** | Display / headings (editorial serif) | Google Fonts |
| **Space Grotesk** | UI / body — **all comment box copy, badges, session labels** | Google Fonts |
| **JetBrains Mono** | Literals — **NOT used anywhere in Phase 3** | Google Fonts |

All three fonts were wired in Phase 1. No new font loading required.

## Frame index — spec screen/state → design frame

Each row maps a `requirements.md` UI Requirements state (or the design-brief 24-state checklist) to a frame in `pencil/v0.2-p3.pen` by id and name.

### GROUP A — Live Preview Header (F36–F38)

| Checklist item | Screen / State | Frame id | Frame name |
|---|---|---|---|
| 1 | Live Preview — point mode OFF (default) | `Imo5T` | F36 · Live Preview — Point Mode OFF |
| 2 | Live Preview — point mode OFF, disabled (preview not live) | `otgBk` | F37 · Live Preview — Point Mode OFF, Disabled |
| 3 | Live Preview — point mode ON (crosshair active, Esc hint visible) | `I2M3R` | F38 · Live Preview — Point Mode ON |

### GROUP B — Point Mode Overlay (F39–F44)

| Checklist item | Screen / State | Frame id | Frame name |
|---|---|---|---|
| 4 | Point mode ON, hovering element (ring highlight, no comment box) | `XgAjM` | F39 · Point Mode ON, Hovering Element |
| 5 | Point mode ON, selection locked (ring frozen, cream veil, comment box — element variant) | `KOrfc` | F40 · Point Mode ON, Selection Locked |
| 6 | Point mode ON, whole-page comment (no highlight, page-variant comment box) | `V1APKE` | F41 · Point Mode ON, Whole-Page Comment |
| 7 | Point mode ON, with existing pins (pins visible on canvas + hover highlight on separate element) | `YDm1x` | F42 · Point Mode ON, With Existing Pins |
| 8 | Point mode OFF, with existing pins (standard view, pins visible, no overlay) | `KOzGO` | F43 · Point Mode OFF, With Existing Pins |
| 9 | Point mode ON, "Comment on this page" affordance visible at bottom of overlay | `d7hfnZ` | F44 · Point Mode ON, 'Comment on this page' Affordance |

### GROUP C — Comment Box (F45–F48)

| Checklist item | Screen / State | Frame id | Frame name |
|---|---|---|---|
| 10 | Comment box — element variant, no type selected (default) | `D7NxR` | F45 · Comment Box — Element, no type |
| 11 | Comment box — element variant, "Something's broken" active | `YEBIZ` | F46 · Element · Something's broken |
| 12 | Comment box — element variant, "Change this" active | `nqOfE` | F47 · Element · Change this |
| 13 | Comment box — page variant (no thumbnail, page indicator shown) | `Dj1Od` | F48 · Comment Box — Page Variant |

### GROUP D — Mock / Demo affordance (F49)

| Checklist item | Screen / State | Frame id | Frame name |
|---|---|---|---|
| 14 | DEMO MODE — "Simulate click on element" floating panel (dogfood-only) | `XL9oc` | F49 · DEMO MODE — Simulate Click Panel |

### GROUP E — Board REPORTED section + fix-comment card states (F50–F55)

| Checklist item | Screen / State | Frame id | Frame name |
|---|---|---|---|
| 15 | Board — REPORTED waiting card (thumbnail, note, type badge, "Start Fix" button) | `F8972` | F50 · Board — REPORTED waiting card |
| 16 | Board — REPORTED in-progress card ("In progress" badge, "Start Fix" hidden) | `qxjjM` | F51 · Board — REPORTED in-progress card |
| 17 | Board — REPORTED queued card ("Queued" badge, "Start Fix" hidden) | `CrIY0` | F52 · Board — REPORTED queued card |
| 18 | Board — REPORTED done card (resolved treatment, checkmark, no button) | `oEoxY` | F53 · Board — REPORTED done card |
| 19 | Board — REPORTED page-level card (no thumbnail, page icon in thumbnail area) | `xjyma` | F54 · Board — REPORTED page-level card |
| 20 | Board — REPORTED section empty (section header hidden/collapsed) | `mi010` | F55 · Board — REPORTED empty (hidden) |

### GROUP F — Fix Session feed (F56–F59)

| Checklist item | Screen / State | Frame id | Frame name |
|---|---|---|---|
| 21 | Fix session — active narration (session name = truncated comment note) | `MVl8k` | F56 · Fix Session — Active narration |
| 22 | Fix session — checkpoint, approve-only state (Phase 1/2 block, unchanged) | `GA76f` | F57 · Fix Session — Checkpoint waiting |
| 23 | Fix session — checkpoint, reject flow (note input inline in checkpoint block) | `X2VOLQ` | F58 · Fix Session — Reject with note |
| 24 | Fix session — done + "Applying fix…" / preview refreshing indicator | `e4tAvw` | F59 · Fix Session — Applied, preview refreshing |

## Reusable components (design symbol → suggested component)

| Design frame / element | Frame id | Backend component intent |
|---|---|---|
| Component · Fix-Comment Card | `X2QsS` | Shared card component reused across all REPORTED card states (F50–F55). Three slots: Thumb (62×50 crop), Body (note + badge), Action ("Start Fix" button or status badge). |
| Point-mode crosshair toggle | within F36/F37/F38 preview header | Stateful toggle button (`PointModeToggle`); three render states: active, inactive, disabled. |
| Hover ring overlay | within F39/F40 Stage Area | Thin overlay layer (`PointModeOverlay`); renders hover ring during hover, freezes + adds cream veil on lock. |
| Pin pill | within F42/F43 Stage Area | Small pill per open fix-comment (`FixPin`); two variants: bug (orange) and change (blue); non-interactive in Phase 3. |
| Comment box | F45–F48 | Single component (`CommentBox`) with two variants (element/page); controlled type toggle inside. |
| DEMO MODE panel | F49 | `SimulateClickPanel` — dogfood-only floating panel; conditionally rendered when `IS_DEMO_BUILD`. |
| "Comment on this page" affordance | within F44 Stage Area | `PageCommentAffordance` strip pinned to the bottom of the point-mode overlay. |

## Layout / IA notes (structural, not visual)

- **Point-mode overlay sits directly on F32 live-stage canvas** — same overlay-ready clean canvas from Phase 2. The overlay intercepts pointer events when point mode is ON; passes them through when OFF. Backend mounts it as a sibling layer inside the stage wrapper, above the webview but below nothing else.
- **No new tab bar changes.** The Phase 3 additions are all inside the Preview Stage and on the Board — the tab bar (Live Preview / Decisions / Progress / Docs) is unchanged.
- **Pin z-order:** pins sit above the "Comment on this page" affordance strip, but below the hover highlight ring. This ensures the affordance strip doesn't occlude pins, and the hover ring reads above all passive layers.
- **REPORTED section board order:** BUILDING NOW → OFF-TRACK → NEEDS YOU → **REPORTED** → UP NEXT → PLANNED → DONE. The REPORTED section header uses the same typography and spacing as existing section headers — read F50 for the exact treatment.
- **REPORTED section collapses when empty** — do not render a ghost section header when no fix-comment cards are in `waiting` status. F55 shows this collapsed state.
- **Fix session feed is identical to Phase 1/2 session feed** — the only Phase 3 addition is the session name label referencing the comment note. No new feed primitives. F56–F59 show the session name treatment.
- **Reject note input is inline expansion, not a new surface** — F58 shows the checkpoint block with a note input appearing below the "Reject" button. It does not navigate away or open a modal. After "Submit rejection", the block clears and narration resumes in the same feed.
- **Comment box is anchored, not modal** — it anchors near the selected element (element variant) or near the bottom of the stage (page variant). It should not float freely in the center. The design brief notes both anchor positions (element near upper area → box below; near lower area → box above) — F40 shows the primary position; a Pencil note within F40 indicates the flip intent.
- **No code/selector strings anywhere in the renderer.** The CSS selector and screenshot crop are internal to the main process. No `data-selector` attribute, no `.btn-primary` text, no file paths appear in any feed event or comment box surface.

## Deviations from requirements

None. All 24 checklist states are designed (F36–F59). The design matches the requirements.md UI Requirements table exactly. The designer created a separate Phase 3 file (`pencil/v0.2-p3.pen`) rather than extending `v0.2-p2.pen` — backend should reference `v0.2-p3.pen` for Phase 3 frames (F36–F59) and `v0.2-p2.pen` for Phase 2 base states (F30–F35) if needed as reference.

## API contracts expected from backend

Copied verbatim from `requirements.md` API Contracts — build to these:

### points:register
**Direction:** renderer → main
**Request:** `{ projectId, selector?, boundingBox?, screenshotCrop?, pinX?, pinY?, note, noteType: 'bug'|'change' }`
**Success:** `{ card: Card }` — newly created fix-comment card with status `'waiting'`
**Errors:** `not_found`, `preview_not_live`, `validation_failed`

### fix-sessions:start
**Direction:** renderer → main
**Request:** `{ projectId, cardId }`
**Success:** `{ session: Session, queued: false }` (started) or `{ session: null, queued: true }` (queued)
**Errors:** `not_found`, `not_waiting`, `no_visual_context`, `artifact_dir_failed`

### points:list
**Direction:** renderer → main
**Request:** `{ projectId }`
**Success:** `{ pins: FixCommentPin[] }` — open pins only (not `done`); `pinX`/`pinY` null for page-level
**Errors:** `not_found`

### points:update
**Direction:** main → renderer (push)
**Payload:** `{ projectId, pins: FixCommentPin[] }` — full current list on every change (not a diff)
**Renderer action:** reconcile pin overlay; add new pins, remove resolved pins

All new channels typed in `src/shared/ipc-schemas.ts` (Zod), exposed via contextBridge — same pattern as Phase 1 and Phase 2.
