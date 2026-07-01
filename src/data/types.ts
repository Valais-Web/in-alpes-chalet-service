export type Locale = "fr" | "en" | "nl";

export type LocalizedText = Record<Locale, string>;

export interface Apartment {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  images: string[]; // asset keys resolved by getImage()
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  surfaceM2: number;
  floor: string;
  amenities: string[]; // amenity keys mapped via i18n
  pricePerNight: number; // CHF
  location: { lat: number; lng: number; address: string };
  practical: {
    checkIn: string;
    checkOut: string;
    rules: LocalizedText;
  };
}

export type AvailabilityStatus = "free" | "booked" | "prebooked" | "blocked";

export interface AvailabilityRange {
  apartmentId: string;
  start: string; // ISO date YYYY-MM-DD
  end: string;   // ISO date YYYY-MM-DD (inclusive)
  status: AvailabilityStatus;
  expiresAt?: string; // ISO datetime for prebooked entries
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
