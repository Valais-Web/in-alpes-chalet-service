/**
 * Local runtime smoke test of the backend in dev-fallback mode (no env vars):
 * in-memory repo, in-process blobs, console emails, dev-open auth.
 * Run: ALLOW_DEV_OPEN_AUTH=1 npx tsx scripts/smoke.mts   — not deployed, safe to delete.
 * (The admin endpoints fail closed without that non-production opt-in.)
 */
import submitBooking from "../netlify/functions/submit-booking.ts";
import content from "../netlify/functions/content.ts";
import adminRequests from "../netlify/functions/admin-requests.ts";
import adminAvailability from "../netlify/functions/admin-availability.ts";

const BASE = "http://localhost";
let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  console.log(`${cond ? "✅" : "❌"} ${name}`, cond ? "" : (extra ?? ""));
  if (!cond) failures++;
}

// 1. valid booking
const bookRes = await submitBooking(
  new Request(`${BASE}/api/submit-booking`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apartmentId: "apt-01",
      arrival: "2027-02-01",
      departure: "2027-02-05",
      guests: 4,
      name: "Test User",
      email: "test@example.com",
      phone: "+41 79 000 00 00",
      message: "Smoke test",
      locale: "fr",
    }),
  }),
);
const booked = await bookRes.json();
check(
  "submit-booking returns ok+id",
  bookRes.status === 200 && booked.ok === true && !!booked.id,
  booked,
);

// 2. availability now has a prebooked hold for the range
const av1 = await (await content(new Request(`${BASE}/api/content?type=availability`))).json();
const hold = av1.find(
  (r: any) => r.apartmentId === "apt-01" && r.start === "2027-02-01" && r.status === "prebooked",
);
check("prebooked hold laid + published to blobs", !!hold && !!hold.expiresAt, av1);

// 3. invalid booking → 400
const badRes = await submitBooking(
  new Request(`${BASE}/api/submit-booking`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apartmentId: "apt-01",
      arrival: "2027-02-05",
      departure: "2027-02-01", // departure before arrival
      guests: 2,
      name: "X",
      email: "not-an-email",
      phone: "123",
    }),
  }),
);
check("invalid booking rejected (400)", badRes.status === 400);

// 4. admin: list requests (dev-open auth)
const reqs = await (await adminRequests(new Request(`${BASE}/api/admin/requests`))).json();
const mine = reqs.find((b: any) => b.email === "test@example.com");
check("admin sees the new request", !!mine && mine.status === "pending", reqs);

// 5. admin: confirm → range becomes booked, hold gone
await adminRequests(
  new Request(`${BASE}/api/admin/requests`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: mine.id, status: "accepted", action: "confirm" }),
  }),
);
const av2 = await (await content(new Request(`${BASE}/api/content?type=availability`))).json();
const firm = av2.filter((r: any) => r.apartmentId === "apt-01" && r.start === "2027-02-01");
check(
  "confirm replaces hold with a single booked range",
  firm.length === 1 && firm[0].status === "booked",
  firm,
);

// 6. admin: block a range, then it appears in published availability
await adminAvailability(
  new Request(`${BASE}/api/admin/availability`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      apartmentId: "apt-03",
      start: "2027-03-01",
      end: "2027-03-08",
      status: "blocked",
    }),
  }),
);
const av3 = await (await content(new Request(`${BASE}/api/content?type=availability`))).json();
check(
  "admin block published",
  av3.some(
    (r: any) => r.apartmentId === "apt-03" && r.start === "2027-03-01" && r.status === "blocked",
  ),
);

// 7. apartments read path
const apts = await (await content(new Request(`${BASE}/api/content?type=apartments`))).json();
check("apartments published + readable", Array.isArray(apts) && apts.length === 3, apts?.length);

console.log(failures === 0 ? "\nALL SMOKE CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
