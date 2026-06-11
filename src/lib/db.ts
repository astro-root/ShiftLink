import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

export function getClient(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL
    if (!url) throw new Error('TURSO_DATABASE_URL が未設定です')
    _client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN ?? undefined,
    })
  }
  return _client
}

export async function initDB() {
  const db = getClient()
  const ddl = [
    `CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      view_token TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL DEFAULT 'シフト表',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_range TEXT NOT NULL,
      required_count INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS availabilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      UNIQUE(participant_id, slot_id)
    )`,
    `CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      proposal_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
  ]
  for (const sql of ddl) {
    await db.execute(sql)
  }
}

export async function getDB(): Promise<Client> {
  await initDB()
  return getClient()
}
