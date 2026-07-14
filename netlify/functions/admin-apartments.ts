/**
 * /api/admin/apartments   (owner only)
 *   GET                       → list all apartments
 *   POST   { …apartment }     → create/update, then republish apartments.json
 *   DELETE ?id=apt-01         → delete, then republish
 *
 * Every write verifies the owner session server-side (CLAUDE.md §6) and
 * regenerates the public JSON (CLAUDE.md §5). No site rebuild.
 */
import { randomUUID } from "node:crypto";
import { repo, ApartmentHasBookingsError } from "../lib/db";
import { requireOwner } from "../lib/auth";
import { publishApartments } from "../lib/publish";
import { apartmentInputSchema } from "../lib/validation";
import { json, readJson, requireMethod, toErrorResponse, HttpError, NO_STORE } from "../lib/http";
import type { Apartment } from "../lib/types";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET", "POST", "DELETE");
    await requireOwner(req);

    if (req.method === "GET") {
      return json(await repo.listApartments(), 200, NO_STORE);
    }

    if (req.method === "POST") {
      const parsed = apartmentInputSchema.safeParse(await readJson<unknown>(req));
      if (!parsed.success) {
        throw new HttpError(
          400,
          `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`,
        );
      }
      const apartment: Apartment = { ...parsed.data, id: parsed.data.id ?? `apt-${randomUUID()}` };
      const saved = await repo.upsertApartment(apartment);
      await publishApartments();
      return json({ ok: true, apartment: saved }, 200, NO_STORE);
    }

    // DELETE
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "missing_id");
    try {
      await repo.deleteApartment(id);
    } catch (err) {
      if (err instanceof ApartmentHasBookingsError) {
        throw new HttpError(409, "apartment_has_bookings");
      }
      throw err;
    }
    await publishApartments();
    return json({ ok: true }, 200, NO_STORE);
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/admin/apartments" };
