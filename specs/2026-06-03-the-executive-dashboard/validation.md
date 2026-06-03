# The Executive Dashboard Validation

This is the test contract for `/sdd-review`. Every check listed here must pass before Phase 1 is approved.

---

## Automated Checks

Run these commands. Each must exit 0.

- **TypeScript:** `tsc --noEmit` — zero errors with `"strict": true`
- **Unit tests — DB layer:** `bun test --run db` — covers projects CRUD, cards CRUD, valid+invalid status transitions, plan seeding from PlanBlock array
- **Unit tests — IPC schemas:** `bun test --run ipc-schemas` — Zod validation rejects malformed payloads on all 10 IPC channels
- **Unit tests — event-transformer:** `bun test --run event-transformer` — SDK events mapped to correct FeedEvent kinds; no raw code/file/git strings pass through
- **Group 1 smoke — SDK plumbing:** `bun run verify-group-1.sh` — real SDK session starts, first feed:event push arrives within 30s, no SDK init error
- **Group 2 smoke — DB persistence:** `bun run verify-group-2.sh` — create project, restart app process, project still present in DB
- **Group 6 smoke — wizard flow:** `bun run verify-group-6.sh` — wizard scoping produces at least 2 questions, approve plan seeds cards in DB
- **E2E suite:** `bun run e2e` — all Playwright tests pass (see story walk in Group 8 of plan.md)

---

## Manual Verification

Walk through these checks in the running Electron app. Each is pass/fail.

### Viewport — Electron window at default launch size (1280 × 800 minimum)

**Story 1 — Project Switcher:**
- [ ] Launch app with no projects → Project Switcher shows empty state with a prominent "Start your first project" CTA. No blank white screen, no error.
- [ ] Create a project via "New project" button → project appears in the Project Switcher list with a name and timestamp.
- [ ] Close and reopen the app → project is still listed (persistence confirmed).
- [ ] Open a project → board view loads. Project Switcher is no longer the active view.

**Story 2 — New Project Wizard scoping:**
- [ ] Click "Start your first project" → Wizard opens to the idea-input screen. Text area is present and accepts input.
- [ ] Submit an idea → scoping Q&A begins. First question renders as a decision card (not raw chat text).
- [ ] At least one question has clickable button options. Clicking a button submits the answer and advances to the next card — no free-text required.
- [ ] At least one question has a free-text box. Typing an answer and submitting advances the card.
- [ ] The scoping conversation is thorough — minimum 3 questions before the plan appears. (If fewer than 3, the scoping session prompt is too shallow — flag as failing.)

**Story 3 — Plan approval:**
- [ ] After answering all scoping questions, the plan-review screen appears with a readable plan (not raw JSON, not code).
- [ ] Individual plan items can be edited inline. Editing one item and approving reflects the edited text — original text is not used.
- [ ] "Approve plan" button is only clickable when the plan is non-empty. Clearing all plan items disables it (or prompts an error).
- [ ] Approving the plan transitions to the project board with cards auto-seeded from the plan.

**Story 4 — Project Board card display:**
- [ ] After plan approval, feature cards appear in the "To do" column. Count matches the number of top-level plan items.
- [ ] Each card shows a title and a status badge ("To do", "Building", or "Done" for features; "Open" or "Fixed" for bugs; "Needs you" or "Decided" for decisions).
- [ ] Starting a session on a feature card (Group 5) changes its badge to "Building" without page reload.
- [ ] Completing a session changes the badge to "Done" without page reload.

**Story 5 — Board manual cards:**
- [ ] "+ Add card" button opens a card-creation form.
- [ ] Creating a feature card → card appears in "To do" column.
- [ ] Creating a bug card → card appears in the bug rail under "Open".
- [ ] Both manually added cards persist after closing and reopening the app.

**Story 6 — Session Feed:**
- [ ] Clicking a feature card opens the Session Feed with the card's name as the session header.
- [ ] The feed shows streaming lines in plain English — no code snippets, no file paths, no git commands, no branch names.
- [ ] Activity labels are readable (e.g. "Checking the project structure" not "tool_use: read_file").
- [ ] A working spinner (or equivalent active indicator) is visible while the session is running.
- [ ] "Back to board" button returns to the Project Board.

**Story 7 — Smart-pausing (decision surfacing):**
- [ ] At least one agent-raised decision surfaces as a decision card in the Session Feed during a real build session (genuine-decision path verified).
- [ ] A routine choice (within the approved stack) is NOT surfaced as a decision card — it appears only as an activity event in the feed.
- [ ] The session feed is visually paused (no new narration lines) while a decision card is awaiting an answer.

**Story 8 — Decision answered, session resumes:**
- [ ] Answering a decision card (button or free-text) causes the session feed to resume streaming narration within 5 seconds.
- [ ] After answering, the board decision card (if it was also a board card) moves from "Needs you" to "Decided".
- [ ] The answered decision card in the feed is rendered in a dimmed "Decided" state and is no longer interactive.

**Story 9 — Stub tabs visible:**
- [ ] Project Board shows tabs for: Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View.
- [ ] Clicking each stub tab shows a placeholder (e.g. "Coming soon — Phase 2/3/4") and does not crash or show a blank screen.
- [ ] Stub tabs are visually present but clearly not functional — no loading spinner, no empty interactive elements.

**Story 10 — Persistence:**
- [ ] Create a project, complete wizard, add manual cards, answer a decision → close app → reopen → all data present (project name, board cards with correct statuses, decision answers).
- [ ] An in-progress session (if resumed after restart) shows at minimum the card in "Building" status — the session itself need not resume mid-stream, but the card status is preserved.

---

## Primary Flow Verification (stop criteria — these three must pass for the feature to be viable)

**Primary Flow 1 — Start a project through to build start:**
- [ ] Walk the full path: open app → start new project → complete scoping (≥3 questions as decision cards) → edit the plan → approve → board seeds with feature cards → first card starts building (session opens, feed shows narration). No terminal window opened. No code visible at any point.

**Primary Flow 2 — Board reflects real progress:**
- [ ] During an active build session, the board card moves from "To do" → "Building" when the session starts, and from "Building" → "Done" when the session completes — both changes happen without the user refreshing or navigating away.

**Primary Flow 3 — Mid-build decision, board updates:**
- [ ] A genuine decision surfaces mid-session as a decision card. User answers. Session resumes (narration restarts). Board decision card (if present) changes from "Needs you" to "Decided". All three signals confirmed in a single uninterrupted session.

---

## Content Quality Checks (manual, /sdd-review reviewer)

- [ ] Zero code snippets, file paths, branch names, or git terminology visible anywhere in the app's UI.
- [ ] Zero raw SDK event keys (`tool_use`, `tool_result`, `content_block_start`, etc.) visible in the session feed.
- [ ] All error states show a friendly plain-English message with a recovery action — no stack traces, no technical error codes shown to the user.
- [ ] The scoping Q&A conversation feels thorough — a reviewer acting as a non-developer can answer all questions without needing technical knowledge.
- [ ] The plan produced by the wizard is readable and understandable by a non-developer without technical translation.

---

## Definition of Done

Phase 1 is complete when ALL of the following are true:

- [ ] All automated checks pass (exit 0)
- [ ] All manual verifications pass
- [ ] All three primary flows pass
- [ ] All content quality checks pass
- [ ] Frontend compliance check passes (handover covers all UI requirements)
- [ ] UX review passes — no blocking issues on primary flows
- [ ] User explicitly approves
- [ ] Living docs updated: README status, WIKI learnings, docs/api.md, CHANGELOG.md
