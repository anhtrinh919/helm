# Replit Agent / AI App Builder — Product Research Report

**Project examined:** "Display Auditor" (Display Audit AI) — a Vietnamese-language retail display compliance tool built via Replit Agent, using React + Vite + TailwindCSS + shadcn/ui (frontend), Express.js + TypeScript (backend), PostgreSQL + Drizzle ORM (database), Google Gemini 2.5 Flash (AI vision). A real, completed, multi-iteration project built entirely through the Replit Agent chat interface.

**Research date:** 2026-06-09  
**Account plan:** Starter (Free)  
**URL examined:** `https://replit.com/@tuananhtrinh919/Display-Auditor?replId=ede43fab-57f3-4943-b4b3-946c35ee139d`

---

## 1. Positioning & Framing

**Meta description (replit.com homepage):** "Build and deploy software collaboratively with the power of AI without spending a second on setup."

**Product tagline on pricing modal:** "Autonomy for all. Choose the best plan for you."

**Tone:** Strongly developer-inclusive. The workspace is a full IDE (file tree, code editor, terminal/console, git panel) with an Agent chat bolted on. Replit does not hide code or use softer language for non-devs — the default view is a code editor pane. The product pitches itself as an accelerator for developers and technical users, not as a no-code tool.

**Non-dev friendliness:** Minimal. The product surfaces files, folders (client, server, shared, uploads, components.json, drizzle.config.ts, vite.config.ts, package.json), a terminal, and a git log by default. A non-developer cannot avoid seeing these. There is no "output-only" or "business view" mode at the free or core tier.

---

## 2. The Agent / AI Chat Interface

### Chat input
- Free-form text box with placeholder: "Make, test, iterate…"
- Attach file button (image/document upload — used to upload reference images for the AI to work from)
- "Select element (⌘U)" — click any element in the live preview to reference it in the chat prompt (visual targeting)
- "Start voice input" button
- "Plan" mode checkbox (currently gated to Core plan)
- **"Economy agent modes"** selector (see §2.3)

### How prompts become code
1. User types a request in the chat box (in any language — this project used Vietnamese throughout)
2. Agent responds with a plan in text (structured list of tasks)
3. Agent then executes: produces a batch of "actions" shown as a collapsed summary button (e.g., "1 message & 54 actions", "69 actions", "9 actions")
4. Each action round ends with a **"Checkpoint made"** marker in the conversation timeline with a timestamp and git commit message
5. The agent shows intermediate status like "Analyzed page data and content (4 seconds)", "Worked for 14 minutes"
6. App restarts automatically; agent verifies via the live preview
7. Agent ends with a summary in natural language + proactive follow-up suggestions

### What the chat shows during a build
- **Action summaries** (collapsed by default): "X actions" — these expand to show individual file changes
- **Checkpoint made** cards — each tied to a git commit, showing:
  - Commit message (auto-generated)
  - "Rollback here" button
  - "Changes" button (diff view)
  - "Preview expired" note (previews of old checkpoints time out)
- **Timing information**: "Worked for 14 minutes", "Worked for 30 seconds"
- **Status messages**: "Transitioned from Plan to Build mode", "Saved progress at the end of the loop"
- **Agent response text**: full natural-language explanation of what was done, including itemized lists of all completed changes
- **Proactive suggestion chips**: after completing a request, Agent surfaces follow-up suggestions (e.g., "AI-powered task prioritization suggestions.", "Dark mode toggle for improved readability and aesthetics.", and a "Show 3 more" button)

### Does it ask clarifying questions?
Barely. From the conversation log: the agent analyzes, plans, and executes in one go. It showed a plan before building only in "Plan mode" (gated). In Build mode it just executes. It does check at the end of a round with "Bạn thấy thế nào?" ("What do you think?") but this is a polite close, not a clarifying pre-flight.

### Iteration model
- User pastes multi-item feature lists (the project conversation shows 7-item lists written in Vietnamese) — agent handles all items in one run
- Follow-up corrections via chat (e.g., "OK, làm đi" = "OK, do it")
- No visual click-to-edit on the preview (though "Select element ⌘U" can reference preview elements)
- Rollback via "Rollback here" on any checkpoint

---

## 3. Workspace Anatomy (Panes & Panels)

### Top navigation bar (left to right)
- **Expand Agent** (AI icon) — likely expands the agent panel to full screen
- **Project name** ("Display Auditor")
- **Upgrade** button — opens the pricing modal immediately
- **Search (Cmd-K)** — command palette
- **Invite** button — opens collaboration/task sidebar
- **Publish** button — opens publish dialog (on free plan, opens upgrade prompt)
- **Open library** — opens file tree sidebar
- **Menu** — user account menu: Home, Recent projects, Settings, Notifications, CLUI (command-line interface), Theme, Help, Log out
- **Main version** — version/branch management
- **New task** — opens background task creation (gated to Core)
- **Help menu** — "Try new: Design on an infinite canvas", "Read the docs", "Send feedback"

### Main workspace tab bar (tabs opened during exploration)
Preview | Git | Console | Database | Auth | Secrets | Integrations | Agent Skills | Automations | replit.md | Security Center | Growth | App Storage | [+ New tab]

Each panel is opened from the **Tools & Files** search (Cmd-K equivalent — a combobox with pre-loaded options).

### Left sidebar — File Tree
```
attached_assets/
client/
  public/
  src/
    components/
    hooks/
    lib/
    pages/
    App.tsx
    index.css
    main.tsx
  index.html
script/
server/
  replit_integrations/
    batch/
    chat/
    image/
  auth.ts
  db.ts
  index.ts
  routes.ts
  seed.ts
  static.ts
  storage.ts
  vite.ts
shared/
uploads/
components.json
drizzle.config.ts
postcss.config.js
README.md
replit.md         ← Replit's persistent agent context file
tsconfig.json
vite-plugin-meta-images.ts
vite.config.ts
[Packager files]
  package-lock.json
  package.json
```

### Canvas tab (tldraw-based)
A whiteboard/canvas panel with two mini-views ("Website" and "Start application") and six interaction modes:
- **Interact** — click/interact with embedded preview
- **Pan** — pan the canvas
- **Chat** — draw chat bubbles / annotations on canvas
- **Draw** — freehand drawing
- **Edit** — select and edit canvas elements
- **Generate** — AI-generate UI elements on canvas

Also has color palette buttons (Black, Grey, Red, Yellow, Blue, Green), fill/outline toggle, and font selector.

### Git tab
- Branch selector ("main")
- Remote: anhtrinh919/display_audit, linked to GitHub
- Pull / Push / Sync buttons
- "There are no changes to commit."
- Full commit history with expand/collapse switches per commit
- "Fetch" button, "Settings" button, "Refresh and Fetch"

### Console tab
- Live terminal (shell) for the Replit environment
- Shows the running app (`npm run dev`) with live output
- "Ask Agent…" button — brings a quick-ask interface into the terminal panel
- Port info: "Port :5000 opened on {...}.replit.dev"
- Stop / networking controls
- "Don't expose this port to the web" toggle

### Database tab
- Shows "Development Database" — PostgreSQL, 29.42 MB / 20 GB limit
- Billing info: renews monthly, hours of compute used
- "All Databases" and "Refresh" controls

### Auth tab
- Replit Auth integration management
- Message: "Replit Auth is not configured. Click set up with Agent, and log into your app once with Replit Auth to configure."
- User table: User ID, Name, Last logged in (empty in this project — custom auth was implemented instead)

### Secrets tab
- Secrets (env vars) section:
  - `AI_INTEGRATIONS_GEMINI_API_KEY` ●●●●
  - `AI_INTEGRATIONS_GEMINI_BASE_URL` ●●●●
  - `GOOGLE_GEMINI_API_KEY` ●●●●
  - `SESSION_SECRET` ●●●●
- "Link Account Secrets" button
- "New Secret" button
- **Configurations** section — non-sensitive vars that differ between dev and production

### Integrations tab
**Replit-managed (built-in, auto-configured):**
- Replit Database (PostgreSQL)
- Replit App Storage (Object Storage)
- Replit Auth (Authentication)
- Replit Domains (Domains)

**Git Providers (manual, not accessible to Agent):**
- GitHub — Active (connected, Disconnect button)
- Bitbucket — Sign in
- GitLab — Sign in

### Agent Skills tab
"Skills extend what Agent can do. Manage installed skills here."  
No skills installed. Description: "Skills are reusable instructions that teach Agent how to perform specific tasks. Ask Agent to create a skill from a chat."

### Automations tab
"This tool is used to visualize and test your agents and automations created using the 'Automation' app type."

### Security and Privacy Center tab
- **Agent security scan** (Core plan gated): "In-depth analysis of security vulnerabilities in your project. Hybrid approach combining static analysis with LLM reasoning. Acts on custom threat model to review full codebase. Resolves vulnerabilities in parallel using background tasks."
- **Automatic dependency scans** (Free): Background scan for third-party package issues
- Powered by Semgrep (static analysis) + HoundDog.ai (privacy) + LLM reasoning

### Growth tab
"Publish your app to unlock Growth tools. Once your app is published you'll get an Agent SEO scan, traffic insights, and visitor analytics here."

### App Storage tab
"Host and save uploads like images, videos, and documents. Store photos, videos, and documents in easy-to-use storage 'buckets'."  
Options: "Create new bucket" / "Use an existing bucket"

---

## 4. Code Visibility

**Code is fully exposed.** The file tree shows every source file. Clicking any file opens the full source in a code editor (Monaco-like). There is no abstraction layer — non-devs see TypeScript, React JSX, database schemas, and API routes.

**Lowest possible code exposure:** The Canvas view (tldraw) gives a whiteboard with embedded live preview, but to actually edit the app a non-dev must use the chat. The chat does generate all code behind the scenes, but it writes it directly into the file tree.

**replit.md** is a special file Replit auto-creates and maintains as a running context document for the agent. It contains: project overview, features, file structure, tech stack, API endpoints, UI conventions, and recent changes. This serves as the agent's "memory" and is updated by the agent after each change.

---

## 5. Iteration Model

- **Primary iteration path:** Chat → Agent executes → Checkpoint auto-saved
- **Rollback:** "Rollback here" button on any Checkpoint — reverts codebase to that point
- **Changes view:** "Changes" button on each Checkpoint shows a diff of what changed
- **Version management:** "Main version" button in top bar for branch management
- **No visual editing** of the live app — all changes go through the chat or the code editor directly
- **Select element (⌘U):** Can target a specific UI element in the preview and reference it in a chat prompt ("fix this button's padding")
- **Chat canvas integration:** The Canvas tab has a "Chat" drawing mode, but the primary agent interaction is the right-side chat panel

---

## 6. Menus and Toolbars (Multi-Level)

### Command Palette (Cmd-K)
```
Commands
  Files — Find a file (⌘P)
  Search — Search through your files (⌘⇧F)
  Stop — Stop Repl
  Open development URL
  My Apps — Jump to another Repl
  Remix — Remix App
  Settings — Change Replit Settings
Tools (jump to existing tab)
  Console
  Git
  Preview
  Database
  Auth
  Secrets
  Integrations
  Agent Skills
  Automations
```

### Tools & Files search dropdown (all options)
```
Jump to existing tab:
  Preview — Preview your App
  Integrations
  Agent Skills
Suggested:
  Publishing
  Database
  App Storage
  Auth
  Security Center
  Secrets
  Automations
  Canvas
  Growth
```

### Agent Modes (⌘⇧I to cycle)
Three modes, selectable via "Economy agent modes" button in chat input:
- **Lite** — "Fast, lightweight models for quick edits and iterations. Best mode for small changes and visual tweaks."
- **Economy** (default on free plan) — "Cost-optimized models for everyday tasks. Delivers a strong balance of speed and quality. Best mode for most builds." Note: "No app testing or code review"
- **Power** (Core plan) — Corresponds to "Core: Full Agent capabilities" — agent is more intelligent, reviews its own code, fixes issues automatically

### Menu (top bar, hamburger)
- Home (links to replit.com/~)
- Recent (project history: e.g., "ExpenseReport")
- Settings
- Notifications (badge count: 3)
- CLUI (command-line interface at replit.com/~/cli)
- Theme (Light/Dark)
- Help
- Log out

### Canvas toolbar
- Mode selector: Interact | Pan | Chat | Draw | Edit | Generate
- Color picker: Black, Grey, Red, Yellow, Blue, Green
- Fill: Outline (toggle)
- Font: Sans
- "Move focus to canvas"
- "Center content"

---

## 7. Integrations

### Built-in (Replit-managed, Agent-configurable):
- **PostgreSQL database** — provisioned automatically, visible in Database panel
- **Object Storage (App Storage)** — S3-like buckets for file uploads
- **Replit Auth** — pre-built login/signup via Replit account (OAuth-like)
- **Replit Domains** — custom domain management
- **Gemini AI Integrations** — `AI_INTEGRATIONS_GEMINI_API_KEY` and base URL auto-provisioned as secrets when using Replit's Gemini integration (separate from user's own key)

### Third-party connectors (gated to Core+, shown in "Unlock" dialog):
- **Stripe** (shown as "Connected" in the Connectors dialog — interesting, may be pre-connected at account level)
- **Google Sheets** (shown as "Connected")
- **Twilio** (Connect button)
- **GitHub** (Connect button — separate from git provider integration)

Connector tagline: "Connect your app to powerful services like Stripe, Google, Twilio, and more with just a few clicks. No complex setup required."

### Git Providers:
- GitHub (active in this project)
- Bitbucket
- GitLab

---

## 8. Error / Debug UX

- Terminal/Console panel shows live stdout — visible errors appear there
- Agent has an "Ask Agent…" button inside the Console panel for quick debugging via chat
- Economy mode does NOT include "app testing or code review" — agent runs and hopes for the best
- Power/Core mode: agent reviews its own code and fixes issues automatically before presenting results
- When builds break, the conversation log shows the agent's self-corrective attempts: "Let me fix the issues identified..." followed by another round of actions
- "Preview expired" on old checkpoints — older Rollback point previews time out and can't be visually inspected

---

## 9. Deploy / Publish / Share Flow

### Publish dialog (accessible from "Publish" top-bar button — on free plan also shows upgrade modal)
```
Publish
  Settings
    Domain: [project-slug].replit.app (Available)
    Who can access your app: Public — Anyone on the internet with the URL
    Review security
  Publish [button]
```

- Free plan: "Publish up to 1 project"
- Core plan: "Publish projects in any region", "Publish private or password-protected deployments", removes "Made with Replit" badge
- Growth tools (SEO scan, traffic insights, visitor analytics) unlock after publishing

### Publishing flow observations:
- One-click deploy to `.replit.app` subdomain
- Development runs continuously on a separate dev URL ({...}.replit.dev:5000)
- "Don't expose this port to the web" toggle for port visibility control

---

## 10. Pricing / Credits / Upsell

### Plans (as shown in "Compare Replit plans" modal)
| Plan | Price | Key limits |
|------|-------|------------|
| **Starter** (current / free) | Free | Free daily Agent credits; publish 1 project; Economy/Lite agent modes only; no plan mode, no parallel agents |
| **Replit Core** | $20/month | $20 monthly credits; 5 collaborators; 2 parallel agents; all regions; Power agent mode; Plan mode; Connectors; Mobile Simulators; Background Tasks; "Made with Replit" badge removal |
| **Replit Pro** | $100/month (+ credit tier options: $225, $440, $850, $2,050/month) | $100+ credits; 15 collaborators; 50 viewers; 10 parallel agents; most powerful models; database rollbacks for 28 days |
| **Enterprise** | Custom | SSO/SAML; Single-tenant; VPC peering; Static outbound IPs; Design system support |

### Upsell touchpoints observed (all opened the pricing/upgrade modal):
1. "Upgrade" button in top navigation bar (always visible)
2. Clicking "Publish" (free plan redirects to upgrade)
3. Clicking "New task" (Background Tasks gated)
4. Clicking "Plans" in task sidebar
5. "New task" in task sidebar
6. "Economy agent modes" button opens "Unlock Replit's full potential" dialog when Power mode selected
7. Agent security scan in Security Center ("Upgrade to unlock")
8. Publish button triggers upgrade dialog before showing publish options

### Credits model:
- Agent usage consumes credits (runs of the AI agent cost credits from the monthly allotment)
- Free plan has "free daily Agent credits" (amount not specified in the UI)
- Economy mode is lower credit cost; Power mode is higher

---

## 11. Preview Experience

- Live preview embedded in a tldraw canvas panel ("Website" and "Start application" frames visible on canvas)
- Preview is a real running web server (Node/Express on port 5000), not a static render
- Dev URL: `{project-slug}.replit.dev:5000` — accessible from external browsers during development
- No device frames or responsive simulators on free/Core plan (Mobile Simulators gated to Core per "Unlock" dialog)
- "Preview expired" on old checkpoint previews

---

## 12. Collaboration / Multiplayer

- **Invite** button in top bar
- Task management sidebar (visible after clicking Invite):
  - "New task", "Core" label, "Filters", "Plans", "Tasks", "ME / Created by me", "Open task board"
  - Task board view at `/taskBoard` route
- Core: up to 5 collaborators, 2 parallel agents
- Pro: up to 15 collaborators, 50 viewers, 10 parallel agents
- Real-time multiplayer not explicitly surfaced in free tier UI

---

## 13. Onboarding / Empty States / Tooltips

- **replit.md** — auto-generated and maintained by Agent; serves as living documentation and project memory
- After each completed build, Agent surfaces 3+ proactive feature suggestion chips ("AI-powered task prioritization suggestions.", "Dark mode toggle for improved readability and aesthetics.", "Show 3 more")
- Empty states: Auth panel says "Click set up with Agent" — all empty states funnel back to the chat
- Help menu: "Read the docs" (docs.replit.com), "Send feedback", "Try new: Design on an infinite canvas"
- Agent ends most responses with "Bạn muốn tôi thực hiện thêm điều gì không?" ("Would you like me to do anything else?") — consistent post-completion prompt
- No interactive tutorial or guided onboarding visible in this project view

---

## Standout Strengths

1. **Full-stack in one environment.** PostgreSQL, object storage, auth, secrets, deployment, and git are all provisioned inside Replit with no external accounts needed. The agent can wire them together without human configuration.

2. **Checkpoint / rollback system.** Every agent run produces a checkpoint with a meaningful commit message, a diff view, and a one-click rollback. This is genuine version history with semantic labels, not just git commits.

3. **Inline agent + terminal.** The "Ask Agent…" button inside the Console panel means when something breaks in production logs, you can ask the agent to fix it without leaving the terminal view.

4. **Language-agnostic input.** The agent handles prompts in Vietnamese throughout this project — no issue with non-English requests.

5. **replit.md context management.** The auto-maintained project context file means the agent has persistent memory of architecture decisions, naming conventions, and recent changes across sessions without the user re-explaining.

6. **Connectors (Core+).** One-click Stripe, Google Sheets, Twilio — genuinely low-friction for common integrations.

7. **Security Center.** Built-in Semgrep + HoundDog.ai scanning with an agent-powered fix mode is differentiated.

---

## Weaknesses / Friction for a Non-Dev

1. **The workspace is a code IDE.** File tree, TypeScript files, terminals, and git logs are all default-visible. A non-developer will be confronted with production code immediately.

2. **No hiding the code.** Unlike Bubble or Webflow, there is no abstraction layer. "No-code" is not a Replit value proposition — it is an AI-assisted code tool.

3. **Economy mode is crippled.** The default free-tier agent mode ("Economy") explicitly has "No app testing or code review." Bugs pass through undetected. Upgrade is required for the agent to self-review.

4. **Publish is paywalled beyond 1 project.** Deploying more than one project requires a subscription. Publish-with-password or private deployments require Core.

5. **Plan Mode gated.** The agent cannot ask clarifying questions or brainstorm before building (Plan Mode) without Core subscription. On Starter, it just starts coding.

6. **Credits are opaque.** Free daily credits are not quantified in the UI. Users don't know how many agent runs they have until they run out.

7. **Preview link management is clunky.** Old checkpoint previews expire. The live dev URL changes. Sharing the work in progress with stakeholders requires publishing.

8. **Canvas (tldraw) is underdeveloped.** Six interaction modes, draw tools, and an embedded preview exist, but there is no visual drag-and-drop component builder or no-code UI editor.

9. **Mobile preview requires upgrade.** Mobile Simulators (iOS/Android) are Core-only.

10. **Upsell frequency is high.** At least 8 distinct touchpoints observed that opened the upgrade modal in a single exploration session.

---

## Relevance to Helm

### (a) One-shotting & iteration vs. a structured build-stack journey

**How Replit does it:** Replit is a one-shot executor — paste a feature list, the agent runs it all in one go, checkpointing as it goes. The user gets a "Worked for 14 minutes" result. There is no structured journey (no spec → frontend → backend phases). Plan Mode (gated) is the only way to slow down and think before coding. Iteration is purely chat-driven: type a correction, agent reruns. There is no concept of "phases" or "stages" — just a continuous append-only conversation log.

**Helm differentiation:** Helm's structured Build Stack (ba → spec → frontend → backend → review) is opposite to Replit's fire-and-forget approach. Helm guides the user through what to build before building it, which catches requirement gaps before they become code bugs. For non-technical users, this journey is safer — Replit's one-shot model often produces apps that need many correction loops because requirements were never clarified upfront.

### (b) Requiring another subscription vs. riding the user's existing Claude Max

**How Replit does it:** Replit requires its own subscription. Free daily credits run out quickly. Core is $20/month, Pro is $100/month+. The agent uses its own LLM (undisclosed, but Replit-managed — agents run on Replit's own LLM infrastructure, not the user's Claude or OpenAI accounts). The user pays Replit separately from any other AI subscription they hold.

**Helm differentiation:** Helm riding the user's existing Claude Max subscription means $0 marginal cost per build for users who already pay Anthropic. This is a clean story: "You're already paying for Claude. Helm is how you build apps with it — no second subscription." Against Replit's $20-100/month, this is a significant price argument, especially for infrequent builders.

### (c) Chat-driven vs. cards + comments + chat-driven

**How Replit does it:** Pure chat, no cards. The conversation is a linear transcript. There are no structured "cards" representing features or decisions — just a thread of messages and collapsed action blocks. Feature suggestions appear as clickable chips at the bottom of agent responses, but clicking them just pre-fills the chat box, not a structured card workflow. Comments or annotations on specific elements are limited to the tldraw canvas draw mode.

**Helm differentiation:** Helm's cards + comments + chat approach makes the build state inspectable as a structured object (the outcome card, the spec), not just a conversation log. Reviewers can comment on a card without reading the full chat history. This is legible to product people who don't write code — they can understand the "what" without decoding the "how."

### (d) Preview + code vs. preview + "cockpit" (no code, task/feature/outcome-driven)

**How Replit does it:** Preview + code always present. The default workspace has a Preview tab and a File Tree with all source files. Clicking any file opens the code editor. The code is never abstracted away. The nearest thing to a "cockpit" is the Canvas (tldraw) view, but it is underdeveloped — no task tracking, no feature status, no outcome grading. The workspace panel tabs (Database, Auth, Secrets, etc.) do provide a business-legible view of the app's infrastructure, which is partially cockpit-like, but they are tool panels for engineers, not status views for non-devs.

**Helm differentiation:** Helm's "cockpit" replaces the code editor as the default surface for non-developers. Users see features, their completion status, the outcome they're building toward, and a live preview — not files and terminals. This is the fundamental re-frame: Helm users manage features and outcomes, Replit users manage files and conversations.

---

## Appendix: Key UI Strings & Labels Verbatim

- Chat input placeholder: "Make, test, iterate…"
- Economy mode description: "Cost-optimized models for everyday tasks. Delivers a strong balance of speed and quality. Best mode for most builds."
- Economy mode note: "No app testing or code review"
- Lite mode description: "Fast, lightweight models for quick edits and iterations. Best mode for small changes and visual tweaks."
- Power mode note: "Full Agent capabilities"
- Plan Mode description: "Plan mode allows you to brainstorm ideas, plan work before starting a project, and collaborate with Replit Agent without editing your app's code or data."
- New task pitch: "Describe what you want to build and Agent will create a plan for you. Build task plans in the background to get more work done at once."
- Background Tasks pitch: "Build task plans in the background to get more work done at once."
- Connectors pitch: "Connect your app to powerful services like Stripe, Google, Twilio, and more with just a few clicks. No complex setup required."
- Mobile Simulators pitch: "Preview your mobile app on iOS simulators and Android emulators. No downloads or devices required."
- Starter plan description: "For exploring what's possible"
- Core plan description: "For personal projects & simple apps"
- Pro plan description: "For commercial and professional builds"
- replit.md: Auto-maintained by Agent — contains project overview, tech stack, API endpoints, UI conventions, recent changes history
- Checkpoint pattern: Each agent build run → auto-checkpoint → git commit with generated message → "Rollback here" + "Changes" buttons
- Agent footnote in pricing: "Replit Agent is powered by large language models. While it can produce powerful results, its behavior is probabilistic — meaning it may occasionally make mistakes."
