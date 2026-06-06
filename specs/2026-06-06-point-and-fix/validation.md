# Point and Fix — Validation

This is the test contract. `/sdd-review` reads this file and executes every check.

---

## Automated Checks

### TypeScript
```bash
cd app && npx tsc --noEmit -p tsconfig.json
```
Must exit 0 with zero errors.

### Unit tests
```bash
cd app && npm rebuild better-sqlite3 && npx vitest run
```
All existing tests must pass (regression). New tests must pass:
- `npx vitest run db` — migration 4 creates `fix_comments` table; `CardType` includes `fix_comment`; `CardStatus` includes `waiting`; `listOpenPins` returns only non-done cards
- `npx vitest run point-capture-service` — activate injects script; deactivate cleans up; screenshot crop resized to ≤512×512; page-level path returns null selector/boundingBox
- `npx vitest run fix-session` — `startFix` creates session + moves card to `building`; second start while active returns `queued: true`; active completes → next in queue auto-starts; rejection calls `resumeWithRejection`; fix-session approval calls `DevServerManager.restart`
- `npx vitest run pins-store` — `setPins` stores by projectId; `load` hydrates from IPC; `subscribe` updates on `points:update` push
- `npx vitest run ipc` — `points:register` returns card with `waiting` status; `points:register` returns `preview_not_live` when preview status is not `live`; `points:list` returns pins array; `fix-sessions:start` returns `queued: false` when no active fix; `fix-sessions:start` returns `queued: true` when a fix is running

### Production build
```bash
cd app && npx electron-vite build
```
Must exit 0 with no TypeScript or bundle errors.

### Full gate
```bash
cd app && bash verify-group-8.sh
```
Must exit 0.

---

## Manual Verification

Run all manual checks at 1440×900 viewport in the production preview build (`vite build` + `vite preview`), NOT the HMR dev server.

### MV-1: Toggle point mode on and off
1. Open a project with a live preview (`status: live`). Confirm the crosshair toggle is visible in the preview header.
2. Click the toggle. Confirm point mode activates: toggle is highlighted; embedded app pointer events are now intercepted by the overlay.
3. Hover over elements in the live preview. Confirm each element is visually highlighted as the cursor moves.
4. Press Esc. Confirm point mode deactivates and the embedded app resumes normal interaction.
5. Toggle point mode on again. Toggle off with the button. Confirm exit.
**Pass criterion:** toggle activates/deactivates correctly; hover highlights work; Esc exits; no broken state after multiple on/off cycles.

### MV-2: File an element-level fix comment (PRIMARY FLOW)
1. Toggle point mode on.
2. Click an element in the live preview.
3. Confirm the comment box appears with a "Element selected" label (no raw selector or path shown).
4. Type a note ("This button color is wrong").
5. Select "Something's broken" as the type.
6. Click Submit.
7. Confirm: comment box closes; point mode exits; a new card appears in the "REPORTED" section of the board with the note truncated and a "Broken" type badge; "Start Fix" button is visible on the card.
**Pass criterion:** card lands on board with correct type badge and "Start Fix" button; no code/path visible anywhere.

### MV-3: File a whole-page comment
1. Toggle point mode on.
2. Find and click the "Comment on this page" affordance (bottom of overlay or equivalent).
3. Type a note ("This page feels cramped").
4. Select "Change this" as the type.
5. Click Submit.
6. Confirm: card lands in REPORTED section with "Change" badge and "Start Fix" button; card has no element thumbnail.
**Pass criterion:** page-level card created correctly; type badge shows "Change".

### MV-4: Pin visibility (PRIMARY FLOW dependency)
1. After filing one element-level and one page-level comment (MV-2, MV-3), toggle point mode off.
2. Confirm both pins (or the element pin) are visible on the live stage even with point mode off.
3. Toggle point mode on. Confirm pins are still visible.
4. Start a fix for one comment and approve it. Confirm that comment's pin disappears from the live stage.
**Pass criterion:** pins visible in both modes; disappear only on card resolution.

### MV-5: Start a fix and navigate to session feed (PRIMARY FLOW)
1. File a comment (MV-2) to create a waiting card.
2. Click "Start Fix" on the card.
3. Confirm: the renderer navigates to the session feed for the fix session; the session name reflects the comment note (truncated); narration events begin appearing in the feed.
4. Confirm: no CSS selector, file path, code block, or raw tool output appears in any feed event.
**Pass criterion:** navigation to session feed; clean narration; no technical strings visible.

### MV-6: Checkpoint — approve fix (PRIMARY FLOW)
1. Let the fix session run to completion (or wait for checkpoint event in the session feed).
2. Confirm the checkpoint block appears with an "Approve" button and a "Reject" button.
3. Click "Approve".
4. Confirm: the renderer navigates back to the board; the fix-comment card is now in the "DONE" section; the preview refreshes (building veil → live); the pin for that comment is gone from the live stage.
**Pass criterion:** card resolves to done; preview refreshes; pin gone; navigation back to board.

### MV-7: Checkpoint — reject and retry (PRIMARY FLOW)
1. Let a fix session reach a checkpoint.
2. Click "Reject".
3. Confirm: a note input appears ("What's still wrong?").
4. Type a note ("The font is still wrong").
5. Click "Send rejection".
6. Confirm: the renderer navigates back to the board; the card stays in the "BUILDING" section (not done); narration events continue in the feed as the agent receives the rejection note.
7. Wait for a second checkpoint. Confirm it appears with both Approve and Reject options again.
**Pass criterion:** card stays building after rejection; same session continues with rejection note; second checkpoint appears.

### MV-8: Queueing — second fix while one runs
1. File two separate comments (MV-2) to create two waiting cards.
2. Click "Start Fix" on the first card. Confirm: navigated to session feed; first card is building.
3. Navigate back to the board. Click "Start Fix" on the second card.
4. Confirm: NOT navigated (stays on board); second card shows "Queued" badge; no new session feed opened.
5. Let the first fix complete and approve the checkpoint.
6. Confirm: without any user action, the second card automatically transitions from "Queued" to "Building"; the board updates; the user is NOT navigated to the second fix session automatically.
**Pass criterion:** second card queued without navigation; auto-starts on first completion without navigation; board updates reflect both transitions.

### MV-9: Point mode disabled when preview not live
1. Navigate to a project with no running preview (`status: none` or `status: building`).
2. Confirm the point-mode toggle is either invisible or visually disabled and non-functional.
3. Click it. Confirm nothing happens.
**Pass criterion:** toggle non-functional in non-live preview states.

### MV-10: Hard gate — no technical strings in fix-session feed
1. Run a fix session to completion (can be the same session as MV-5/MV-6).
2. Scroll through all feed events in the session view.
3. Confirm: no CSS selector strings (e.g. `div > button:nth-of-type(1)`), no file paths, no fenced code blocks, no inline backtick spans, no localhost URLs appear in any narration text.
**Pass criterion:** zero technical strings in the feed; all events are plain-language narration.

---

## Definition of Done

All criteria below must be true before Phase 3 is approved:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` all tests pass (regression + new)
- [ ] `npx electron-vite build` exits 0
- [ ] MV-1: Point mode toggle works correctly
- [ ] MV-2: Element-level comment files as a card on the board (PRIMARY)
- [ ] MV-3: Whole-page comment files correctly
- [ ] MV-4: Pins visible; disappear on resolution
- [ ] MV-5: Start fix navigates to session feed with clean narration (PRIMARY)
- [ ] MV-6: Approve fix → card resolves, preview refreshes, pin removed (PRIMARY)
- [ ] MV-7: Reject fix → same session retries, second checkpoint appears (PRIMARY)
- [ ] MV-8: Queue: second fix queued; auto-starts without navigation
- [ ] MV-9: Toggle disabled in non-live states
- [ ] MV-10: No technical strings in fix-session feed (hard gate)
- [ ] All three primary user stories (MV-2, MV-5+MV-6, MV-7) pass with no bugs
