/**
 * Canonical domain types — the SINGLE source of truth shared by the client
 * (src/data/types.ts) and the Netlify Functions (netlify/lib/types.ts), which
 * both re-export from here. Type-only, so nothing is bundled at runtime and the
 * client/server code stay decoupled; this just stops the two copies from
 * drifting (they previously disagreed on `sortOrder`).
 */

export type Locale = "fr" | "en" | "nl";
export type LocalizedText = Record<Locale, string>;

export interface Apartment {
  id: string;
  slug: string;
  sortOrder: number;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  images: string[]; // Cloudinary URLs in production; legacy asset keys in fixtures
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  surfaceM2: number;
  floor: string;
  amenities: string[]; // amenity keys mapped via i18n
  pricePerNight: number; // CHF
  location: { lat: number; lng: number; address: string };
  practical: { checkIn: string; checkOut: string; rules: LocalizedText };
}

export type AvailabilityStatus = "free" | "booked" | "prebooked" | "blocked";

export interface AvailabilityRange {
  apartmentId: string;
  start: string; // ISO date YYYY-MM-DD
  end: string; // ISO date YYYY-MM-DD (inclusive)
  status: AvailabilityStatus;
  expiresAt?: string; // ISO datetime, only for `prebooked`
}

export type BookingStatus = "pending" | "accepted" | "declined" | "archived";

export interface BookingRequest {
  id: string;
  apartmentId: string;
  arrival: string;
  departure: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
}
