# Point and Fix Requirements

---
phase: 3
type: feature
ui: true
---

## Phase type

**`feature`** — extends the existing Phase 2 product. Follows all established codebase patterns: typed contextBridge IPC channels in `ipc-schemas.ts`, Zustand stores in renderer, SQLite via better-sqlite3 in main process, `SessionOrchestrator` spine for fix sessions, `DevServerManager.restart()` for post-fix preview refresh, and the hard event-transformer gate. Invents what two new capabilities require: a point-mode overlay on the live preview, and a fix-session orchestration layer with queue and retry.

## Scope

Phase 3 delivers two stacked capabilities that sit on top of the Phase 2 live preview. First, the user can toggle "point mode" in the live preview header, hover any element in the running app to highlight it, click to lock the selection, type a note, pick a type, and submit — the comment lands as a new card on the build-spine board with the element's visual context (selector, bounding box, screenshot crop) captured invisibly. Whole-page comments are also supported from the same mode. Commented spots get a visible pin on the live stage so the user can see what's already been reported while sweeping. Second, starting a fix from its card opens a focused agent session — a narrow build session with full visual context in its prompt — that runs to a checkpoint: approve and the preview refreshes and the card resolves; reject with a note and the same session retries. Only one fix session runs at a time; a second start queues the card. On completion, a non-developer can point at anything in their running app, file a comment, and start a fix without ever describing code-level location or context.

## User Stories

1. As a builder, I can toggle point mode in the live preview header, hover any element to see it highlighted, click to lock the selection, type a note, pick a type ("Something's broken" or "Change this"), and submit — and the comment lands as a card on the board with the element's visual context captured silently, so I never have to describe where the problem is in code terms.
   [Point and Fix, Step 1]

2. As a builder, while in point mode I can also comment on the entire screen by clicking a "Comment on this page" affordance, for issues like "this page feels cramped", and that lands as a page-level card on the board.
   [Point and Fix, Step 1]

3. As a builder, I can see visible pins on already-commented spots in the live preview while in point mode, so I know what's already reported while I sweep.
   [Point and Fix, Step 1]

4. As a builder, I can start the fix from a comment card on the board — I'm taken into a narrated fix session that shows me what the agent is doing, and at the end I see a checkpoint where I can approve or reject.
   [Point and Fix, Step 2] — **PRIMARY**

5. As a builder, when I approve a fix at the checkpoint, the preview refreshes to show the fixed app and the card resolves to done, so I can immediately see the change landed.
   [Point and Fix, Step 2] — **PRIMARY**

6. As a builder, when I reject a fix at the checkpoint with a note explaining what's still wrong, the same session retries with my reason and returns to a new checkpoint — the card stays open until I approve.
   [Point and Fix, Step 3] — **PRIMARY**

7. As a builder, if I start a second fix while one is already running, the card enters a "queued" state and auto-starts when the running fix finishes, without navigating me.
   [Point and Fix, Step 2]

8. As a builder, when I submit a point-and-fix comment, pin disappears from the live preview once the fix card resolves (approved), so the annotation layer stays clean.
   [Point and Fix, Step 1]

## UI Requirements

| Screen | State | Key UI Elements | Primary User Action |
|--------|-------|-----------------|---------------------|
| Live Preview — point mode OFF (default) | F32 live stage, no annotation layer | Crosshair toggle button in the preview header (right side, with a brief label "Point & fix"); no hover highlights; normal click behavior for the embedded app | Toggle point mode on |
| Live Preview — point mode ON, hovering | F32 live stage with overlay | Crosshair icon in header is highlighted/active; element under cursor is highlighted with a subtle border ring; current selector shown nowhere (internal only); "Esc to exit" hint | Click to lock selection |
| Live Preview — point mode ON, locked selection | Comment box appears (anchored near selected element or in a fixed position) | Comment box with: element thumbnail (cropped screenshot), free-text note input, "Type" toggle ("Something's broken" / "Change this"), Submit and Cancel buttons; no code/selector is shown | Type note, pick type, Submit |
| Live Preview — point mode ON, whole-page comment | Comment box (triggered by "Comment on this page" affordance at bottom of overlay) | Same comment box without element thumbnail; note input; type toggle; Submit and Cancel | Type note, pick type, Submit |
| Live Preview — point mode ON, with existing pins | F32 live stage | Each existing open comment card shown as a small colored pin at its recorded position; pins are NOT clickable in Phase 3; pin disappears when its card is resolved | Visual scan — no action |
| Live Preview — point mode OFF, with existing pins | F32 live stage (point mode off) | Pins remain visible even when point mode is off, so resolved-vs-open state is always visible | No interaction with pins in Phase 3 |
| Board — comment card (waiting) | Card in `waiting` status | Card shows: comment thumbnail, truncated note, type badge ("Broken" or "Change"), "Start Fix" primary button; no secondary actions in Phase 3 | Click "Start Fix" |
| Board — comment card (fix running) | Card in `building` status | Same card face with "In progress" badge; "Start Fix" button hidden; Spotlight section shows fix session in flight | Watch the board |
| Board — comment card (queued) | Card in `queued` status | Card face with "Queued" badge; "Start Fix" button hidden | Wait for running fix to finish |
| Board — comment card (done) | Card in `done` status | Same card face; checkmark / resolved treatment; no pin visible in preview | — |
| Session feed — fix session | Active session in ScopedSession view | Same narrated feed as a build session; the session name references the comment's note (truncated); no element selector/path/code in any feed event | Watch narration, answer decisions if any |
| Session feed — fix session at checkpoint | Checkpoint event in feed | Same checkpoint block as Phase 2; "Approve" button; "Reject" button + note input | Approve → board + preview refresh; Reject + note → retry |

## Data Model

New table and new columns added via migration 4. Existing tables are not modified except for `CardType` enum extension.

```
fix_comments  (new table)
- id:               TEXT PRIMARY KEY   — UUID; matches the card it is paired with
- card_id:          TEXT NOT NULL UNIQUE — FK → cards.id ON DELETE CASCADE; each comment maps 1:1 to a card
- project_id:       TEXT NOT NULL      — FK → projects.id ON DELETE CASCADE
- selector:         TEXT               — CSS selector path to the element; null for page-level comments
- bounding_box:     TEXT               — JSON { x, y, width, height } relative to the webview viewport; null for page-level
- screenshot_crop:  TEXT               — base64 PNG crop of the element (max ~60 KB after resize); null for page-level
- pin_x:            REAL               — 0.0–1.0 fractional position within the webview viewport (X); null for page-level
- pin_y:            REAL               — 0.0–1.0 fractional position within the webview viewport (Y); null for page-level
- note:             TEXT NOT NULL      — free-text note from the user
- note_type:        TEXT NOT NULL      — 'bug' | 'change' (maps to "Something's broken" / "Change this")
- created_at:       INTEGER NOT NULL   — Unix epoch ms
```

**CardType extension:** `cards.type` gains a new value `'fix_comment'` alongside the existing `'feature'`, `'bug'`, `'decision'`. Fix-comment cards follow an extended status lifecycle (see CardStatus extension below).

**CardStatus extension:** fix-comment cards follow a modified subset of the build-spine lifecycle. The `waiting` status is a new value: a comment has been filed but the fix has not been started yet. The full fix-comment lifecycle is `waiting → building → needs_you → done` (or `failed`). `queued` is surfaced to the renderer as a display property derived from session queue state, NOT as a stored card status — the stored status remains `waiting` while queued. This avoids polluting the card state machine with queue position.

```
cards (CardType extended — new type value)
- type: 'feature' | 'bug' | 'decision' | 'fix_comment'  (was: 'feature' | 'bug' | 'decision')

cards (CardStatus extended — new status value)
- status: 'planned' | 'up_next' | 'building' | 'needs_you' | 'failed' | 'done' | 'waiting'
  (new value: 'waiting' — filed comment, fix not yet started)
```

**Note:** `fix_comments.screenshot_crop` is stored as a base64 string and passed to the fix session prompt in the main process. It is NEVER serialized into a `FeedEvent` or any renderer-bound IPC payload. It is internal to the main process only.

## API Contracts

This is an Electron app. All IPC uses named channels via contextBridge. Phase 3 adds the following channels. All existing Phase 1 and Phase 2 channels remain unchanged.

### points:register

**Direction:** renderer invokes → main handles
**Purpose:** renderer sends a completed point-and-fix comment (after the user submits the comment box); main creates the `fix_comments` DB record, creates a paired `fix_comment` card, and pushes a `board:update`.
**Request:**
```typescript
{
  projectId: string
  // Element-level comment (selector, bounding box, screenshot crop provided):
  selector?: string          // CSS selector path; omitted for page-level
  boundingBox?: {            // omitted for page-level
    x: number
    y: number
    width: number
    height: number
  }
  screenshotCrop?: string    // base64 PNG; omitted for page-level
  pinX?: number              // 0.0–1.0 fractional viewport X; omitted for page-level
  pinY?: number              // 0.0–1.0 fractional viewport Y; omitted for page-level
  note: string               // free-text from the user
  noteType: 'bug' | 'change'
}
```
**Success response:** `{ card: Card }` — the newly created fix-comment card with status `'waiting'`
**Error responses:**
- `{ error: 'not_found' }` — no project with that projectId
- `{ error: 'preview_not_live' }` — the preview is not in `live` status; point-and-fix requires a running app
- `{ error: 'validation_failed', field: string, message: string }` — note is empty, or noteType is invalid

### fix-sessions:start

**Direction:** renderer invokes → main handles
**Purpose:** renderer requests that the fix session for a fix-comment card starts. If another fix session is running for this project, the card is queued (stored status stays `waiting`; a `board:update` push communicates the queued display state). If no fix is running, the session starts immediately — behaves identically to `sessions:start` except the prompt is generated from the fix-comment's visual context and note.
**Request:** `{ projectId: string, cardId: string }`
**Success response:**
- `{ session: Session, queued: false }` — session started; renderer should navigate to the session feed
- `{ session: null, queued: true }` — card queued; renderer should NOT navigate (the user stays on the board)
**Error responses:**
- `{ error: 'not_found' }` — card not found or not a fix_comment type
- `{ error: 'not_waiting' }` — card is not in `waiting` or `queued` state (already building or done)
- `{ error: 'no_visual_context' }` — the `fix_comments` record for this card is missing (data integrity error)
- `{ error: 'artifact_dir_failed', message: string }` — could not resolve artifact_dir for the project

### points:list (renderer invokes → main handles)

**Direction:** renderer invokes → main handles
**Purpose:** renderer requests all open (unresolved) fix-comment pin positions for a project, to render the pin overlay in the live preview.
**Request:** `{ projectId: string }`
**Success response:** `{ pins: FixCommentPin[] }` where:
```typescript
FixCommentPin = {
  cardId: string
  pinX: number | null   // null for page-level comments
  pinY: number | null   // null for page-level comments
  noteType: 'bug' | 'change'
}
```
(Only cards with status `waiting`, `building`, `needs_you`, or `failed` are returned — not `done`.)
**Error responses:**
- `{ error: 'not_found' }` — no project with that projectId

### points:update (push — main → renderer)

**Direction:** main pushes to renderer whenever the pin set for a project changes (new pin added, card resolves to done)
**Payload:** `{ projectId: string, pins: FixCommentPin[] }` — full current list, not a diff
**Renderer action:** update pin overlay for this project; pins that disappeared (resolved) are removed from the overlay; pins that appeared (new comment) are added.

## Constraints & Business Rules

- **Point mode is a toggle, not always-on.** The crosshair button in the live preview header turns point mode on and off. When on, pointer events on the webview are intercepted by the overlay (not delivered to the embedded app). When off, the embedded app receives all pointer events normally. Esc also exits point mode. Point mode can only be active when preview status is `live` — it is disabled (button grayed, non-functional) in all other preview states.

- **Click capture: real app vs. mock.** In the real Electron app, click capture inside the `<webview>` works via `webview.executeJavaScript()`: the main process injects a listener script into the guest page that captures `mouseover` (for highlight) and `click` (for selection lock), computes a CSS selector path and `getBoundingClientRect`, takes a screenshot crop via `webview.capturePage({ rect })`, and returns the data over `ipcRenderer.sendToHost` / `webview.addEventListener('ipc-message')`. The mock web build uses a pre-scripted affordance (e.g. a floating "Simulate click on element X" list) that fires the same internal event with synthetic data — no real DOM injection. Do NOT attempt real capture through the `data:` URL iframe in the mock; it will always be blocked by the opaque-origin cross-origin rule.

- **Screenshot crop sizing.** The element screenshot crop must be resized to fit within 512×512 pixels before base64 encoding, to cap the payload at approximately 60 KB. The resize is done in the main process via Electron's `nativeImage.resize()` before DB storage. The crop is used in the fix-session prompt — it is not displayed in the UI anywhere.

- **Visual context in the fix-session prompt.** When a fix session starts, `SessionOrchestrator` generates the prompt by reading the `fix_comments` record (via a new main-process accessor). The prompt includes: the user's plain-language note, the type label ("Something's broken" / "Change this"), the CSS selector path (for element-level comments), and the note that a screenshot crop of the element has been captured (the agent uses the selector for navigation — the crop is described textually, not passed as an image, because the SDK prompt is text-only). No raw file path, URL, or technical artifact escapes to any renderer-bound event.

- **One active fix session per project.** The main process tracks the active fix session per project in memory (not in DB). When `fix-sessions:start` is invoked: if no active fix exists, start immediately and push `board:update` with status `building`. If an active fix exists, enqueue the card (a simple in-memory queue keyed by projectId) and return `{ queued: true }`. When the active session reaches `done` or `failed`, auto-dequeue the next card in the queue and start it; do NOT navigate the renderer when auto-dequeuing (the session starts silently, and the board card updates via `board:update`).

- **Fix session is a narrow build session.** A fix session uses the same `SessionOrchestrator.start()` spine as a regular build session: same `AgentSession`, same event-transformer gate, same checkpoint loop. The only differences are: (1) the `buildPrompt` variant includes the visual context and a specific instruction to fix only the named element without touching other parts of the app; (2) fix sessions always run with the real pipeline (`cwd = artifact_dir`, `allowedTools = undefined`, `permissionMode = 'bypassPermissions'`), because they only make sense when a real app exists; (3) fix sessions are created with `source = 'user_added'` and `type = 'fix_comment'` — the card was already created by `points:register`.

- **Post-fix preview refresh.** On fix-session checkpoint approval (`cards:approve-checkpoint` with verdict `approved` for a `fix_comment` card), the main process calls `DevServerManager.restart(projectId)` — same as after a build session completes. The renderer receives a `preview:update` push with `status: 'live'` once the server is back up.

- **Reject flow.** When the user rejects a checkpoint for a fix session (`cards:approve-checkpoint` with `verdict: 'flagged'` and a `flagNote`), the main process calls `SessionOrchestrator.resumeWithRejection(sessionId, flagNote)` — which sends the reject note back into the active session via `handle.reply()`, keeping the same session live. The card status reverts to `building`. The session continues and eventually emits a new `checkpoint` event. This is different from regular build sessions where a `flagged` verdict is not currently wired to a retry — Phase 3 introduces this wired retry path for fix sessions specifically.

- **Pins display in point mode and in standard preview.** Pins are rendered as a thin overlay on the F32 live-stage canvas — the same overlay-ready surface the HANDOFF.md notes was "designed to be a clean canvas for exactly this annotation layer." Pins are visible when point mode is ON (always) and when point mode is OFF (also visible — the user can see what's already reported at any time). Pins are NOT interactive in Phase 3 (no click-to-open behavior on pins — the card on the board is how the user acts on a comment).

- **`waiting` status and the board layout.** Fix-comment cards in `waiting` status appear in a new "REPORTED" section on the build-spine board above the "PLANNED" section. They do not appear in the "PLANNED" or "UP NEXT" sections. Cards in `building`, `needs_you`, `failed`, and `done` use the existing board sections. The board order (top to bottom): BUILDING NOW → OFF-TRACK → NEEDS YOU → REPORTED → UP NEXT → PLANNED → DONE.

- **Hard event-transformer gate applies to fix sessions identically.** All `FeedEvent.text` values from a fix session must be stripped of code, paths, selector strings, and technical output. The fix-session prompt contains a CSS selector (internal to the agent's cwd context), but no selector may appear in any narration event reaching the renderer.

- **All new IPC channels follow existing patterns.** New channels typed in `src/shared/ipc-schemas.ts` (Zod schemas), registered in `src/main/ipc/` bridge files, exposed via `src/preload/index.ts` contextBridge, validated both sides.

- **Strict TypeScript (`"strict": true`); all npm deps pinned exactly (no `^` or `~`).**

- **Phase 3 is macOS only.** No Windows/Linux compatibility work required.

- **Verify on production build + preview, not HMR dev server.** Zustand store fragmentation under HMR produces false bugs — always confirm UI behavior on `vite build + vite preview`.

## Excluded from This Phase

- Clicking a pin to open its comment card (navigating from pin to card) — deferred; in Phase 3 the board card is how the user acts
- Drag-to-select-region annotation — excluded; element + page-level covers Phase 3
- Parallel fix sessions — Phase 4
- Undo/discard a failed fix (reject → discard, not retry) — excluded; Phase 3 reject always retries the same session
- Decisions Log, Progress Timeline, Docs View (functional) — Phase 4
- Auto-deploy to production hosting — globally excluded
- Code editor, terminal panel, git/branch/PR surface — globally excluded
