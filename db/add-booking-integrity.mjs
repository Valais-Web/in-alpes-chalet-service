/**
 * Adds the availability overlap protection to an existing Neon database:
 *   1. the btree_gist extension
 *   2. an EXCLUDE constraint forbidding overlapping booked/blocked ranges per
 *      apartment (soft 'prebooked' holds are intentionally excluded, CLAUDE.md §5)
 *
 *   node --env-file=.env db/add-booking-integrity.mjs
 *
 * Idempotent: skips the constraint if it already exists. If the table already
 * holds overlapping booked/blocked ranges, the ALTER will fail — this script
 * first prints any offending pairs so they can be cleaned up before re-running.
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
  await pool.query(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
  console.log("btree_gist ready.");

  const { rows: existing } = await pool.query(
    `SELECT 1 FROM pg_constraint WHERE conname = 'availability_no_overlap' LIMIT 1;`,
  );
  if (existing.length) {
    console.log("Constraint availability_no_overlap already present. Nothing to do.");
    process.exit(0);
  }

  // Surface any current overlaps that would make the ALTER fail.
  const { rows: overlaps } = await pool.query(`
    SELECT a.apartment_id, a.start_date a_start, a.end_date a_end,
           b.start_date b_start, b.end_date b_end
    FROM availability a
    JOIN availability b
      ON a.apartment_id = b.apartment_id
     AND a.id < b.id
     AND a.status IN ('booked','blocked')
     AND b.status IN ('booked','blocked')
     AND daterange(a.start_date, a.end_date, '[]') && daterange(b.start_date, b.end_date, '[]')
    ORDER BY a.apartment_id, a_start;
  `);
  if (overlaps.length) {
    console.error(
      `\nFound ${overlaps.length} overlapping booked/blocked range pair(s). Resolve these before adding the constraint:`,
    );
    for (const o of overlaps) {
      console.error(
        `  ${o.apartment_id}: [${o.a_start}..${o.a_end}] overlaps [${o.b_start}..${o.b_end}]`,
      );
    }
    process.exit(1);
  }

  await pool.query(`
    ALTER TABLE availability
      ADD CONSTRAINT availability_no_overlap EXCLUDE USING gist (
        apartment_id WITH =,
        (daterange(start_date, end_date, '[]')) WITH &&
      ) WHERE (status IN ('booked','blocked'));
  `);
  console.log("Constraint availability_no_overlap added.");
} finally {
  await pool.end();
}
