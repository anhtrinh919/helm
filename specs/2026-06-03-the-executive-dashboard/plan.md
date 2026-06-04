# The Executive Dashboard Implementation Plan

Each group is independently reviewable and maps to one slice of the feature. Groups are a **sequence of work**, not a visual spec. Code-harness implements and verifies each group before moving to the next.

## Ground rules for this file

- **Design-agnostic.** No hex values, no Tailwind classes, no pixel sizes, no font declarations. Those live in the design file (`design-tokens.css` + frame index in `handover.md`).
- **Behavior and sequence only.** What each group delivers and which prior groups it requires.
- **Components are named, not described visually.** The design frame tells the visual half.
- **Each group has a verify line.** Command that proves the group is done.

---

## Group 1: Engine Plumbing — Claude Agent SDK end-to-end proof

**Delivers:** One real scoped session wired to the live Claude Agent SDK on the user's own Claude subscription. Streaming output flows from SDK → main process → IPC → renderer. `pathToClaudeCodeExecutable` guard in place. This is the de-risk milestone; no further UI work stacks up until this group is verified.

**Depends on:** None — scaffold

**Verify:** `bun run verify-group-1.sh` — launches a real SDK session with a canned prompt, streams at least one feed event to the renderer console, confirms no SDK init error on a fresh macOS machine with `claude` in PATH.

1. Scaffold the Electron project: `package.json`, `tsconfig.json` (strict mode), `vite.config.ts` for renderer, `electron-builder` config, `.npmrc` (exact versions). Install and pin all deps from tech-stack.md.
2. Create `src/main/sdk/session-runner.ts`: wraps `@anthropic-ai/claude-agent-sdk` `query()`. Resolves `pathToClaudeCodeExecutable` via `execSync('which claude')` on init. Exposes `startSession(prompt: string, onEvent: (e: SdkEvent) => void): SessionHandle`. Exposes `steerSession(handle: SessionHandle, mode: SteerMode, text: string): void` for mid-build steering.
3. Create `src/main/sdk/event-transformer.ts`: converts raw SDK events (`text`, `tool_use`, `tool_result`, etc.) into typed `FeedEvent` objects (`narration | activity | decision_prompt | steering | checkpoint | summary | error`). No raw SDK payload crosses the IPC boundary. Log raw payload to DB `feed_events.raw_payload`.
4. Create `src/main/ipc/feed-bridge.ts`: registers `ipcMain.handle` for `sessions:get-feed`. Registers `webContents.send` push for `feed:event`, `board:update`, and `project:background-status`. Validates all payloads with Zod schemas from `src/shared/ipc-schemas.ts`.
5. Create `src/shared/ipc-schemas.ts`: Zod schemas for every IPC channel defined in requirements.md. Export inferred TypeScript types. Both main and renderer import from this file — single source of truth.
6. Create a minimal renderer stub: a single React component that invokes `sessions:get-feed` on mount and renders each event text in a list. No styling beyond functional layout.
7. Write `verify-group-1.sh`: spawns Electron in dev mode, injects a test prompt via a hidden IPC command, waits for the first `feed:event` push, asserts it arrives within 30s, exits 0. Fails if SDK init throws.

---

## Group 2: Local Persistence — SQLite DB layer + durable session management

**Delivers:** All five tables (`projects`, `cards`, `sessions`, `feed_events`, `question_queue`) created and migrated on app launch. CRUD operations for projects and cards exposed via IPC. Data survives app restart. Sessions that were `active` at quit are recoverable on relaunch with `resumed_at` set.

**Depends on:** Group 1 (project scaffold, shared IPC schemas, Zod types)

**Verify:** `bun test --run db` — unit tests for all DB operations; and `bun run verify-group-2.sh` — app launch, create project, restart app, project still present; simulate active session at quit, confirm session row survives restart with correct status.

1. Create `src/main/db/migrations.ts`: runs all schema migrations on `app.ready`. DB file at `app.getPath('userData')/helm.db`. Migrations are numbered and idempotent.
2. Create `src/main/db/schema.ts`: TypeScript types matching the data model in requirements.md exactly. Types derived from Zod schemas in `src/shared/ipc-schemas.ts`.
3. Create `src/main/db/projects.ts`: `listProjects()`, `createProject(name)`, `getProject(id)`, `updateProject(id, patch)`. `listProjects()` includes `backgroundStatus` derived from the project's most recent active session.
4. Create `src/main/db/cards.ts`: `listCards(projectId)`, `createCard(projectId, type, title, source)`, `updateCardStatus(id, status)`, `seedCardsFromPlan(projectId, planBlocks)`, `updateCheckpoint(id, verdict, flagNote?)`. Status machine enforced: invalid transitions throw a typed error. `seedCardsFromPlan` generates `step_label` as "Step N of M: <title>" for each card.
5. Create `src/main/db/sessions.ts`: `createSession(projectId, cardId?, name)`, `getSession(id)`, `updateSessionStatus(id, status)`, `setResumedAt(id, timestamp)`. On app launch, scan for sessions with status=`active` and set `resumed_at` — these sessions are shown as in-progress in the rail until the user opens them.
6. Create `src/main/db/feed-events.ts`: `appendEvent(sessionId, event)`, `getEvents(sessionId, afterId?)`.
7. Create `src/main/db/question-queue.ts`: `createQuestion(sessionId, prompt, position)`, `listQuestions(sessionId)`, `answerQuestion(id, answer)`, `reopenQuestion(id)`. Status machine: `pending → answered → reopened → answered`.
8. Register IPC handlers: `projects:list`, `projects:create`, `projects:get`, `cards:create`, `cards:update-status`, `cards:approve-checkpoint`, `sessions:reopen-question`. Validate all inputs with Zod before calling DB functions.
9. Unit tests (Vitest) in `src/main/db/__tests__/`: cover create, read, status transitions (valid + invalid), plan-seeding with step labels, checkpoint verdict, question-queue state machine (pending → answered → reopened). Tests use an in-memory SQLite DB (`:memory:`).

---

## Group 3: App Shell + Front-Door Sentence + Project Switcher

**Delivers:** The outer Electron window is running. First-run shows the front-door sentence ("What do you want to build?") as a full-screen prompt. Populated state shows a project list with live background-status indicators per project. "New build" button always visible. Clicking a project opens its board (board stub is fine in this group). Project list loads from DB and persists on restart.

**Depends on:** Group 1 (Electron scaffold), Group 2 (DB + IPC handlers)

**Verify:** `bun run verify-group-3.sh` — launch app with no projects, confirm front-door sentence renders full-screen; create a project via IPC stub; confirm project appears in list with background-status indicator; restart; confirm project still listed.

1. Create `src/renderer/store/projects.ts`: Zustand slice. State: `projects: Project[]`, `activeProjectId: string | null`. Actions: `loadProjects()` (calls `projects:list` IPC), `createProject(name)` (calls `projects:create`), `setActive(id)`, `applyBackgroundStatus(projectId, status)` (called on `project:background-status` push).
2. Create `src/renderer/components/FrontDoor.tsx`: full-screen sentence prompt — single large text area with placeholder "What do you want to build?", submit button. On submit: calls `projects:create` to create the project, then routes to the New Project Wizard with the idea text pre-loaded.
3. Create `src/renderer/components/ProjectSwitcher.tsx`: renders populated project list. Each project row shows name, last-opened timestamp, and a `BackgroundStatusBadge` (idle / active / needs_you / failed). "+ New build" button routes to FrontDoor.
4. Wire routing in `src/renderer/App.tsx`: when `projects` is empty → render `FrontDoor`; when projects exist and `activeProjectId` is null → render `ProjectSwitcher`; when `activeProjectId` is set → render `ProjectBoard` (stub).
5. Create `src/renderer/components/ProjectBoard.stub.tsx`: placeholder showing project name and "Board coming in Group 4".
6. Subscribe to `project:background-status` push on renderer init: call `store.applyBackgroundStatus(projectId, status)` to update the project row live without leaving the current view.

---

## Group 4: Build-Spine Board — items, states, dependencies, spine ordering

**Delivers:** Full Project Board for a selected project. Build-spine layout with items in states: planned, up_next, building (spotlight), needs_you, failed, done. Done items collapsed to quiet history. Dependency legibility (depends_on rendered on each item). Step labels ("Step N of M: <name>"). "+ Add item" creates a feature or bug card. Board auto-seeds from project plan on first open after wizard approval. Board listens for `board:update` pushes and re-renders in real time. Needs-you promotion: when a card transitions to needs_you, it rises to the headline position with the question inline.

**Depends on:** Group 2 (DB + card IPC), Group 3 (app shell, active project, board mount point)

**Verify:** `bun run verify-group-4.sh` — open project, confirm build-spine renders in correct order; add item, confirm appears in Planned; trigger a `board:update` push that sets card to needs_you from main via test IPC, confirm Needs-you block promotes to headline position; trigger done, confirm item collapses to history.

1. Create `src/renderer/store/board.ts`: Zustand slice. State: `cards: Card[]`. Actions: `loadBoard(projectId)` (calls `projects:get`), `addCard(type, title)` (calls `cards:create`), `applyUpdate(card)` (called on `board:update` push — replaces card by id), `approveCheckpoint(cardId, verdict, flagNote?)` (calls `cards:approve-checkpoint`).
2. Create `src/renderer/components/ProjectBoard.tsx`: renders the build-spine. Groups cards into: Needs-you headline (if any), Building spotlight (if any), Up-next list, Planned list, Done history (collapsed). Renders one-line orientation sentence. Stub tabs in tab strip.
3. Create `src/renderer/components/SpineItem.tsx`: renders one spine item. Shows step label, title, status, dependency note (if `depends_on` is non-empty, show "requires: <step labels>"). Click opens scoped session (wired in Group 5). Three size modes: spotlight (building), standard (planned/up_next), condensed (done).
4. Create `src/renderer/components/NeedsYouHeadline.tsx`: renders the Needs-you block at the top of the board. Shows the question text, answer buttons (calls `sessions:answer-decision`), and a "Re-open" link on prior decided questions. Only rendered when at least one card is in `needs_you` status.
5. Create `src/renderer/components/AddItemModal.tsx`: modal for "+ Add item". Type selector (feature / bug), title text input, submit. Calls `store.addCard()`. Validates title non-empty.
6. Render stub tabs: Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View. Each shows "Unlocks in Phase N" placeholder — never locked/greyed. Phase numbers from requirements.md.
7. Wire `board:update` push: subscribe on renderer init, call `store.applyUpdate(card)`. If card.status === 'needs_you', the store re-sorts to promote the card to headline position.
8. Main-process `board:update` emitted from `cards:update-status`, `wizard:approve-plan`, and `cards:approve-checkpoint` handlers whenever a card changes. Push to all open windows.

---

## Group 5: Scoped Session Feed — streaming, steering, question queue

**Delivers:** Clicking a build-spine item opens its scoped session. The session shows: item header with step label, streaming plain-English feed, activity labels, working indicator, steering input (interrupt / redirect / look-closer). Question queue panel shows all questions with pending/answered state and Re-open link on answered questions. Session started via live SDK. Feed events stream in real time via `feed:event` pushes. Done state shows reviewable-result checkpoint block. Error state shows friendly message. "Back to board" returns to the spine.

**Depends on:** Group 1 (SDK session runner + event transformer), Group 2 (sessions DB + question-queue DB), Group 3 (routing), Group 4 (card click)

**Verify:** `bun run verify-group-5.sh` — click a spine item, confirm session starts, confirm at least 3 narration events stream within 60s (real SDK call), confirm steering input is visible, confirm "Back to board" returns; simulate a decision event, confirm question appears in queue with pending state; answer it, confirm state changes to answered with Re-open link; simulate session done, confirm checkpoint block appears.

1. Create `src/renderer/store/feed.ts`: Zustand slice. State: `events: FeedEvent[]`, `questions: QuestionQueueItem[]`, `session: Session | null`, `status: 'idle' | 'active' | 'paused_for_decision' | 'done' | 'error'`. Actions: `startSession(projectId, cardId)`, `loadFeed(sessionId)`, `appendEvent(event)`, `appendQuestion(question)`, `answerQuestion(questionId, answer)`, `reopenQuestion(questionId)`, `steer(mode, text)`, `setStatus(status)`.
2. Create `src/renderer/components/ScopedSession.tsx`: renders session name header (step label format), scrolling event list, question queue panel, steering input footer, status-appropriate overlay (checkpoint block when done; error state when failed). Calls `store.startSession()` on mount. Subscribes to `feed:event` push for the active session.
3. Create `src/renderer/components/FeedEventRow.tsx`: renders one `FeedEvent`. `narration`: plain text. `activity`: indented label with icon. `decision_prompt`: renders `DecisionCard` inline. `steering`: renders steering-input confirmation. `checkpoint`: renders `CheckpointBlock`. `summary`: styled summary. `error`: friendly error text.
4. Create `src/renderer/components/SteeringInput.tsx`: three-mode input panel (interrupt / redirect / look-closer). Text area + submit. Calls `store.steer(mode, text)` which calls `sessions:steer` IPC. Emits a `steering` feed event on success.
5. Create `src/renderer/components/QuestionQueue.tsx`: scrollable list of all `QuestionQueueItem` for the session. Shows question text, status badge (Pending / Answered), Re-open link on answered items. Calling Re-open calls `store.reopenQuestion(questionId)` which calls `sessions:reopen-question` IPC and updates the question's status to `reopened`.
6. Create `src/renderer/components/CheckpointBlock.tsx`: shown when `event.kind === 'checkpoint'`. Displays plain-language "Here's what I built — does this look right?" label, screenshot preview (renders image from `screenshotPath` if available), "Looks good, continue" and "Something's off" buttons. "Looks good" calls `store.approveCheckpoint(cardId, 'approved')`. "Something's off" opens a steering text input and calls `store.approveCheckpoint(cardId, 'flagged', note)` on submit.
7. Wire card-click navigation: `SpineItem` (Group 4) routes to `ScopedSession` passing `projectId` + `cardId`. Routing is in-app state in `App.tsx`.
8. Main-process `sessions:start` handler: creates session row in DB, starts real SDK session via `session-runner.ts`, streams events through `event-transformer.ts`, emits `feed:event` per event. Updates card status to `building` on session start and emits `board:update`. On session done, generates checkpoint event (captures screenshot or structured summary) and emits `feed:event` with kind=`checkpoint`.
9. Main-process `sessions:steer` handler: validates session is `active`, forwards steering input to the running SDK session via `session-runner.steerSession()`, appends a `steering` feed event, emits `feed:event`.
10. "Back to board" button: clears `activeFeedCardId` in app store; renders `ProjectBoard`.

---

## Group 6: New Project Wizard — sentence entry, scoping Q&A, plan approval

**Delivers:** Full New Project Wizard. Sentence entry → scoping Q&A via decision cards → plan-review with inline editing → approve-plan triggers board auto-seed as build-spine. Wizard backed by real SDK scoping session. Plan-seeding generates step labels ("Step N of M: <title>"). Smart-pausing heuristics wired. All user-facing copy is plain language (no jargon, no internal IDs, no model names).

**Depends on:** Group 1 (SDK), Group 2 (DB + wizard IPC), Group 3 (navigation), Group 4 (board auto-seed from plan)

**Verify:** `bun run verify-group-6.sh` — open wizard, submit idea, confirm at least 2 scoping questions render as decision cards with "Step N of M" progress labels, answer all questions, confirm plan-review screen shows editable plain-language plan, approve plan, confirm board spine populates with feature items showing step labels.

1. Create `src/renderer/store/wizard.ts`: Zustand slice. State: `step: 'idea' | 'scoping' | 'plan_review' | 'approving' | 'error'`, `sessionId: string | null`, `questions: DecisionPrompt[]`, `currentQuestion: DecisionPrompt | null`, `plan: PlanBlock[] | null`. Actions: `submitIdea(projectId, text)`, `submitAnswer(answer)`, `approvePlan(editedPlan)`.
2. Create `src/renderer/components/wizard/IdeaInput.tsx`: full-screen sentence prompt (re-uses or mirrors `FrontDoor.tsx` treatment). On submit: calls `wizard:start-scoping` IPC, transitions store to `scoping`.
3. Create `src/renderer/components/wizard/ScopingQA.tsx`: renders current `DecisionPrompt` as a `DecisionCard`. Handles button-choice and free-text variants. Progress label uses "Step N of M" format — never "Question 3/8". On submit: calls `wizard:answer-question`. If response is `{ type: 'plan_ready' }`, transitions to `plan_review`.
4. Create `src/renderer/components/wizard/PlanReview.tsx`: renders `PlanBlock[]` as an editable list. Each block has inline edit-in-place. "Approve plan" CTA calls `wizard:approvePlan(editedPlan)` → on success, navigates to Project Board. "Getting your plan ready…" label during approving (not "Locking in your plan").
5. Main-process `wizard:start-scoping` handler: creates scoping session, starts SDK session with a system prompt that instructs the agent to grill the user on their idea and produce a structured plan. Returns the first `DecisionPrompt`.
6. Main-process `wizard:answer-question` handler: forwards answer to running scoping session, waits for next agent response, classifies as either another question or completed plan. Returns appropriately typed response.
7. Main-process `wizard:approve-plan` handler: calls `db.seedCardsFromPlan()` (which generates step labels), sets `project.plan` and `project.status = 'building'`, pushes `board:update` for each seeded card, returns updated project + cards.
8. Smart-pausing heuristics in `event-transformer.ts`: genuine-decision heuristic (question has product fork — architecture, feature toggle, design direction, user-facing wording) → emit `decision_prompt` and pause session. Routine heuristic (standard tool/library micro-choice within approved stack, file naming) → auto-answer with default, emit `activity` event.

---

## Group 7: Decision Prompts — inline + board headline + re-open

**Delivers:** Decision cards render correctly in three contexts: inline in the scoped session feed (pauses the session), as the Needs-you headline on the board, and in the New Project Wizard. Answering a decision in the feed resumes the session and updates the board. Re-opening an answered question is possible from the question queue. Decision cards support button-choice, free-text, and plan-approval variants.

**Depends on:** Group 5 (session feed + question queue), Group 6 (wizard uses same card component)

**Verify:** `bun run verify-group-7.sh` — trigger a genuine decision event from a running session (use a test prompt that forces a question), confirm feed pauses and card renders in question queue as pending, submit answer, confirm state changes to answered with Re-open link, confirm feed resumes streaming; trigger Re-open, confirm question re-opens and session is notified.

1. Create `src/renderer/components/DecisionCard.tsx`: shared component used in feed, board headline, and wizard. Props: `prompt: DecisionPrompt`, `onAnswer: (answer: string) => void`, `answered?: boolean`, `onReopen?: () => void`. Renders button-choice, free-text, or plan-approval variants. Answered state shows chosen answer dimmed, non-interactive, with a "Re-open" link if `onReopen` is provided.
2. Wire `DecisionCard` into `FeedEventRow.tsx` (Group 5): when `event.kind === 'decision_prompt'`, render `DecisionCard` with `onAnswer` calling `store.answerQuestion(questionId, answer)` and `onReopen` calling `store.reopenQuestion(questionId)`.
3. Wire `DecisionCard` into `NeedsYouHeadline.tsx` (Group 4): the headline block renders the top pending question's `DecisionCard` directly with answer buttons. On answer, calls `sessions:answer-decision` IPC.
4. Main-process `sessions:answer-decision` handler: validates session is `paused_for_decision`, forwards answer to the running SDK session, sets session status back to `active`, updates the associated `question_queue` row to `answered`, updates the associated card's `decision_prompt.answer` in DB, emits `board:update` (card transitions from `needs_you` back to `building`).
5. Main-process `sessions:reopen-question` handler: validates question is in `answered` state, sets it to `reopened`, notifies the running SDK session of the re-open, emits `feed:event` with kind=`narration` ("You re-opened a question — I'll wait for your updated answer"), emits updated `QuestionQueueItem` to renderer.
6. Playwright E2E test: full flow — start session → trigger decision → question appears in queue as pending → answer → answered state with Re-open → Re-open → session notified → board card returns to needs_you → re-answer → session resumes.

---

## Group 8: Story walk + integration hardening

**Delivers:** All 17 user stories verified end-to-end. Edge cases handled: empty states, error recovery, session restart after crash, mid-build steering, checkpoint approve and flag, re-open question, multiple projects with background-status rail updates. All automated checks pass.

**Depends on:** Groups 1–7 (all capabilities)

**Verify:** `bun test && tsc --noEmit && bun run e2e` — all pass.

1. Playwright E2E: Story 1 — open app with no projects, see front-door sentence, create a project, see it in list with background-status indicator, open it, see empty build-spine.
2. Playwright E2E: Story 2+3+11 — open wizard from front-door sentence, submit idea, complete scoping Q&A (button + free-text both exercised, progress shows "Step N of M"), reach plan review, edit one item, approve, confirm board spine seeds with step labels.
3. Playwright E2E: Story 4+5+12 — board shows seeded items in Planned state with step labels; add a feature item and a bug item manually; confirm they appear in correct positions; confirm done items collapse to history.
4. Playwright E2E: Story 6+13 — click a spine item, confirm scoped session opens with step-label header, confirm narration streams, confirm steering input is visible; submit a "look closer" steering input, confirm it appears in the feed; confirm no code/git/terminal text appears.
5. Playwright E2E: Story 7+8+14+17 — trigger a genuine decision event, confirm Needs-you headline promotes to top of board with question inline, answer from board headline, confirm session resumes; confirm question appears in queue as answered with Re-open link; Re-open, confirm question re-opens.
6. Playwright E2E: Story 9 — verify all five stub tabs visible; clicking each shows "Unlocks in Phase N" placeholder (not locked/greyed); no crash.
7. Playwright E2E: Story 10 — create project, complete wizard, add items, answer a decision → close app → reopen → all data present (project name, spine items with correct statuses, decision answers); session marked as active at quit shows card in building status on relaunch.
8. Playwright E2E: Story 15 — simulate a session failure, confirm Failed state on spine item with plain-English description and "Try again" CTA; click Try again, confirm session restarts.
9. Playwright E2E: Story 16 — complete a session, confirm checkpoint block appears with screenshot preview, click "Looks good, continue", confirm next spine item advances to up_next; repeat with "Something's off", confirm flagNote forwarded and item returns to building.
10. Playwright E2E: Story 12+background status — open Project B while Project A has an active session, confirm Project A row shows active status in the switcher rail without leaving Project B's board.
11. Error hardening: simulate SDK init failure (bad PATH), confirm friendly error in wizard and session; simulate DB write failure, confirm error message, no silent data loss.
12. IPC Zod validation hardening: send malformed payloads to every IPC handler, confirm all return typed error responses, none throw uncaught exceptions.
13. Plain-language audit: scan all rendered text in every E2E flow — zero instances of raw IDs, model names, tool-call names, file paths, branch names, "Phase N/M" format (must be "Step N of M: <name>"), jargon activity labels.
14. Final `tsc --noEmit` with `"strict": true` — zero errors.
