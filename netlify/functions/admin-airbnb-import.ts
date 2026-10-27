/**
 * POST /api/admin/airbnb-import   { url }   (owner only)
 *
 * Reads a public Airbnb listing and returns a draft to prefill the "new
 * apartment" form. Writes nothing: the admin reviews the draft, the browser
 * re-hosts the photos on Cloudinary, then the normal save path validates it.
 * Best-effort scraping — see netlify/lib/airbnb.ts.
 */
import { z } from "zod";
import { requireOwner } from "../lib/auth";
import { importAirbnbListing } from "../lib/airbnb";
import { json, readJson, requireMethod, toErrorResponse, HttpError, NO_STORE } from "../lib/http";

const bodySchema = z.object({ url: z.string().min(1).max(500) });

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "POST");
    await requireOwner(req);
    const parsed = bodySchema.safeParse(await readJson<unknown>(req));
    if (!parsed.success) throw new HttpError(400, "invalid_airbnb_url");
    return json(await importAirbnbListing(parsed.data.url), 200, NO_STORE);
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/admin/airbnb-import" };
