# Bolt.new — Product Research Report

**Researched:** June 9, 2026  
**Project observed:** "AI Study Abroad Agent Landing Page" (`bolt.new/~/sb1-zpou2843`)  
**Account plan:** Free tier (tuananhtrinh919@gmail.com)

---

## 1. Positioning & Framing

**Tagline / headline:** "What will you build today?" — "Create stunning apps & websites by chatting with AI."

**Page title:** "Bolt AI builder: Websites, apps & prototypes"

Bolt positions itself as a prompt-to-app builder for the broadest possible audience: from non-developers who want a quick prototype to developers who want faster scaffolding. The framing is deliberately non-technical: "chatting with AI" not "generating code." However, the actual workspace is deeply code-centric (Monaco editor, terminal, file tree), making the non-dev pitch aspirational rather than structural.

**Owned by:** StackBlitz. The in-browser execution environment (WebContainer) is a StackBlitz technology that runs Node.js directly in the browser without a server.

**Target audience signals:**  
- Homepage hero copy targets anyone with an idea  
- Pricing tiers (Free → Pro → Teams → Enterprise) signal a path from hobbyist to corporate team  
- Design System dropdown includes corporate design systems (Washington Post, AWS Cloudscape, Porsche), indicating enterprise builders as a real segment  
- Integrations (Figma, GitHub, Stripe, Supabase, Expo) strongly imply a developer or technical-product-manager primary user

---

## 2. The Chat / Prompt Interface

### 2.1 Initial prompt → app

On the homepage, the user types a prompt into a single textarea with placeholder "Type your idea and we'll build it together." Buttons below the textarea select the build mode:

- **Standard** (agent selector — default for free, "balanced for everyday building")
- **Plan** (toggle — highlights blue when active; discusses and plans before any code is written)
- **Design System** (dropdown — selects a design system context: Chakra UI, Material UI, Shadcn (open source); Washington Post, AWS Cloudscape, Porsche (corporate); "Import your design system")

Additional starting points (buttons labeled "or start from"):
- **Figma** → "Connect to Figma / Log in to Figma" dialog
- **GitHub** → "Connect to GitHub / Log in to GitHub" dialog
- **Team template** → (requires Teams plan)

Also accepts: file drag-and-drop directly into the chatbox

### 2.2 What the chat shows during generation

On generation, the AI response in the chat shows:
1. **Thoughts** — an expandable/collapsible section ("Thoughts" button) showing the model's internal reasoning chain before code starts. Collapsed by default. The v1 agent exposes a full step-by-step reasoning trace (example: "Let me structure this properly: 1. Main landing page… 2. Comparison screen…").
2. **Summary / plan narrative** — a plain-English explanation of what it's about to build (core features, design elements).
3. **File action list** — each file write is shown as a clickable row: "Create app/(tabs)/_layout.tsx", "Create data/universities.ts", etc. Clicking a row opens the file in the code editor.
4. **Terminal command** — the install/run command shown inline: "Start application / npm run dev"
5. **Post-build summary** — a paragraph describing what was built.
6. **Version label** — "Version 1 at Jun 09 7:19 AM" appears below the response.
7. **Response actions** — "Copy response", "Good response" (thumbs up), "Bad response" (thumbs down), "More actions" (ellipsis).

**What is NOT shown during generation (observed):** no explicit token count per message visible in the chat itself by default. Token usage display is a setting ("Display token usage in chat" — always shows monthly token balance above the chatbox) that must be turned on in settings.

### 2.3 Follow-up edit model

The chat input (inside a project) shows:
- **Placeholder:** "How can Bolt help you today? (or /command)"
- **Mode toggle:** "Discuss" (v1 legacy) or "Plan" (new Bolt Agent) — clicking switches the placeholder to "What do you want to discuss?" / "What do you want to plan?"
- **Select button:** activates element-picker mode (targets specific UI elements in the preview)
- **v1 Agent / Standard label:** clickable agent selector in the bottom-left of chatbox
- **Add context button** (+ icon / "Add context, enhance your prompt, and more"): opens a menu with:
  - **Import Figma frame** — paste a Figma frame URL to use as reference
  - **Attach file** — upload assets (10 MB free / 100 MB paid)
  - **Enhance prompt** — opens dialog asking clarifying questions to improve the prompt
  - **Open Prompt Library** — pre-built prompt templates organized by category
  - **Search Help Center** — searches docs without leaving the project
- **File attachment button** (type="file") — direct file upload shortcut
- **Send message button** — standard submit

### 2.4 Slash commands

Typing `/` in the chatbox opens a command palette (listbox) with groups:

**Commands:**
- Clear context
- Create Prompt

**Accessibility:**
- Keyboard Navigation Audit
- Focus Management for Single Page Applications
- Accessible Data Tables
- Accessible Rich Text Content
- ARIA Landmark Regions

**SEO:**
- Internal Linking Strategy
- Header Hierarchy Optimization
- Local SEO Implementation
- Content Readability Analysis
- Image SEO Enhancement

**Usability:**
- Form Simplification
- Navigation Menu Optimization
- Input Validation UX
- Inclusive Design Patterns
- Microcopy Optimization

**Misc:**
- Dark Mode Implementation
- Internationalization Setup
- Error Handling Strategy
- Web App Manifest Generator

**Workflow:**
- Component Documentation Template
- API Documentation Generator

### 2.5 Prompt enhancer

"Enhance prompt" opens a dialog: "Help us enhance your prompt" — asks clarifying questions to expand a vague prompt into a detailed one. The help center compares outputs: enhanced prompts produce "a more engaging homepage and additional pages" vs simple prompts.

### 2.6 Diff vs rewrite

Not explicitly surfaced in UI as a user-facing control. Bolt applies changes to files automatically. The version history system (see §5) is how you undo an unwanted rewrite.

---

## 3. Workspace Anatomy

The project workspace is a four-pane split-screen layout (left to right):

### 3.1 Chat panel (far left)
- Conversation thread with the AI
- Prompt input at the bottom
- Scrollable history with version markers

### 3.2 File sidebar (left-center)
- **Files** tab — full file tree with folders: `.bolt/`, `app/`, `(tabs)/`, `assets/`, `data/`, `hooks/`, `types/`, plus root files (.gitignore, .npmrc, .prettierrc, app.json, package.json, tsconfig.json, etc.)
- **Search** tab — "Search in files" full-text search across codebase
- Right-click context menu on files: "New file…", "Delete", "Target file" (focus Bolt on this file), "Lock file" / "Lock all" (exclude from AI context)

### 3.3 Code editor (center)
- Monaco-based code editor (same engine as VS Code)
- Shows current open file at top ("app / _layout.tsx")
- Full syntax highlighting, line numbers
- Save with Ctrl+S
- `@` tagging to mention files in prompts from within editor

### 3.4 Preview / right panels (right side)
Toggled by a tab bar:
- **Preview** — shows the live running app in an iframe. The observed project showed "Your preview will appear here" / "Building the mobile application" (it was still booting)
- **Code** — switches the main area to code view (file tree + editor)
- **Database** — shows "Power up your backend with Bolt Database" panel with sections: Tables, Authentication, Server functions, Secrets, User management, File storage. Two CTAs: "Ask Bolt to create a database" and "Connect to Supabase"
- **More Options** (button with aria-label "More Options") — opens Device Preview dialog

### 3.5 Bottom panel (terminal area)
Tab bar with:
- **Bolt** — Bolt log output (AI activity)
- **Publish Output** — deployment log
- **Terminal** — interactive xterm.js terminal (bash), user can run commands directly

### 3.6 Top toolbar
Left to right:
- **Home** (← arrow) — Bolt logo / breadcrumb
- **Project title** ("AI Study Abroad Agent Landing Page") — clickable; opens: Version history, Export/Download, Duplicate, Project settings
- **Share** button → dialog: "Share your project / Copy link / Enter a list of emails / Project access: Anyone with the link / No access"
- **Publish** button → panel: "Publish your project / App is not published yet / Public / Publish on: Web / App Store"
- **Connect project to GitHub** button
- **Files** / **Search** sidebar toggle buttons

---

## 4. Code Visibility & Non-Dev Surface

**Code visibility:** Code is very prominent by default. The code editor is the center pane. The file tree is always visible in the left sidebar. However, a non-dev can:
1. Stay entirely in the chat + preview panes and ignore the code view
2. Use the "Preview" tab to see only the running app
3. Never touch the terminal

**Non-code surface:** The preview panel is the only true non-code view. There is no "no-code" mode — Bolt does not offer a drag-and-drop visual editor or component palette.

**Discuss / Plan mode:** This is Bolt's answer to non-code interaction. Plan mode lets you have a conversation with Bolt about your project (using full codebase context) without triggering any code changes. Quick action buttons at the end of a Plan response offer "Implement this plan" (switches to Build mode automatically).

**Select mode (Inspector):** A "Select" button activates an element picker in the preview. User hovers over elements, clicks one, and Bolt focuses the next prompt on that element. "Inspector options" → "Pick from layers" gives finer control (choose from nested elements at a click point). This is the closest thing to a visual editing surface — but it's still chat-based, not drag-and-drop.

**Bottom line:** A non-developer can use Bolt but will be surrounded by code at all times. The UI does not hide code; it just lets you ignore it.

---

## 5. Iteration Model

### 5.1 Chat-driven iteration
All changes come from chat prompts. Type what you want changed, submit, Bolt modifies files.

### 5.2 Select / element targeting
Click "Select" in the chatbox → pick an element in the preview → the element reference appears above the chatbox → type a prompt about that element. "Pick from layers" gives sub-element precision.

### 5.3 Lock files / Target files
Right-click files in the tree:
- **Target file** — tells Bolt to focus only on this file
- **Lock file / Lock all** — excludes a file or directory from AI context (v1 agent only for "ignore" file; Bolt Agent uses right-click UI)

### 5.4 Version history / Rollback
Multiple restore options:
- **Version history panel** (recommended) — click project title → Version history. Shows a visual timeline of auto-saved versions. Can rename versions (pencil icon), bookmark (bookmark icon), preview before restoring, and restore. Database state is NOT rolled back with a version restore.
- **Chat restore** — scroll up in chat, click eye icon to preview, click return arrow to restore
- **Download / manual backup** — Export → Download → zip file. Restore by drag-dropping into StackBlitz.
- **GitHub integration** — import from repo to create new project from a point-in-time state

### 5.5 Error handling / Auto-fix
When a build error occurs, Bolt shows an "Attempt fix" button in chat. Each attempt consumes tokens. Docs explicitly warn against clicking it repeatedly. Recommended: switch to Discussion/Plan mode, research the error, manually intervene.

---

## 6. Every Menu, Toolbar, Settings — Enumerated

### 6.1 Project title menu (click project name top-left)
- Version history
- Export → Download (zip)
- Duplicate
- Project settings

### 6.2 Chatbox + icon / Add context menu
- Import Figma frame
- Attach file
- Enhance prompt
- Open Prompt Library
- Search Help Center

### 6.3 Slash command palette (type `/` in chatbox)
See §2.4 full list above (23 commands across Commands, Accessibility, SEO, Usability, Misc, Workflow)

### 6.4 Select → Inspector options
- Pick from layers (toggle)

### 6.5 File tree right-click
- New file…
- Delete
- Target file
- Lock file / Lock all

### 6.6 Code editor right-click (selected text)
- Ask Bolt (links highlighted code section into the chat prompt)

### 6.7 Share dialog
- Copy link
- Enter a list of emails (invite collaborators)
- Project access: "Anyone with the link" / "No access"
- Note: "Share sites privately" is a Pro plan feature

### 6.8 Publish panel
- Publish on: **Web** / **App Store**
- Privacy: **Public** (free plan branding); Private publishing requires Pro
- Bolt Cloud hosting provided (no external hosting needed on free)
- Custom domain: Pro plan feature

### 6.9 Database panel
- Ask Bolt to create a database (prompts Bolt to scaffold Bolt Database)
- Connect to Supabase (uses existing Supabase project)
- Sections: Tables, Authentication, Server functions, Secrets, User management, File storage

### 6.10 Terminal tabs
- Bolt (AI activity log)
- Publish Output
- Terminal (interactive bash)

### 6.11 Device Preview (More Options)
- Mobile QR code for Expo Go (React Native / Expo projects)
- Device selector: "iPhone 17 / 402 x 874 / 80%"

### 6.12 Settings pages (bolt.new/settings)

**General:**
- Theme (Light / Dark / System)
- Display token usage in chat (toggle — shows monthly balance above chatbox)
- Sound notification (chime when Bolt finishes responding)
- Default model (Standard / Max — for new projects)
- Editor line wrapping
- Show open source Design Systems after creating your own

**Knowledge (Account-level):**
- Global instructions — system prompt that applies to every conversation. "Browse examples of instructions" link.

**Connectors (MCP):**
- Custom MCP server (remote URL)
- Pre-configured: Notion, Linear, Miro, Context7, GitHub, Sentry, Granola, Shaders, Jira

**Add-on features (paid only):**
- Dynamic Reasoning (deeper reasoning, higher token cost, slower)
- Image Generation (text-to-image inside chat, uses tokens)

**Subscription & Tokens:**
- Shows current token balance, next refill date, daily limit, monthly limit
- Upgrade path to Pro / Teams

**Cloud:**
- Domains (custom domain management)
- Database management
- Analytics (visits, views, sources, locations — Pro feature)

---

## 7. Integrations

| Integration | Entry point | Notes |
|---|---|---|
| **Figma** | Homepage "Figma" button or chatbox + → Import Figma frame | Requires Figma login; imports frames for design reference |
| **GitHub** | Homepage "GitHub" button or toolbar "Connect project to GitHub" | Two-way: push Bolt project to GitHub, or import from repo |
| **Supabase** | Database panel "Connect to Supabase" | Connects to existing Supabase project for auth, storage, DB |
| **Bolt Database** | Database panel "Ask Bolt to create a database" | Built-in Supabase-backed database, managed in-app |
| **Expo / Mobile** | Scaffold is Expo-based for mobile; Device Preview tab | QR code for testing on real device via Expo Go |
| **Netlify** | Listed in docs integrations | Deploy to Netlify (alongside native Bolt hosting) |
| **Stripe** | Listed in docs | Payment integration |
| **Google SSO** | Listed in docs | Authentication integration |
| **Google Stitch** | Listed in docs | Design import (similar to Figma path) |
| **Lovable import** | Listed in docs | "Import from Lovable" — Bolt explicitly names Lovable as a migration source |
| **MCP servers** | Settings → Connectors | Notion, Linear, Miro, Context7, GitHub, Sentry, Granola, Shaders, Jira + custom |

---

## 8. Error / Debug UX

- When a build fails, Bolt shows an **"Attempt fix"** button inline in chat. Each click uses tokens.
- Docs explicitly warn: "Avoid clicking Attempt fix over and over." If it doesn't work after 2 attempts, research manually.
- Switch to Plan/Discussion mode to discuss the error without consuming build tokens.
- Strategy: prompt Bolt to "enhance error handling and implement detailed logging" to get better diagnostic info before the next fix attempt.
- Terminal is always accessible for manual debugging.
- Context window errors: when project exceeds context window, chat shows "Project size exceeded" + "Remove unused files" button (runs `npx knip` to prune dead code).

---

## 9. Deploy / Publish / Share Flow

### Publishing (read-only investigation — not executed)

The Publish panel shows:
- "App is not published yet"
- **Publish on: Web** — deploys to Bolt's hosted infrastructure (bolt.new subdomain, free plan)
- **Publish on: App Store** — (button present; implies native mobile app publishing path via Expo)
- **Privacy:** "Public" is the only free option; private publishing requires Pro
- **Custom domain:** Pro plan feature

### Hosting model
- Bolt Cloud provides built-in hosting. No external host needed.
- Free plan: bolt.new subdomain, Bolt branding on published sites, up to 333k web requests/month
- Pro: no branding, custom domain, up to 1M web requests/month
- Analytics (visits, views, sources, locations) available on Pro

### Sharing (project — not deployed site)
- "Share your project" dialog: copy link, email invite, access control (anyone / no access)
- Private sharing = Pro feature

---

## 10. Pricing / Token Model

### Plans (as of June 2026)

| Tier | Price | Tokens | Key limits |
|---|---|---|---|
| **Free** | $0 | 1M/month, 300k daily cap | Bolt branding on sites, 10MB uploads, 333k web req/month |
| **Pro** | $25/month (monthly) | 10M/month, no daily cap | No branding, private sites, custom domains, 100MB uploads, 1M web req, rollover, AI image editing, image generation |
| **Teams** | $30/member/month | 10M/member, no sharing of tokens | Everything Pro + centralized billing, admin controls, private NPM, Design System knowledge |
| **Enterprise** | Custom | Custom | SSO, audit logs, compliance, SLAs, dedicated support |

### Token economy — how it actually works

**Key insight from docs:** "Most token usage is related to syncing your project's file system to the AI: the larger the project, the more tokens used per message." This is the fundamental pain point. Every message to Bolt costs tokens proportional to project size — not just the prompt itself, but re-syncing the entire codebase context.

**Token consumption triggers:**
- Every chat message in Build mode (processes full project context)
- Image generation (more tokens + slower than stock images)
- Connectors active (each connector adds context = more tokens)
- Repeated "Attempt fix" clicks

**Token-free operations (explicitly called out in docs):**
- Clicking Publish button
- Using Version History (restoring a version costs 0 tokens)
- Clicking any built-in action/button

**Token display:** Off by default. Can be turned on in Settings → General → "Display token usage in chat." Shows monthly balance above chatbox.

**Rollover:** Paid plans only, since July 1, 2025. Unused tokens valid for 2 months total (one rollover period).

**Free plan caps:** 1M monthly tokens, 300k daily. At the observed project complexity (6 files for an Expo app), a single initial generation likely used 50k–200k tokens (estimated; not directly observable since token display was off).

**Add-ons (paid only):**
- Dynamic Reasoning: deeper thinking, higher token cost
- AI image generation: text-to-image, token-consuming

### Upsell touchpoints observed
1. "Try Bolt Agent / You're currently using v1 Agent / Advanced agent ideal for working with larger codebases" banner (2 separate banners in the chat panel)
2. "v1 Agent Retirement Notice — New projects now use Bolt Agent. The V1 agent won't be accessible after August 3, 2026" (with "Learn more →" and "Switch to Bolt Agent" CTA)
3. Database panel: "Power up your backend with Bolt Database" (always visible even on free)
4. Settings → Subscription & Tokens: upgrade to Pro/Teams cards
5. Settings → Add-on features: "Add-on features are only available on paid plans. Upgrade to a paid account to get access."
6. Settings → Cloud: "Unlock Bolt Cloud with Pro" overlay
7. "Free domain name for eligible users until June 10th" banner (promotional)

---

## 11. Preview Experience

- **Preview panel** (right side) shows the running app in an iframe
- **Device frame:** "iPhone 17 / 402 x 874" — mobile device emulation with visible phone chrome
- **Zoom:** "80%" — zoom control (observed: zoom out/in buttons)
- **Help Center** and **Join our Community** links visible in the preview panel footer
- **Responsive/device toggles:** The device combobox (showing "iPhone 17") is clickable, but the DOM only showed one device option in the observed state — it may be that device selection is limited in v1 agent context or the project was still loading
- **Open in new tab:** Not directly observed as a button, but standard browser behavior applies since it's an iframe
- **Live preview:** WebContainer-powered — the app runs in-browser without a remote server. Changes from Bolt agent are applied and the preview reloads.
- **Mobile QR code:** "More Options" button opens "Device Preview" dialog — shows QR code to test on real device via Expo Go app

---

## 12. Onboarding, Empty States, Tooltips, Help

- **Homepage hero:** Clean single-textarea with placeholder text and mode buttons — minimal friction to start
- **Empty preview:** "Your preview will appear here" while building; "Building the mobile application" message
- **Agent upsell banners:** Two dismissible banners encouraging v1 → Bolt Agent upgrade (each has "Switch to Bolt Agent" + "Dismiss")
- **Database empty state:** Full panel explaining Tables / Auth / Server functions / Secrets / User management / File storage with "Learn more" links per feature
- **Help links:** "Help Center" and "Join our Community" (Discord) links visible in the preview panel footer area
- **Prompt enhancer:** Built-in (see §2.5) — lowers barrier for non-technical users to write good prompts
- **Prompt library:** Pre-organized by category (SEO, Usability, Accessibility, Misc, Workflow) — reduces blank-page problem
- **Docs search in chatbox:** "Search Help Center" from the + menu — help is accessible without leaving the workspace
- **Knowledge/system prompt:** Settings → Knowledge — global instructions that apply to every project ("Browse examples of instructions" link for inspiration)
- **agents.md support:** Upload an agents.md file to set per-project instructions for the agent (alternative to UI-based project knowledge)

---

## Standout Strengths

1. **WebContainer is technically remarkable.** Node.js running in the browser means zero server-side infrastructure cost and near-instant boot times. No waiting for a cloud VM to spin up.

2. **Prompt Library + slash commands.** 23 built-in slash commands cover real developer workflows (SEO audits, accessibility checks, dark mode, i18n). This makes the chat useful for experienced developers who want structured actions, not just vague prompts.

3. **Version history is genuinely token-free.** Restoring a version costs zero tokens — this is explicitly documented and a genuine differentiator from re-prompting. The visual timeline with rename/bookmark features is more complete than competitors.

4. **Element selector (Select mode).** Clicking an element in the preview and chatting about it is a meaningful bridge between visual editing and chat-based editing. "Pick from layers" adds real precision.

5. **Design System context.** Pre-loading Chakra / Material UI / Shadcn / corporate design systems as AI context means consistent component usage across the project — a real developer productivity feature.

6. **MCP connectors (Notion, Linear, Jira, etc.).** External tool context injection is meaningfully differentiated. Connecting to a Linear board means Bolt can reference actual issues when making changes.

7. **Plan mode + quick action buttons.** "Implement this plan" button at the end of a Plan response is smooth — it switches to Build mode automatically. This is a better UX than re-prompting.

---

## Weaknesses / Friction for a Non-Developer

1. **The workspace is a developer IDE.** File tree, Monaco editor, xterm terminal — a non-developer is overwhelmed before they see the preview. There is no "simple mode" or "hide code" button.

2. **Token anxiety is real and unavoidable.** Free plan's 300k daily / 1M monthly limit is consumed fast. On a medium-complexity project, a single refactor pass can eat 100k+ tokens. Bolt's own docs spend significant space on "how to not waste tokens" — which signals the problem is severe enough to require a documentation section.

3. **"Context window exceeded" is a user-visible error.** When the project gets too large, users see a failure message and have to run cleanup commands. Non-devs have no idea what a context window is.

4. **Errors require manual intervention.** The "Attempt fix" loop doesn't always work. Docs recommend researching errors yourself and switching to discussion mode. Non-devs will be stuck.

5. **No visual editor / drag-and-drop.** The Select mode is the closest thing — but it's still text-prompt based. Non-devs who want to move a button 10px left must describe it in words.

6. **v1 Agent deprecation creates confusion.** The existing project uses v1 (legacy) and is being retired August 3, 2026. Two prominent banners in the workspace push the upgrade — creating anxiety rather than confidence.

7. **Figma import requires Figma account + login.** Adds friction for users who just want to upload an image.

8. **Preview doesn't auto-open.** In the observed session, the preview showed "Your preview will appear here" during the entire observation window — WebContainer boot is not instant for Expo projects.

---

## Relevance to Helm

### (a) One-shotting & iteration vs structured build-stack journey

**How Bolt does it:** Pure chat-driven. Every iteration is a new chat message → Bolt rewrites/patches files → preview updates. There is no explicit "phase" concept, no spec documents, no task tracking, no outcome cards. The user's mental model is conversational: "tell Bolt what to change." Bolt's "Plan mode" adds a planning step, but it's a mode toggle on the same chat interface — not a structured workflow. A user can go from no-plan to one-shot generation in one message.

**Helm's differentiator:** Helm's structured build-stack (BA → Spec → Frontend → Backend → Review) forces the user through phases that produce artifacts (outcome cards, requirements, plan). A Bolt project after 20 messages is a pile of chat — the user has no structured record of what was decided, what was built, or why. Helm produces a living document layer on top of the code. For non-technical users who need to hand off to a developer or revisit a project after 3 months, the Helm artifact layer is an actual differentiator.

### (b) Requiring another subscription vs riding the user's existing Claude Max

**How Bolt does it:** Bolt is a separate subscription on top of whatever AI subscriptions you already have. Free plan: $0 but 1M tokens/month, 300k daily, branding, no custom domain. Pro: $25/month for 10M tokens. This is additive cost on top of any Claude subscription you already pay for.

**Bolt's model-agnosticism:** Bolt's docs explicitly state "You choose the agent that matches your work, and Bolt handles model selection behind the scenes. As new models become available, Bolt can update how agents perform without changing your workflow." This means Bolt is opaque about which underlying model runs — it's branded as "Standard" and "Max" (no model names disclosed). Users can't choose Claude vs GPT vs Gemini. (The v1 legacy agent used Google Gemini for Discussion mode per the docs.)

**Helm's differentiator:** Helm rides the user's existing Claude Max subscription. If a user already pays $100/month for Claude Max, Helm adds zero marginal cost. Bolt asks them to pay $25/month on top of any existing AI spend. This is a concrete, hard-number cost comparison Helm can use in positioning. For a user who pays Claude Max + Bolt Pro, they're spending ~$125+/month. Helm collapses that to $100/month (just Claude Max).

### (c) Chat-driven vs cards+comments+chat-driven

**How Bolt does it:** Pure chat. One long scrolling thread per project. No cards, no structured task representation, no comment threads on specific outputs. Version labels ("Version 1 at Jun 09 7:19 AM") are the only structured artifacts in the chat. Bolt's Plan mode produces a plan text in chat, not a board or card. The "quick action buttons" (Implement this plan / Show an example / Refine this idea) are the closest thing to structured interaction — they're contextual buttons at the end of a response.

**Helm's differentiator:** Cards + comments on specific outputs create a different mental model of building: you're moving features through stages, not having a conversation. For a product owner or non-developer, "this feature card moved from 'planned' to 'shipped'" is more legible than "message 47 in the chat changed the footer color." Bolt's chat thread becomes semantically opaque after ~20 messages; there's no way to look at the current state of a feature without scrolling through all chat history.

### (d) Preview+code vs preview+"cockpit" (no code, task/feature/outcome-driven)

**How Bolt does it:** Preview + code are the two primary surfaces. The code editor is always present (center pane). Even when you switch to "Preview" mode in the right panel, the file tree, search bar, and code editor remain on the left. There is no way to view the app without also seeing the project files. The "cockpit" concept — a task/feature/outcome dashboard with no code — does not exist in Bolt.

**Helm's differentiator:** A cockpit interface that shows "features built," "features in progress," "features planned" with zero code visible would feel fundamentally different from Bolt. Bolt's user always feels like they're in an IDE with a chat assistant. Helm's target user (non-developer product owner) should feel like they're in a product command center. The code is an implementation detail they never see.

**Token metering as a specific Helm pain point exploit:**

Bolt's token economy is the sharpest pain point to exploit:
- Free tier: 300k tokens/day, 1M/month. At typical Expo project complexity, this is perhaps 3–5 substantial interactions per day before you hit the daily wall.
- Pro tier: $25/month just for more tokens on top of the same opaque model.
- Every chat message costs tokens proportional to project size — not just prompt size. As projects grow, the cost-per-message grows too.
- Bolt's own docs spend a major section on "how to not waste tokens" — listing 10+ strategies to avoid consuming your allocation.
- Users are trained to fear prompting — they second-guess asking Bolt questions because every question costs tokens.

Helm's pitch: "Your Claude Max subscription already includes the AI capacity. Helm uses it. You never hit a token wall because your cap is already what you paid for."

---

*Report prepared by research agent. All findings based on direct browser observation of the authenticated Bolt.new workspace and official Bolt help documentation.*
