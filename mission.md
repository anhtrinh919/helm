# Mission — Helm

## Purpose
Helm is a no-code app studio for non-developers, powered by the Claude subscription you already pay for. You describe what you want, watch it get built through a guided journey, point at whatever is wrong to fix it, give it real logins and data, and ship it to a live URL — all in one calm desktop window, never touching code, never paying a second subscription.

Helm is the alternative to Replit, Bolt, and Lovable for people who are not developers and do not want to become one.

## Target Users
Non-developers and product/project people who have an idea and a Claude subscription. They can already get an AI to build things, but today that means an IDE they don't understand (Replit, Bolt), a runaway chat thread that loses the plot after twenty messages (all three), and a token meter or a second monthly bill (all three). Helm's user wants to manage a build like a project, not operate a developer tool.

Open-source and local: anyone downloads Helm, runs it on their own machine, and points it at their own Claude subscription. Helm never hosts their app or their data.

## Why Helm, not Replit / Bolt / Lovable
This is the heart of the product. Each line is a confirmed gap from hands-on research of all three (see `research/`):

- **A guided journey, not a one-shot gamble.** The others fire your whole app from a single prompt, then you patch it by chatting. It breaks a lot — in our own test, two of three Lovable messages were error-fixes, and Bolt's own docs warn you not to mash its "Attempt fix" button. Helm builds through a structured path: it understands what you want *before* it builds, so far fewer things go wrong.
- **Free on the Claude you already have — no token meter, always the best model.** Every competitor charges $20–25/month *on top of* any AI subscription, meters your usage (Bolt's cost even grows as your app grows, training you to fear prompting), and hides which model runs — none let you choose Claude. Helm runs on your existing Claude subscription at zero marginal cost, with no usage wall, always on Claude.
- **Cards and a cockpit, not an opaque chat log.** The others are one long chat thread that becomes unreadable; there is no "feature" or "outcome" you can point to, so you can never cleanly answer "did it build what I asked?" Helm tracks work as cards with outcomes, comments, and status — the build state is always inspectable.
- **A cockpit around the preview, not an IDE around the code.** Replit and Bolt are code editors with a chat bolted on; code is always in your face. Lovable hides code well but its "cockpit" is *just a preview* — it has no idea what your app is supposed to do. Helm wraps the live app in feature/outcome context: what's built, what's next, what each screen is for. Code is never shown.
- **Point at it to fix it — and Helm catches breaks for you.** Click any element in the running app and say what's wrong; a focused session fixes exactly that. And the universal non-dev trap — a broken screen with an error you'd have to find in a developer console — Helm detects and offers to fix on its own. No competitor does this.
- **You can actually ship.** "Publish" is a core verb in all three, and Helm had none. Now one click puts your app on a real, shareable URL.
- **Bring an app you started elsewhere.** Started in Lovable, Bolt, Replit, or just locally? Import it and keep going in Helm. (Bolt itself ships an "import from Lovable" path — Helm makes the migration land in a better home.)

## Vision & Tone
Calm, in-control, and legible — an executive cockpit, not a workbench. Everything important is at a glance; decisions surface when they're needed; the rest is handled. The experience is "watch it get made and steer it," never "operate a build tool." Nothing should feel like software development. It should feel like running a project that happens to produce real, shippable software.

Visual direction: calm, sleek, modern, guiding — bold where it counts. Easy to grasp on first open, with depth to master over time. Serious software for serious work, without becoming corporate or cold. (This replaces the earlier playful/maximalist look entirely.)

## Success Looks Like
A non-developer opens Helm, describes an app, answers a few questions, and watches a board fill with features and their status — no terminal, no file, no technical decision. When something needs them — a question, a broken screen, a choice — it appears as a card they act on directly. When a piece is built, they see the live app in the same window and point at what to fix next. They give it a login screen and a place to store data without knowing what a database is. When it's ready, one click puts it on a URL they can send to anyone. They never paid a second subscription, never hit a usage wall, and never saw a line of code.

## Design Tool
external-pencil

## Master User Journey

### Core Jobs (JTBD)
- When I have an idea for an app, I need to drive an AI to build it without touching code, so I can ship real software as a non-developer.
- When a build is in motion, I need to see what's done, what's left, and what's broken at a glance, so I stay in control without keeping notes on the side.
- When something looks wrong, I need to point at it (or have Helm catch it for me) and get it fixed, so I'm never stuck staring at a broken screen.
- When my app needs accounts or saved data, I need to add them by asking, so a real app isn't gated behind concepts I don't have.
- When it's ready, I need to put it on a real URL in one step, so I can actually show it to people.
- When I already started an app somewhere else, I need to bring it in and continue, so I'm not locked into where I began.
- When I make product decisions, I need them captured and acted on, so I don't re-decide or lose the reasoning.

### Named Flows

**Build something new (guided journey):**
1. At the front door, pick "Build something new" (Cockpit/Journey)
2. Describe the goal — Helm understands it before building, then lays out an ordered path of milestones (Journey)
3. Steps unlock in order; each ends at a checkpoint where you test what was just built, report anything off, and continue (Journey)
4. Mid-build requests are triaged: small fixes happen now, large/unrelated ones are parked on a visible "For later" shelf so nothing derails and nothing is lost (Journey)
5. The last step → "Your app now does what you set out to build" → the project shifts to free iteration; the path collapses to a journey strip (Journey)

**Iterate freely:**
1. From scratch: pick "Iterate on an app → start fresh"; your first feature request also scaffolds the app, in one step (Cockpit)
2. Or import: pick "bring an existing app", point Helm at the folder; it figures out how to run it and shows the live app (Import)
3. From then on: a freeform board, feature by feature, parallel work, point-and-fix (Cockpit)

**Fix something:**
1. Spot an issue in the live app — or Helm flags a broken screen on its own (Point-and-Fix / Error Recovery)
2. Point at the element and say what's wrong, or accept Helm's offered fix (Point-and-Fix)
3. A focused session with full visual context fixes exactly that (Point-and-Fix)
4. Verify it's resolved; roll back any change you don't like (Version History)

**Give it logins and data:**
1. Ask for accounts or saved data in plain language (Backend)
2. Helm provisions a local login + database + file storage and wires the app to them — no cloud account, no code shown (Backend)

**Ship it:**
1. Click Publish (Ship)
2. Helm puts the locally-running app on a real URL on your own Cloudflare domain (`<your-app>.ta-infra.uk`); the app keeps running on your machine, the world reaches it through the tunnel (Ship)
3. Stop, restart, or check who can reach it from the same panel (Ship)

**Run many at once:**
1. Each action (comment, bug, tweak, feature) spawns its own context-loaded scoped session (Cockpit)
2. All sessions work in parallel (Cockpit)
3. Results land back on the board (Cockpit)
