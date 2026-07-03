/**
 * Prove the backend is talking to Neon (not the in-memory fallback).
 * Reads counts, performs one live booking write, confirms the rows landed in
 * Neon, then cleans up so the seeded DB is left untouched.
 *   set -a; . ./.env; set +a; ALLOW_DEV_OPEN_AUTH=1 npx tsx scripts/verify-neon.mts
 */
import { neon } from "@neondatabase/serverless";
import submitBooking from "../netlify/functions/submit-booking.ts";

const sql = neon(process.env.NEON_DATABASE_URL!);
let bad = 0;
const ok = (n: string, c: boolean, x?: unknown) => {
  console.log(`${c ? "✅" : "❌"} ${n}`, c ? "" : x ?? "");
  if (!c) bad++;
};

const [{ n: nApt }] = await sql`select count(*)::int n from apartments`;
const [{ n: nAv }] = await sql`select count(*)::int n from availability`;
ok(`reads from Neon: ${nApt} apartments, ${nAv} availability ranges`, nApt === 3 && nAv === 10);

const res = await submitBooking(
  new Request("http://x/api/submit-booking", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apartmentId: "apt-01",
      arrival: "2099-01-01",
      departure: "2099-01-05",
      guests: 2,
      name: "NEON VERIFY",
      email: "verify@example.com",
      phone: "+41 00 000 00 00",
      message: "verify",
    }),
  }),
);
ok("submit-booking → 200", res.status === 200, await res.clone().json());

const rows = await sql`select id, status from booking_requests where email = 'verify@example.com'`;
ok("booking row persisted in Neon (status=new)", rows.length === 1 && rows[0].status === "new", rows);

const hold =
  await sql`select status, expires_at from availability where apartment_id='apt-01' and start_date='2099-01-01'`;
ok("48h prebooked hold persisted in Neon", hold.length === 1 && hold[0].status === "prebooked" && !!hold[0].expires_at, hold);

// cleanup
await sql`delete from booking_requests where email = 'verify@example.com'`;
await sql`delete from availability where apartment_id='apt-01' and start_date='2099-01-01'`;
const [{ n: nAvAfter }] = await sql`select count(*)::int n from availability`;
ok("cleaned up — DB back to seeded state", nAvAfter === 10);

console.log(bad === 0 ? "\nNEON VERIFICATION PASSED" : `\n${bad} FAILED`);
process.exit(bad ? 1 : 0);
