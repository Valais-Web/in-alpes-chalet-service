/**
 * Data access layer — front-end only.
 *
 * ALL reads and writes are stubbed and operate on in-memory copies of the
 * JSON fixtures. Every function returns a Promise so a real API can drop in
 * later without changing any component.
 */
import apartmentsJson from "./apartments.json";
import availabilityJson from "./availability.json";
import type {
  Apartment,
  AvailabilityRange,
  AvailabilityStatus,
  BookingRequest,
  BookingStatus,
} from "./types";

import apt1 from "@/assets/apt-1.jpg";
import apt2 from "@/assets/apt-2.jpg";
import apt3 from "@/assets/apt-3.jpg";
import apt4 from "@/assets/apt-4.jpg";

const IMAGE_MAP: Record<string, string> = {
  "apt-1": apt1,
  "apt-2": apt2,
  "apt-3": apt3,
  "apt-4": apt4,
};

export function resolveImage(key: string): string {
  return IMAGE_MAP[key] ?? apt1;
}

// --- in-memory stores (reset on reload; simulates a backend) ---
let apartments: Apartment[] = JSON.parse(JSON.stringify(apartmentsJson));
let availability: AvailabilityRange[] = JSON.parse(JSON.stringify(availabilityJson));
let bookings: BookingRequest[] = [
  {
    id: "req-demo-1",
    apartmentId: "apt-01",
    arrival: "2026-12-20",
    departure: "2026-12-27",
    guests: 4,
    name: "Sophie Martin",
    email: "sophie@example.com",
    phone: "+41 79 123 45 67",
    message: "Bonjour, nous serions intéressés pour la semaine de Noël.",
    status: "new",
    createdAt: new Date().toISOString(),
  },
];

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

// --- effective status: expired prebooked -> free ---
export function effectiveStatus(r: AvailabilityRange): AvailabilityStatus {
  if (r.status === "prebooked" && r.expiresAt && new Date(r.expiresAt) < new Date()) {
    return "free";
  }
  return r.status;
}

// --- Apartments ---
export async function listApartments(): Promise<Apartment[]> {
  await delay();
  return apartments;
}

export async function getApartmentBySlug(slug: string): Promise<Apartment | null> {
  await delay();
  return apartments.find((a) => a.slug === slug) ?? null;
}

export async function upsertApartment(apt: Apartment): Promise<Apartment> {
  await delay();
  const idx = apartments.findIndex((a) => a.id === apt.id);
  if (idx >= 0) apartments[idx] = apt;
  else apartments = [...apartments, apt];
  return apt;
}

export async function deleteApartment(id: string): Promise<void> {
  await delay();
  apartments = apartments.filter((a) => a.id !== id);
}

// --- Availability ---
export async function listAvailability(apartmentId: string): Promise<AvailabilityRange[]> {
  await delay();
  return availability
    .filter((r) => r.apartmentId === apartmentId)
    .map((r) => ({ ...r, status: effectiveStatus(r) }));
}

export async function setAvailability(range: AvailabilityRange): Promise<void> {
  await delay();
  availability = [...availability, range];
}

export async function clearAvailability(apartmentId: string, start: string, end: string): Promise<void> {
  await delay();
  availability = availability.filter(
    (r) => !(r.apartmentId === apartmentId && r.start === start && r.end === end),
  );
}

// --- Bookings ---
export async function submitBookingRequest(
  input: Omit<BookingRequest, "id" | "status" | "createdAt">,
): Promise<BookingRequest> {
  await delay(400);
  const req: BookingRequest = {
    ...input,
    id: `req-${Date.now()}`,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  bookings = [req, ...bookings];
  // simulate soft-hold: mark the period as prebooked in local data
  availability = [
    ...availability,
    {
      apartmentId: input.apartmentId,
      start: input.arrival,
      end: input.departure,
      status: "prebooked",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  return req;
}

export async function listBookings(): Promise<BookingRequest[]> {
  await delay();
  return bookings;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  await delay();
  bookings = bookings.map((b) => (b.id === id ? { ...b, status } : b));
}
