# The Executive Dashboard Validation

This is the test contract for `/sdd-review`. Every check listed here must pass before Phase 1 is approved.

---

## Automated Checks

Run these commands. Each must exit 0.

- **TypeScript:** `tsc --noEmit` — zero errors with `"strict": true`
- **Unit tests — DB layer:** `bun test --run db` — covers projects CRUD, cards CRUD, valid+invalid status transitions (planned→up_next→building→done, needs_you→building, failed→building), plan seeding with step labels, checkpoint verdict, question-queue state machine (pending→answered→reopened→answered)
- **Unit tests — IPC schemas:** `bun test --run ipc-schemas` — Zod validation rejects malformed payloads on all IPC channels (including sessions:steer, sessions:reopen-question, cards:approve-checkpoint, project:background-status)
- **Unit tests — event-transformer:** `bun test --run event-transformer` — SDK events mapped to correct FeedEvent kinds; no raw code/file/git strings pass through; checkpoint event generated on session done
- **Group 1 smoke — SDK plumbing:** `bun run verify-group-1.sh` — real SDK session starts, first feed:event push arrives within 30s, no SDK init error
- **Group 2 smoke — DB persistence:** `bun run verify-group-2.sh` — create project, restart app process, project still present; active session at quit survives restart with resumed_at set
- **Group 6 smoke — wizard flow:** `bun run verify-group-6.sh` — wizard scoping produces at least 2 questions with "Step N of M" progress labels, approve plan seeds cards in DB with step_label field populated
- **E2E suite:** `bun run e2e` — all Playwright tests pass (see story walk in Group 8 of plan.md)

---

## Manual Verification

Walk through these checks in the running Electron app. Each is pass/fail.

### Viewport — Electron window at default launch size (1280 × 800 minimum)

**Story 1 — Project Switcher with background status:**
- [ ] Launch app with no projects → front-door sentence renders full-screen with a single large plain-language prompt. No blank white screen, no form fields, no error.
- [ ] Create a project via sentence entry → project appears in the Project Switcher list with name, timestamp, and a background-status indicator.
- [ ] Close and reopen the app → project is still listed (persistence confirmed).
- [ ] Open a project → board (build-spine) view loads. Front-door sentence is no longer the active view.
- [ ] With Project A open in a background session, switch to Project B → Project A's row in the switcher rail shows an active status without navigating back.

**Story 2+11 — Sentence entry and wizard scoping:**
- [ ] Launch app (no projects) → front-door sentence is present. Text area accepts input. Submit is the only action.
- [ ] Submit an idea → scoping Q&A begins. First question renders as a decision card. Progress label shows "Step N of M" (not "Question 3/8").
- [ ] At least one question has clickable button options. Clicking submits and advances. No free-text required for button cards.
- [ ] At least one question has a free-text box. Typing and submitting advances the card.
- [ ] Scoping is thorough — minimum 3 questions before the plan appears.
- [ ] No raw model name, internal ID, or technical jargon visible at any point in the wizard.

**Story 3 — Plan approval:**
- [ ] After answering all scoping questions, the plan-review screen appears with a readable plan (not raw JSON, not code).
- [ ] Individual plan items can be edited inline. Approving reflects the edited text.
- [ ] "Approve plan" CTA is only clickable when the plan is non-empty.
- [ ] Approving transitions to the build-spine board with items auto-seeded from the plan. Each item shows a step label in "Step N of M: <name>" format.

**Story 4+12 — Build-spine board card display:**
- [ ] After plan approval, feature items appear in the build-spine in Planned state. Count matches top-level plan items.
- [ ] Each item shows a step label, title, and status.
- [ ] Starting a session on a spine item changes its status to Building (spotlight) without page reload.
- [ ] Completing a session changes the item to Done and it collapses to quiet history — it does not stay as a full card.
- [ ] Done items are visible in the history section at the bottom of the spine, not deleted.

**Story 5 — Board manual items:**
- [ ] "+ Add item" button opens an item-creation form.
- [ ] Creating a feature item → item appears in Planned state in the spine.
- [ ] Creating a bug item → item appears in the spine appropriately.
- [ ] Both manually added items persist after closing and reopening the app.

**Story 6+13 — Scoped session and steering:**
- [ ] Clicking a spine item opens the scoped session with the item's step label as the header ("Step N of M: <name>").
- [ ] The feed shows streaming lines in plain English — no code snippets, no file paths, no git commands, no branch names.
- [ ] Activity labels are readable ("Building the sign-in form" not "wiring sign-in form" or "tool_use: write_file").
- [ ] A working indicator is visible while the session is running.
- [ ] Steering input is visible with interrupt / redirect / look-closer options.
- [ ] Submitting a "look closer" or "redirect" steering input produces a feed event confirming it was received.
- [ ] "Back to board" button returns to the build-spine.

**Story 7+14 — Smart-pausing and Needs-you headline:**
- [ ] At least one agent-raised decision surfaces as a decision card during a real build session.
- [ ] When a card transitions to Needs-you, the "Needs you" block rises to the most prominent position on the board — it is visually the headline, not a badge or buried card.
- [ ] The full question text and answer buttons are shown inline in the Needs-you block — no need to open the item.
- [ ] A routine choice is NOT surfaced as a decision card — it appears only as an activity event.
- [ ] The session feed is visually paused (no new narration lines) while a decision card awaits an answer.

**Story 8+17 — Decision answered, session resumes, re-open:**
- [ ] Answering a decision card causes the session feed to resume streaming narration within 5 seconds.
- [ ] The answered card in the question queue shows "Answered" state with a "Re-open" link.
- [ ] Clicking Re-open transitions the question back to reopened state. The session receives notification.
- [ ] The answered decision card in the feed is rendered dimmed and non-interactive.

**Story 9 — Stub tabs (phase-unlocking, not dead/locked):**
- [ ] Project board shows tabs for: Live Preview, Point-and-Fix, Decisions Log, Progress Timeline, Docs View.
- [ ] Each stub tab shows "Unlocks in Phase N" (correct phase number) and does not crash or show a blank screen.
- [ ] Stub tabs are visually present but clearly not functional — no loading spinner, no empty interactive elements.
- [ ] Stub tabs do NOT appear as greyed-out or locked icons — they read as forward-looking invitations.

**Story 10 — Persistence and session durability:**
- [ ] Create a project, complete wizard, add manual items, answer a decision → close app → reopen → all data present (project name, spine items with correct statuses, decision answers).
- [ ] A session that was active when the app quit shows the card in Building status on relaunch. The session itself need not resume mid-stream, but the status is preserved.

**Story 15 — Failed/off-track state:**
- [ ] Simulate or trigger a session failure. Confirm the spine item transitions to Failed state.
- [ ] Failed item shows a plain-English description of what went wrong — no stack trace, no technical error code.
- [ ] "Try again" or "Tell me more" CTA is present and functional.
- [ ] Clicking "Try again" restarts the session and transitions the item back to Building.

**Story 16 — Reviewable-result checkpoint:**
- [ ] When a session completes, a checkpoint block appears in the scoped session feed.
- [ ] Checkpoint block shows a plain-language "Here's what I built — does this look right?" label.
- [ ] A screenshot preview or visual summary is shown (not a blank frame).
- [ ] "Looks good, continue" advances to the next spine item (it transitions to Up next).
- [ ] "Something's off" opens a steering text input. Submitting a flag note causes the item to return to Building state.
- [ ] Navigating away and back to the session shows the checkpoint still visible and actionable (not cleared).

---

## Primary Flow Verification (stop criteria — these three must pass for the feature to be viable)

**Primary Flow 1 — Start a project through to build start:**
- [ ] Walk the full path: open app → front-door sentence → submit idea → complete scoping (≥3 questions as decision cards with "Step N of M" labels) → edit the plan → approve → build-spine populates with items → first item goes Building (session opens, feed shows plain-English narration). No terminal window opened. No code visible at any point. No jargon in any label.

**Primary Flow 2 — Steer, decide, checkpoint:**
- [ ] During an active build session: a genuine decision surfaces as Needs-you on the board headline (not buried); user answers from the board; session resumes; item eventually finishes and shows a reviewable checkpoint; user approves; next item advances to Up next. All three signals confirmed in a single uninterrupted session.

**Primary Flow 3 — Persistence across app restart:**
- [ ] Create a project, complete the wizard, get one item to Done with an approved checkpoint → quit the app → reopen → project is present, board spine shows correct item statuses, the done item is in collapsed history, the next item is Up next. No data lost. No terminal opened at any point.

---

## Content Quality Checks (manual, /sdd-review reviewer)

- [ ] Zero code snippets, file paths, branch names, or git terminology visible anywhere in the app's UI.
- [ ] Zero raw SDK event keys (`tool_use`, `tool_result`, `content_block_start`, etc.) visible in the session feed.
- [ ] Zero internal IDs or codes (no "CFP-08", no card UUIDs) visible to the user.
- [ ] Zero raw model names visible anywhere (agent identity is implicit, never named).
- [ ] All step/phase labels use the format "Step N of M: <plain-name>" — never "Phase 1/4" or a bare number.
- [ ] All activity labels are natural English ("Building the sign-in form") — no jargon verbs ("wiring", "scaffolding") or raw tool-call names.
- [ ] All error states show a friendly plain-English message with a recovery action — no stack traces, no technical error codes.
- [ ] The scoping Q&A conversation feels thorough — a reviewer acting as a non-developer can answer all questions without needing technical knowledge.
- [ ] The plan produced by the wizard is readable and understandable by a non-developer without translation.
- [ ] Stub tabs say "Unlocks in Phase N" — not "Coming soon", not locked/greyed.

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
