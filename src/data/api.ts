/**
 * Data access layer — front-end only.
 *
 * Two interchangeable implementations behind one API:
 *   • STUB (default): in-memory copies of the JSON fixtures. Zero config, used
 *     for local UI work and preview builds.
 *   • LIVE (VITE_API_MODE="live"): talks to the Netlify Functions. Reads come
 *     from the published JSON via /api/content (never Neon directly — CLAUDE.md
 *     §3); writes go to the /api/admin/* + /api/submit-booking endpoints.
 *
 * Components never know which is active — they just call these functions.
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

const LIVE = import.meta.env.VITE_API_MODE === "live";

const IMAGE_MAP: Record<string, string> = {
  "apt-1": apt1,
  "apt-2": apt2,
  "apt-3": apt3,
  "apt-4": apt4,
};

/** Cloudinary URLs pass through; fixture keys resolve to bundled assets. */
export function resolveImage(key: string): string {
  if (/^https?:\/\//.test(key)) return key;
  return IMAGE_MAP[key] ?? apt1;
}

/** Expired pre-reservations read as free (computed client-side, CLAUDE.md §5). */
export function effectiveStatus(r: AvailabilityRange): AvailabilityStatus {
  if (r.status === "prebooked" && r.expiresAt && new Date(r.expiresAt) < new Date()) {
    return "free";
  }
  return r.status;
}

// ---------------------------------------------------------------------------
// LIVE transport
// ---------------------------------------------------------------------------

/**
 * Called whenever an admin API call returns 401 — the client-side "logged in"
 * flag (sessionStorage) has no expiry, but the server session cookie does, so
 * they can desync. AdminAuth registers a handler that forces a re-login instead
 * of letting the admin silently render empty lists.
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin" });
  if (res.status === 401) onUnauthorized?.();
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiSend<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) onUnauthorized?.();
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${method} ${path} failed: ${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// STUB in-memory stores
// ---------------------------------------------------------------------------

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
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Apartments
// ---------------------------------------------------------------------------

export async function listApartments(): Promise<Apartment[]> {
  if (LIVE) return apiGet<Apartment[]>("/api/content?type=apartments");
  await delay();
  return apartments;
}

export async function getApartmentBySlug(slug: string): Promise<Apartment | null> {
  if (LIVE) {
    const all = await listApartments();
    return all.find((a) => a.slug === slug) ?? null;
  }
  await delay();
  return apartments.find((a) => a.slug === slug) ?? null;
}

export async function upsertApartment(apt: Apartment): Promise<Apartment> {
  if (LIVE) {
    const { apartment } = await apiSend<{ apartment: Apartment }>(
      "POST",
      "/api/admin/apartments",
      apt,
    );
    return apartment;
  }
  await delay();
  const idx = apartments.findIndex((a) => a.id === apt.id);
  if (idx >= 0) apartments[idx] = apt;
  else apartments = [...apartments, apt];
  return apt;
}

export async function deleteApartment(id: string): Promise<void> {
  if (LIVE) {
    await apiSend("DELETE", `/api/admin/apartments?id=${encodeURIComponent(id)}`);
    return;
  }
  await delay();
  apartments = apartments.filter((a) => a.id !== id);
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export async function listAvailability(apartmentId: string): Promise<AvailabilityRange[]> {
  if (LIVE) {
    const all = await apiGet<AvailabilityRange[]>("/api/content?type=availability");
    return all
      .filter((r) => r.apartmentId === apartmentId)
      .map((r) => ({ ...r, status: effectiveStatus(r) }));
  }
  await delay();
  return availability
    .filter((r) => r.apartmentId === apartmentId)
    .map((r) => ({ ...r, status: effectiveStatus(r) }));
}

export async function setAvailability(range: AvailabilityRange): Promise<void> {
  if (LIVE) {
    await apiSend("POST", "/api/admin/availability", range);
    return;
  }
  await delay();
  availability = [...availability, range];
}

export async function clearAvailability(
  apartmentId: string,
  start: string,
  end: string,
): Promise<void> {
  if (LIVE) {
    await apiSend("DELETE", "/api/admin/availability", { apartmentId, start, end });
    return;
  }
  await delay();
  availability = availability.filter(
    (r) => !(r.apartmentId === apartmentId && r.start === start && r.end === end),
  );
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function submitBookingRequest(
  input: Omit<BookingRequest, "id" | "status" | "createdAt"> & { locale?: string },
): Promise<{ ok: true; id: string }> {
  if (LIVE) {
    return apiSend<{ ok: true; id: string }>("POST", "/api/submit-booking", input);
  }
  await delay(400);
  const req: BookingRequest = {
    ...input,
    id: `req-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  bookings = [req, ...bookings];
  availability = [
    ...availability,
    {
      apartmentId: input.apartmentId,
      start: input.arrival,
      end: input.departure,
      status: "prebooked",
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    },
  ];
  return { ok: true, id: req.id };
}

export async function submitContact(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<{ ok: true }> {
  if (LIVE) return apiSend<{ ok: true }>("POST", "/api/contact", input);
  await delay(400);
  return { ok: true };
}

export async function listBookings(): Promise<BookingRequest[]> {
  if (LIVE) return apiGet<BookingRequest[]>("/api/admin/requests");
  await delay();
  return bookings;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  action: "confirm" | "decline" | "none" = "none",
): Promise<void> {
  if (LIVE) {
    await apiSend("PATCH", "/api/admin/requests", { id, status, action });
    return;
  }
  await delay();
  bookings = bookings.map((b) => (b.id === id ? { ...b, status } : b));
}
