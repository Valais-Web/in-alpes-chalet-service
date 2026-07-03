/**
 * Seed Neon with the demo apartments + availability from the JSON fixtures.
 *
 *   1. create tables:  psql "$NEON_DATABASE_URL" -f db/schema.sql
 *   2. seed:           NEON_DATABASE_URL=... node db/seed.mjs
 *
 * Idempotent (ON CONFLICT / delete-then-insert). Image values are the fixture
 * keys ("apt-1"…); replace with Cloudinary URLs via the admin once live.
 */
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("NEON_DATABASE_URL is required");
  process.exit(1);
}
const sql = neon(url);

const apartments = JSON.parse(
  await readFile(new URL("../src/data/apartments.json", import.meta.url)),
);
const availability = JSON.parse(
  await readFile(new URL("../src/data/availability.json", import.meta.url)),
);

for (const [i, a] of apartments.entries()) {
  const cover = a.images[0] ?? null;
  const gallery = a.images.slice(1);
  await sql`
    INSERT INTO apartments (
      id, slug, sort_order,
      name_fr, name_en, name_nl,
      short_desc_fr, short_desc_en, short_desc_nl,
      long_desc_fr, long_desc_en, long_desc_nl,
      guests, bedrooms, bathrooms, size_m2, floor,
      amenities, rules_fr, rules_en, rules_nl,
      check_in, check_out,
      price_per_night, lat, lng, address,
      cover_image_url, gallery_image_urls
    ) VALUES (
      ${a.id}, ${a.slug}, ${i},
      ${a.title.fr}, ${a.title.en}, ${a.title.nl},
      ${a.summary.fr}, ${a.summary.en}, ${a.summary.nl},
      ${a.description.fr}, ${a.description.en}, ${a.description.nl},
      ${a.maxGuests}, ${a.bedrooms}, ${a.bathrooms}, ${a.surfaceM2}, ${a.floor},
      ${JSON.stringify(a.amenities)}::jsonb, ${a.practical.rules.fr}, ${a.practical.rules.en}, ${a.practical.rules.nl},
      ${a.practical.checkIn}, ${a.practical.checkOut},
      ${a.pricePerNight}, ${a.location.lat}, ${a.location.lng}, ${a.location.address},
      ${cover}, ${JSON.stringify(gallery)}::jsonb
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

for (const r of availability) {
  await sql`
    INSERT INTO availability (apartment_id, start_date, end_date, status, expires_at)
    VALUES (${r.apartmentId}, ${r.start}, ${r.end}, ${r.status}, ${r.expiresAt ?? null})
  `;
}

console.log(`Seeded ${apartments.length} apartments, ${availability.length} availability ranges.`);
