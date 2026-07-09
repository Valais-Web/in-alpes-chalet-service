/**
 * Migrate booking_requests.status to the pending/accepted/declined/archived model.
 *   node --env-file=.env db/migrate-status.mjs
 *
 * Old → new: new/in_progress → pending, answered → accepted, archived stays.
 * ('declined' had no old equivalent — decline previously set 'archived'.)
 * Idempotent: safe to run more than once.
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
  // Drop the old CHECK first so the remap to new values isn't rejected.
  await pool.query(
    `ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check`,
  );
  const { rowCount } = await pool.query(`
    UPDATE booking_requests SET status = CASE status
      WHEN 'new' THEN 'pending'
      WHEN 'in_progress' THEN 'pending'
      WHEN 'answered' THEN 'accepted'
      ELSE status END
    WHERE status IN ('new','in_progress','answered')
  `);
  await pool.query(`ALTER TABLE booking_requests ALTER COLUMN status SET DEFAULT 'pending'`);
  await pool.query(`
    ALTER TABLE booking_requests
    ADD CONSTRAINT booking_requests_status_check
    CHECK (status IN ('pending','accepted','declined','archived'))
  `);
  console.log(`Migrated. ${rowCount} row(s) remapped to the new status model.`);

  const { rows } = await pool.query(
    `SELECT status, count(*)::int n FROM booking_requests GROUP BY status ORDER BY status`,
  );
  console.log("Current status distribution:", rows);
} finally {
  await pool.end();
}
