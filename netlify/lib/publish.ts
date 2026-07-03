/**
 * Publishing pipeline: Neon (source of truth) → Netlify Blobs (public read).
 *
 * CLAUDE.md §5: every admin write regenerates the relevant JSON. The public
 * site reads only these documents, so a Neon sleep/outage never breaks
 * browsing or the calendar — visitors keep seeing the last published JSON.
 */
import { repo } from "./db";
import { putJson } from "./blobs";

export const APARTMENTS_KEY = "apartments.json";
export const AVAILABILITY_KEY = "availability.json";

export async function publishApartments(): Promise<void> {
  const apartments = await repo.listApartments();
  await putJson(APARTMENTS_KEY, apartments);
}

export async function publishAvailability(): Promise<void> {
  const availability = await repo.listAvailability();
  await putJson(AVAILABILITY_KEY, availability);
}

export async function publishAll(): Promise<void> {
  await Promise.all([publishApartments(), publishAvailability()]);
}
