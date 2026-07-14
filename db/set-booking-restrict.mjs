/**
 * Change booking_requests.apartment_id from ON DELETE CASCADE to RESTRICT, so
 * deleting an apartment can no longer wipe its booking history.
 *
 *   node --env-file=.env db/set-booking-restrict.mjs
 *
 * Idempotent: drops the existing FK (whatever its rule) and re-adds it as
 * RESTRICT under the conventional name.
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
  await pool.query(`
    ALTER TABLE booking_requests
      DROP CONSTRAINT IF EXISTS booking_requests_apartment_id_fkey;
  `);
  await pool.query(`
    ALTER TABLE booking_requests
      ADD CONSTRAINT booking_requests_apartment_id_fkey
      FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE RESTRICT;
  `);
  console.log("booking_requests.apartment_id is now ON DELETE RESTRICT.");
} finally {
  await pool.end();
}
