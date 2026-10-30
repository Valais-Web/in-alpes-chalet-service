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
  source?: "airbnb"; // written by the Airbnb calendar sync — read-only in the admin
  /** Admin only (stripped from the public JSON): the range belongs to a booking
   * request, so it changes only through that request (confirm/decline). */
  fromRequest?: true;
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

/** Draft apartment fields scraped from a public Airbnb listing
 * (POST /api/admin/airbnb-import). Images are still Airbnb URLs: the admin
 * re-hosts them on Cloudinary before saving. Best-effort — see netlify/lib/airbnb.ts. */
export interface AirbnbImport {
  listingId: string;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  rules: LocalizedText;
  images: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  surfaceM2: number | null; // only when the description mentions it
  amenities: string[];
  location: { lat: number; lng: number; address: string };
  warnings: string[]; // fields that could not be read and need a manual check
}

/** Admin view of one apartment's Airbnb calendar sync (GET /api/admin/calendar-sync). */
export interface CalendarSyncStatus {
  apartmentId: string;
  importUrl: string; // Airbnb iCal export URL ("" = sync off)
  lastSyncedAt: string | null; // ISO datetime of the last successful feed check
  lastError: string | null;
  conflicts: { start: string; end: string }[]; // Airbnb reservations overlapping a site booking
}
