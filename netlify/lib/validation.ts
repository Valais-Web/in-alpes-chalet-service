/**
 * Zod schemas — the single validation boundary for every write.
 * CLAUDE.md §13: "Valider les entrées (Zod) dans toute function qui écrit."
 */
import { z } from "zod";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** A real `YYYY-MM-DD` calendar date — the regex alone would accept 2026-02-31,
 * so we round-trip through Date to reject impossible dates. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "not a real calendar date");

const MAX_TEXT = 5000;
const localized = z.object({
  fr: z.string().min(1).max(MAX_TEXT),
  en: z.string().max(MAX_TEXT).default(""),
  nl: z.string().max(MAX_TEXT).default(""),
});

/** An image must be a Cloudinary HTTPS URL (what admin uploads produce) or a
 * legacy kebab asset key — never an arbitrary/`javascript:`/external string. */
const imageRef = z
  .string()
  .min(1)
  .max(500)
  .refine(
    (s) => /^https:\/\/res\.cloudinary\.com\/[\w./,-]+$/.test(s) || /^[a-z0-9-]+$/.test(s),
    "image must be a Cloudinary HTTPS URL or an asset key",
  );

/** Public booking request (from the site form). */
export const bookingInputSchema = z
  .object({
    apartmentId: z.string().min(1).max(120),
    arrival: isoDate,
    departure: isoDate,
    guests: z.coerce.number().int().min(1).max(30),
    name: z.string().min(1).max(120),
    email: z.string().email().max(200),
    phone: z.string().min(3).max(40),
    message: z.string().max(2000).default(""),
    locale: z.enum(["fr", "en", "nl"]).optional(), // for the guest acknowledgement email
  })
  .refine((v) => v.departure > v.arrival, {
    message: "departure_must_be_after_arrival",
    path: ["departure"],
  })
  .refine((v) => v.arrival >= todayISO(), {
    message: "arrival_in_past",
    path: ["arrival"],
  });
export type BookingInput = z.infer<typeof bookingInputSchema>;

/** Public contact-page message. */
export const contactInputSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().default(""),
  message: z.string().min(1).max(4000),
});
export type ContactInput = z.infer<typeof contactInputSchema>;

/** Admin: create/update an apartment. */
export const apartmentInputSchema = z.object({
  id: z.string().min(1).max(120).optional(), // absent → create
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  title: localized,
  summary: localized,
  description: localized,
  images: z.array(imageRef).max(30).default([]),
  maxGuests: z.coerce.number().int().min(1).max(50),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(0).max(50),
  surfaceM2: z.coerce.number().int().min(1).max(5000),
  floor: z.string().max(40).default(""),
  amenities: z.array(z.string().min(1).max(60)).max(50).default([]),
  pricePerNight: z.coerce.number().int().min(0).max(1_000_000),
  location: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    address: z.string().min(1).max(300),
  }),
  practical: z.object({
    checkIn: z.string().max(20).default("16:00"),
    checkOut: z.string().max(20).default("10:00"),
    rules: localized,
  }),
});
export type ApartmentInput = z.infer<typeof apartmentInputSchema>;

/** Admin: set a status on a date range. */
export const availabilityInputSchema = z
  .object({
    apartmentId: z.string().min(1).max(120),
    start: isoDate,
    end: isoDate,
    status: z.enum(["free", "booked", "prebooked", "blocked"]),
    expiresAt: z.string().datetime().optional(),
  })
  .refine((v) => v.end >= v.start, {
    message: "end_must_be_on_or_after_start",
    path: ["end"],
  })
  .refine((v) => v.status !== "prebooked" || Boolean(v.expiresAt), {
    message: "prebooked_requires_expiresAt",
    path: ["expiresAt"],
  });
export type AvailabilityInput = z.infer<typeof availabilityInputSchema>;

/** Admin: clear a range. */
export const availabilityClearSchema = z.object({
  apartmentId: z.string().min(1),
  start: isoDate,
  end: isoDate,
});

/** Admin: booking status transition + resulting availability action.
 * The status and action must be consistent so the request status can never
 * disagree with the calendar (e.g. a declined request that also books dates):
 *   accepted ⇔ confirm,  declined ⇔ decline,  pending/archived ⇔ none. */
export const requestUpdateSchema = z
  .object({
    id: z.string().min(1).max(120),
    status: z.enum(["pending", "accepted", "declined", "archived"]),
    action: z.enum(["confirm", "decline", "none"]).default("none"),
  })
  .refine(
    (v) => {
      if (v.status === "accepted") return v.action === "confirm";
      if (v.status === "declined") return v.action === "decline";
      return v.action === "none"; // pending, archived
    },
    { message: "invalid_status_action_combo", path: ["action"] },
  );
export type RequestUpdate = z.infer<typeof requestUpdateSchema>;
