/**
 * Zod schemas — the single validation boundary for every write.
 * CLAUDE.md §13: "Valider les entrées (Zod) dans toute function qui écrit."
 */
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const localized = z.object({
  fr: z.string().min(1),
  en: z.string().default(""),
  nl: z.string().default(""),
});

/** Public booking request (from the site form). */
export const bookingInputSchema = z
  .object({
    apartmentId: z.string().min(1),
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
  });
export type BookingInput = z.infer<typeof bookingInputSchema>;

/** Admin: create/update an apartment. */
export const apartmentInputSchema = z.object({
  id: z.string().min(1).optional(), // absent → create
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  sortOrder: z.coerce.number().int().default(0),
  title: localized,
  summary: localized,
  description: localized,
  images: z.array(z.string().url()).default([]),
  maxGuests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  surfaceM2: z.coerce.number().int().min(1),
  floor: z.string().default(""),
  amenities: z.array(z.string()).default([]),
  pricePerNight: z.coerce.number().int().min(0),
  location: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    address: z.string().min(1),
  }),
  practical: z.object({
    checkIn: z.string().default("16:00"),
    checkOut: z.string().default("10:00"),
    rules: localized,
  }),
});
export type ApartmentInput = z.infer<typeof apartmentInputSchema>;

/** Admin: set a status on a date range. */
export const availabilityInputSchema = z
  .object({
    apartmentId: z.string().min(1),
    start: isoDate,
    end: isoDate,
    status: z.enum(["free", "booked", "prebooked", "blocked"]),
    expiresAt: z.string().datetime().optional(),
  })
  .refine((v) => v.end >= v.start, {
    message: "end_must_be_on_or_after_start",
    path: ["end"],
  });
export type AvailabilityInput = z.infer<typeof availabilityInputSchema>;

/** Admin: clear a range. */
export const availabilityClearSchema = z.object({
  apartmentId: z.string().min(1),
  start: isoDate,
  end: isoDate,
});

/** Admin: booking status transition + resulting availability action. */
export const requestUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "in_progress", "answered", "archived"]),
  /** confirm → block the range; decline → free it. */
  action: z.enum(["confirm", "decline", "none"]).default("none"),
});
export type RequestUpdate = z.infer<typeof requestUpdateSchema>;
