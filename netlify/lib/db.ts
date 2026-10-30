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
import { env, flags, assertProductionSecrets } from "./env";
import type { CalendarOp } from "./bookingTransitions";
import { subtractRanges } from "./dates";
import type {
  Apartment,
  AvailabilityRange,
  AvailabilityStatus,
  BookingRequest,
  BookingStatus,
} from "./types";

import seedApartments from "../../src/data/apartments.json";
import seedAvailability from "../../src/data/availability.json";

/** Thrown when a hold/booking would overlap an existing non-free range. Maps to
 * HTTP 409 at the boundary. Raised by the DB exclusion constraint (code 23P01)
 * or the in-memory overlap check. */
export class AvailabilityConflictError extends Error {
  constructor() {
    super("availability_conflict");
    this.name = "AvailabilityConflictError";
  }
}

/** Thrown when deleting an apartment is blocked because booking records still
 * reference it (FK is ON DELETE RESTRICT). Maps to HTTP 409. */
export class ApartmentHasBookingsError extends Error {
  constructor() {
    super("apartment_has_bookings");
    this.name = "ApartmentHasBookingsError";
  }
}

/** New booking + the range it occupies (`[arrival, holdEnd]` inclusive nights). */
export interface NewBooking {
  input: Omit<BookingRequest, "id" | "status" | "createdAt">;
  holdEnd: string; // last occupied night = departure - 1 day
  expiresAt: string;
}

/** A site-owned availability row (not from Airbnb), as the calendar sync sees it. */
export interface SyncRow {
  start: string;
  end: string;
  status: AvailabilityStatus;
  bookingRequestId: string | null; // set ⇔ the row is a guest booking/hold from the site
}

export interface Repo {
  listApartments(): Promise<Apartment[]>;
  getApartment(idOrSlug: string): Promise<Apartment | null>;
  upsertApartment(a: Apartment): Promise<Apartment>;
  deleteApartment(id: string): Promise<void>;

  listAvailability(apartmentId?: string): Promise<AvailabilityRange[]>;
  setAvailability(r: AvailabilityRange): Promise<void>;
  /** Delete one manual range (exact match). Airbnb rows and booking-owned rows
   * are never deleted here: they change only through the sync or the request. */
  clearAvailability(apartmentId: string, start: string, end: string): Promise<void>;
  /** Make `[start,end]` free: delete or trim every manual (site, non-booking)
   * range overlapping it. Booking-owned and Airbnb rows are left alone. */
  freeRange(apartmentId: string, start: string, end: string): Promise<void>;

  listBookings(): Promise<BookingRequest[]>;
  /**
   * Atomically: purge this apartment's expired holds, insert the request, and
   * lay the pre-reservation hold — in one transaction. Throws
   * AvailabilityConflictError if the hold overlaps a live booked/blocked/valid
   * pre-reserved range. Replaces the old non-transactional insert+hold pair.
   */
  createBooking(b: NewBooking): Promise<BookingRequest>;
  /**
   * Apply an owner decision atomically: set the request status and run the
   * resolved calendar op (book / unbook / none) in the same
   * transaction, always scoped to THIS request's own availability rows. `book`
   * throws AvailabilityConflictError if the firm range would overlap another
   * confirmed range. See bookingTransitions.ts for how the op is derived.
   */
  decideBooking(d: BookingDecision): Promise<void>;

  // Maintenance (retention scheduled function) --------------------------------
  /** Strip PII from bookings whose departure is before `cutoffDate` (ISO). Keeps
   * the row (dates/apartment/status) for business records. Returns the count. */
  anonymizeBookingsBefore(cutoffDate: string): Promise<number>;
  /** Delete expired pre-reservation holds. Returns the count removed. */
  purgeExpiredHolds(): Promise<number>;

  // Airbnb calendar sync (calendarSync.ts) -------------------------------------
  /** Every apartment with its Airbnb iCal URL ("" when sync is off). */
  listCalendarSync(): Promise<{ apartmentId: string; importUrl: string }[]>;
  setCalendarSyncUrl(apartmentId: string, importUrl: string): Promise<void>;
  /** The apartment's own (non-Airbnb) rows, which always take precedence. */
  listSiteRowsForSync(apartmentId: string): Promise<SyncRow[]>;
  /** Atomically replace all of the apartment's Airbnb rows. Throws
   * AvailabilityConflictError if a site booking landed in between. */
  replaceAirbnbRanges(
    apartmentId: string,
    ranges: { start: string; end: string; status: "booked" | "blocked" }[],
  ): Promise<void>;
}

/** Do two inclusive `[start,end]` day ranges overlap? */
function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Postgres exclusion-constraint violation (availability_no_overlap). */
function isOverlapViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23P01";
}

/** Postgres foreign-key violation (e.g. delete blocked by ON DELETE RESTRICT). */
function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23503";
}

/** An owner's decision on a booking request + the range it covers. `op` is the
 * calendar mutation resolved from the request's current + target status (see
 * bookingTransitions.ts); it always acts on this request's OWN availability rows
 * (never by date overlap), so it can't disturb another guest's soft hold. */
export interface BookingDecision {
  id: string;
  status: BookingStatus;
  apartmentId: string;
  arrival: string;
  lastNight: string; // departure - 1 (checkout day stays free)
  op: CalendarOp;
}

/** Confirmed-unavailable statuses. A soft `prebooked` hold does NOT block a new
 * request (CLAUDE.md §5) — only these do. */
const BLOCKING: readonly string[] = ["booked", "blocked"];

// ---------------------------------------------------------------------------
// In-memory implementation (dev fallback)
// ---------------------------------------------------------------------------

/** Availability as stored internally: the public range plus the owning booking
 * request (mirrors availability.booking_request_id). `bookingRequestId` is
 * stripped before the range is exposed/published — it must never leak into the
 * public availability.json. */
type StoredRange = AvailabilityRange & { bookingRequestId?: string };

/** Drop the internal owner id before a range crosses the repo boundary (the
 * admin only learns THAT a request owns it; publish strips even that). */
function toPublicRange({ bookingRequestId, ...pub }: StoredRange): AvailabilityRange {
  return bookingRequestId ? { ...pub, fromRequest: true } : pub;
}

function seedApartmentList(): Apartment[] {
  return (seedApartments as Omit<Apartment, "sortOrder">[]).map((a, i) => ({
    ...a,
    sortOrder: i,
  }));
}

function memoryRepo(): Repo {
  let apartments: Apartment[] = seedApartmentList();
  let availability: StoredRange[] = JSON.parse(JSON.stringify(seedAvailability));
  const bookings: BookingRequest[] = [];
  const syncUrls = new Map<string, string>();

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
      if (bookings.some((b) => b.apartmentId === id)) throw new ApartmentHasBookingsError();
      apartments = apartments.filter((a) => a.id !== id);
      availability = availability.filter((r) => r.apartmentId !== id);
    },

    async listAvailability(apartmentId) {
      return availability
        .filter((r) => !apartmentId || r.apartmentId === apartmentId)
        .map(toPublicRange);
    },
    async setAvailability(r) {
      if (BLOCKING.includes(r.status)) {
        const clash = availability.some(
          (x) =>
            x.apartmentId === r.apartmentId &&
            BLOCKING.includes(x.status) &&
            rangesOverlap(r.start, r.end, x.start, x.end),
        );
        if (clash) throw new AvailabilityConflictError();
      }
      availability = [...availability, r];
    },
    async clearAvailability(apartmentId, start, end) {
      // Airbnb rows are owned by the sync and would come straight back;
      // booking-owned rows must go through the request (decline).
      availability = availability.filter(
        (r) =>
          r.source === "airbnb" ||
          Boolean(r.bookingRequestId) ||
          !(r.apartmentId === apartmentId && r.start === start && r.end === end),
      );
    },
    async freeRange(apartmentId, start, end) {
      const free = { start, end };
      availability = availability.flatMap((r) =>
        r.apartmentId !== apartmentId ||
        r.source === "airbnb" ||
        r.bookingRequestId ||
        !rangesOverlap(r.start, r.end, start, end)
          ? [r]
          : subtractRanges(r, [free]).map((p) => ({ ...r, ...p })),
      );
    },

    async listBookings() {
      return [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async createBooking({ input, holdEnd, expiresAt }) {
      const now = new Date();
      // Purge this apartment's expired holds, mirroring the Neon transaction.
      availability = availability.filter(
        (r) =>
          !(
            r.apartmentId === input.apartmentId &&
            r.status === "prebooked" &&
            r.expiresAt &&
            new Date(r.expiresAt) < now
          ),
      );
      // Reject only overlaps with a CONFIRMED-unavailable range (booked/blocked);
      // soft pre-reservations may overlap (CLAUDE.md §5).
      const clash = availability.some(
        (r) =>
          r.apartmentId === input.apartmentId &&
          BLOCKING.includes(r.status) &&
          rangesOverlap(input.arrival, holdEnd, r.start, r.end),
      );
      if (clash) throw new AvailabilityConflictError();

      const b: BookingRequest = {
        ...input,
        id: `req-${randomUUID()}`,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      bookings.unshift(b);
      availability = [
        ...availability,
        {
          apartmentId: input.apartmentId,
          start: input.arrival,
          end: holdEnd,
          status: "prebooked",
          expiresAt,
          bookingRequestId: b.id,
        },
      ];
      return b;
    },
    async decideBooking({ id, status, apartmentId, arrival, lastNight, op }) {
      // Availability moves FIRST so that, if `book` overlaps a confirmed range,
      // we throw before touching the request status — mirroring the atomic Neon
      // transaction (status and calendar never drift apart).
      if (op === "book") {
        const clash = availability.some(
          (r) =>
            r.apartmentId === apartmentId &&
            r.bookingRequestId !== id &&
            BLOCKING.includes(r.status) &&
            rangesOverlap(arrival, lastNight, r.start, r.end),
        );
        if (clash) throw new AvailabilityConflictError();
        // Replace this request's own hold and/or earlier booked range with one
        // firm range (idempotent: re-confirming never duplicates).
        availability = availability.filter(
          (r) =>
            !(r.bookingRequestId === id && (r.status === "prebooked" || r.status === "booked")),
        );
        availability.push({
          apartmentId,
          start: arrival,
          end: lastNight,
          status: "booked",
          bookingRequestId: id,
        });
      } else if (op === "unbook") {
        // Reverse this request's confirmed booking (and any hold it still owns),
        // never another guest's overlapping range.
        availability = availability.filter(
          (r) =>
            !(r.bookingRequestId === id && (r.status === "booked" || r.status === "prebooked")),
        );
      }
      const b = bookings.find((x) => x.id === id);
      if (b) b.status = status;
    },

    async anonymizeBookingsBefore(cutoffDate) {
      let n = 0;
      for (const b of bookings) {
        if (b.departure < cutoffDate && b.email !== "") {
          b.name = "[removed]";
          b.email = "";
          b.phone = "";
          b.message = "";
          n++;
        }
      }
      return n;
    },
    async purgeExpiredHolds() {
      const now = new Date();
      const before = availability.length;
      availability = availability.filter(
        (r) => !(r.status === "prebooked" && r.expiresAt && new Date(r.expiresAt) < now),
      );
      return before - availability.length;
    },

    async listCalendarSync() {
      return [...apartments]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((a) => ({ apartmentId: a.id, importUrl: syncUrls.get(a.id) ?? "" }));
    },
    async setCalendarSyncUrl(apartmentId, importUrl) {
      if (importUrl) syncUrls.set(apartmentId, importUrl);
      else syncUrls.delete(apartmentId);
    },
    async listSiteRowsForSync(apartmentId) {
      return availability
        .filter((r) => r.apartmentId === apartmentId && r.source !== "airbnb")
        .map((r) => ({
          start: r.start,
          end: r.end,
          status: r.status,
          bookingRequestId: r.bookingRequestId ?? null,
        }));
    },
    async replaceAirbnbRanges(apartmentId, ranges) {
      const kept = availability.filter(
        (r) => !(r.apartmentId === apartmentId && r.source === "airbnb"),
      );
      const clash = ranges.some((n) =>
        kept.some(
          (r) =>
            r.apartmentId === apartmentId &&
            BLOCKING.includes(r.status) &&
            rangesOverlap(n.start, n.end, r.start, r.end),
        ),
      );
      if (clash) throw new AvailabilityConflictError();
      availability = [
        ...kept,
        ...ranges.map((n) => ({ apartmentId, ...n, source: "airbnb" as const })),
      ];
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
    ...(r.source === "airbnb" ? { source: "airbnb" as const } : {}),
    ...(r.booking_request_id ? { fromRequest: true as const } : {}),
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
      try {
        await sql`DELETE FROM apartments WHERE id = ${id}`;
      } catch (err) {
        if (isForeignKeyViolation(err)) throw new ApartmentHasBookingsError();
        throw err;
      }
    },

    async listAvailability(apartmentId) {
      const rows = apartmentId
        ? await sql`SELECT * FROM availability WHERE apartment_id = ${apartmentId} ORDER BY start_date ASC`
        : await sql`SELECT * FROM availability ORDER BY start_date ASC`;
      return rows.map(rowToRange);
    },
    async setAvailability(r) {
      try {
        await sql`
          INSERT INTO availability (id, apartment_id, start_date, end_date, status, expires_at)
          VALUES (${randomUUID()}, ${r.apartmentId}, ${r.start}, ${r.end}, ${r.status}, ${r.expiresAt ?? null})
        `;
      } catch (err) {
        if (isOverlapViolation(err)) throw new AvailabilityConflictError();
        throw err;
      }
    },
    async clearAvailability(apartmentId, start, end) {
      // Airbnb rows are owned by the sync and would come straight back;
      // booking-owned rows must go through the request (decline).
      await sql`DELETE FROM availability WHERE apartment_id = ${apartmentId} AND start_date = ${start} AND end_date = ${end} AND source IS NULL AND booking_request_id IS NULL`;
    },
    async freeRange(apartmentId, start, end) {
      const rows = await sql`
        SELECT * FROM availability
        WHERE apartment_id = ${apartmentId} AND source IS NULL AND booking_request_id IS NULL
          AND daterange(start_date, end_date, '[]') && daterange(${start}, ${end}, '[]')
      `;
      if (!rows.length) return;
      // Delete the overlapping rows and re-insert what lies outside [start,end],
      // in one transaction. Only shrinking, so the exclusion constraint can't fire.
      const stmts = rows.map((r) => sql`DELETE FROM availability WHERE id = ${r.id}`);
      for (const r of rows) {
        const range = rowToRange(r);
        for (const p of subtractRanges(range, [{ start, end }])) {
          stmts.push(sql`
            INSERT INTO availability (id, apartment_id, start_date, end_date, status, expires_at)
            VALUES (${randomUUID()}, ${apartmentId}, ${p.start}, ${p.end}, ${range.status}, ${r.expires_at ?? null})
          `);
        }
      }
      await sql.transaction(stmts);
    },

    async listBookings() {
      const rows = await sql`SELECT * FROM booking_requests ORDER BY created_at DESC`;
      return rows.map(rowToBooking);
    },
    async createBooking({ input, holdEnd, expiresAt }) {
      // Reject if the requested nights overlap a CONFIRMED-unavailable range.
      // (The soft hold we insert is 'prebooked', which the exclusion constraint
      // deliberately ignores, so this explicit check is what enforces it.
      // booked/blocked only ever change via owner confirmation, so the tiny
      // read-then-write window here is immaterial; the constraint still makes it
      // impossible for the owner to confirm two overlapping bookings.)
      const clash = await sql`
        SELECT 1 FROM availability
        WHERE apartment_id = ${input.apartmentId}
          AND status IN ('booked','blocked')
          AND daterange(start_date, end_date, '[]') && daterange(${input.arrival}, ${holdEnd}, '[]')
        LIMIT 1
      `;
      if (clash.length) throw new AvailabilityConflictError();

      const id = `req-${randomUUID()}`;
      // One atomic transaction: purge this apartment's expired holds → insert
      // the request → lay the new hold. Either all commit or none, so a failure
      // can never leave a request without its hold.
      const results = await sql.transaction([
        sql`
          DELETE FROM availability
          WHERE apartment_id = ${input.apartmentId}
            AND status = 'prebooked'
            AND expires_at IS NOT NULL
            AND expires_at < now()
        `,
        sql`
          INSERT INTO booking_requests (id, apartment_id, guest_name, email, phone, arrival, departure, guests, message, status)
          VALUES (${id}, ${input.apartmentId}, ${input.name}, ${input.email}, ${input.phone}, ${input.arrival}, ${input.departure}, ${input.guests}, ${input.message}, 'pending')
          RETURNING *
        `,
        sql`
          INSERT INTO availability (id, apartment_id, start_date, end_date, status, expires_at, booking_request_id)
          VALUES (${randomUUID()}, ${input.apartmentId}, ${input.arrival}, ${holdEnd}, 'prebooked', ${expiresAt}, ${id})
        `,
      ]);
      return rowToBooking((results[1] as Row[])[0]);
    },
    async decideBooking({ id, status, apartmentId, arrival, lastNight, op }) {
      const stmts = [sql`UPDATE booking_requests SET status = ${status} WHERE id = ${id}`];
      // Every calendar op targets only THIS request's own rows
      // (booking_request_id), so acting on one request never frees or removes
      // another guest's overlapping soft hold (CLAUDE.md §5).
      if (op === "book") {
        // Replace this request's hold and/or earlier booked range with one firm
        // range (idempotent: re-confirming never duplicates); the exclusion
        // constraint rejects an overlap with another confirmed range, rolling
        // back the whole decision.
        stmts.push(
          sql`DELETE FROM availability WHERE booking_request_id = ${id} AND status IN ('prebooked','booked')`,
        );
        stmts.push(sql`
          INSERT INTO availability (id, apartment_id, start_date, end_date, status, booking_request_id)
          VALUES (${randomUUID()}, ${apartmentId}, ${arrival}, ${lastNight}, 'booked', ${id})
        `);
      } else if (op === "unbook") {
        // Reverse this request's confirmed booking + any hold it still owns.
        stmts.push(
          sql`DELETE FROM availability WHERE booking_request_id = ${id} AND status IN ('booked','prebooked')`,
        );
      }
      try {
        await sql.transaction(stmts);
      } catch (err) {
        if (isOverlapViolation(err)) throw new AvailabilityConflictError();
        throw err;
      }
    },

    async anonymizeBookingsBefore(cutoffDate) {
      const rows = await sql`
        UPDATE booking_requests
        SET guest_name = '[removed]', email = '', phone = NULL, message = NULL
        WHERE departure < ${cutoffDate} AND email <> ''
        RETURNING id
      `;
      return rows.length;
    },
    async purgeExpiredHolds() {
      const rows = await sql`
        DELETE FROM availability
        WHERE status = 'prebooked' AND expires_at IS NOT NULL AND expires_at < now()
        RETURNING id
      `;
      return rows.length;
    },

    async listCalendarSync() {
      const rows = await sql`
        SELECT a.id, COALESCE(c.import_url, '') AS import_url
        FROM apartments a LEFT JOIN calendar_sync c ON c.apartment_id = a.id
        ORDER BY a.sort_order ASC, a.created_at ASC
      `;
      return rows.map((r) => ({ apartmentId: r.id as string, importUrl: r.import_url as string }));
    },
    async setCalendarSyncUrl(apartmentId, importUrl) {
      if (!importUrl) {
        await sql`DELETE FROM calendar_sync WHERE apartment_id = ${apartmentId}`;
        return;
      }
      await sql`
        INSERT INTO calendar_sync (apartment_id, import_url, updated_at)
        VALUES (${apartmentId}, ${importUrl}, now())
        ON CONFLICT (apartment_id) DO UPDATE SET import_url = EXCLUDED.import_url, updated_at = now()
      `;
    },
    async listSiteRowsForSync(apartmentId) {
      const rows = await sql`
        SELECT start_date, end_date, status, booking_request_id FROM availability
        WHERE apartment_id = ${apartmentId} AND source IS NULL
      `;
      return rows.map((r) => ({
        start: toDateStr(r.start_date),
        end: toDateStr(r.end_date),
        status: r.status as AvailabilityStatus,
        bookingRequestId: (r.booking_request_id as string | null) ?? null,
      }));
    },
    async replaceAirbnbRanges(apartmentId, ranges) {
      try {
        await sql.transaction([
          sql`DELETE FROM availability WHERE apartment_id = ${apartmentId} AND source = 'airbnb'`,
          ...ranges.map(
            (n) => sql`
              INSERT INTO availability (id, apartment_id, start_date, end_date, status, source)
              VALUES (${randomUUID()}, ${apartmentId}, ${n.start}, ${n.end}, ${n.status}, 'airbnb')
            `,
          ),
        ]);
      } catch (err) {
        if (isOverlapViolation(err)) throw new AvailabilityConflictError();
        throw err;
      }
    },
  };
}

// Fail fast rather than silently serving from the in-memory repo in production.
assertProductionSecrets();

export const repo: Repo = flags.hasNeon ? neonRepo() : memoryRepo();
