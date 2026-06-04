import Database from 'better-sqlite3'
import { migrate } from './migrations'

/** Open (or create) a database, apply pragmas + migrations. Pass ':memory:' for tests. */
export function openDatabase(path: string): Database.Database {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

export type Db = Database.Database
