# Lovable Research Report
**Project researched:** abroad-spark (study abroad app prototype)
**Research date:** 2026-06-09
**Source:** Live authenticated session at lovable.dev

---

## 1. Positioning & Framing

Lovable markets itself as a full-stack app builder, not just a front-end prototyper. The dashboard greeting is "What should we build, Tuan?" — casual, personal, co-creator framing. The product positions itself against traditional development, not against Figma or no-code tools.

Key positioning signals observed:
- **"Go from idea to app"** is the implicit frame (new project starts directly from a chat bar on the homepage dashboard).
- The top-nav persistent label is "Previewing last saved version" — subtly signals the product always has a working live version, not just a wireframe.
- Marketing language like "Your last employee" was **not** observed in the in-app UI; the in-app copy is much more neutral and functional.
- The company's own brand identity ("Lovable-style gradients") is mentioned in AI responses, suggesting Lovable actively cultivates an aesthetic identity.
- Supabase is name-dropped in every first-generation response as a soft upsell: "Need to save information, add user accounts, or connect with other services? Supabase is a simple way to add these features without complex technical setup." This is a deliberate onboarding funnel into their "Lovable Cloud" offering.

---

## 2. The Chat Interface

### Input area
The primary chat input reads "Ask Lovable..." with placeholder text. The send button is labeled "Send message." There is a persistent **Build / Plan toggle** (keyboard shortcut ⌥P):

- **Build mode** ("Make changes directly") — default; every message generates code immediately
- **Plan mode** ("Discuss before building") — chat without generating code; used for thinking through requirements before committing credits

Additional chat input controls:
- **"@" reference system** — triggers a listbox showing three reference types: Code, Files, Projects. This lets the user mention specific files or other Lovable projects inline in their prompt.
- **Voice recording button** — voice-to-prompt input.
- **Attach files** — drag-and-drop or click to attach files to the message.

### Chat actions menu (accessed via a button to the left of Build toggle)
Opens a dropdown with:
1. Settings (keyboard shortcut ⌘.)
2. History
3. Knowledge
4. GitHub
5. GitLab
6. Connectors
7. Take a screenshot
8. Add reference
9. Add skill
10. Attach

### AI response anatomy
Each AI response contains:
- **"Finished thinking"** toggle button — expands/collapses the model's internal reasoning trace before it generated code
- **A title** summarizing the task (e.g., "Add study abroad app prototype", "Fix: Resolve missing CSS class")
- **"No tasks tracked yet."** label (placeholder, presumably for task-tracking integrations)
- A **Details / Preview toggle** — "Details" shows the full Timeline + Changes view (file diffs); "Preview" shows the rendered app preview at that version
- Helpful / Not helpful thumbs buttons
- "Copy message" button
- "More options" → reveals: "Copy message link", "Preview", "Credits used: [N]" (per-response credit tracking)
- **"Revert to this version"** button — one-click rollback per message

For error-fix responses specifically, there is also:
- **"Undo latest edit"** button — appears on the most recent AI response only
- Link to "Troubleshooting docs" (docs.lovable.dev/tips-tricks/troubleshooting)

### Details view (per-message)
Clicking "Details" opens a two-tab panel:
- **Timeline tab**: shows each build step in sequence — "Thought" (collapsible thinking), "Edited [filename]", "Generated image"
- **Changes tab**: full git-style diff of every file modified, with line-level additions/deletions, color-coded. Each changed file has "View file" and "Mention in chat" actions.

### Error / debug UX
When a runtime error is pasted into the chat, Lovable:
1. Reads the error step-by-step (the "Finished thinking" trace is visible)
2. Narrates the problem and solution in structured markdown (Problem / Solution / Fix)
3. Auto-generates a fix
4. On the last AI response, shows an "Undo latest edit" button specifically
5. Provides a "Troubleshooting docs" link as a fallback

**There is no "Try to fix" button** surfaced from the preview iframe itself. Error recovery is purely chat-driven: paste the error message, Lovable diagnoses and applies the fix.

---

## 3. Workspace Anatomy

The workspace is a three-column layout (when sidebar is open):
- **Left column**: Chat panel (conversation + input form)
- **Center/right**: Preview iframe OR code/files panel (depending on active tab)
- **Top navigation bar**: project name + status, tab switcher, preview controls, user actions

### Top navigation bar (left to right)
1. **Switch project** (Lovable logo button) — goes to dashboard
2. **Project name + status** ("abroad-spark / Previewing last saved version")
3. **View history** button — opens history drawer in the chat panel
4. **Close sidebar** button — collapses the chat panel
5. **Tab switcher**: Preview | Files | Code | More

### Preview tab controls (right side of nav bar)
- Device toggle: **Show tablet preview** / **Show mobile preview** (toggles between desktop and tablet, then tablet and mobile — cycles through responsive views)
- **Preview URL** textbox (navigate to a specific route, e.g., `/onboarding/1`)
- **Open preview in new tab** button
- **Refresh page** button
- **Show preview toolbar** / **Show toolbar** button (toggles the floating visual-edit toolbar)
- **Comments** button (0 unread comments badge)
- **User avatar** ("View Tuan Anh Trinh (You)")
- **Share** button
- **Upgrade** link (to billing settings)
- **Publish** button

### Default view for a non-developer
By default, Lovable opens on the **Preview tab** with the chat sidebar open. Code is completely hidden unless the user clicks the "Code" tab. The Preview tab shows only the rendered app iframe. A non-dev can build and iterate entirely in the Preview tab + chat — they never need to see a file or a line of code.

The "Code" tab is labeled **"Read only / Upgrade"** — code editing in the browser is gated behind a paid plan. Even if a user opens the Code tab, it defaults to showing a single file (`src/pages/Index.tsx`), not the full file tree. The file tree is present (a "Search code" input box appears in the Code tab's left sidebar) but collapsed by default.

---

## 4. Code Visibility

### For non-developers (default experience)
- Code tab exists but is one extra click away
- Code tab defaults to a single file view, not a full tree
- Code editing is **locked to paid plans** ("Read only / Upgrade")
- On free plan, code can be: viewed, copied to clipboard, downloaded as a file, or "Referenced in chat" (mentioned in a message)
- No syntax highlighting issues are observable from the accessibility tree, but the code is displayed using a tab-based editor interface

### For developers who want code access
- Code tab has a **Search code** input for file search
- Each open file tab has: "Reference file in chat", "Copy file content", "Download file"
- GitHub and GitLab sync is available via Settings > Git (bidirectional repo sync)
- No in-browser editing without upgrade

### Verdict
Lovable's code hiding is **thorough for non-devs**: Preview is default, Code tab requires intent, Code editing requires payment. The framing is "the AI edits code, not you." A non-dev can genuinely operate entirely in Preview + chat.

---

## 5. Visual Edit / Point-and-Click Editing

This is Lovable's most differentiated feature for non-devs. The visual toolbar floats over the preview iframe and contains 4 tools:

### Tool 1: Select elements
Clicking "Select elements" activates an element-picker mode over the preview iframe. The user can presumably click any visible UI element and Lovable opens an editing UI (since the iframe is sandboxed, the interaction occurs via postMessage). Based on the accessibility tree, after selecting an element, the chat sidebar shows controls for "Pending changes" with "Clear" and "Send" buttons — meaning: selected-element changes are staged and sent as a chat message, not applied immediately.

### Tool 2: Edit text inline
Clicking "Edit text inline" lets the user directly click and edit text content in the preview iframe. This is the most non-dev-friendly mode — editing text feels like editing a Google Doc.

### Tool 3: Draw annotation
Lets the user draw/sketch on the preview as a way to communicate visual intent — presumably converts annotations to chat instructions.

### Tool 4: Add a comment
Adds a sticky comment to the preview, similar to Figma comments. The "You have 0 unread comments" badge in the nav confirms this is a collaboration feature.

### Toolbar options
The floating toolbar has a "Toolbar options" button that opens: Dock / Minimize / Hide + THEME (Auto / Light / Dark). This lets the toolbar be repositioned or collapsed while editing.

### What happens when you select an element
Based on the accessibility tree, after selecting elements, a "Pending changes" panel appears with "Clear" (discard) and "Send" (commit to chat) buttons. This confirms the visual select → chat message flow: select an element → make changes → "Send" fires a pre-filled chat prompt with the element context attached.

### Verdict
Lovable's visual editing is **real but chat-bridged** — it's not a true direct-manipulation interface. You select elements, but changes are queued and sent as AI prompts. The result is still AI-generated code, not a property panel or WYSIWYG editor. This is significantly more constrained than Webflow or Figma's properties panel approach, but more powerful than chat-only because it gives element-level context automatically.

---

## 6. Iteration Model

### Chat edits
Standard back-and-forth: type a request, Lovable generates. Every message costs 1 credit. Credits are counted per-message (visible in "More options" → "Credits used").

### Plan mode
Toggle from Build → Plan to discuss without consuming build credits. The user can iterate on ideas verbally, then switch back to Build mode.

### Version history
- History drawer (opened via "View history" button) shows 3 versions for this project, each labeled by timestamp and a title
- Each history entry has: timestamp, auto-generated title (matches the task name in the chat), "More actions" menu (Open preview in new tab, View code changes, Go to message in chat), "Revert" button, "Bookmark in history" button
- Bookmarks tab exists for pinned versions
- **"Revert to this version"** button appears on every AI response in the chat — one-click rollback without needing to open the history drawer

### Undo
- "Undo latest edit" button appears on the most recent AI response — instant one-step undo
- Not a general multi-step undo; only the latest edit is undoable via this affordance

### Branching
No explicit branching UI was observed. The history is linear. There is no "fork from this point" feature visible in the current UI.

---

## 7. Every Menu, Setting, and Panel

### Settings navigation (accessed via ⌘. or Chat actions → Settings)
Groups and links:
- **Account**: Profile, username, email, visibility, chat suggestions, sound notifications, linked accounts, 2FA
- **Project**: project name, URL subdomain, owner, access controls, public remixing, category, hide Lovable badge (Pro), rename, remix, transfer, delete, disable analytics, cross-project sharing, auto-fix security issues, unpublish
- **Git**: Connect GitHub or GitLab (bidirectional sync)
- **Domains**: Custom domain (Pro plan)
- **Workspace**: Workspace name, settings
- **Billing**: Plans, credits, usage history
- **Usage**: Cloud & AI balance (Cloud: $0/$25 free, AI: $0/$1 free per month)
- **Members & access**: People, Groups, Identity (SSO)
- **Customization**:
  - Knowledge (project-level instructions + workspace-level instructions)
  - Skills (reusable prompt templates, triggerable via `/` slash commands)
  - Templates (Business plan: promote projects as workspace templates)
  - Design systems (Enterprise plan: workspace design system)
- **Build & deploy**: Workspace domains
- **Security & compliance**: Privacy/security settings, Security center (with deep/basic scan, dependency audit)

### Account settings notable fields
- **Vibe coding level: L1 Bronze** — gamification/progression system, "Add to LinkedIn" CTA
- Chat suggestions toggle, generation complete sound toggle
- Auto-accept invitations toggle

### "More" tab (inside project workspace)
Sub-tabs:
- **Analytics**: requires publishing first; links to RudderStack/GA4 data
- **Cloud**: "Lovable Cloud" — integrated backend (database, storage, auth, LLM models). Button: "Enable Cloud" or "Connect Supabase project"
- **Payments**: "Accept payments" — two paths: Built-in payments (optimal payment gateway) or Shopify connector (e-commerce)
- **Security**: Deep/basic security scan, detected issues panel, project dependencies + vulnerability count, "Edit security memory"
- **SEO & AI search**: SEO research powered by Semrush, custom domain (Pro), scanning in progress

### Dashboard sidebar
- Home, Search, Resources, Connectors (74 integrations)
- Projects: All projects, Starred, Created by me, Shared with me
- Recents
- Referral: "Share Lovable — 100 credits per paid referral"
- "Upgrade to Pro" CTA

### Connectors (74 total, 5 enabled by default)
Categories: Marketing (8), Messaging (7), Productivity (37), Sales (5), Google (10), Microsoft (8)
Notable connectors: Stripe, Slack, Gmail, Supabase, HubSpot, Shopify, Telegram, Discord, Sentry, PostHog, Resend, Linear, Google Calendar, Firecrawl, Airtable, ElevenLabs, BigQuery, OpenAI, Figma, GitHub, Perplexity, Notion, Snowflake, Salesforce, Twilio, Google Drive, Google Sheets, Gemini, Teams, GitLab, n8n

### Apps settings
- **Telegram integration**: chat with Lovable about projects via DMs
- **Desktop app**: Lovable for macOS (Apple Silicon, Intel), Windows "coming soon" — described as "tabs + local MCPs"

---

## 8. Integrations

### Supabase / Backend
- "Enable Cloud" button in the More > Cloud tab — provisions Lovable's own hosted Supabase instance
- Alternatively, "Already have a Supabase project? Connect it here"
- Cloud features: Database, storage, authentication, backend logic, LLM model access (chat, image generation, text analysis)
- Pricing: Free usage included ($25 Cloud + $1 AI per month), pay as you scale

### GitHub / GitLab
- Two-way sync: Settings > Git provides GitHub and GitLab connection
- Also available from Chat actions menu
- Code tab allows "Reference file in chat" and "Download file"

### Custom domains
- Pro plan feature
- Accessible from Settings > Domains and from Publish dialog > "Add custom domain"
- Publish dialog shows free `.lovable.app` subdomain for free users

### Payments
- Built-in payment gateway (details not visible without enabling)
- Shopify connector for physical goods

### Knowledge / Instructions
- **Project knowledge**: describe the project's purpose, tech stack, architecture — fed to the AI on every generation
- **Workspace knowledge**: shared coding style, naming conventions, preferences — applies across all projects
- Both are free-text fields

### Skills
Built-in skills (maintained by Lovable):
1. `accessibility` — a11y audit and fixes
2. `redesign` — visual redesign of existing UI
3. `seo-review` — SEO audit, links to results panel
4. `skill-creator` — creates new SKILL.md files for workspace
5. `video-creator` — creates animated videos programmatically

User-created skills can be added via chat description, GitHub import, or URL import. Skills are triggered with `/skillname` or auto-triggered by keyword match.

---

## 9. Error/Debug UX

Lovable's error recovery flow is **chat-paste driven**:
1. User pastes an error message (stack trace, console error, build error) into the chat
2. Lovable auto-detects the error type from the text
3. Response shows: "Finished thinking" (expandable reasoning), structured Problem/Solution breakdown, then applies a fix
4. "Undo latest edit" button appears on the response for one-step rollback
5. "Troubleshooting docs" link appears in the error-fix response

**What's missing for non-devs**: The app does **not** surface "Try to fix" from within the preview iframe. Errors visible in the preview (blank screen, broken layout) require the user to know to paste the error from the browser console into chat. This is a significant friction point for users without developer instincts.

Auto-fix is available in settings: "Auto-fix security issues" (for security scan findings). No general runtime auto-fix.

---

## 10. Deploy/Publish/Share Flow

### Publish button
Opens a dialog with:
- "Your website URL": `abroad-spark.lovable.app` (editable subdomain)
- "Add custom domain" — Pro badge, gated
- Back / Continue buttons
- Link to publish docs

**Not triggered** (read only): Continue presumably triggers the actual deployment. The subdomain URL format is `[project-name].lovable.app`.

### Share button
Opens a dialog with:
- "Copy invite link" (currently "Invite link disabled")
- "Invite by email" input + Invite button
- "Who has project access" section — shows current members and roles
- "General project access" — workspace members can edit
- **"Share preview"** button → opens a separate panel: "Create a public link to allow anyone to access a view only version of your project. The link is valid for 7 days." — generates a time-limited public preview URL

### Public visibility
Project settings note: "Public project visibility has been removed. Only workspace members can now view and edit this project." Public remixing can be enabled separately.

---

## 11. Pricing / Credits / Subscription

### Plans (as observed)
| Plan | Price | Credits | Notes |
|------|-------|---------|-------|
| Free | $0 | 5 daily credits, resets each day | Up to ~150/month with daily reset |
| Pro | $25/month | 100 credits/month + 5 daily + rollovers | Custom domains, badge removal, roles |
| Business | $50/month | 100 credits/month | Internal publish, SSO, team workspace, templates, design templates |
| Enterprise | Custom | Volume-based | Design systems, SCIM, audit logs, dedicated support |

### Credit model
- 1 credit = 1 AI generation (1 Build-mode message)
- Plan-mode messages do NOT consume credits
- Credits are counted per message ("Credits used: 0" shown in More options on a message — this project's messages all show 0, possibly because they pre-date the credit tracking or the account has a rollover)
- Free plan: 5 credits/day (hard daily limit), resets to 5 in 23 hours
- Cloud & AI balance separate from build credits: Free users get $25 Cloud + $1 AI per month
- Additional credits purchasable as "on-demand credit top-ups" on Pro+

### Upsell touchpoints observed
1. **"Upgrade" link** persistently in the top navigation bar
2. **Code tab**: "Read only / Upgrade" label — code editing gated
3. **Custom domain**: "Pro" badge in Publish dialog
4. **"Hide Lovable badge"**: "Pro" badge in Project settings
5. **Design systems**: "Enterprise" badge in Settings > Design systems
6. **Templates**: "Business" badge in Settings > Templates
7. **SEO tab**: "Pro" badge on custom domain within More > SEO
8. **Sidebar**: "Upgrade to Pro — Unlock more features" CTA in left navigation
9. **Referral program**: "Share Lovable — 100 credits per paid referral"
10. **Student discount**: "Lovable for students — up to 50% off Lovable Pro"
11. **Enterprise demos**: "Book a demo" CTA
12. **Gamification**: "Vibe coding level" + "Add to LinkedIn" — social pressure to upgrade

---

## 12. Preview Experience

### Preview iframe
- The preview is live — it renders the actual built React/Vite app in a sandboxed iframe
- Label "Previewing last saved version" persists — clarifies that preview reflects the last successful build, not a real-time edit
- Preview URL bar lets users navigate to specific routes (e.g., `/onboarding/1`)
- Responsive previews: cycles through Desktop → Tablet → Mobile with a single toggle button

### Visual edit overlay
Floating toolbar docks over the iframe with: Select elements, Edit text inline, Draw annotation, Add a comment, Toolbar options (Dock/Minimize/Hide, Theme: Auto/Light/Dark)

### Preview in history
Each history entry has "Open preview in new tab" — opens a sandboxed preview at that specific version's state.

---

## 13. Onboarding Cues, Empty States, and Attachment

### Empty states observed
- **Files tab**: "You haven't generated any files yet. Once you create one, it will appear here." (shown for this project even though code was generated — this may be the "generated files" separate from code files)
- **History Bookmarks tab**: "No bookmarks yet."
- **Workspace skills**: "No skills found."
- **Security**: "No scan has run yet. Run a security scan to surface issues."

### Inline onboarding notices in chat
Two persistent banners were visible at the bottom of the chat:
1. **"Reuse work from other projects"** info banner with "Add reference" button and "Dismiss" — prompts cross-project reuse
2. **"Enable notifications"** info banner with "Enable" and "Dismiss" — browser push notifications

### Add reference feature
The "@" system in chat lets users reference:
- **Code**: specific files from the current project
- **Files**: uploaded or generated files
- **Projects**: other Lovable projects in the workspace (enabling cross-project knowledge/component reuse)

### Attachment
- File drag-and-drop: "Drop any files here to add them to your message" drop zone
- "Attach files" file input button in chat form
- "Take a screenshot" in chat actions — presumably captures the current preview and attaches it to the next message (in-app screenshot → context for prompts)

### First generation "What's next?" guidance
After the first successful build, Lovable's AI response includes a "What's next?" section with:
- "Refine & Customize: Tweak the design, animations, and layouts via prompts or visual edits."
- "Master Prompting: Use 'chat mode' to plan out your project without making edits."
- Supabase upsell

---

## Standout Strengths

1. **The visual edit toolbar is genuinely differentiated.** Select elements + Edit text inline creates a WYSIWYG-feeling iteration loop. No competitor (Bolt, Replit) has an equivalent in-preview element picker that feeds back into AI chat.

2. **Rich version history with per-message rollback.** "Revert to this version" on every message + full git-style diff in the "Changes" tab is unusually powerful. Users can see exactly what changed, revert any step, or jump to any past state.

3. **Deep Details view (Timeline + Changes).** The per-message file diff view is more detailed than Bolt or Replit equivalents. Builders who want transparency get it without seeing raw code.

4. **Plan mode is well-executed.** The Build/Plan toggle (⌥P) cleanly separates "thinking" from "generating," which helps non-devs who want to plan before spending credits. The label "Discuss before building" is the clearest framing of this concept of any AI builder.

5. **74 pre-built connectors.** No setup code required — Stripe, Supabase, Shopify, Figma, OpenAI, Notion, etc. are all one-click. For an indie builder wanting a real app with real integrations, this is a significant advantage over Bolt.

6. **Integrated backend ("Lovable Cloud").** A complete Supabase-backed backend with auth, database, storage, and LLM access, provision-able in one click. Removes the #1 reason non-devs get stuck (no backend).

7. **Skills system.** Reusable slash-command instructions that persist across sessions. Built-in skills for accessibility, redesign, SEO, and video creation. Non-devs can save and reuse their best prompts as workflow templates.

8. **Security scanning built in.** Deep/basic security scans, dependency auditing, auto-fix toggle for low-risk issues — this is enterprise-grade tooling bundled into the product.

9. **Desktop app + Telegram integration.** Multiple surfaces for working with Lovable — browser, native desktop (with local MCP support), and Telegram chat.

---

## Weaknesses / Friction for a Non-Developer

1. **Error recovery requires knowing what an error looks like.** Lovable can fix errors when told about them, but it doesn't surface "There's an error in your app, want me to fix it?" The user must notice the broken preview, find the console error (requires developer knowledge), and paste it into chat. This is the biggest non-dev gap.

2. **Visual editing is chat-bridged, not direct.** "Select elements" stages changes and sends them as AI prompts — the result is still AI-generated code. A property panel (change font size, color, spacing with sliders) doesn't exist. Non-devs expect direct manipulation; what they get is an AI loop with element context.

3. **Plan mode credit confusion.** Non-devs may not understand the distinction between Build and Plan mode, or why switching modes matters. The credit model (5/day free) creates anxiety around every message.

4. **Code tab is visible but gated.** Showing a "Code" tab and then labeling it "Read only / Upgrade" is confusing UX — it implies code exists and is accessible but then blocks access. A pure non-dev tool would hide the Code tab entirely.

5. **Preview URL bar is a developer concept.** The URL input in the preview bar (`/onboarding/1`) is meaningless to a non-dev who doesn't know what a route is. They'd navigate the app by clicking through it in the preview, not by typing paths.

6. **History is time-stamped, not named.** The history panel shows "Aug 18, 2025, 12:06 PM" as the label for each version. The auto-generated title (e.g., "Fix: Resolve undefined key error") appears only inside the history drawer, not as the primary label. Non-devs have to remember what time they made a change.

7. **Connectors are powerful but configuration-heavy.** 74 connectors is impressive, but connecting Stripe or Supabase still requires API keys, accounts, and configuration — not zero-setup for a true non-dev.

8. **No branching.** History is linear. Non-devs who want to try two different design approaches simultaneously have no path except building one, manually backing up, then trying the other.

9. **"Previewing last saved version" label adds anxiety.** Non-devs may not understand what "last saved version" means or why they're "previewing" rather than seeing the live state. The distinction between the preview iframe and a deployed app is blurred without explanation.

10. **Paid features are present but gated everywhere.** The density of "Pro" and "Business" badges throughout the UI creates friction — non-devs experience the product as a constant reminder of what they don't have rather than what they do.

---

## Relevance to Helm

### (a) One-shotting & iteration vs. a structured build-stack journey

Lovable is a **pure one-shot-first, iterate-second** tool. The user writes a big prompt → gets an app → refines through chat. There is no phase structure, no spec phase, no constitution, no BA dialogue. The "Plan mode" is the closest analog — the AI can discuss before building — but it's framed as a feature toggle, not a workflow stage.

**How Lovable does it**: Single mega-prompt → full app → iterated through chat messages (each costs 1 credit). Plan mode allows unprompted discussion. No structured phases or task groupings.

**Helm contrast**: Helm's `/ba → /spec → /frontend → /backend → /sdd-review` pipeline is the opposite philosophy — structured discovery prevents wasted credits and broken builds. Lovable users frequently encounter broken builds (as seen in this project: 2 of 3 messages were error fixes). A structured build-stack journey eliminates these mid-build failures that cost non-devs both credits and confidence.

### (b) Requiring another subscription vs. riding the user's existing Claude Max

Lovable charges its own credits on top of the user's Claude subscription. The free tier is genuinely limited: 5 credits/day, with code editing gated at Pro ($25/month). A moderate user building a real app will hit the free limit within a session.

**How Lovable does it**: Proprietary credit system, opaque model selection (users don't choose which model runs their generation), separate billing from any LLM provider subscriptions.

**Helm contrast**: If Helm routes through the user's existing Claude Max, users pay once for one subscription and get full capability. For a user already on Claude Max, Lovable is an expensive addition ($25/month) that also restricts them to Lovable's model choices. This is a strong differentiator — Helm would feel like an upgrade path for existing Claude Max users, not a new subscription on top.

### (c) Chat-driven vs. cards+comments+chat-driven

Lovable is **purely chat-driven**. The chat input is the single interaction surface for all intent. The visual edit toolbar feeds back into chat (element selection → chat prompt). Comments are available but appear to be a collaboration tool (for sharing, not for driving the build).

**How Lovable does it**: Everything flows through the chat box. Plan mode is chat. Build mode is chat. Visual edits are queued and sent as chat messages. The result is that all intent is expressed as natural language.

**Helm contrast**: Cards (features/tasks as structured objects) + comments (contextual feedback attached to specific outcomes) + chat creates a richer intent model. Cards give Helm persistent, referenceable units of work. Lovable has no equivalent — a feature request lives in chat history and is easily lost. Helm's card-based approach gives non-devs a visible representation of "what's been built" and "what's next" that Lovable's linear chat thread can't provide.

### (d) Preview + code vs. preview + "cockpit" (no code, task/feature/outcome-driven)

Lovable's answer to "no code" is: hide the Code tab by default, gate editing behind paywall. The preview is the non-dev's cockpit.

**How Lovable does it**: Preview iframe is the primary surface. Visual edit toolbar adds element-level manipulation. Code exists but is hidden/gated. Non-devs work through Preview + chat.

**The critical gap**: Lovable's preview cockpit **has no concept of a feature or an outcome**. The user sees a rendered UI with no link back to "what this is supposed to do." There's no outcome card, no user story, no acceptance criteria attached to any screen. The "What's next?" section at the bottom of each AI response gestures toward next steps but is generated ad-hoc, not structured.

**Helm contrast**: Helm's "cockpit" model means the preview surface is surrounded by task/outcome context — the user sees not just "what the app looks like now" but "what features are complete, what's in progress, what the spec said." This closes the gap between design intent and built result that Lovable's chat-only memory cannot bridge. For a non-dev who asks "did it build what I asked for?", Lovable gives them only the rendered preview and chat history to compare against. Helm would give them a spec-graded outcome card.

**Where Lovable is stronger**: The actual visual edit experience (element selection + inline text editing) is ahead of anything Helm currently has. Lovable's "select element → AI fixes it" loop is fast and satisfying. Helm's cockpit needs an equivalent point-and-click interaction model to stay competitive here.

---

## Summary Table

| Dimension | Lovable |
|-----------|---------|
| Default landing surface | Preview iframe + chat sidebar |
| Code hidden by default? | Yes (Code tab requires click, editing requires upgrade) |
| Visual/direct manipulation | Yes: Select elements, Edit text inline, Draw annotation, Comment |
| Visual edit mechanism | Element selection → stages AI chat message, not direct WYSIWYG |
| Build modes | Build (direct code gen) + Plan (discuss-first) |
| Version history | Per-message Revert + Timeline drawer, no branching |
| Error recovery | Chat-paste-driven; no in-preview "fix this" button |
| Deployment | .lovable.app subdomain free; custom domain = Pro |
| Backend | Lovable Cloud (Supabase-backed) or BYO Supabase |
| Integrations | 74 connectors (Stripe, Slack, Notion, Figma, OpenAI, etc.) |
| Pricing | Free: 5 credits/day; Pro: $25/month; Business: $50/month |
| Credit model | 1 credit = 1 Build message; Plan mode free |
| Knowledge/instructions | Project-level + workspace-level custom instructions |
| Skills | 5 built-in + user-creatable, triggered by `/` command |
| Gamification | "Vibe coding level" progression system |
| Multi-platform | Browser + macOS desktop app + Telegram |
| Non-dev assessment | Very strong for prototyping; struggles at production error recovery without dev instincts |
