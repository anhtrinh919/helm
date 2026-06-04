# Frontend → Backend Handover — Helm, Phase 2: Watch It Get Made

**Design track:** external-pencil
**Design file — source of truth:** `pencil/v0.2-p2.pen`
**Design tokens:** `./design-tokens.css`
**Visual canon:** the **v4 (Maximalist)** system — warm cream canvas (`#FFEFD2`), ink text (`#1B1208`), scarce semantic accents. Inherited unchanged from Phase 1; Phase 2 adds **no new brand tokens**, only Live-Preview surface tokens (stage surround + cream veils).

> **Backend must open `pencil/v0.2-p2.pen` and build the Live Preview states from the F30–F35 frames.** Visual details live in the file, not in this doc. This handover is an index, not a spec.

## Design intent
*"I can already use what I asked for."* The Live Preview is the **delivery**, not a status display — when the running app appears it must feel finished and yours, never fragile or technical. Every in-between state (building veil, snag, blocked) exists only to protect that payoff feeling: calm, warm, never alarming.

## Design tokens
Import `./design-tokens.css` (generated from the v4 variable set in `v0.2-p2.pen`). New Phase 2 tokens: `--preview-stage` (neutral surround for the embedded app), `--preview-veil-strong/-/-light` (translucent cream overlays for the building/snag states), `--window-dot-*` (macOS chrome dots on the running-app stage mock). Backend imports this directly (e.g. `@import './design-tokens.css'` from the renderer's global stylesheet) — same pattern as Phase 1.

## Fonts required
| Family | Role | Source |
|---|---|---|
| **Fraunces** | Display / headings (editorial serif) | Google Fonts |
| **Space Grotesk** | UI / body | Google Fonts |
| **JetBrains Mono** | Literals only — **NOT used anywhere in Live Preview copy** | Google Fonts |
Already wired in Phase 1; no new font loading needed.

## Frame index — spec screen/state → design frame
Each row maps a `requirements.md` UI Requirements state to a frame in `pencil/v0.2-p2.pen` (by id and name).

### Live Preview pane (main area — the F29 stub becomes real)
| Screen / State | Frame id | Frame name |
|---|---|---|
| Live Preview — No preview yet (before first runnable build) | `anGYL` | F30 · Live Preview — Nothing Yet |
| Live Preview — Building veil (build step mid-flight) | `xHQWh` | F31 · Live Preview — Building Veil |
| Live Preview — Live app running (interactive, full-bleed) | `mfq7E` | F32 · Live Preview — Live App Running |
| Live Preview — Snag / auto-recovering | `ZCOnE` | F33 · Live Preview — Fixing a Snag |
| Live Preview — Blocked rest state (paired with board card below) | `P9jWZc` | F34 · Live Preview — Blocked Rest |

### Blocking problem on the board (reused Phase 1 surface)
| Screen / State | Frame id | Frame name |
|---|---|---|
| Build-Spine Board — Needs-you / decision card raised by a blocking build error | `Vswv0` | F35 · Board — Needs-You Card Raised |

**Pairing note:** the `blocked` preview state is a **pair** — `F34` (calm "PAUSED — NEEDS YOU" rest state in the preview) shows simultaneously with `F35` (the actionable decision card on the board). The preview never carries the action; the board card does. `F35` reuses the Phase 1 Needs-You / decision-prompt machinery (Phase 1 frames F12 / F22 / F25–F26) — do not build a new decision surface.

## Reusable components (design symbol → suggested component)
| Design frame | id | Backend component intent |
|---|---|---|
| Left Rail | `F4Tf0` | Existing Phase 1 build-spine rail — unchanged; shown for context in the new frames |
| Top Tab Bar | `KpF7n` | Existing tab bar (Live Preview / Decisions Log / Progress / Docs). **Live Preview tab is now real**; the other three remain stubs. The active-tab treatment must work as one tab among several. |
| Component · Order Up Running App | `TzvQ2` | The **sample embedded app** used to mock the running-app stage. This is illustrative content only — the real stage hosts the actual built app via webview. Use it to read the stage surround, padding, and window-chrome treatment, NOT as a component to build. |
| Window Chrome Frame | `o5jB2` | The neutral stage surround (`--preview-stage`) + macOS dots that frame the running app. Build this as the preview "stage" wrapper; the live dev-server webview mounts inside it. |
| Board Card — Needs-You | `k77Ua` | Reused Phase 1 needs-you card — no new build. |

## State → preview status mapping (for the `PreviewState` union in requirements.md)
| `PreviewState.status` | Frame |
|---|---|
| `none` | `anGYL` (F30 Nothing Yet) |
| `building` | `xHQWh` (F31 Building Veil) |
| `live` | `mfq7E` (F32 Live App) — webview loads `state.url` into the stage |
| `snag` | `ZCOnE` (F33 Fixing a Snag) |
| `blocked` | `P9jWZc` (F34 Blocked Rest) + raise board card per `Vswv0` (F35) |

## Layout / IA notes (structural, not visual)
- **The running app is full-bleed inside the stage with NO Helm or browser chrome** — no address bar, no URL, no refresh button, no devtools. The only framing is the neutral `--preview-stage` surround + macOS-style window dots (decorative, non-functional). Scrub any `localhost:PORT` / path / console output from every state — this is the one surface where a technical string could leak.
- **The webview must mount inside the stage wrapper** (`o5jB2` treatment), not replace the whole main area. The Helm left rail and tab bar stay visible around it.
- **Veils sit OVER the stage, not instead of it** — building (F31) and snag (F33) overlay a translucent cream veil (`--preview-veil-*`) on top of the last-good app so "the current version is still there underneath" reads true. Do not blank the app to a solid panel during these states.
- **F32 (live app) must stay an overlay-ready clean canvas** — Phase 3's point-and-fix annotation layer lands directly on this surface. Do not add a competing hover/highlight/border treatment to the stage.
- **Webview security:** `nodeIntegration: false`, `contextIsolation: true` — the embedded built app gets no elevated privileges (per requirements.md).

## Deviations from requirements
None. All 6 UI Requirement states are designed (F30–F35); the blocked state is correctly designed as the F34+F35 pair; the board card reuses the Phase 1 needs-you/decision surface as specified. The sample app in the frames ("Order Up" kitchen ticket board) is illustrative stage content only — it is not a deliverable.

## API contracts expected from backend
Copied verbatim from `requirements.md` API Contracts — build to these:
- **`preview:get-state`** (renderer→main): `{ projectId }` → `{ state: PreviewState }` where `PreviewState` ∈ `{none}` / `{building}` / `{live, url}` / `{snag}` / `{blocked}`; errors `not_found`, `db_unavailable`.
- **`preview:update`** (push main→renderer): `{ projectId, state: PreviewState }` — renderer loads `url` into webview on `live`, else shows the matching veil/overlay frame above.
- **`devserver:start`** (renderer→main): `{ projectId }` → `{ url }`; errors `not_found`, `no_artifact`, `already_running` (returns `url`), `start_failed`.
- **`devserver:stop`** (renderer→main): `{ projectId }` → `{ stopped: true }`; errors `not_found`, `not_running`.
- **`sessions:start`** (extended, same channel): when a project has/builds an `artifact_dir`, main starts the session with a real cwd + full tools instead of `tmpdir()` + `allowedTools:[]`. New error `artifact_dir_failed`. Shape unchanged; invisible to renderer.
- All new channels typed in `src/shared/ipc-schemas.ts` (Zod), exposed via contextBridge, validated both sides — existing Phase 1 pattern.
