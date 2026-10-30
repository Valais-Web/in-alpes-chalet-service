/**
 * Publishing pipeline: Neon (source of truth) → Netlify Blobs (public read).
 *
 * CLAUDE.md §5: every admin write regenerates the relevant JSON. The public
 * site reads only these documents, so a Neon sleep/outage never breaks
 * browsing or the calendar — visitors keep seeing the last published JSON.
 */
import { repo } from "./db";
import { putJsonFresh } from "./blobs";

export const APARTMENTS_KEY = "apartments.json";
export const AVAILABILITY_KEY = "availability.json";

// Publishes can overlap (admin edits, bookings, the scheduled Airbnb sync);
// putJsonFresh keeps a slower, older snapshot from overwriting a newer one.

export async function publishApartments(): Promise<void> {
  await putJsonFresh(APARTMENTS_KEY, () => repo.listApartments());
}

export async function publishAvailability(): Promise<void> {
  // `fromRequest` is admin-only bookkeeping; keep the public JSON minimal.
  await putJsonFresh(AVAILABILITY_KEY, async () =>
    (await repo.listAvailability()).map(({ fromRequest: _omit, ...r }) => r),
  );
}

export async function publishAll(): Promise<void> {
  await Promise.all([publishApartments(), publishAvailability()]);
}
