---
phase: 4
type: rebuild
chunk: 1+2
---

# Phase 4 Requirements — Build & Iterate

## Scope

Phase 4 reorganizes Helm around two explicit project modes — **Build** and **Iterate** — picked once at a redesigned front door. The engine (sessions, agent SDK, live preview, point-and-fix, DB) is completely unchanged; what changes is the entire visual language (total redesign replacing the v4 Maximalist system) and the project management and onboarding surface. Build mode delivers a goal-driven, ordered rail where every step hard-stops at a dogfoodable checkpoint before the next unlocks. Iterate mode is the existing freeform board, reframed, with two new entry paths (start-fresh-as-one-step and import-existing-app). On completion a user can: pick a mode at the front door; navigate an ordered, checkpoint-gated build rail; import and iterate on an existing AI-built local web app; rename, delete, and organize projects; and experience a fully redesigned Helm that looks and feels calm, sleek, and guiding.

**Delivery is split into two dogfoodable chunks that each end in a fully working Electron app:**
- **Chunk 1:** New visual language (all design tokens + core screens reskinned) + Build mode (rail, checkpoints, triage+shelf, celebration, mode transition)
- **Chunk 2:** Iterate mode surfaces (two doors, scratch entry, import flow) + remaining screens reskinned + project management (rename, delete)

## User Stories

Stories are ordered by chunk. Every story references its Named Flow and step from product.md.

### Chunk 1 — Visual Redesign + Build Mode

**C1-S1:** As a first-time user opening Helm, I see a calm, modern front door that presents two clear options — "Build something new" and "Iterate on an app" — without any playful or maximalist visual noise. [Front Door (Two Doors), Step 1]

**C1-S2:** As a builder who picks "Build something new", I describe my goal in a sentence and see an ordered rail of milestones generated toward it, labeled "Step N of M to your first working app." [Start in Build mode, Step 1–2]

**C1-S3:** As a builder watching my rail, I see steps locked in order — the next step only unlocks when the current step's checkpoint has been explicitly passed. I can never skip ahead. [Start in Build mode, Step 3]

**C1-S4:** As a builder whose current step finishes, I land at a hard-stop Rail Checkpoint screen — I test what was just built, report any bugs, and must explicitly click "Continue to the next step" to advance. The agent does not advance on its own. [Start in Build mode, Step 3]

**C1-S5:** As a builder who types a request mid-rail, the agent triages it: small fixes and questions are handled immediately in the current session; large, unrelated, or scope-expanding requests are parked on the "For later" shelf automatically. A visible note appears: "Saved for later." [Start in Build mode, Step 4]

**C1-S6:** As a builder, I can see the "For later" shelf beside the rail at any time — nothing I typed is lost, even if it was triaged out. [Start in Build mode, Step 4]

**C1-S7:** As a builder who completes the last rail step and approves its checkpoint, I see the Build→Iterate Celebration screen — "Your app now does what you set out to build." The rail collapses to a compact journey strip. [Start in Build mode, Step 5]

**C1-S8:** As a builder whose celebration ends, my project transitions to Iterate mode and the freeform board opens with any parked "For later" items already on the backlog. [Start in Build mode, Step 5]

**C1-S9:** As a user viewing any screen, I see the new calm, sleek visual language: neutral tokens, clean typography, deliberate use of accent color (guiding, bold where it counts), no chunky outlines, no maximalist palette. Every previously shipped screen is reskinned. [product.md — Total Redesign]

**C1-S10:** As a user on any screen, the "Live" badge on a project in the side rail shows only when that project's dev server is actually running and healthy. It disappears when the server is stopped. [product.md — Project Management, session stop bug]

**C1-S11:** As a user running a session, I can stop it. A "Stop" action is reachable from the session view. After stopping, the session's status updates and the Live badge clears if applicable. [product.md — session stop bug]

**C1-S12:** As a user on any screen, I can navigate back to the board or home via a consistent navigation control — there is no screen where I'm stuck without a way back. [product.md — back/home navigation bug]

**C1-S13:** As a builder mid-rail who switches to another project and comes back, the wizard Q&A state (my answers, current question) is exactly as I left it — nothing is lost. [Start in Build mode, Step 2 — wizard state bug]

### Chunk 2 — Iterate Mode + Import + Project Management

**C2-S1:** As a user at the front door who picks "Iterate on an app", I see two sub-options: "Start fresh" and "Bring an existing app." [Front Door (Two Doors), Step 1]

**C2-S2:** As a user who picks "Start fresh", my first feature request and the app scaffold are built as a single step — I do not see a blank canvas or a separate setup screen before the build begins. When it completes, the freeform Iterate board is ready. [Start in Iterate mode — scratch, Step 1–2]

**C2-S3:** As a user who picks "Bring an existing app", I point Helm at a local folder that contains an AI-built web app. Helm scans the folder, derives a run manifest (start command + port), shows me what it found, and starts the live preview. [Start in Iterate mode — import, Step 1–2]

**C2-S4:** As a user who imported an existing app, I can iterate on it like any Helm project: the board, sessions, and point-and-fix all work exactly as they do for a project started in Helm. [Start in Iterate mode — import, Step 3]

**C2-S5:** As a user looking at the project switcher, I can rename a project. [product.md — Project Management]

**C2-S6:** As a user looking at the project switcher, I can delete a project. A confirmation is shown before deletion. [product.md — Project Management]

**C2-S7:** As an existing Helm user (pre-modes) whose project had an unfinished plan, I open Helm and my project is in Build mode, positioned at the correct rail step matching my progress. [product.md — Two Modes, existing projects]

**C2-S8:** As an existing Helm user (pre-modes) whose project was done, I open Helm and my project is in Iterate mode on the freeform board. [product.md — Two Modes, existing projects]

## UI Requirements

### Screen: Front Door (Two Doors)
**Default state:** Full-screen. Two large, clearly differentiated option areas — "Build something new" (Build mode entry) and "Iterate on an app" (Iterate mode entry). Each has a one-line description. Brand mark visible. No text input on this screen — the mode choice comes first.
**After "Iterate on an app" is clicked:** The same screen or a slide-out reveals two sub-options: "Start fresh" and "Bring an existing app." No full navigation change required — this is a secondary choice within the same view.
**Empty state:** N/A (always shown to new users or those who explicitly navigate to it).
**Loading:** No loading state — this is pure UI choice.
**Error:** N/A.
**Mobile:** Not in scope — desktop-only Electron app.

### Screen: Build Rail
**Default state:** The two-column layout persists — the left rail shows the project list (existing component), the main area shows the Build Rail. The rail is a vertical ordered list of milestone steps. Each step shows: step label ("Step N of M"), title, status indicator. Current step: expanded with the live session feed embedded. Locked steps: collapsed, visually muted, with a lock indicator. Completed steps: collapsed, checkmark. "For later" shelf is a dismissible panel beside (or below) the rail — visible when it has items, collapses when empty.
**During a step:** The current step is expanded showing the session feed. The session feed uses the same feed components already built. Steering input is available within the current step.
**At checkpoint:** Checkpoint UI overlays or replaces the current step's expanded view (see Rail Checkpoint screen).
**All done:** Celebration overlay appears (see Build→Iterate Celebration screen).
**Error:** If the current step's session fails, it shows in the step as a failed state with retry option.
**Mobile:** N/A.

### Screen: Rail Checkpoint
**Default state:** A full-width panel within the current step area (not a modal). Shows: what was built (screenshot if available, otherwise a text summary from the session), a "Report a bug" input, and a prominent "Continue to the next step →" button. The Continue button is the only way to advance.
**Bug reported:** Bug appears on the board as a card (existing AddItemModal or inline). Checkpoint remains open — the user can report multiple bugs before continuing.
**Mobile:** N/A.

### Screen: For-Later Shelf
**Default state:** A collapsible panel in the Build Rail view. Shows parked items as a simple list with item title and a faint "Saved for later" label. Items are visually distinct from rail steps.
**Empty state:** Panel collapses entirely — no visible affordance when the shelf is empty.
**Mobile:** N/A.

### Screen: Build→Iterate Celebration
**Default state:** Full-screen overlay. Large, centered text: "Your app now does what you set out to build." A compact journey strip (collapsed rail history) appears below. A single "Open your app →" or "Start iterating →" CTA.
**After CTA:** Overlay dismisses, project transitions to Iterate mode, freeform board loads with parked "For later" items as backlog cards.
**Mobile:** N/A.

### Screen: Import Flow
**Default state:** A step-by-step flow within the front door / wizard surface. Step 1: folder picker (native OS dialog) — user selects the app's root folder. Step 2: Helm scans the folder and shows what it found (detected start command, detected port, or "not found" with manual override fields). Step 3: Helm starts the dev server and previews the app (live preview pane). Step 4: Board opens in Iterate mode.
**Error — no manifest found:** Manual override form: enter start command and port manually. Helm validates by attempting to start and probe.
**Error — start fails:** Error message with the raw error (not code — human-readable), retry and cancel options.
**Mobile:** N/A.

### Screen: Project Switcher (redesigned)
**Default state:** Left rail (brand + project list, reskinned) + main area (project grid or list with status). Each project card shows: name, mode badge (Build/Iterate), background status dot, last-updated time. Actions: open, rename (inline edit), delete (confirmation).
**Empty state:** The switcher is only shown when projects exist, so no empty state here — empty-project users go to Front Door.
**Mobile:** N/A.

### Reskinned existing screens (all must use new token system by end of Chunk 2)
All existing screens must be reskinned to the new visual language. The existing components are unchanged in behavior — only the visual treatment changes:
- Front-Door Sentence (now replaced by Front Door Two Doors — no longer an input-first screen)
- Project Switcher (redesigned above)
- Build-Spine Board (board tab, session cards, spine items — reskinned tokens)
- Scoped Session (feed, steering input, question queue — reskinned tokens)
- Decision Prompt (structured card — reskinned)
- Rail Checkpoint (reskinned and wired to build rail logic)
- Live Preview Pane (chrome/surround reskinned)
- Point-and-Fix Overlay (reskinned)
- Decisions / Progress / Docs panels (reskinned)

## Data Model

### Migration 5 — Phase 4 additions
```sql
-- Project mode and rail state
ALTER TABLE projects ADD COLUMN mode TEXT NOT NULL DEFAULT 'build';
-- 'build' | 'iterate'

ALTER TABLE projects ADD COLUMN rail_step INTEGER;
-- The index of the current rail step (0-based). NULL in iterate mode.

ALTER TABLE projects ADD COLUMN rail_complete INTEGER NOT NULL DEFAULT 0;
-- 1 when the celebration has been shown and mode has transitioned to 'iterate'.

-- For-later shelf items (parked mid-rail requests)
CREATE TABLE shelf_items (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'user_triage',
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_shelf_project ON shelf_items(project_id, created_at);

-- Import tracking
ALTER TABLE projects ADD COLUMN import_folder TEXT;
-- Absolute path to the imported app's folder (NULL for Helm-native projects).
```

### Existing tables used unchanged
- `projects` (extended above) — mode, rail_step, rail_complete, import_folder added
- `cards` — rail step cards are standard `plan_seed` cards; shelf items have their own table
- `sessions` — no change
- `feed_events` — no change
- `fix_comments` — no change

## API Contracts

### IPC: `projects:set-mode`
Set a project's mode (used on celebration → Iterate transition).
- **Request:** `{ projectId: string, mode: 'build' | 'iterate' }`
- **Success:** `{ project: Project }` (updated project)
- **Errors:**
  - `{ error: 'not_found' }` — project does not exist
  - `{ error: 'validation_failed', field: string, message: string }` — bad input

### IPC: `projects:set-rail-step`
Advance the rail step after checkpoint approval.
- **Request:** `{ projectId: string, step: number }`
- **Success:** `{ project: Project }`
- **Errors:**
  - `{ error: 'not_found' }`
  - `{ error: 'step_out_of_bounds', max: number }` — step exceeds plan length

### IPC: `projects:rename`
Rename a project (project management).
- **Request:** `{ projectId: string, name: string }`
- **Success:** `{ project: Project }`
- **Errors:**
  - `{ error: 'not_found' }`
  - `{ error: 'validation_failed', field: 'name', message: 'name must not be empty' }`

### IPC: `projects:delete`
Delete a project and all its data (CASCADE in DB).
- **Request:** `{ projectId: string }`
- **Success:** `{ ok: true }`
- **Errors:**
  - `{ error: 'not_found' }`

### IPC: `shelf:list`
List parked items for a project.
- **Request:** `{ projectId: string }`
- **Success:** `{ items: ShelfItem[] }` where `ShelfItem = { id, projectId, title, source, createdAt }`
- **Errors:**
  - `{ error: 'not_found' }`

### IPC: `shelf:add`
Park a request on the shelf (used by triage logic in wizard-orchestrator / session).
- **Request:** `{ projectId: string, title: string }`
- **Success:** `{ item: ShelfItem }`
- **Errors:**
  - `{ error: 'not_found' }`
  - `{ error: 'validation_failed', field: 'title', message: string }`

### IPC: `shelf:promote`
Promote a shelf item to a board card (user moves it to the active backlog in Iterate mode).
- **Request:** `{ itemId: string, projectId: string }`
- **Success:** `{ card: Card }` (newly created card from the shelf item)
- **Errors:**
  - `{ error: 'not_found' }`

### IPC: `import:scan`
Scan a folder and derive a run manifest (or signal manual override needed).
- **Request:** `{ folderPath: string }`
- **Success:**
  - `{ found: true, startCommand: string, port: number, confidence: 'high' | 'low' }` — Helm found a manifest
  - `{ found: false }` — no manifest; UI should show manual override form
- **Errors:**
  - `{ error: 'folder_not_found' }` — path does not exist or is not a directory
  - `{ error: 'scan_failed', message: string }` — unexpected error during scan

### IPC: `import:start`
Start the dev server for an imported project using the given manifest, set artifact_dir.
- **Request:** `{ projectId: string, folderPath: string, startCommand: string, port: number }`
- **Success:** `{ ok: true, url: string }` — server started and HTTP probe passed
- **Errors:**
  - `{ error: 'not_found' }` — project not found
  - `{ error: 'start_failed', message: string }` — process failed to start or probe timed out
  - `{ error: 'already_running' }` — dev server already running for this project

### IPC: `sessions:stop`
Stop a running session.
- **Request:** `{ sessionId: string }`
- **Success:** `{ ok: true }`
- **Errors:**
  - `{ error: 'not_found' }` — session not found
  - `{ error: 'session_not_active' }` — session already stopped/done

### Design Tokens (not IPC — renderer-only)
The new token system replaces the v4 Maximalist system entirely. The following CSS custom properties are the complete replacement (defined in `globals.css`, no legacy token names retained):

```css
/* Neutrals — light mode */
--color-bg: #F8F7F5;          /* page background */
--color-surface: #FFFFFF;     /* card, panel surfaces */
--color-surface-raised: #F2F1EF; /* nested surfaces */
--color-border: #E4E2DE;      /* hairline borders */
--color-border-strong: #C9C5BF; /* emphasized borders */
--color-ink: #1A1917;         /* primary text */
--color-ink-2: #5A5651;       /* secondary text */
--color-ink-3: #9B9690;       /* placeholder / tertiary */

/* Accent — one primary accent, two supporting */
--color-accent: #2563EB;      /* guiding blue — CTAs, active states, links */
--color-accent-soft: #EFF6FF; /* accent wash for backgrounds */
--color-success: #16A34A;     /* done, approved, healthy */
--color-success-soft: #F0FDF4;
--color-warn: #D97706;        /* needs attention */
--color-warn-soft: #FFFBEB;
--color-danger: #DC2626;      /* error, failed, delete */
--color-danger-soft: #FEF2F2;

/* Typography */
--font-ui: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
/* Fraunces and Space Grotesk are retired */

/* Shape */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 22px;
--radius-full: 9999px;

/* Elevation — subtle shadows, no chunky outlines */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.10);
```

The `brut` and `brut-2` classes are retired. Border treatment is a single-pixel `var(--color-border)` line with no drop shadow, or `--shadow-sm/md/lg` for elevation cues.

## Constraints & Context

- The engine is frozen: `SessionOrchestrator`, `DevServerManager`, `WizardOrchestrator`, the SQLite schema (except Migration 5 above), and all IPC channel handler logic are untouched except for new channels added above and the two bug fixes (session stop + Live badge truthfulness).
- The wizard Q&A state loss bug (switching projects mid-scoping) must be fixed in the `wizard` Zustand store — the state is currently held in-memory only; fix requires either persisting in the DB or attaching the state to the project row so it survives a view switch.
- Triage in Build mode is agent-side logic in the session system prompt — the agent decides "small fix now" vs "park to shelf." The shelf IPC above is what the agent triggers via a tool call; the UI simply listens.
- Import: the scan step looks for `helm.json` first (existing DevServerManager manifest format: `{ startCommand, port }`), then falls back to known patterns (`package.json` scripts containing `dev` or `start`, `vite.config`, `next.config`). The confidence field signals to the UI whether to auto-proceed or pause for confirmation.
- The mock-bridge (`src/renderer/src/mock-bridge.ts`) is retired — all validation and dogfooding runs on the real Electron app.
- Tailwind v4 `@theme` block in `globals.css` is the single source of truth for design tokens. No inline styles or hardcoded hex values in components.
- All new IPC channels follow the existing `CH` registry pattern in `ipc-schemas.ts`.
- Session stop: `SessionOrchestrator` already has an `interrupted` set — the stop IPC handler adds the sessionId to that set and calls `handle.cancel()` (existing `SessionHandle` interface). The main process then updates session status to `'stopped'` and pushes `backgroundStatus` to the renderer.

## Excluded from This Phase

- Non-web / native / arbitrary codebases for import (import is limited to AI-built local web apps with a derivable dev command)
- Cloud sync, team features, or multi-user
- Any user-facing code, diff, or git surface
- Auto-deploy to production
- Paid API tier or any monetization
- Mock-bridge — fully removed, not maintained
- Tauri migration or any shell change
- Animate transitions between modes (simple cross-fade is fine; choreographed animation is not in scope)
- Dark mode (the new token system is designed to support it in a future phase, but it is not built in Phase 4)
