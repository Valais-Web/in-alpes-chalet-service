/**
 * Adds domain CHECK constraints mirroring the Zod validation to an existing DB:
 *   apartments: lat/lng bounds, guests >= 1, price >= 0
 *   availability: prebooked rows must carry expires_at
 *   booking_requests: departure > arrival, guests >= 1
 *
 *   node --env-file=.env db/add-domain-constraints.mjs
 *
 * Idempotent (each ADD CONSTRAINT is guarded by pg_constraint). An ALTER fails
 * if existing rows violate the rule — fix the data, then re-run.
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

const CONSTRAINTS = [
  ["apartments", "apartments_lat_bounds", "CHECK (lat BETWEEN -90 AND 90)"],
  ["apartments", "apartments_lng_bounds", "CHECK (lng BETWEEN -180 AND 180)"],
  ["apartments", "apartments_guests_pos", "CHECK (guests >= 1)"],
  ["apartments", "apartments_price_nonneg", "CHECK (price_per_night >= 0)"],
  [
    "availability",
    "availability_prebooked_expiry",
    "CHECK (status <> 'prebooked' OR expires_at IS NOT NULL)",
  ],
  ["booking_requests", "booking_departure_after_arrival", "CHECK (departure > arrival)"],
  ["booking_requests", "booking_guests_pos", "CHECK (guests >= 1)"],
];

const pool = new Pool({ connectionString: url });
try {
  for (const [table, name, def] of CONSTRAINTS) {
    const { rows } = await pool.query(`SELECT 1 FROM pg_constraint WHERE conname = $1 LIMIT 1;`, [
      name,
    ]);
    if (rows.length) {
      console.log(`= ${name} already present`);
      continue;
    }
    await pool.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} ${def};`);
    console.log(`+ ${name} added`);
  }
  console.log("Domain constraints applied.");
} finally {
  await pool.end();
}
