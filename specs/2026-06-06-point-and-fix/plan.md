# Point and Fix — Implementation Plan

Each group is independently reviewable and maps to one slice of the feature. Groups are a sequence of work — code-harness implements and verifies each group before moving to the next.

## Ground rules for this file

- **Design-agnostic.** No hex values, no Tailwind classes, no pixel sizes, no font declarations. Those live in the design file.
- **Behavior and sequence only.** Each group describes what it delivers (capability, data path, API surface, integration point) and which earlier groups it depends on.
- **Components are named, not described visually.** The design frame tells the visual half.
- **Each group has a verify line.** The command that proves it's done.

---

## Group 1: DB migration + data model — fix_comments and CardType/CardStatus extension

**Delivers:** Migration 4 adds the `fix_comments` table and extends `cards.type` with `'fix_comment'` and `cards.status` with `'waiting'`. DB accessors expose the new operations needed by all downstream groups.

**Depends on:** none — schema-only change

**Verify:** `npx vitest run db` — all DB tests pass; migration smoke: new Database(':memory:') → migrate → tables include `fix_comments`, columns include `waiting` status transitions for fix_comment cards.

1. Add migration 4 to `src/main/db/migrations.ts`:
   - `CREATE TABLE fix_comments` with columns: `id TEXT PRIMARY KEY`, `card_id TEXT NOT NULL UNIQUE REFERENCES cards(id) ON DELETE CASCADE`, `project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE`, `selector TEXT`, `bounding_box TEXT`, `screenshot_crop TEXT`, `pin_x REAL`, `pin_y REAL`, `note TEXT NOT NULL`, `note_type TEXT NOT NULL`, `created_at INTEGER NOT NULL`
   - `CREATE INDEX idx_fix_comments_project ON fix_comments(project_id)`
   - `CREATE INDEX idx_fix_comments_card ON fix_comments(card_id)`

2. Extend `CardType` enum in `src/shared/ipc-schemas.ts` with `'fix_comment'` (alongside existing `'feature'`, `'bug'`, `'decision'`).

3. Extend `CardStatus` enum in `src/shared/ipc-schemas.ts` with `'waiting'` (alongside existing values).

4. Update `TRANSITIONS` in `src/main/db/cards.ts` to include `waiting` as a valid status for `fix_comment` cards:
   - `waiting → building` (start fix)
   - `waiting → waiting` (queued; status stays waiting when enqueued, no DB write needed — queue is in-memory)
   - `building → needs_you | done | failed` (same as regular cards)

5. Create `src/main/db/fix-comments.ts` with DB accessors:
   - `createFixComment(db, { id, cardId, projectId, selector?, boundingBox?, screenshotCrop?, pinX?, pinY?, note, noteType }): FixComment` — inserts; `id` matches the paired card's id
   - `getFixComment(db, cardId): FixComment` — throws `NotFoundError` if not found
   - `listOpenPins(db, projectId): FixCommentPin[]` — returns rows where the paired card has status NOT in `('done')`, selecting only `card_id, pin_x, pin_y, note_type`
   - `deleteFixComment(db, cardId): void` — used on card deletion (cascade handles it, but expose explicitly for tests)

6. Add `FixComment` and `FixCommentPin` Zod schemas to `src/shared/ipc-schemas.ts`:
   - `FixComment`: all columns from the table; `screenshotCrop` is NOT exported to the renderer — it is stripped in the IPC handler before responding to `points:list`. Define it in `ipc-schemas.ts` for main-process use but do not include it in `FixCommentPin` or any renderer-bound payload.
   - `FixCommentPin`: `{ cardId: string, pinX: number | null, pinY: number | null, noteType: z.enum(['bug','change']) }`

---

## Group 2: IPC schemas + bridge — point registration and fix-session channels

**Delivers:** All three new IPC channels typed in `ipc-schemas.ts`, registered in their bridge file, exposed via contextBridge in `preload/index.ts`, and typed in `bridge-api.ts`. The renderer can now invoke `points:register`, `fix-sessions:start`, and `points:list` and receive `points:update` pushes. Handlers are stubs at this stage — real logic is wired in Groups 3 and 4.

**Depends on:** Group 1 (Zod schemas)

**Verify:** `npx tsc --noEmit -p tsconfig.json` — zero type errors across main, preload, renderer, and shared.

1. Add to `src/shared/ipc-schemas.ts`:
   - `RegisterPointRequest` Zod schema (matches the `points:register` request shape from requirements.md)
   - `StartFixSessionRequest`: `z.object({ projectId: z.string(), cardId: z.string() })`
   - `StartFixSessionResponse`: discriminated union `{ queued: false, session: Session } | { queued: true, session: null }`
   - `ListPinsRequest`: `z.object({ projectId: z.string() })`
   - `ListPinsResponse`: `z.object({ pins: z.array(FixCommentPin) })`
   - `PinsUpdatePush`: `z.object({ projectId: z.string(), pins: z.array(FixCommentPin) })`
   - Add channel constants to `CH`: `pointsRegister`, `fixSessionsStart`, `pointsList`, `pointsUpdate`

2. Create `src/main/ipc/points-bridge.ts` with stub IPC handlers (return empty/error for now):
   - `points:register` → stub returns `{ error: 'not_implemented' }`
   - `fix-sessions:start` → stub returns `{ error: 'not_implemented' }`
   - `points:list` → returns `{ pins: [] }`
   
3. Register `points-bridge.ts` handlers in `src/main/index.ts`.

4. Expose new channels in `src/preload/index.ts` via contextBridge: `pointsRegister`, `fixSessionsStart`, `pointsList`.

5. Add typed wrappers to `src/shared/bridge-api.ts` for all three invoke channels and the `onPinsUpdate` push listener (same pattern as `onPreviewUpdate`).

6. Add typed wrappers in `src/renderer/src/bridge.ts` — both real bridge (preload call-through) and mock bridge (`src/renderer/src/mock-bridge.ts`): stub `pointsRegister` and `fixSessionsStart` return sensible mocked values; `pointsList` returns an empty pins array; `onPinsUpdate` fires no-op.

---

## Group 3: Point capture service — click injection and mock affordance

**Delivers:** A `PointCaptureService` in the main process that manages injection of the click-listener script into the `<webview>` guest page and returns captured element data (selector, bounding box, screenshot crop) to the orchestrator. The service is designed to be activated/deactivated per-project per-session — it is only active when point mode is ON. The mock path for the web build is also wired here.

**Depends on:** Group 2 (IPC channel stubs)

**Verify:** `npx vitest run point-capture-service` — unit tests pass using an injectable fake webview (covering: activate → inject script → receive ipc-message → return ElementCapture; deactivate → script removed; page-level comment path; screenshot crop resize).

1. Create `src/main/sdk/point-capture-service.ts` with class `PointCaptureService`:
   - Constructor takes `getWebview: (projectId: string) => Electron.WebviewTag | null` (injectable for testing) and `deps: PointCaptureDeps` (injectable process I/O, similar to `DevServerDeps` pattern in `DevServerManager`)
   - `activate(projectId: string): void` — injects the hover-and-click listener into the webview guest via `webview.executeJavaScript()`. The script: listens for `mousemove` to highlight the element under cursor (adds/removes a thin outline class); listens for `click` to lock the selection, compute a CSS selector path via a simple `buildSelector()` helper (walking parentElement up to body, using tag+id+nth-of-type), and send `{ type: 'elementCaptured', selector, rect: el.getBoundingClientRect() }` via `window.ipcRenderer.sendToHost()`. ESC key sends `{ type: 'exitPointMode' }`. Whole-page affordance sends `{ type: 'pageComment' }`.
   - `deactivate(projectId: string): void` — injects cleanup script to remove event listeners; stops forwarding ipc-message events.
   - `captureScreenshot(projectId: string, rect: DOMRect): Promise<string>` — calls `webview.capturePage({ x, y, width, height })`, resizes to fit 512×512 via `nativeImage.resize()`, returns base64 PNG. Returns empty string on failure.
   - Emits events via a callback: `onCapture: (data: ElementCapture) => void` and `onExit: () => void`
   - `ElementCapture` type (internal, not exported to renderer): `{ selector: string | null, boundingBox: { x, y, width, height } | null, screenshotCrop: string, pinX: number | null, pinY: number | null }` — `null` fields for page-level comments.

2. Create `src/main/sdk/__tests__/point-capture-service.test.ts` with unit tests for the capture paths.

3. For the mock build: the mock bridge's `pointsRegister` should accept a hardcoded set of synthetic `ElementCapture` entries (simulating 2–3 pre-canned elements) that the renderer's point-mode overlay lists as "elements you can comment on". When the user picks one, the mock bridge fires the same registration flow without any DOM injection. This is the "scripted affordance" pattern for mock builds.

---

## Group 4: Fix-session orchestration — queue, prompt, retry

**Delivers:** Real implementations of `points:register` and `fix-sessions:start` IPC handlers, plus a `FixSessionQueue` in the main process that enforces one-active-fix-per-project and auto-dequeues on completion. `SessionOrchestrator` gains a `startFix` method and a `resumeWithRejection` method for the retry flow.

**Depends on:** Groups 1, 2, 3

**Verify:** `npx vitest run fix-session` — unit tests pass covering: register point → card created with `waiting` status; start fix → session starts, card moves to `building`, `queued: false` returned; second start while running → `queued: true`, card stays `waiting`; first fix completes → second auto-starts (no navigation push); rejection → same session continues; fix complete → `DevServerManager.restart()` called.

1. Create `src/main/sdk/fix-session-queue.ts` with class `FixSessionQueue`:
   - Tracks `activeByProject: Map<string, string>` (projectId → sessionId of the running fix)
   - Tracks `queueByProject: Map<string, string[]>` (projectId → ordered list of queued cardIds)
   - `enqueue(projectId, cardId): void` — appends cardId to the project's queue
   - `dequeue(projectId): string | null` — pops the front of the queue; returns null if empty
   - `setActive(projectId, sessionId): void`
   - `clearActive(projectId): void` — removes from active map; returns the next queued cardId if any, or null
   - `isActive(projectId): boolean`
   - `isQueued(projectId, cardId): boolean`

2. Add `startFix(projectId: string, cardId: string): Session` to `SessionOrchestrator`:
   - Reads the `fix_comments` record for the card via `getFixComment(db, cardId)`
   - Generates the fix-session prompt: plain-English instruction referencing the user's note, the type label, and the CSS selector (element-level only; page-level gets a whole-page instruction). Prompt adheres to all existing constraints (no code, no paths, friendly narration, decision protocol). The prompt explicitly instructs: "Fix ONLY this element without changing other parts of the app."
   - Calls the existing session-start machinery (same cwd, same tools, same permissionMode as regular build sessions)
   - Updates card status from `waiting` → `building` and pushes `board:update`
   - Returns the started `Session`

3. Add `resumeWithRejection(sessionId: string, flagNote: string): void` to `SessionOrchestrator`:
   - Gets the session's card, reverts card status from `done` (checkpoint pending) back to `building`, pushes `board:update`
   - Calls `handle.reply(flagNote)` on the active session handle to send the reject reason back into the agent
   - The agent receives the note as a user reply and continues, eventually emitting a new checkpoint event

4. Wire real implementations in `src/main/ipc/points-bridge.ts`:
   - `points:register` handler: validate request → `createCard('fix_comment', note, ...)` → `createFixComment(...)` → push `board:update` + `points:update` → return `{ card }`
   - `fix-sessions:start` handler: look up `FixSessionQueue`; if no active fix → `orchestrator.startFix(projectId, cardId)` → `queue.setActive(...)` → return `{ session, queued: false }`; if active → `queue.enqueue(projectId, cardId)` → return `{ session: null, queued: true }`
   - `points:list` handler: call `listOpenPins(db, projectId)` → return `{ pins }`

5. Extend `cards:approve-checkpoint` IPC handler in `src/main/ipc/data-bridge.ts` to handle the `fix_comment` rejection retry:
   - When `verdict === 'flagged'` AND the card type is `'fix_comment'` AND the card has an active session: call `orchestrator.resumeWithRejection(sessionId, flagNote)` instead of the standard flagged treatment
   - When `verdict === 'approved'` AND card type is `'fix_comment'`: after approval, call `DevServerManager.restart(projectId)` to refresh the preview; push `points:update` with the card removed from pins

6. When a fix session finishes (in `SessionOrchestrator.finish()`): check if the session is a fix session (card type `fix_comment`); if so, after `emitCheckpoint()`, call `fixQueue.clearActive(projectId)` and auto-dequeue the next card if one exists — call `startFix(projectId, nextCardId)` without any navigation-causing push to the renderer (the board card's `board:update` is sufficient).

---

## Group 5: Renderer — point-mode overlay, comment box, pin layer

**Delivers:** The point-mode toggle and overlay in `LivePreviewPane`, the comment box component, and the pin overlay layer on the F32 live stage. The renderer sends `points:register` to the main process after the user submits the comment box. The renderer listens for `points:update` pushes and refreshes the pin overlay.

**Depends on:** Groups 3 and 4 (live IPC)

**Verify:** `npx tsc --noEmit -p tsconfig.json` — zero type errors; `npx vitest run pins-store` — pin store state transitions; manual verification per validation.md primary flow.

1. Create `src/renderer/src/store/pins.ts` — Zustand store:
   - `pins: Record<string, FixCommentPin[]>` — keyed by projectId
   - `setPins(projectId, pins): void`
   - `load(projectId): Promise<void>` — calls `helm.points.listPins(projectId)`, stores result
   - `subscribe(): () => void` — listens to `helm.events.onPinsUpdate(...)` and calls `setPins`

2. Extend `LivePreviewPane.tsx`:
   - Add a `pointModeActive` boolean state (local) — default false
   - Add a point-mode toggle button to the header (visible only when `state.status === 'live'`): a crosshair icon with a brief label; active state is visually distinct; disabled (non-functional) when status is not `live`
   - Toggling on: calls `helm.points.activate(projectId)` (which triggers `PointCaptureService.activate()` in main); toggles overlay into hover-capture mode
   - Toggling off / Esc received: calls `helm.points.deactivate(projectId)`, closes comment box if open
   - When `pointModeActive` is true and `state.status === 'live'`: render `<PointModeOverlay>` on top of the F32 live stage

3. Create `src/renderer/src/components/board/PointModeOverlay.tsx`:
   - Covers the webview area with a transparent click-capturing div when active (pointer-events intercept while still forwarding the underlying capture via IPC)
   - Displays the pins layer: renders a `<FixCommentPin>` component at `{ left: pinX * 100 + '%', top: pinY * 100 + '%' }` for each open pin from `usePins`
   - Displays the comment box when a selection has been locked: renders `<PointCommentBox>`
   - Listens to incoming `element-captured` events from the main process (a new push channel `point:captured`) carrying `{ selector, boundingBox, screenshotCrop? }` to trigger the comment box

4. Create `src/renderer/src/components/board/PointCommentBox.tsx`:
   - Shows a thumbnail placeholder (no actual screenshot image in the renderer — the crop is main-process-only); instead, shows a brief label like "Element selected" with the selector visually hidden
   - Free-text note input (multiline, max 500 chars)
   - Type selector: two-button toggle "Something's broken" / "Change this"
   - Submit button (disabled until note is non-empty)
   - Cancel button
   - On submit: calls `helm.points.register(projectId, { ...capturedData, note, noteType })` → on success, closes the comment box, exits point mode, shows a brief success message
   - On cancel: closes comment box, returns to hover-capture mode (still in point mode)

5. Add `point:captured` as a new push channel (main → renderer): carries `{ projectId, capture: { selector, boundingBox, pinX, pinY } }`. Add to `ipc-schemas.ts`, preload, bridge-api, and both bridge implementations.

6. Add a new IPC invoke channel pair for point-mode lifecycle: `points:activate` and `points:deactivate` — these call `PointCaptureService.activate()` / `.deactivate()` in the main process. Add to `ipc-schemas.ts`, `points-bridge.ts`, preload, bridge-api, and bridge implementations.

---

## Group 6: Board — fix-comment card rendering + start-fix flow

**Delivers:** Fix-comment cards render correctly on the build-spine board in a new "REPORTED" section. The "Start Fix" button invokes `fix-sessions:start` and either navigates to the session feed (immediately started) or shows a "Queued" badge (queued). The board order is updated to include the REPORTED section.

**Depends on:** Group 4 (live IPC) and Group 5 (pins store)

**Verify:** `npx tsc --noEmit -p tsconfig.json` — zero type errors; `npx vitest run board-store` — board store handles `waiting` and `fix_comment` card type; manual: file a comment → card appears in REPORTED → start fix → navigate to session.

1. Create `src/renderer/src/components/board/FixCommentCard.tsx`:
   - Renders a fix-comment card in its `waiting`, `building`, `needs_you`, `failed`, or `done` state
   - `waiting` + `queued: false`: shows the note (truncated), type badge ("Broken" / "Change"), "Start Fix" button
   - `waiting` + `queued: true` (derived from session queue push — see below): shows "Queued" badge, no "Start Fix" button
   - `building`: shows "In progress" badge (same as spotlight treatment for build cards); no Start Fix button
   - `done`: shows resolved treatment; no Start Fix button

2. Update `ProjectBoard.tsx`:
   - Add `'waiting'` to the `ORDER` array and `SECTION_META` with label "REPORTED" and a pill color
   - Group fix-comment cards with `status === 'waiting'` into the REPORTED section; filter them OUT of other existing sections (they should never appear in PLANNED/UP NEXT)
   - Derive `queued` state: when `fix-sessions:start` returns `{ queued: true }`, store the cardId in local state as queued; also handle a new `board:update` push carrying the queued state (the main process pushes a board update with a synthetic `queued: true` field when a card is enqueued — this requires extending `Card` in ipc-schemas or using the existing `stepLabel` field as a signal; choose the cleaner option)
   - On "Start Fix" click: call `helm.fixSessions.start(projectId, cardId)`; if `!queued`, call `openSession(projectId, cardId)` to navigate to the fix session feed; if `queued`, show "Queued" badge without navigating

3. Update `CardStatus` type handling across the renderer to include `'waiting'` without TypeScript errors — check all switch/exhaustive checks.

---

## Group 7: Fix-session checkpoint and retry — wiring the approval loop

**Delivers:** Checkpoint approval for fix-comment cards triggers `DevServerManager.restart()` and a preview refresh. Rejection triggers `resumeWithRejection()` and the session continues. The checkpoint block in the session feed renders the Reject + note input path for fix sessions.

**Depends on:** Groups 4, 5, 6

**Verify:** `npx vitest run fix-session` — retry flow tests: `flagged` verdict on `fix_comment` card → `resumeWithRejection` called → session continues → new checkpoint emitted; `approved` verdict → `DevServerManager.restart()` called → `preview:update` pushed.

1. Extend `src/renderer/src/components/session/CheckpointBlock.tsx`:
   - Add a "Reject" secondary button alongside the existing "Approve" button
   - On Reject click: expand an inline note input ("What's still wrong?") and a "Send rejection" confirm button
   - "Send rejection" calls `helm.cards.approveCheckpoint(cardId, 'flagged', flagNote)` — same channel, different verdict
   - On rejection confirm, call `onBack()` to navigate back to the board (the card reverts to `building` — the user is returned to the board to wait for the next checkpoint)

2. Confirm that `cards:approve-checkpoint` handler in `src/main/ipc/data-bridge.ts` (extended in Group 4) correctly routes `fix_comment` rejection to `resumeWithRejection` and regular-card rejection to the existing flagged path. Add IPC contract tests.

3. Add a `preview:update` push from the `cards:approve-checkpoint` handler when approving a `fix_comment` card: after `DevServerManager.restart()` resolves, push the new `live` state.

---

## Group 8: Story walk — end-to-end validation

**Delivers:** Every user story verified end-to-end. The three primary flow stories (file comment → card → start fix → checkpoint → approve; reject → retry → approve; queue flow) are the stop criterion.

**Depends on:** Groups 1–7

**Verify:** `bash verify-group-8.sh` exits 0 (tsc + vitest + prod build + primary flow smoke).

1. Run `npx tsc --noEmit -p tsconfig.json` — zero errors.
2. Run `npx vitest run` — all tests pass (including Groups 1–7 new tests).
3. Create `app/verify-group-8.sh`: tsc + vitest + `npx electron-vite build` (no bundle errors).
4. Manual validation: per validation.md primary flow (the dogfood gate runs as the /sdd-review step).
5. Confirm that the hard event-transformer gate still holds for fix sessions: no CSS selector, file path, code block, or tool output appears in any `FeedEvent.text` in the session feed.
