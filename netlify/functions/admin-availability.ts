/**
 * /api/admin/availability   (owner only)
 *   GET    ?apartmentId=apt-01              → list ranges
 *   POST   { apartmentId, start, end, status }  → set a range, republish
 *   DELETE { apartmentId, start, end }      → clear a range, republish
 */
import { repo } from "../lib/db";
import { requireOwner } from "../lib/auth";
import { publishAvailability } from "../lib/publish";
import { availabilityInputSchema, availabilityClearSchema } from "../lib/validation";
import { json, readJson, requireMethod, toErrorResponse, HttpError } from "../lib/http";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET", "POST", "DELETE");
    await requireOwner(req);

    if (req.method === "GET") {
      const apartmentId = new URL(req.url).searchParams.get("apartmentId") ?? undefined;
      return json(await repo.listAvailability(apartmentId));
    }

    if (req.method === "POST") {
      const parsed = availabilityInputSchema.safeParse(await readJson<unknown>(req));
      if (!parsed.success) {
        throw new HttpError(
          400,
          `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`,
        );
      }
      await repo.setAvailability(parsed.data);
      await publishAvailability();
      return json({ ok: true });
    }

    // DELETE
    const parsed = availabilityClearSchema.safeParse(await readJson<unknown>(req));
    if (!parsed.success) {
      throw new HttpError(400, `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
    await repo.clearAvailability(parsed.data.apartmentId, parsed.data.start, parsed.data.end);
    await publishAvailability();
    return json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/admin/availability" };
