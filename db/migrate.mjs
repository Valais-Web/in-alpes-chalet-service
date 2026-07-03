/**
 * Apply db/schema.sql to Neon.
 *   node --env-file=.env db/migrate.mjs
 * Idempotent (schema uses CREATE TABLE / INDEX IF NOT EXISTS).
 */
import { readFile } from "node:fs/promises";
import { Pool, neonConfig } from "@neondatabase/serverless";

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("NEON_DATABASE_URL is required");
  process.exit(1);
}

// Node ≥22 exposes a global WebSocket that the Neon driver can use for the
// pooled (multi-statement) connection.
if (!neonConfig.webSocketConstructor && globalThis.WebSocket) {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
const pool = new Pool({ connectionString: url });
try {
  await pool.query(schema);
  console.log("Schema applied.");
} finally {
  await pool.end();
}
