/**
 * Data access — the ONLY place that talks to Neon.
 *
 * Exposes a `repo` implementing a small repository interface. When
 * NEON_DATABASE_URL is set it runs against Neon (Postgres); otherwise it falls
 * back to an in-memory store seeded from the JSON fixtures, so the whole backend
 * is runnable locally with zero configuration.
 *
 * NOTE ON THE SCHEMA: CLAUDE.md §4 models availability one row per date. The
 * whole frontend (and the published JSON) instead work with date *ranges*
 * (start/end). We follow the range model here — it is what every consumer
 * already expects — and extend `apartments` with the price/location columns the
 * UI requires. See db/schema.sql.
 */
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { env, flags } from "./env";
import type {
  Apartment,
  AvailabilityRange,
  AvailabilityStatus,
  BookingRequest,
  BookingStatus,
} from "./types";

import seedApartments from "../../src/data/apartments.json";
import seedAvailability from "../../src/data/availability.json";

export interface Repo {
  listApartments(): Promise<Apartment[]>;
  getApartment(idOrSlug: string): Promise<Apartment | null>;
  upsertApartment(a: Apartment): Promise<Apartment>;
  deleteApartment(id: string): Promise<void>;

  listAvailability(apartmentId?: string): Promise<AvailabilityRange[]>;
  setAvailability(r: AvailabilityRange): Promise<void>;
  clearAvailability(apartmentId: string, start: string, end: string): Promise<void>;

  listBookings(): Promise<BookingRequest[]>;
  insertBooking(b: Omit<BookingRequest, "id" | "status" | "createdAt">): Promise<BookingRequest>;
  updateBookingStatus(id: string, status: BookingStatus): Promise<void>;
}

// ---------------------------------------------------------------------------
// In-memory implementation (dev fallback)
// ---------------------------------------------------------------------------

function seedApartmentList(): Apartment[] {
  return (seedApartments as Omit<Apartment, "sortOrder">[]).map((a, i) => ({
    ...a,
    sortOrder: i,
  }));
}

function memoryRepo(): Repo {
  let apartments: Apartment[] = seedApartmentList();
  let availability: AvailabilityRange[] = JSON.parse(JSON.stringify(seedAvailability));
  const bookings: BookingRequest[] = [];

  return {
    async listApartments() {
      return [...apartments].sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async getApartment(idOrSlug) {
      return apartments.find((a) => a.id === idOrSlug || a.slug === idOrSlug) ?? null;
    },
    async upsertApartment(a) {
      const idx = apartments.findIndex((x) => x.id === a.id);
      if (idx >= 0) apartments[idx] = a;
      else apartments = [...apartments, a];
      return a;
    },
    async deleteApartment(id) {
      apartments = apartments.filter((a) => a.id !== id);
      availability = availability.filter((r) => r.apartmentId !== id);
    },

    async listAvailability(apartmentId) {
      return availability.filter((r) => !apartmentId || r.apartmentId === apartmentId);
    },
    async setAvailability(r) {
      availability = [...availability, r];
    },
    async clearAvailability(apartmentId, start, end) {
      availability = availability.filter(
        (r) => !(r.apartmentId === apartmentId && r.start === start && r.end === end),
      );
    },

    async listBookings() {
      return [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async insertBooking(input) {
      const b: BookingRequest = {
        ...input,
        id: `req-${randomUUID()}`,
        status: "new",
        createdAt: new Date().toISOString(),
      };
      bookings.unshift(b);
      return b;
    },
    async updateBookingStatus(id, status) {
      const b = bookings.find((x) => x.id === id);
      if (b) b.status = status;
    },
  };
}

// ---------------------------------------------------------------------------
// Neon implementation
// ---------------------------------------------------------------------------

type Row = Record<string, any>;

function rowToApartment(r: Row): Apartment {
  const gallery: string[] = Array.isArray(r.gallery_image_urls) ? r.gallery_image_urls : [];
  return {
    id: r.id,
    slug: r.slug,
    sortOrder: r.sort_order ?? 0,
    title: { fr: r.name_fr, en: r.name_en, nl: r.name_nl },
    summary: { fr: r.short_desc_fr, en: r.short_desc_en, nl: r.short_desc_nl },
    description: { fr: r.long_desc_fr, en: r.long_desc_en, nl: r.long_desc_nl },
    images: [r.cover_image_url, ...gallery].filter(Boolean),
    maxGuests: r.guests,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    surfaceM2: r.size_m2,
    floor: r.floor ?? "",
    amenities: Array.isArray(r.amenities) ? r.amenities : [],
    pricePerNight: r.price_per_night,
    location: { lat: Number(r.lat), lng: Number(r.lng), address: r.address },
    practical: {
      checkIn: r.check_in,
      checkOut: r.check_out,
      rules: { fr: r.rules_fr, en: r.rules_en, nl: r.rules_nl },
    },
  };
}

function rowToRange(r: Row): AvailabilityRange {
  return {
    apartmentId: r.apartment_id,
    start: toDateStr(r.start_date),
    end: toDateStr(r.end_date),
    status: r.status as AvailabilityStatus,
    ...(r.expires_at ? { expiresAt: new Date(r.expires_at).toISOString() } : {}),
  };
}

function rowToBooking(r: Row): BookingRequest {
  return {
    id: r.id,
    apartmentId: r.apartment_id,
    arrival: toDateStr(r.arrival),
    departure: toDateStr(r.departure),
    guests: r.guests,
    name: r.guest_name,
    email: r.email,
    phone: r.phone ?? "",
    message: r.message ?? "",
    status: r.status as BookingStatus,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

/** Postgres date columns arrive as `Date` or `YYYY-MM-DD` string. Normalise. */
function toDateStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function neonRepo(): Repo {
  const sql = neon(env.NEON_DATABASE_URL);

  return {
    async listApartments() {
      const rows = await sql`SELECT * FROM apartments ORDER BY sort_order ASC, created_at ASC`;
      return rows.map(rowToApartment);
    },
    async getApartment(idOrSlug) {
      const rows =
        await sql`SELECT * FROM apartments WHERE id = ${idOrSlug} OR slug = ${idOrSlug} LIMIT 1`;
      return rows[0] ? rowToApartment(rows[0]) : null;
    },
    async upsertApartment(a) {
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
          cover_image_url, gallery_image_urls, updated_at
        ) VALUES (
          ${a.id}, ${a.slug}, ${a.sortOrder},
          ${a.title.fr}, ${a.title.en}, ${a.title.nl},
          ${a.summary.fr}, ${a.summary.en}, ${a.summary.nl},
          ${a.description.fr}, ${a.description.en}, ${a.description.nl},
          ${a.maxGuests}, ${a.bedrooms}, ${a.bathrooms}, ${a.surfaceM2}, ${a.floor},
          ${JSON.stringify(a.amenities)}::jsonb, ${a.practical.rules.fr}, ${a.practical.rules.en}, ${a.practical.rules.nl},
          ${a.practical.checkIn}, ${a.practical.checkOut},
          ${a.pricePerNight}, ${a.location.lat}, ${a.location.lng}, ${a.location.address},
          ${cover}, ${JSON.stringify(gallery)}::jsonb, now()
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug, sort_order = EXCLUDED.sort_order,
          name_fr = EXCLUDED.name_fr, name_en = EXCLUDED.name_en, name_nl = EXCLUDED.name_nl,
          short_desc_fr = EXCLUDED.short_desc_fr, short_desc_en = EXCLUDED.short_desc_en, short_desc_nl = EXCLUDED.short_desc_nl,
          long_desc_fr = EXCLUDED.long_desc_fr, long_desc_en = EXCLUDED.long_desc_en, long_desc_nl = EXCLUDED.long_desc_nl,
          guests = EXCLUDED.guests, bedrooms = EXCLUDED.bedrooms, bathrooms = EXCLUDED.bathrooms,
          size_m2 = EXCLUDED.size_m2, floor = EXCLUDED.floor,
          amenities = EXCLUDED.amenities,
          rules_fr = EXCLUDED.rules_fr, rules_en = EXCLUDED.rules_en, rules_nl = EXCLUDED.rules_nl,
          check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out,
          price_per_night = EXCLUDED.price_per_night, lat = EXCLUDED.lat, lng = EXCLUDED.lng, address = EXCLUDED.address,
          cover_image_url = EXCLUDED.cover_image_url, gallery_image_urls = EXCLUDED.gallery_image_urls,
          updated_at = now()
      `;
      return a;
    },
    async deleteApartment(id) {
      await sql`DELETE FROM apartments WHERE id = ${id}`;
    },

    async listAvailability(apartmentId) {
      const rows = apartmentId
        ? await sql`SELECT * FROM availability WHERE apartment_id = ${apartmentId} ORDER BY start_date ASC`
        : await sql`SELECT * FROM availability ORDER BY start_date ASC`;
      return rows.map(rowToRange);
    },
    async setAvailability(r) {
      await sql`
        INSERT INTO availability (id, apartment_id, start_date, end_date, status, expires_at)
        VALUES (${randomUUID()}, ${r.apartmentId}, ${r.start}, ${r.end}, ${r.status}, ${r.expiresAt ?? null})
      `;
    },
    async clearAvailability(apartmentId, start, end) {
      await sql`DELETE FROM availability WHERE apartment_id = ${apartmentId} AND start_date = ${start} AND end_date = ${end}`;
    },

    async listBookings() {
      const rows = await sql`SELECT * FROM booking_requests ORDER BY created_at DESC`;
      return rows.map(rowToBooking);
    },
    async insertBooking(input) {
      const id = `req-${randomUUID()}`;
      const rows = await sql`
        INSERT INTO booking_requests (id, apartment_id, guest_name, email, phone, arrival, departure, guests, message, status)
        VALUES (${id}, ${input.apartmentId}, ${input.name}, ${input.email}, ${input.phone}, ${input.arrival}, ${input.departure}, ${input.guests}, ${input.message}, 'new')
        RETURNING *
      `;
      return rowToBooking(rows[0]);
    },
    async updateBookingStatus(id, status) {
      await sql`UPDATE booking_requests SET status = ${status} WHERE id = ${id}`;
    },
  };
}

export const repo: Repo = flags.hasNeon ? neonRepo() : memoryRepo();
