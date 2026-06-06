import type Database from 'better-sqlite3'

/**
 * Numbered, idempotent migrations. Each step bumps PRAGMA user_version.
 * Run on app launch before any IPC handler is registered.
 */

type Migration = (db: Database.Database) => void

const MIGRATIONS: Migration[] = [
  // 1 — initial schema
  (db) => {
    db.exec(`
      CREATE TABLE projects (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL,
        plan        TEXT,
        status      TEXT NOT NULL DEFAULT 'planning'
      );

      CREATE TABLE sessions (
        id          TEXT PRIMARY KEY,
        project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        card_id     TEXT,
        name        TEXT NOT NULL,
        status      TEXT NOT NULL,
        started_at  INTEGER NOT NULL,
        ended_at    INTEGER,
        resumed_at  INTEGER
      );

      CREATE TABLE cards (
        id              TEXT PRIMARY KEY,
        project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        type            TEXT NOT NULL,
        title           TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'planned',
        source          TEXT NOT NULL,
        position        INTEGER NOT NULL,
        step_label      TEXT,
        depends_on      TEXT,
        created_at      INTEGER NOT NULL,
        updated_at      INTEGER NOT NULL,
        session_id      TEXT,
        decision_prompt TEXT,
        checkpoint      TEXT
      );

      CREATE TABLE feed_events (
        id          TEXT PRIMARY KEY,
        session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        kind        TEXT NOT NULL,
        text        TEXT NOT NULL,
        raw_payload TEXT,
        created_at  INTEGER NOT NULL
      );

      CREATE TABLE question_queue (
        id          TEXT PRIMARY KEY,
        session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        prompt      TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'pending',
        answer      TEXT,
        position    INTEGER NOT NULL,
        created_at  INTEGER NOT NULL,
        answered_at INTEGER
      );

      CREATE INDEX idx_cards_project ON cards(project_id, position);
      CREATE INDEX idx_sessions_project ON sessions(project_id);
      CREATE INDEX idx_feed_session ON feed_events(session_id, created_at);
      CREATE INDEX idx_question_session ON question_queue(session_id, position);
    `)
  },
  // 2 — feed events reference the question/card they're about (Group 5)
  (db) => {
    db.exec(`ALTER TABLE feed_events ADD COLUMN ref_id TEXT;`)
  },
  // 3 — Phase 2: project artifact tracking + build steps
  (db) => {
    db.exec(`
      ALTER TABLE projects ADD COLUMN artifact_dir TEXT;
      ALTER TABLE projects ADD COLUMN dev_pid INTEGER;

      CREATE TABLE build_steps (
        id           TEXT PRIMARY KEY,
        project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        card_id      TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        status       TEXT NOT NULL,
        started_at   INTEGER NOT NULL,
        completed_at INTEGER,
        dev_url      TEXT
      );

      CREATE INDEX idx_build_steps_project ON build_steps(project_id, started_at);
      CREATE INDEX idx_build_steps_session ON build_steps(session_id);
    `)
  },
]

export function migrate(db: Database.Database): void {
  const current = (db.pragma('user_version', { simple: true }) as number) ?? 0
  for (let v = current; v < MIGRATIONS.length; v++) {
    const run = db.transaction(() => {
      MIGRATIONS[v]!(db)
      db.pragma(`user_version = ${v + 1}`)
    })
    run()
  }
}
