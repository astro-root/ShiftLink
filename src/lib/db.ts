import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
// node:sqlite は Node.js 22+ に組み込み済み (npm インストール不要)
const { DatabaseSync } = require('node:sqlite') as any;

declare global {
  // eslint-disable-next-line no-var
  var __db: any;
}

export function getDb(): any {
  if (!global.__db) {
    const dbPath = path.join(process.cwd(), 'shiftlink.db');
    global.__db = new DatabaseSync(dbPath);
    global.__db.exec('PRAGMA journal_mode = WAL');
    global.__db.exec('PRAGMA foreign_keys = ON');
    initSchema(global.__db);
  }
  return global.__db;
}

function initSchema(db: any): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shifts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL DEFAULT 'シフト',
      edit_token  TEXT    UNIQUE NOT NULL,
      view_token  TEXT    UNIQUE NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS staff (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id  INTEGER NOT NULL,
      name      TEXT    NOT NULL,
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS slots (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id       INTEGER NOT NULL,
      date           TEXT    NOT NULL,
      start_time     TEXT    NOT NULL,
      end_time       TEXT    NOT NULL,
      required_count INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS preferences (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id  INTEGER NOT NULL,
      slot_id   INTEGER NOT NULL,
      status    TEXT    NOT NULL DEFAULT 'available',
      UNIQUE(staff_id, slot_id),
      FOREIGN KEY (staff_id) REFERENCES staff(id)  ON DELETE CASCADE,
      FOREIGN KEY (slot_id)  REFERENCES slots(id)  ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS proposals (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id      INTEGER NOT NULL,
      title         TEXT    NOT NULL,
      score         REAL    NOT NULL DEFAULT 0,
      coverage_rate REAL    NOT NULL DEFAULT 100,
      data          TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
    );
  `);
}
