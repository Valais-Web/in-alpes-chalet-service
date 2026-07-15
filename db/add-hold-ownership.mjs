/**
 * Adds hold/booking ownership to `availability` so an owner decision acts on
 * exactly the request's own range — not on every overlapping soft hold.
 *
 *   1. availability.booking_request_id  (text, nullable)
 *   2. FK → booking_requests(id) ON DELETE CASCADE
 *   3. partial index on the ownership column
 *
 *   node --env-file=.env db/add-hold-ownership.mjs
 *
 * Idempotent: safe to re-run. Existing rows (manual blocks and holds laid
 * before this migration) keep booking_request_id = NULL, which simply means
 * "unowned" — decisions match nothing there, exactly as before.
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
  await pool.query(`ALTER TABLE availability ADD COLUMN IF NOT EXISTS booking_request_id text;`);
  console.log("Column availability.booking_request_id ready.");

  await pool.query(
    `ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_booking_request_fk;`,
  );
  await pool.query(`
    ALTER TABLE availability
      ADD CONSTRAINT availability_booking_request_fk
      FOREIGN KEY (booking_request_id) REFERENCES booking_requests(id) ON DELETE CASCADE;
  `);
  console.log("FK availability_booking_request_fk added.");

  await pool.query(`
    CREATE INDEX IF NOT EXISTS availability_booking_request_idx
      ON availability (booking_request_id) WHERE booking_request_id IS NOT NULL;
  `);
  console.log("Index availability_booking_request_idx ready.");
  console.log("Done.");
} finally {
  await pool.end();
}
