/**
 * Transitional: let booking_requests.status accept BOTH the old and new values,
 * so the currently-deployed code (inserts 'new') and the new code (inserts
 * 'pending') both work during the deploy window. Run before deploying the new
 * status code; the strict constraint is restored by db/migrate-status.mjs after.
 *   node --env-file=.env db/widen-status.mjs
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);
await sql`ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check`;
await sql`
  ALTER TABLE booking_requests ADD CONSTRAINT booking_requests_status_check
  CHECK (status IN ('pending','accepted','declined','archived','new','in_progress','answered'))
`;
console.log("Constraint widened to accept old + new status values.");
