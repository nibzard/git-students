import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let schemaReady = false;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    total_time_ms INTEGER,
    score INTEGER,
    question_order TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    answer TEXT,
    time_ms INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    UNIQUE(session_id, question_id)
  )`,
];

export function getDbClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    }
    client = createClient({ url, authToken });
  }
  return client;
}

export async function ensureSchema() {
  if (schemaReady) return;
  const db = getDbClient();
  for (const stmt of schemaStatements) {
    await db.execute(stmt);
  }
  schemaReady = true;
}
