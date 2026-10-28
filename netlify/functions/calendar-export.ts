/**
 * GET /api/calendar/<slug>.ics   (public)
 *
 * The site's busy dates for one apartment as an iCal feed, to import into
 * Airbnb ("Connect calendars"). Exposes only confirmed bookings and manual
 * blocks — already public in availability.json — never pending holds (a bot
 * must not be able to freeze Airbnb, CLAUDE.md §5) and never dates that came
 * from Airbnb itself (no sync loop). Reads the published blobs, never Neon.
 */
import { getJson } from "../lib/blobs";
import { buildIcal } from "../lib/ical";
import { APARTMENTS_KEY, AVAILABILITY_KEY } from "../lib/publish";
import { requireMethod, toErrorResponse, HttpError } from "../lib/http";
import type { Apartment, AvailabilityRange } from "../lib/types";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET", "HEAD");
    const m = new URL(req.url).pathname.match(/^\/api\/calendar\/([a-z0-9-]+)\.ics$/);
    if (!m) throw new HttpError(404, "not_found");

    const apartments = (await getJson<Apartment[]>(APARTMENTS_KEY)) ?? [];
    const apt = apartments.find((a) => a.slug === m[1]);
    if (!apt) throw new HttpError(404, "not_found");

    const ranges = ((await getJson<AvailabilityRange[]>(AVAILABILITY_KEY)) ?? []).filter(
      (r) =>
        r.apartmentId === apt.id &&
        (r.status === "booked" || r.status === "blocked") &&
        r.source !== "airbnb",
    );
    const body = buildIcal({
      name: `In-Alpes – ${apt.title.fr}`,
      summary: "In-Alpes – réservé",
      ranges: ranges.map((r) => ({
        start: r.start,
        end: r.end,
        uid: `${apt.id}-${r.start}-${r.end}@in-alpes.ch`,
      })),
    });
    return new Response(req.method === "HEAD" ? null : body, {
      status: 200,
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": `inline; filename="${apt.slug}.ics"`,
        "cache-control": "public, max-age=300",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/calendar/*" };
