# Frontend → Backend Handover — Helm, Phase 1

**Design track:** external-pencil
**Design file — source of truth:** `pencil/v0.1.pen`
**Design tokens:** `./design-tokens.css`
**Visual canon:** the **v4 (Maximalist)** frames — warm cream canvas, ink text, confetti, bright semantic accents. The earlier `V4 —` prefixed frames and the `v1-*` token set are **superseded leftovers** — build ONLY from the `F#` frames indexed below.

## Design intent
"A CEO who made clear decisions and walked away knowing the team is executing." The **board is the scoreboard** (dense, live, authoritative); the **scoped session is the build-cam** (streaming, readable, never alarming). The product is a *director's chair*, not a grandstand — the user can steer mid-build, not just watch.

## Fonts required
| Family | Role | Source |
|---|---|---|
| **Fraunces** | Display / headings (editorial serif) | Google Fonts |
| **Space Grotesk** | UI / body | Google Fonts |
| **JetBrains Mono** | Literals only (URLs, IDs, code-ish text) | Google Fonts |

## Frame index — spec screen/state → design frame
Each row maps a requirements.md screen + state to a frame in `pencil/v0.1.pen` (by id and name).

### Front door & project switcher
| Screen / State | Frame id | Frame name |
|---|---|---|
| Front door — first run / empty (no projects), "What do you want to build?" | `s9Rus` | F1 · Front-Door · First Run |
| Project switcher — populated (rail with live background status) | `B4PoG7` | F2 · Project Switcher · Populated |

### New Project Wizard (entry = a sentence)
| Screen / State | Frame id | Frame name |
|---|---|---|
| Wizard — sentence entry | `YE0VQ` | F3 · Wizard — Sentence Entry |
| Wizard — scoping Q&A, button-choice card | `q11K0G` | F4 · Wizard — Q&A Button Choice |
| Wizard — scoping Q&A, free-text card | `VoVHV` | F5 · Wizard — Q&A Free-Text |
| Wizard — editable plan review | `asMby` | F6 · Wizard — Plan Review |
| Wizard — approving (spinner) | `XI5Qs` | F7 · Wizard — Approving Spinner |
| Wizard — error | `El3mk` | F8 · Wizard — Error |

### Build-spine board (replaces kanban)
| Screen / State | Frame id | Frame name |
|---|---|---|
| Board — empty (new project, no items) | `xyzcT` | F9 · Build-Spine · Empty |
| Board — planned / up-next (ordered, dependency-aware) | `TwdqK` | F10 · Build-Spine · Planned / Up-next |
| Board — building spotlight ("Building · Step 2 of 8") | `MPNEP` | F11 · Build-Spine · Building Spotlight |
| Board — needs-you headline (agent waiting, promoted) | `B8V94j` | F12 · Build-Spine · Needs-You Headline |
| Board — failed / off-track (agent stopped) | `b1vjJ0` | F13 · Build-Spine · Failed / Off-track |
| Board — done, collapsed history | `Mb4c9` | F14 · Build-Spine · Done Collapsed History |

### Scoped session (the steerable conversation inside an item)
| Screen / State | Frame id | Frame name |
|---|---|---|
| Session — active (plain-English feed) | `J9cJT` | F16 · Scoped Session — Active |
| Session — paused for decision | `AbKqD` | F17 · Scoped Session — Paused for Decision |
| Session — steering active (interrupt / redirect / look-closer) | `a2Mwaq` | F18 · Scoped Session — Steering Active |
| Session — question queue (pending / answered / re-open) | `xT9dX` | F19 · Scoped Session — Question Queue |
| Session — done with checkpoint | `Vlv3D` | F20 · Scoped Session — Done with Checkpoint |
| Session — error | `YOdpd` | F21 · Scoped Session — Error |

### Needs-you, decisions & reviewable results
| Screen / State | Frame id | Frame name |
|---|---|---|
| Needs-you — single question headline | `G4bQD` | F22 · Needs-You · Single Question Headline |
| Reviewable result — shown ("does this look right?") | `EIi2N` | F23 · Reviewable-Result · Result Shown |
| Reviewable result — flagged ("something's off") | `ojvFL` | F24 · Reviewable-Result · Flagged |
| Decision prompt — pending (button) | `QRTyJ` | F25 · Decision Prompt · Pending (Button) |
| Decision prompt — pending (free text) | `E1o0Xl` | F26 · Decision Prompt · Pending (Free Text) |
| Decision prompt — plan approval (editable) | `W8hzx` | F27 · Decision Prompt · Plan Approval |
| Decision prompt — answered / decided (re-openable) | `MnooM` | F28 · Decision Prompt · Answered |

### Stub tabs (visible but not functional in Phase 1)
| Screen / State | Frame id | Frame name |
|---|---|---|
| Stub — Live Preview tab (Phase 2) | `UlIIY` | F29 · Stub — Live Preview tab |
| Stub — Decisions Log tab (Phase 4) | `WbvPV` | F30 · Stub — Decisions Log tab |
| Stub — Progress tab (Phase 4) | `oqSBX` | F15 · Stub Tab · Progress (Phase 4) |

**Stub coverage note:** Point-and-Fix (Phase 3) and Docs View (Phase 4) stubs are not separately drawn — reuse the representative stub pattern above (same "coming in Phase N" panel). Reveal each tab as its phase unlocks; do not render future tabs as dead/greyed UI.

## Build notes
- Reads/writes are all local (the user's machine + their own Claude subscription). No raw code, git, terminal, or file paths ever surface to the user.
- Plain language everywhere: "Step 2 of 8" (not "Phase 1/4"), "Building Sign-in & accounts" (not "wiring sign-in form"); no `CFP-08`-style codes in the user's view; model name stays ambient.
- Persistence is user-facing: sessions are durable background processes; the rail shows live per-project status while you're elsewhere; reopening the app resumes visibly.
- Cleanup (optional, non-blocking): the leftover `V4 —` frames in `v0.1.pen` can be deleted to keep the file tidy; they are not referenced here.
