import { createClient } from '@libsql/client';

export const client = createClient({
  url: process.env.URL_TURSO!,
  authToken: process.env.TOKEN_TURSO,
});

export async function initDb() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS soportes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      año INTEGER NOT NULL,
      mes TEXT NOT NULL,
      mes_num INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      soportes INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_soportes_año ON soportes(año);
    CREATE INDEX IF NOT EXISTS idx_soportes_tipo ON soportes(tipo);

    CREATE TABLE IF NOT EXISTS tendencias (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
