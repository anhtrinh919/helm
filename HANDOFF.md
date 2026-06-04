# Helm — Session Handoff (Phase 2 → Phase 3)

Read this before starting a new session. It captures the non-obvious things that
aren't visible from the code or git log. Phase 2 (Watch It Get Made) is complete
and committed; `.build-state.json` is at `phase-complete`. Run `/build` to update
docs and start **Phase 3 — Point and Fix**.

---

## 1. The one that will bite you first: better-sqlite3 has TWO ABIs

Unchanged from Phase 1, still the #1 footgun. `better-sqlite3` is a native module
with separate Node and Electron binaries, and there's only one `node_modules`.

- **Tests** (`vitest`) need the **Node** build: `cd app && npm rebuild better-sqlite3`
- **Real desktop app** (`electron-vite dev`) needs the **Electron** build:
  `cd app && npm run rebuild`

If tests explode at `new Database(path)` with a NODE_MODULE_VERSION mismatch,
that's this. Always leave it on the Electron build when you hand back to the user.

## 2. The dogfood server must bind `--host`, or it's localhost-only

`vite preview` binds to `127.0.0.1` by default — the Tailscale/LAN URL returns
nothing and the user can't dogfood from their phone or another Mac. Always start it
with `--host`:
`npx vite preview --config vite.web.config.ts --port 4318 --strictPort --host`.
Current dogfood server: **port 4318**, PID in `.build-state.json` `dogfoodPid`
(72131 as of this writing). Tailscale URL form: `http://<tailscale-ip>:4318/`.

## 3. Verify the renderer on a production preview, not the dev server

Vite HMR fragments the Zustand stores after many edits (a subscription writes one
store instance, a component reads another) — events look stuck even though the push
fired. Always confirm UI on `vite build` + `vite preview`, never the HMR dev server.

## 4. Two dogfood surfaces — and they embed the preview DIFFERENTLY (Phase 3 hinges on this)

- **Real app:** `cd app && npm run dev` → Electron window, live Claude Agent SDK on
  the user's subscription, real DB at `app.getPath('userData')/helm.db`. Needs the
  Electron ABI (#1). The Live Preview embeds the running app in an Electron
  **`<webview>`** (`webviewTag: true` is set in `webPreferences`).
- **Mock web build:** `vite preview ... --host` → browser-testable, scripted
  `mock-bridge.ts` data, no native module, no SDK cost. The Live Preview embeds a
  tiny inline demo app in a plain **`<iframe>`** (the demo is a `data:` URL).

`LivePreviewPane.tsx` picks `<webview>` vs `<iframe>` off `isMock`. **This split is
the central fact for Phase 3** (see the Phase 3 section below) — capturing *which
element the user clicked inside the embedded app* works very differently across a
cross-process `<webview>` and a `data:`-URL `<iframe>`.

## 5. Preview state has ONE authority: DevServerManager

`src/main/sdk/dev-server-manager.ts` owns both the dev-server child-process
lifecycle AND the preview state machine (`none → building → live → snag → blocked`).
It is the single source of truth; the renderer store (`store/preview.ts`) only
mirrors what the manager pushes over `preview:update`. The Stage-3 adversarial
review's three Criticals all traced to "preview state had no single authority" —
don't reintroduce a second writer. Specifically:

- `resume()` **probes the URL before trusting a stored PID** — PIDs get recycled by
  the OS, so a live-looking `dev_pid` may be a stranger's process. Keep the probe.
- `build_steps.status` is **outcome-only** (`running | complete | failed`). 'snag'
  is a *preview* state, not a build-step status — don't conflate them again.
- Process I/O (spawn/probe/manifest/pidAlive) is **injected** (`DevServerDeps`) so
  tests drive it without real servers. `defaultDeps()` is the production wiring.

## 6. The build→preview contract is `helm.json`

The build agent writes `helm.json` (`{ startCommand, port }`) into the project's
`artifact_dir`; DevServerManager reads it to start the server. This is how a
text-narrating agent session turns into a runnable app. The real pipeline runs with
full tools + `permissionMode: 'bypassPermissions'` + `cwd` = the artifact dir; the
old Phase-1 narration-only path (`allowedTools: []`, tmpdir) still exists and is
selected when no `DevServerManager` is injected. `artifact_dir` lives under
`app.getPath('userData')/projects/<projectId>/` — hidden from the user by design.

## 7. The hard gate now also strips code from real tool output

Phase 2 gave the agent real tools, so `event-transformer.ts` gained `stripCode()`:
it removes fenced blocks, inline backtick spans, and absolute filesystem paths
before any narration reaches the feed. The gate invariant from Phase 1 still holds —
no code, paths, tool args, or terminal text may cross. With real tools running, this
is load-bearing, not cosmetic.

## 8. The zustand-selector render-loop trap (cost an afternoon)

A selector that returns a fresh object literal every render
(`(s) => s.states[id] ?? {status:'none'}`) triggers an infinite re-render that
blanks the whole tree with **no console error** — just a cream screen. Fix is a
**module-level constant**: `const NONE = {status:'none'}` then
`usePreview((s) => s.states[id]) ?? NONE`. If a screen goes blank with no error,
suspect a selector returning a new reference.

## 9. Checkpoint approval navigates back to the board

"Looks good, continue" on a checkpoint calls `approveCheckpoint('approved')` **then
`onBack()`** — approving alone leaves `status==='done'` and the block stays mounted,
so without the navigation the button looks dead (this was a dogfood fix). Any new
terminal action on the session screen needs to move the user somewhere, not just
mutate state in place.

---

## Verify / test commands (from `app/`)

- Tests (needs Node ABI — see #1): `npx vitest run` — **110 tests**
- Strict types: `npx tsc --noEmit`
- Full Phase-2 gate (tsc + suite + plain-language gate + prod build + real-server
  smoke): `bash verify-group-9.sh`
- Real-process dev-server smoke only: `npx tsx scripts/verify-group-9.ts`
- Live SDK smoke (real `claude` binary): `npx tsx scripts/verify-group-1.ts`

## Repo state

- Branch `phase-2-watch-it-get-made`, **18 commits ahead of `main`**.
- Remote `origin` → **https://github.com/anhtrinh919/helm** (public). Both `main`
  and the feature branch are pushed and tracking. The dogfood handoff now pushes
  to origin before printing the URL.
- `specs/2026-06-04-watch-it-get-made/` holds requirements / plan / validation —
  `requirements.md` is the contract. Design lives in `pencil/v0.2-p2.pen`
  (frames F30–F35 cover the six preview states).

---

## Next: Phase 3 — Point and Fix

The user clicks any element in the live preview, leaves a comment or bug report, and
a focused agent session picks it up and fixes **just that element** — with full
visual context (which element, what it looks like), so the user never describes
location or problem in code terms.

**The first hard problem: capturing the clicked element from inside the embed.**
The preview app runs in a separate context from the Helm renderer (see #4):

- **Real app** = Electron `<webview>`. You can inject a preload / `executeJavaScript`
  into the guest, listen for clicks there, and send the element's selector +
  bounding box + a screenshot crop back over `<webview>` IPC. This is the path that
  matters for real users.
- **Mock** = `<iframe>` on a `data:` URL (opaque origin). Cross-origin rules block
  the parent from reading guest clicks directly; the mock will likely need its own
  scripted "pretend you clicked element X" affordance rather than true DOM capture.
  Don't burn time trying to make true click-capture work through the mock iframe —
  script it, the way other mock flows are scripted.

**What Phase 3 builds on that already exists:** the `needs_you` / decision-card
surface from Phase 1 (a Point-and-Fix comment is a new kind of work item that should
land as a card and spin up a scoped session), the scoped-session feed + checkpoint
loop (a fix is just a small build session with a checkpoint), and DevServerManager's
`restart()` → live (the preview must refresh to show the fix landed). A fix session
is a narrow build session pointed at one element — reuse the spine, don't invent a
parallel mechanism. (Parallel sessions are Phase 4, not Phase 3.)

**Likely new contract surface:** an IPC to register a "point" (element selector +
screenshot crop + user's note + project/preview coordinates) and turn it into a
card, plus a way to pass that visual context into the fix session's prompt.
