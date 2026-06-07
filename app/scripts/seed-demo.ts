/**
 * seed-demo.ts — populate the real Helm SQLite DB with a demo project so you
 * can explore all features without burning Claude API tokens.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * What it creates:
 *   - A "Customer Feedback Portal" project with 5 cards (3 done, 1 up_next, 1 planned)
 *   - Build steps for the done cards (Progress tab)
 *   - Answered decisions for the done sessions (Decisions tab)
 *   - A tiny static web app in a temp dir (Live Preview)
 *   - A helm.json pointing at a Python HTTP server on port 5100
 *
 * After running, launch the Electron app and the project will already be there.
 * To start the demo live preview: cd to the printed artifact dir and run the
 * start command printed at the end.
 */

import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DB_PATH = join(homedir(), 'Library', 'Application Support', 'helm', 'helm.db')

if (!existsSync(DB_PATH)) {
  console.error(`DB not found at ${DB_PATH}`)
  console.error('Launch the Electron app once so the DB is created, then re-run this script.')
  process.exit(1)
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const now = Date.now()
const ago = (mins: number): number => now - mins * 60_000
const projectId = randomUUID()
const PORT = 5100

// ── 1. Demo artifact: a simple HTML app ──────────────────────────────────────

const artifactDir = join(homedir(), 'Library', 'Application Support', 'helm', 'projects', projectId)
mkdirSync(artifactDir, { recursive: true })

writeFileSync(
  join(artifactDir, 'index.html'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Customer Feedback Portal</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #fafaf9; color: #1c1c1e; min-height: 100vh; }
    header { background: #fff; border-bottom: 2px solid #1c1c1e; padding: 16px 32px; display: flex; align-items: center; gap: 16px; }
    header h1 { font-size: 18px; font-weight: 800; }
    nav a { font-size: 14px; font-weight: 600; color: #555; text-decoration: none; margin-left: 24px; }
    nav a:hover { color: #1c1c1e; }
    main { max-width: 860px; margin: 40px auto; padding: 0 24px; }
    .hero { text-align: center; margin-bottom: 48px; }
    .hero h2 { font-size: 36px; font-weight: 900; margin-bottom: 8px; }
    .hero p { color: #666; font-size: 16px; }
    .form-card { background: #fff; border: 2px solid #1c1c1e; border-radius: 16px; padding: 32px; box-shadow: 4px 4px 0 #1c1c1e; }
    .form-card h3 { font-size: 18px; font-weight: 800; margin-bottom: 20px; }
    label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #444; }
    input, textarea, select { width: 100%; border: 2px solid #ddd; border-radius: 8px; padding: 10px 14px; font-size: 15px; outline: none; font-family: inherit; }
    input:focus, textarea:focus, select:focus { border-color: #1c1c1e; }
    .field { margin-bottom: 20px; }
    .tags { display: flex; gap: 10px; }
    .tag { border: 2px solid #1c1c1e; border-radius: 999px; padding: 6px 16px; font-size: 13px; font-weight: 700; cursor: pointer; background: #fff; }
    .tag.active { background: #ffc2e2; }
    button#submit { width: 100%; background: #1c1c1e; color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 800; cursor: pointer; margin-top: 8px; }
    button#submit:hover { background: #333; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat { background: #fff; border: 2px solid #1c1c1e; border-radius: 12px; padding: 20px; box-shadow: 3px 3px 0 #1c1c1e; }
    .stat .n { font-size: 32px; font-weight: 900; }
    .stat .l { font-size: 13px; color: #666; margin-top: 4px; }
    .search-input { width: 100%; border: 2px solid #1c1c1e; border-radius: 10px; padding: 10px 16px; font-size: 15px; outline: none; font-family: inherit; margin-bottom: 16px; }
  </style>
</head>
<body>
  <header>
    <h1>FeedbackHub</h1>
    <nav>
      <a href="#">Submit</a>
      <a href="#" id="admin-link">Admin</a>
    </nav>
  </header>
  <main id="submit-view">
    <div class="hero">
      <h2>Tell us what you think</h2>
      <p>Your feedback helps us build a better product.</p>
    </div>
    <div class="form-card">
      <h3>Submit feedback</h3>
      <div class="field">
        <label>Category</label>
        <div class="tags">
          <button class="tag active" onclick="selectTag(this)">Bug</button>
          <button class="tag" onclick="selectTag(this)">Feature request</button>
          <button class="tag" onclick="selectTag(this)">General feedback</button>
        </div>
      </div>
      <div class="field">
        <label>Your feedback</label>
        <textarea rows="4" placeholder="Describe what you experienced or what you'd like to see…"></textarea>
      </div>
      <div class="field">
        <label>Email (optional)</label>
        <input type="email" placeholder="you@company.com" />
      </div>
      <button id="submit">Submit feedback</button>
    </div>
  </main>
  <main id="admin-view" style="display:none">
    <div class="stats">
      <div class="stat"><div class="n">142</div><div class="l">Total submissions</div></div>
      <div class="stat"><div class="n">38</div><div class="l">This week</div></div>
      <div class="stat"><div class="n">12</div><div class="l">Unreviewed</div></div>
    </div>
    <input class="search-input" placeholder="Search feedback…" />
    <div style="background:#fff;border:2px solid #1c1c1e;border-radius:12px;overflow:hidden">
      ${[
        ['Bug', 'The submit button disappears after clicking twice', '2 hours ago'],
        ['Feature', 'Add dark mode to the dashboard', '5 hours ago'],
        ['General', 'Love the new chart — really helpful', '1 day ago'],
        ['Bug', 'Email field shows validation error even with valid email', '2 days ago'],
        ['Feature', 'Export feedback as CSV', '3 days ago'],
      ]
        .map(
          ([tag, text, time]) =>
            `<div style="border-bottom:1px solid #eee;padding:14px 20px;display:flex;gap:12px;align-items:flex-start">
          <span style="border:2px solid #1c1c1e;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:800;white-space:nowrap">${tag}</span>
          <span style="flex:1;font-size:14px">${text}</span>
          <span style="font-size:12px;color:#888;white-space:nowrap">${time}</span>
        </div>`,
        )
        .join('')}
    </div>
  </main>
  <script>
    function selectTag(el) {
      document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'))
      el.classList.add('active')
    }
    document.getElementById('admin-link').addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('submit-view').style.display = 'none'
      document.getElementById('admin-view').style.display = 'block'
    })
    document.querySelector('nav a').addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('admin-view').style.display = 'none'
      document.getElementById('submit-view').style.display = 'block'
    })
  </script>
</body>
</html>`,
)

writeFileSync(
  join(artifactDir, 'helm.json'),
  JSON.stringify({ startCommand: `python3 -m http.server ${PORT}`, port: PORT }),
)

// ── 2. Project row ───────────────────────────────────────────────────────────

db.prepare(`
  INSERT INTO projects (id, name, created_at, updated_at, plan, status, artifact_dir)
  VALUES (?, 'Customer Feedback Portal', ?, ?, ?, 'building', ?)
`).run(
  projectId,
  ago(120),
  ago(5),
  JSON.stringify([
    { id: randomUUID(), title: 'User sign-in & sign-up' },
    { id: randomUUID(), title: 'Feedback submission form' },
    { id: randomUUID(), title: 'Admin dashboard' },
    { id: randomUUID(), title: 'Email notifications' },
    { id: randomUUID(), title: 'CSV export' },
  ]),
  artifactDir,
)

// ── 3. Cards ─────────────────────────────────────────────────────────────────

function makeCard(
  pos: number,
  title: string,
  status: string,
  stepNum: number,
  total: number,
): string {
  const id = randomUUID()
  db.prepare(`
    INSERT INTO cards (id, project_id, type, title, status, source, position, step_label, depends_on, created_at, updated_at)
    VALUES (?, ?, 'feature', ?, ?, 'plan_seed', ?, ?, '[]', ?, ?)
  `).run(
    id, projectId, title, status, pos,
    `Step ${stepNum} of ${total}: ${title}`,
    ago(120 - pos * 20), ago(5),
  )
  return id
}

const card1 = makeCard(0, 'User sign-in & sign-up', 'done', 1, 5)
const card2 = makeCard(1, 'Feedback submission form', 'done', 2, 5)
const card3 = makeCard(2, 'Admin dashboard', 'done', 3, 5)
const card4 = makeCard(3, 'Email notifications', 'up_next', 4, 5)
makeCard(4, 'CSV export', 'planned', 5, 5)

// Checkpoint for the last done card so it shows correctly
db.prepare(`UPDATE cards SET checkpoint = ? WHERE id = ?`).run(
  JSON.stringify({ status: 'approved' }), card3,
)

// ── 4. Sessions + feed events ─────────────────────────────────────────────────

const sessions: { id: string; cardId: string; startMins: number; endMins: number }[] = [
  { id: randomUUID(), cardId: card1, startMins: 115, endMins: 97 },
  { id: randomUUID(), cardId: card2, startMins: 90, endMins: 68 },
  { id: randomUUID(), cardId: card3, startMins: 60, endMins: 35 },
]

for (const s of sessions) {
  db.prepare(`
    INSERT INTO sessions (id, project_id, card_id, name, status, started_at, ended_at)
    VALUES (?, ?, ?, ?, 'done', ?, ?)
  `).run(s.id, projectId, s.cardId, 'Build session', ago(s.startMins), ago(s.endMins))

  const events = [
    { kind: 'narration', text: 'Reading the project plan.', delay: 0 },
    { kind: 'activity', text: 'Writing', delay: 30_000 },
    { kind: 'narration', text: 'Setting up the core structure.', delay: 60_000 },
    { kind: 'narration', text: 'Wiring up the data layer.', delay: 180_000 },
    { kind: 'narration', text: 'Adding the finishing touches.', delay: 600_000 },
    { kind: 'checkpoint', text: "Here's what I built — does this look right?", delay: 900_000 },
  ]
  for (const ev of events) {
    db.prepare(`
      INSERT INTO feed_events (id, session_id, kind, text, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), s.id, ev.kind, ev.text, ago(s.startMins) + ev.delay)
  }
}

// ── 5. Build steps (Progress tab) ────────────────────────────────────────────

for (const s of sessions) {
  db.prepare(`
    INSERT INTO build_steps (id, project_id, session_id, card_id, status, started_at, completed_at, dev_url)
    VALUES (?, ?, ?, ?, 'complete', ?, ?, ?)
  `).run(
    randomUUID(), projectId, s.id, s.cardId,
    ago(s.startMins), ago(s.endMins),
    `http://localhost:${PORT}`,
  )
}

// ── 6. Decisions (answered questions in question_queue) ──────────────────────

const decisions: { sessionId: string; question: string; answer: string; delayMins: number }[] = [
  {
    sessionId: sessions[0]!.id,
    question: 'Should users sign in with email/password or a magic-link flow?',
    answer: 'Email and password — keep it simple for now.',
    delayMins: 3,
  },
  {
    sessionId: sessions[1]!.id,
    question: 'How many categories should feedback be tagged with?',
    answer: 'Three: Bug, Feature request, and General feedback.',
    delayMins: 3,
  },
  {
    sessionId: sessions[2]!.id,
    question: 'Should the dashboard show a chart of submissions over time?',
    answer: 'Yes — a simple bar chart by week.',
    delayMins: 3,
  },
]

for (let i = 0; i < decisions.length; i++) {
  const d = decisions[i]!
  const s = sessions[i]!
  const qId = randomUUID()
  const answeredAt = ago(s.startMins) + d.delayMins * 60_000
  db.prepare(`
    INSERT INTO question_queue (id, session_id, prompt, status, answer, position, created_at, answered_at)
    VALUES (?, ?, ?, 'answered', ?, ?, ?, ?)
  `).run(
    qId, d.sessionId,
    JSON.stringify({ type: 'buttons', question: d.question }),
    d.answer, i, ago(s.startMins), answeredAt,
  )
}

// ── Done ──────────────────────────────────────────────────────────────────────

console.log(`
✓ Demo project seeded: "Customer Feedback Portal"
  Project ID: ${projectId}
  Artifact dir: ${artifactDir}

To enable the Live Preview, start the demo server:
  cd "${artifactDir}" && python3 -m http.server ${PORT}

Then open the Helm Electron app — the project will already be in the rail.
`)

db.close()
