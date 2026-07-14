/**
 * GET /api/content?type=apartments|availability  (public)
 *
 * The public read endpoint. Serves the JSON documents from Netlify Blobs — the
 * public site NEVER touches Neon (CLAUDE.md §3), so a Neon sleep/outage never
 * affects browsing, and public traffic can never wake or hammer the database.
 * Blobs are seeded by admin writes (every admin save republishes) and by the
 * data import, which goes through the admin API. If nothing has been published
 * yet, we serve an empty list (uncached) rather than reach into Neon.
 */
import { getJson } from "../lib/blobs";
import { APARTMENTS_KEY, AVAILABILITY_KEY } from "../lib/publish";
import { json, requireMethod, toErrorResponse, HttpError } from "../lib/http";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET");
    const type = new URL(req.url).searchParams.get("type");

    if (type === "apartments") {
      const data = await getJson<unknown[]>(APARTMENTS_KEY);
      if (!data) return json([], 200, { "cache-control": "no-store" });
      // Apartments change rarely (admin edits republish); a short CDN cache is fine.
      return json(data, 200, {
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      });
    }
    if (type === "availability") {
      const data = await getJson<unknown[]>(AVAILABILITY_KEY);
      if (!data) return json([], 200, { "cache-control": "no-store" });
      // Availability must be fresh: a booking or admin action changes it and it
      // gates double-bookings. Always revalidate rather than serve stale.
      return json(data, 200, { "cache-control": "no-cache, must-revalidate" });
    }
    throw new HttpError(400, "unknown_type: use ?type=apartments|availability");
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/content" };
