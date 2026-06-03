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
2. Create `src/main/sdk/session-runner.ts`: wraps `@anthropic-ai/claude-agent-sdk` `query()`. Resolves `pathToClaudeCodeExecutable` via `execSync('which claude')` on init. Exposes `startSession(prompt: string, onEvent: (e: SdkEvent) => void): SessionHandle`.
3. Create `src/main/sdk/event-transformer.ts`: converts raw SDK events (`text`, `tool_use`, `tool_result`, etc.) into typed `FeedEvent` objects (`narration | activity | decision_prompt | summary | error`). No raw SDK payload crosses the IPC boundary — only transformed events. Log raw payload to DB `feed_events.raw_payload`.
4. Create `src/main/ipc/feed-bridge.ts`: registers `ipcMain.handle` for `sessions:get-feed`. Registers `webContents.send` push for `feed:event`. Validates all payloads with Zod schemas from `src/shared/ipc-schemas.ts`.
5. Create `src/shared/ipc-schemas.ts`: Zod schemas for every IPC channel defined in requirements.md. Export inferred TypeScript types. Both main and renderer import from this file — single source of truth.
6. Create a minimal renderer stub: a single React component that invokes `sessions:get-feed` on mount and renders each event text in a list. No styling beyond functional layout.
7. Write `verify-group-1.sh`: spawns Electron in dev mode, injects a test prompt via a hidden IPC command, waits for the first `feed:event` push, asserts it arrives within 30s, exits 0. Fails if SDK init throws.

---

## Group 2: Local Persistence — SQLite DB layer

**Delivers:** All four tables (`projects`, `cards`, `sessions`, `feed_events`) created and migrated on app launch. CRUD operations for projects and cards exposed via IPC. Data survives app restart.

**Depends on:** Group 1 (project scaffold, shared IPC schemas, Zod types)

**Verify:** `bun test --run db` — unit tests for all DB operations; and `bun run verify-group-2.sh` — app launch, create project, restart app, project still present.

1. Create `src/main/db/migrations.ts`: runs all schema migrations on `app.ready`. DB file at `app.getPath('userData')/helm.db`. Migrations are numbered and idempotent.
2. Create `src/main/db/schema.ts`: TypeScript types matching the data model in requirements.md exactly. No runtime type assertions — types derived from Zod schemas in `src/shared/ipc-schemas.ts`.
3. Create `src/main/db/projects.ts`: `listProjects()`, `createProject(name)`, `getProject(id)`, `updateProject(id, patch)`. All synchronous (better-sqlite3 API).
4. Create `src/main/db/cards.ts`: `listCards(projectId)`, `createCard(projectId, type, title, source)`, `updateCardStatus(id, status)`, `seedCardsFromPlan(projectId, planBlocks)`. Status machine enforced: invalid transitions throw a typed error.
5. Create `src/main/db/sessions.ts`: `createSession(projectId, cardId?, name)`, `getSession(id)`, `updateSessionStatus(id, status)`.
6. Create `src/main/db/feed-events.ts`: `appendEvent(sessionId, event)`, `getEvents(sessionId, afterId?)`.
7. Register IPC handlers: `projects:list`, `projects:create`, `projects:get`, `cards:create`, `cards:update-status`. Validate all inputs with Zod before calling DB functions.
8. Unit tests (Vitest) in `src/main/db/__tests__/`: cover create, read, status transitions (valid + invalid), and plan-seeding. Tests use an in-memory SQLite DB (`:memory:`).

---

## Group 3: App Shell + Project Switcher

**Delivers:** The outer Electron window is running with a functional Project Switcher: empty state with "Start your first project" CTA, populated state with project list, "New project" button. Clicking a project opens its board (board stub is fine in this group). Project list loads from DB and persists on restart.

**Depends on:** Group 1 (Electron scaffold), Group 2 (DB + IPC handlers)

**Verify:** `bun run verify-group-3.sh` — launch app, confirm Project Switcher renders in empty state; create a project via IPC stub; confirm project appears in list; restart; confirm project still listed.

1. Create `src/renderer/store/projects.ts`: Zustand slice. State: `projects: Project[]`, `activeProjectId: string | null`. Actions: `loadProjects()` (calls `projects:list` IPC), `createProject(name)` (calls `projects:create`), `setActive(id)`.
2. Create `src/renderer/components/ProjectSwitcher.tsx`: renders empty state or project list depending on store. Calls `loadProjects()` on mount. "+ New project" button triggers project-creation flow (modal or inline form — design decides treatment). Each project row calls `store.setActive(id)`.
3. Wire `ProjectSwitcher` into the app root (`src/renderer/App.tsx`). When `activeProjectId` is null, render `ProjectSwitcher` full-screen. When set, render `ProjectBoard` (stub component for now).
4. Create `src/renderer/components/ProjectBoard.stub.tsx`: placeholder that shows the project name and "Board coming in Group 4". Accepts `projectId` prop.
5. Register `board:update` push listener in the renderer on app init — store the handler but no-op for now (wired in Group 4).

---

## Group 4: Project Board — cards, columns, statuses, add-card

**Delivers:** Full Project Board for a selected project. Feature columns (To do / Building / Done), bug rail, decisions section. Cards rendered with correct status badges. "+ Add card" creates a feature or bug card. Board auto-seeds from project plan on first open after wizard approval. Board listens for `board:update` pushes and re-renders affected cards in real time.

**Depends on:** Group 2 (DB + card IPC), Group 3 (app shell, active project, board mount point)

**Verify:** `bun run verify-group-4.sh` — open project, confirm columns render; add feature card, confirm appears in To do; add bug card, confirm appears in Open; trigger a `board:update` push from main via test IPC, confirm card moves in UI without reload.

1. Create `src/renderer/store/board.ts`: Zustand slice. State: `cards: Card[]` (flat array; view-layer groups by type+status). Actions: `loadBoard(projectId)` (calls `projects:get`), `addCard(type, title)` (calls `cards:create`), `applyUpdate(card)` (called on `board:update` push — replaces card by id).
2. Create `src/renderer/components/ProjectBoard.tsx`: renders three feature columns, bug rail, decisions section, stub tabs. Loads board on mount. Renders `CardItem` components in correct columns.
3. Create `src/renderer/components/CardItem.tsx`: displays card title and status badge. Click opens session feed (wired in Group 5; card is clickable but no-ops in this group). Decision cards show an "Answer" CTA (wired in Group 7).
4. Create `src/renderer/components/AddCardModal.tsx`: modal or inline form for "+ Add card". Type selector (feature / bug), title text input, submit. Calls `store.addCard()`. Validates title non-empty before submit.
5. Render stub tabs: Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View. Each tab body shows "Coming soon — Phase N" with the phase number from requirements.md.
6. Wire `board:update` push: on renderer init, subscribe to `board:update` IPC push and call `store.applyUpdate(card)`.
7. Main-process handler: `board:update` is emitted from `cards:update-status` and `wizard:approve-plan` handlers whenever a card changes. Push to all open windows.

---

## Group 5: Session Feed — streaming plain-English output

**Delivers:** Clicking a card on the board opens the Session Feed screen. The feed shows streaming narration lines, activity labels, a working spinner. Session is started via the live SDK (calls Group 1's `session-runner.ts`). Feed events stream in real time via `feed:event` pushes. Done/error states render correctly. "Back to board" returns to the Project Board.

**Depends on:** Group 1 (SDK session runner + event transformer), Group 2 (sessions DB), Group 3 (routing), Group 4 (card click)

**Verify:** `bun run verify-group-5.sh` — click a card, confirm session starts, confirm at least 3 narration events stream within 60s (real SDK call), confirm "Back to board" returns to board with card still showing 'building' status.

1. Create `src/renderer/store/feed.ts`: Zustand slice. State: `events: FeedEvent[]`, `session: Session | null`, `status: 'idle' | 'active' | 'paused_for_decision' | 'done' | 'error'`. Actions: `startSession(projectId, cardId)`, `loadFeed(sessionId)`, `appendEvent(event)`, `setStatus(status)`.
2. Create `src/renderer/components/SessionFeed.tsx`: renders session name header, scrolling event list, status-appropriate footer (spinner / decision card / done summary / error). Calls `store.startSession()` on mount. Subscribes to `feed:event` push for the active session.
3. Create `src/renderer/components/FeedEventRow.tsx`: renders one `FeedEvent`. `narration` events: plain text. `activity` events: indented label with icon. `decision_prompt` events: renders `DecisionCard` inline (wired in Group 7). `summary` events: styled summary. `error` events: friendly error text.
4. Wire card-click navigation: `CardItem` (Group 4) routes to `SessionFeed` passing `projectId` + `cardId`. Routing is in-app state (no URL routing needed — single-window app); `App.tsx` renders `SessionFeed` when `activeFeedCardId` is set.
5. Main-process `sessions:start` handler: creates a session row in DB, starts a real SDK session via `session-runner.ts`, streams events through `event-transformer.ts`, emits `feed:event` push per event. Updates `cards` table card status to 'building' on session start; emits `board:update`.
6. "Back to board" button: clears `activeFeedCardId` in app store; renders `ProjectBoard`.

---

## Group 6: New Project Wizard — scoping Q&A + plan approval

**Delivers:** Full New Project Wizard: idea-input screen → scoping Q&A via decision cards → plan-review screen with inline editing → approve-plan triggers board auto-seed. Wizard is backed by a real SDK scoping session. Smart-pausing heuristics wired (genuine decisions surface; routine choices auto-answered).

**Depends on:** Group 1 (SDK), Group 2 (DB + wizard IPC), Group 3 (navigation), Group 4 (board auto-seed from plan)

**Verify:** `bun run verify-group-6.sh` — open wizard, submit idea, confirm at least 2 scoping questions render as decision cards, answer all questions, confirm plan-review screen shows editable plan, approve plan, confirm board populates with feature cards.

1. Create `src/renderer/store/wizard.ts`: Zustand slice. State: `step: 'idea' | 'scoping' | 'plan_review' | 'approving' | 'error'`, `sessionId: string | null`, `questions: DecisionPrompt[]`, `currentQuestion: DecisionPrompt | null`, `plan: PlanBlock[] | null`. Actions: `submitIdea(projectId, text)`, `submitAnswer(answer)`, `approvePlan(editedPlan)`.
2. Create `src/renderer/components/wizard/IdeaInput.tsx`: full-width text area, submit button. On submit: calls `wizard:start-scoping` IPC, transitions store to `scoping`.
3. Create `src/renderer/components/wizard/ScopingQA.tsx`: renders current `DecisionPrompt` as a `DecisionCard`. Handles button-choice and free-text variants. On submit: calls `wizard:answer-question`. If response is `{ type: 'plan_ready' }`, transitions to `plan_review`.
4. Create `src/renderer/components/wizard/PlanReview.tsx`: renders `PlanBlock[]` as an editable list. Each block has inline edit-in-place (click to edit title/description). "Approve plan" CTA calls `wizard:approvePlan(editedPlan)` → on success, navigates to Project Board.
5. Main-process `wizard:start-scoping` handler: creates scoping session, starts SDK session with a system prompt that instructs the agent to grill the user on their idea and produce a structured plan. Returns the first `DecisionPrompt`.
6. Main-process `wizard:answer-question` handler: forwards answer to the running scoping session, waits for the next agent response, classifies it as either another question or a completed plan. Returns appropriately typed response.
7. Main-process `wizard:approve-plan` handler: calls `db.seedCardsFromPlan()`, sets `project.plan` and `project.status = 'building'`, pushes `board:update` for each seeded card, returns updated project + cards.
8. Smart-pausing heuristics in `event-transformer.ts`: when an SDK agent event contains a question, classify it. Genuine-decision heuristic: the question text contains a product fork (architecture, feature toggle, design direction, user-facing wording). Routine heuristic: question is about a standard tool, library micro-choice within the approved stack, or file naming. Routine questions are auto-answered with a default and emitted as an `activity` feed event ("I chose X automatically"). Genuine questions are emitted as `decision_prompt` events and pause the session.

---

## Group 7: Decision Prompts — inline + board surface

**Delivers:** Decision cards render correctly in both the Session Feed (inline, pauses the session) and on the Project Board (standalone "Needs you" cards). Answering a decision in the feed resumes the session and updates the board. Decision cards support button-choice, free-text, and plan-approval variants.

**Depends on:** Group 5 (session feed), Group 6 (wizard uses the same card component)

**Verify:** `bun run verify-group-7.sh` — trigger a genuine decision event from a running session (use a test prompt that forces a question), confirm feed pauses and card renders, submit answer, confirm feed resumes streaming.

1. Create `src/renderer/components/DecisionCard.tsx`: shared component used in feed and board. Props: `prompt: DecisionPrompt`, `onAnswer: (answer: string) => void`, `answered?: boolean`. Renders button-choice, free-text, or plan-approval variants based on `prompt.type`. Answered state shows chosen answer dimmed, non-interactive.
2. Wire `DecisionCard` into `FeedEventRow.tsx` (Group 5): when `event.kind === 'decision_prompt'`, render `DecisionCard` with `onAnswer` calling `store.answerDecision(sessionId, answer)`.
3. Create `src/renderer/store/decisions.ts` (or extend `board.ts`): action `answerDecision(sessionId, answer)` calls `sessions:answer-decision` IPC, then updates the associated decision card's status to 'decided' in the board store.
4. Main-process `sessions:answer-decision` handler: validates session is `paused_for_decision`, forwards the answer to the running SDK session, sets session status back to 'active', updates the associated card's `decision_prompt.answer` field in DB, emits `board:update`.
5. Board surface: `CardItem` for decision cards with `status: 'needs_you'` renders a prominent "Answer" CTA that opens the `DecisionCard` in a modal overlay. On answer, calls same `answerDecision` action.
6. Playwright E2E test: full flow — start session → trigger decision → answer → confirm session resumes → confirm board card moves from 'needs_you' to 'decided'.

---

## Group 8: Story walk + integration hardening

**Delivers:** All 10 user stories verified end-to-end. Edge cases handled: empty states, error recovery, session restart after crash, card-add during active session, multiple projects. All automated checks pass.

**Depends on:** Groups 1–7 (all capabilities)

**Verify:** `bun test && tsc --noEmit && bun run e2e` — all pass.

1. Playwright E2E: Story 1 — open app with no projects, see Project Switcher empty state, create a project, see it in list, open it, see empty board.
2. Playwright E2E: Story 2+3 — open wizard, submit idea, complete scoping Q&A (button + free-text variants both exercised), reach plan review, edit one item, approve, confirm board seeds.
3. Playwright E2E: Story 4+5 — board shows seeded feature cards in To do; add a feature card and a bug card manually; confirm they appear in correct columns.
4. Playwright E2E: Story 6 — click a feature card, confirm session feed opens with narration streaming, confirm no code/git/terminal text appears in feed.
5. Playwright E2E: Story 7+8 — trigger a genuine decision event, confirm feed pauses, answer, confirm feed resumes, confirm board decision card moves to Decided.
6. Playwright E2E: Story 9 — verify all five stub tabs are visible on the board and clicking each shows a "Coming soon" placeholder.
7. Playwright E2E: Story 10 — create project, add cards, close app, reopen app, confirm project and cards are present.
8. Error hardening: simulate SDK init failure (bad PATH), confirm friendly error in wizard and session feed, no crash. Simulate DB write failure, confirm error message, no silent data loss.
9. IPC Zod validation hardening: send malformed payloads to every IPC handler via test scripts, confirm all return typed error responses, none throw uncaught exceptions.
10. Final `tsc --noEmit` with `"strict": true` — zero errors.
