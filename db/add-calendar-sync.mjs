/**
 * Adds the Airbnb calendar sync storage (netlify/lib/calendarSync.ts):
 *
 *   1. availability.source  (text, NULL | 'airbnb') + CHECK + partial index
 *   2. calendar_sync table   (apartment → Airbnb iCal export URL)
 *
 *   node --env-file=.env db/add-calendar-sync.mjs
 *
 * Idempotent: safe to re-run. Existing rows keep source = NULL (site rows).
 */
import { Pool, neonConfig } from "@neondatabase/serverless";

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("NEON_DATABASE_URL is required");
  process.exit(1);
}
if (!neonConfig.webSocketConstructor && globalThis.WebSocket) {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

const pool = new Pool({ connectionString: url });
try {
  await pool.query(`ALTER TABLE availability ADD COLUMN IF NOT EXISTS source text;`);
  await pool.query(`ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_source_check;`);
  await pool.query(`
    ALTER TABLE availability
      ADD CONSTRAINT availability_source_check CHECK (source IS NULL OR source = 'airbnb');
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS availability_source_idx
      ON availability (apartment_id) WHERE source IS NOT NULL;
  `);
  console.log("Column availability.source ready.");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS calendar_sync (
      apartment_id  text PRIMARY KEY REFERENCES apartments(id) ON DELETE CASCADE,
      import_url    text NOT NULL,
      updated_at    timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log("Table calendar_sync ready.");
} finally {
  await pool.end();
}
