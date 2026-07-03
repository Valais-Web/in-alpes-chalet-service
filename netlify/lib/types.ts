/**
 * Server-side domain types. Kept in sync with src/data/types.ts by hand —
 * the two layers are deliberately decoupled (the client never imports server
 * code and vice-versa), so this small duplication is intentional.
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
  images: string[]; // Cloudinary URLs in production
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  surfaceM2: number;
  floor: string;
  amenities: string[];
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

export type BookingStatus = "new" | "in_progress" | "answered" | "archived";

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
