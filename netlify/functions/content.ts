/**
 * GET /api/content?type=apartments|availability  (public)
 *
 * The public read endpoint. Serves the JSON documents from Netlify Blobs — the
 * public site never touches Neon (CLAUDE.md §3). If a document has never been
 * published yet, it falls back to reading straight from the repo and publishes
 * on the way out, so a fresh environment self-heals on first request.
 */
import { getJson } from "../lib/blobs";
import { repo } from "../lib/db";
import {
  APARTMENTS_KEY,
  AVAILABILITY_KEY,
  publishApartments,
  publishAvailability,
} from "../lib/publish";
import { json, requireMethod, toErrorResponse, HttpError } from "../lib/http";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET");
    const type = new URL(req.url).searchParams.get("type");

    if (type === "apartments") {
      let data = await getJson(APARTMENTS_KEY);
      if (!data) {
        data = await repo.listApartments();
        await publishApartments();
      }
      // Apartments change rarely (admin edits republish); a short CDN cache is fine.
      return json(data, 200, {
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      });
    }
    if (type === "availability") {
      let data = await getJson(AVAILABILITY_KEY);
      if (!data) {
        data = await repo.listAvailability();
        await publishAvailability();
      }
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
