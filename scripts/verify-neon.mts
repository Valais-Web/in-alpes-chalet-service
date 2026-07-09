/**
 * Prove the backend is talking to Neon (not the in-memory fallback).
 * Reads counts, performs one live booking write, confirms the rows landed in
 * Neon, then cleans up so the seeded DB is left untouched.
 *   set -a; . ./.env; set +a; ALLOW_DEV_OPEN_AUTH=1 npx tsx scripts/verify-neon.mts
 */
import { neon } from "@neondatabase/serverless";
import submitBooking from "../netlify/functions/submit-booking.ts";
import adminApartments from "../netlify/functions/admin-apartments.ts";
import adminLogin from "../netlify/functions/admin-login.ts";
import content from "../netlify/functions/content.ts";

const sql = neon(process.env.NEON_DATABASE_URL!);
let bad = 0;
const ok = (n: string, c: boolean, x?: unknown) => {
  console.log(`${c ? "✅" : "❌"} ${n}`, c ? "" : (x ?? ""));
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
ok(
  "booking row persisted in Neon (status=pending)",
  rows.length === 1 && rows[0].status === "pending",
  rows,
);

const hold =
  await sql`select status, expires_at from availability where apartment_id='apt-01' and start_date='2099-01-01'`;
ok(
  "48h prebooked hold persisted in Neon",
  hold.length === 1 && hold[0].status === "prebooked" && !!hold[0].expires_at,
  hold,
);

// cleanup
await sql`delete from booking_requests where email = 'verify@example.com'`;
await sql`delete from availability where apartment_id='apt-01' and start_date='2099-01-01'`;
const [{ n: nAvAfter }] = await sql`select count(*)::int n from availability`;
ok("cleaned up — DB back to seeded state", nAvAfter === 10);

// --- Admin auth: log in, capture the session cookie ---
const loginRes = await adminLogin(
  new Request("http://x/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  }),
);
const setCookie = loginRes.headers.get("set-cookie") ?? "";
const cookie = setCookie.split(";")[0];
ok(
  "admin login issues a session cookie",
  loginRes.status === 200 && cookie.startsWith("inalpes_session="),
  setCookie,
);

// --- Admin apartment round-trip (editor payload → Neon → published JSON) ---
const newApt = {
  slug: "verify-studio",
  title: { fr: "Studio Vérif", en: "Verify Studio", nl: "Verify Studio" },
  summary: { fr: "Résumé", en: "Summary", nl: "Samenvatting" },
  description: { fr: "Desc", en: "Desc", nl: "Desc" },
  images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
  maxGuests: 3,
  bedrooms: 1,
  bathrooms: 1,
  surfaceM2: 44,
  floor: "2",
  amenities: ["wifi", "balcony"],
  pricePerNight: 130,
  location: { lat: 46.18, lng: 7.31, address: "Rue Test 1, 1997 Haute-Nendaz" },
  practical: { checkIn: "16:00", checkOut: "10:00", rules: { fr: "R", en: "R", nl: "R" } },
};
const createRes = await adminApartments(
  new Request("http://x/api/admin/apartments", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(newApt),
  }),
);
const created = await createRes.json();
ok(
  "admin creates apartment with all fields",
  createRes.status === 200 && !!created.apartment?.id,
  created,
);

const published = await (await content(new Request("http://x/api/content?type=apartments"))).json();
const found = published.find((p: any) => p.slug === "verify-studio");
ok(
  "new apartment round-trips through published JSON (surface/amenities/rules/location)",
  !!found &&
    found.surfaceM2 === 44 &&
    found.amenities.includes("balcony") &&
    found.practical.rules.fr === "R" &&
    found.location.address.startsWith("Rue Test") &&
    found.images[0].startsWith("https://"),
  found,
);

await adminApartments(
  new Request(`http://x/api/admin/apartments?id=${created.apartment.id}`, {
    method: "DELETE",
    headers: { cookie },
  }),
);
const afterDel = await sql`select count(*)::int n from apartments where slug='verify-studio'`;
ok("apartment deleted — DB clean", afterDel[0].n === 0);

console.log(bad === 0 ? "\nNEON VERIFICATION PASSED" : `\n${bad} FAILED`);
process.exit(bad ? 1 : 0);
