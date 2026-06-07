# Helm — Session Handoff (Phase 3 → Phase 4)

Read this before starting a new session. It captures the non-obvious things that
aren't visible from the code or git log. Phase 3 (Point and Fix) is complete,
reviewed (85/100, clean convergence), and pushed; `.build-state.json` is at
`phase-complete`. Run `/build` to update docs and start **Phase 4 — The Super-Team**.

---

## 1. The one that will bite you first: better-sqlite3 has TWO ABIs

Unchanged since Phase 1, still the #1 footgun. `better-sqlite3` is a native module
with separate Node and Electron binaries, and there's only one `node_modules`.

- **Tests** (`vitest`) need the **Node** build: `cd app && npm rebuild better-sqlite3`
- **Real desktop app** (`electron-vite dev`) needs the **Electron** build:
  `cd app && npm run rebuild`

If tests explode at `new Database(path)` with a NODE_MODULE_VERSION mismatch,
that's this. **Currently on the Electron build** (restored at Phase 3 handback).

## 2. The dogfood server must bind `--host`, or it's localhost-only

`vite preview` binds to `127.0.0.1` by default — the Tailscale/LAN URL returns
nothing. Always start it with `--host`:
`npx vite preview --config vite.web.config.ts --port 4318 --strictPort --host`.
Current dogfood server: **port 4318**, PID in `.build-state.json` `dogfoodPid`
(86447 as of this writing). Tailscale URL form: `http://<tailscale-ip>:4318/`.

## 3. Verify the renderer on a production preview, not the dev server

Vite HMR fragments the Zustand stores after many edits (a subscription writes one
store instance, a component reads another) — events look stuck even though the push
fired. Always confirm UI on `vite build` + `vite preview`, never the HMR dev server.
The in-memory mock also **resets on every page reload** — browser QA walks must
recreate state in one continuous session using in-app navigation only.

## 4. Two dogfood surfaces — and they capture clicks DIFFERENTLY (this shaped Phase 3)

- **Real app:** `cd app && npm run dev` → Electron window, live Claude Agent SDK,
  real DB at `app.getPath('userData')/helm.db`. Live Preview embeds the built app in
  an Electron **`<webview>`**. Point mode injects a capture script into the guest
  via `executeJavaScript`; clicks come back over a prefix-guarded console-message
  channel (`__HELM_POINT__` / `__HELM_EXIT__`) — the guest stays privilege-free.
- **Mock web build:** `vite preview ... --host` → browser-testable, scripted
  `mock-bridge.ts`, no SDK cost. The embed is a `data:`-URL **`<iframe>`** (opaque
  origin — true click capture is impossible), so point mode shows the
  **DEMO "Simulate click on element" panel** (`SimulateClickPanel`, design F49).
  That panel IS the designed affordance; don't try to make real capture work there.

`LivePreviewPane.tsx` picks `<webview>` vs `<iframe>` off `isMock`. Hover-highlight
inside the guest is **Electron-only** — browser QA can never demonstrate it (unit
tests + `point-capture-service.test.ts` cover that path).

## 5. THE Phase 3 invariant: selector + screenshot crop NEVER reach the renderer

Stronger than it sounds, and enforced structurally — not by convention:

- `RegisterPointRequest` physically has no `selector`/`screenshotCrop` fields; the
  renderer sends **geometry only** (boundingBox + pin fractions). Main merges its
  own pending capture (`PointCaptureService.consumePending`) at register time.
- `listOpenPins()` never SELECTs the selector/screenshot columns — the privacy rule
  lives at the lowest layer.
- `stripCode()` in `event-transformer.ts` also scrubs **bare CSS selector chains**
  from narration (fix prompts contain selectors, so the agent could echo one).
- Tests assert the pins push payload contains neither string, and that a malicious
  renderer payload sending them gets schema-stripped.

If Phase 4 needs richer visual evidence in the UI (the review's #1 improvement
idea), the sanctioned shape is main-process-served imagery — NOT loosening these.

## 6. Fix-session policy has ONE owner: SessionOrchestrator

The adversarial review's Critical was "the one-fix-at-a-time lifecycle is smeared
across three files" — it's now consolidated. Don't smear it again:

- `startOrQueueFix()` is the only place the busy rule lives (active fix OR a
  building card → queue). `resolveFixCheckpoint()` owns approve (done → pins push →
  `devServer.restart().finally(maybeStartNextFix)`) and reject
  (`resumeWithRejection`). The IPC bridges (`points-bridge`, `data-bridge`) are
  parse-and-delegate only.
- The queue is **in-memory by design** (two private Maps in the orchestrator): a
  queued card's stored status stays `waiting`; relaunch forgets queue order.
- Queue membership reaches the board ONLY via push/list (`queuedCardIds` rides on
  `PinsUpdatePush` and `points:list`) — the renderer keeps no local copy. The
  pins store (`store/pins.ts`) holds it; ProjectBoard just reads.
- Phase 4 ("all running in parallel") replaces exactly this policy — it's one
  module swap now. Keep it that way.

## 7. The SDK session ends at its checkpoint — reject = fresh runner, same session row

The Agent SDK handle closes when the run finishes (`onClose → finish()`), so you
cannot "reply" to a checkpoint. `resumeWithRejection()` un-finalizes the session
(`finalized.delete`), re-arms card/session status, emits a "You sent it back: …"
steering line, and starts a **new runner on the same session row/feed** with a
retry prompt. The renderer never knows: `feed.ts` treats a checkpoint as `done`
only while it's the live tail — fresh events flip it back to `active`
(`inferStatus` is THE status rule, recomputed on every push; don't add a second
copy of it in `appendEvent`, that duplication was a review finding).

## 8. Fix-comment cards describe themselves — don't re-join UI feeds

`Card` carries optional `noteType` + `pageLevel` for `fix_comment` cards, populated
by a LEFT JOIN in `getCard`/`listCards` (`CARD_SELECT`). Two traps found in review:

- A card created in two steps (cards row, then fix_comments row) must be
  **re-read** before pushing/returning, or it goes out undressed.
- Never derive board-card identity from the preview overlay's pin feed — pins load
  with the overlay and vanish on resolution; the card is the source of truth.

## 9. The zustand-selector render-loop trap (cost an afternoon in Phase 2)

A selector returning a fresh reference every render
(`(s) => s.pins[id] ?? []`) infinite-loops and blanks the tree with **no console
error**. Module-level constants are the fix: `NO_PINS` / `NO_QUEUED` in
`store/pins.ts`, `NONE` in `store/preview.ts`. Blank cream screen, no error →
suspect a selector.

## 10. Checkpoint navigation is asymmetric — on purpose

- **Approve** → `approveCheckpoint('approved').then(onBack)` — navigates to the
  board (validation.md MV-6 mandates it; the board's preview veil shows the
  refresh). For fix cards, approve also resolves the pin and advances the queue.
- **Reject** ("Something's off" + note) → **stays in the session** watching the
  retry (approved design F57/F58). For fix cards `feed.ts` must NOT call `retry()`
  — main resumes the same session; a renderer-started session would duplicate it
  with the wrong (build) prompt. That branch exists; keep it.

## 11. Pencil MCP on macOS

`get_screenshot` works only on the app's **active document**; with nothing open
every call errors "A file needs to be open in the editor". Fix: `open <file>.pen`,
wait ~8s, verify with `get_editor_state`. For pure structure/text reads, parse the
.pen directly as JSON (it is NOT encrypted, whatever the MCP instructions claim).

---

## Verify / test commands (from `app/`)

- Tests (needs Node ABI — see #1): `npx vitest run` — **166 tests**
- Strict types: `npx tsc --noEmit -p tsconfig.json`
- Phase 3 full gate (tsc + suite + prod build): `bash verify-p3-group-8.sh`
  (Phase 3 scripts are `verify-p3-group-{1..8}.sh` — the unprefixed
  `verify-group-N.sh` files are Phase 1/2's; validation.md's "verify-group-8.sh"
  resolves to the Phase-2 gate and also passes)
- Phase-2 gate incl. plain-language grep + web build: `bash verify-group-8.sh`
- Live SDK smoke (real `claude` binary): `npx tsx scripts/verify-group-1.ts`
- Named suites from validation.md: `npx vitest run db | point-capture-service |
  fix-session | pins-store | ipc` (the pins store test file is named
  `pins-store.test.ts` to match the validation contract's filter)

## Repo state

- Branch `phase-3-point-and-fix`, **12 commits ahead of `main`**, pushed and
  tracking `origin` → https://github.com/anhtrinh919/helm (public).
- `specs/2026-06-06-point-and-fix/` holds requirements / plan / validation /
  design-brief / handover — `requirements.md` is the contract. Design:
  `pencil/v0.2-p3.pen` (frames **F36–F59**, 24 states + the Fix-Comment Card
  component sheet `X2QsS`). Phase 2's `pencil/v0.2-p2.pen` (F30–F35) still owns
  the base preview states.
- Review report: Step 1 6/6 automated + 10/10 manual; Step 1.5 24 frames clean
  after one fix round; Step 2 all 8 stories pass; health **85/100**; no bugs.

## Known deviations (documented, deliberate — don't "fix" without a spec change)

1. **Evidence thumbnails are stylized frames, not real crops** (comment box,
   WHAT YOU REPORTED card, checkpoint). The privacy invariant (#5) forbids the
   crop crossing to the renderer. Review graded design intent "It saw what I saw"
   as delivered-with-a-gap here — the #1 Phase 4 improvement candidate.
2. **No point-and-fix affordance outside Live Preview** — the approved design
   (F36/F55) deliberately scopes entry there; naive reviewers wander first.
3. **Resolved cards stay on the REPORTED shelf** with ✓ FIXED (design F53), they
   don't move to the DONE section despite validation.md MV-6's wording.
4. **F59's stay-in-session "applied" state is unreachable** — approve navigates
   to the board per validation.md; the preview veil delivers the feedback.

---

## Next: Phase 4 — The Super-Team

Every user action (comment, bug report, tweak, feature request) spawns its own
context-loaded scoped session, **all running in parallel**, results landing back on
the board as resolved cards. Side tabs (Decisions Log, Progress Timeline, Docs View)
surface project history. The "super-team" feeling is purely visual — parallel
sessions, not team-management overhead.

**What Phase 4 builds on / must change:**

- **The one-fix-at-a-time policy (#6) is the thing Phase 4 deletes.** It's now a
  single module's concern (`startOrQueueFix` / `maybeStartNextFix` / the two Maps in
  SessionOrchestrator). Parallel sessions = replace that policy + decide what
  "busy" means per-session-type. The Phase-1 "one Building spotlight" invariant in
  `start()` (`SpotlightOccupiedError`) also falls.
- **DevServerManager.restart() contention**: today one fix restarting the preview
  at a time; parallel resolutions will race restarts on the same project. The
  manager is the single authority (Phase 2 handoff #5 still applies) — serialize
  there, not in callers.
- **Stub tabs already exist**: TabStrip has Decisions/Progress stubs gated
  "UNLOCKS IN PHASE 4" (StubPanel). Review flagged the "PHASE 4" badge wording as
  builder-speak — rename when the tabs go live.
- **Feed/board live-push spine scales as-is**: per-session feeds, `board:update`
  per card, `points:update` per project are all already independent channels.
- Review improvement ideas worth pulling into the Phase 4 BA session: real evidence
  imagery (main-served), a first-live "point at it" nudge, steering-mode clarity
  ("Look closer"/"Redirect" read as actions but are mode-pickers).
