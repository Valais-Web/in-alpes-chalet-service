/**
 * /api/admin/availability   (owner only)
 *   GET    ?apartmentId=apt-01              → list ranges
 *   POST   { apartmentId, start, end, status }  → set a range, republish
 *          status "free" frees the dates (trims manual ranges); "prebooked"
 *          without expiresAt gets the standard hold TTL
 *   DELETE { apartmentId, start, end }      → clear a range, republish
 */
import { repo, AvailabilityConflictError } from "../lib/db";
import { requireOwner } from "../lib/auth";
import { afterSiteCalendarChange } from "../lib/calendarSync";
import { env } from "../lib/env";
import { availabilityInputSchema, availabilityClearSchema } from "../lib/validation";
import { json, readJson, requireMethod, toErrorResponse, HttpError, NO_STORE } from "../lib/http";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET", "POST", "DELETE");
    await requireOwner(req);

    if (req.method === "GET") {
      const apartmentId = new URL(req.url).searchParams.get("apartmentId") ?? undefined;
      return json(await repo.listAvailability(apartmentId), 200, NO_STORE);
    }

    if (req.method === "POST") {
      const body = await readJson<Record<string, unknown>>(req);
      // A manual soft hold from the admin lasts the standard hold TTL.
      if (body?.status === "prebooked" && body.expiresAt === undefined) {
        body.expiresAt = new Date(Date.now() + env.PREBOOKING_TTL_HOURS * 3600_000).toISOString();
      }
      const parsed = availabilityInputSchema.safeParse(body);
      if (!parsed.success) {
        throw new HttpError(
          400,
          `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`,
        );
      }
      const { apartmentId, start, end, status } = parsed.data;
      try {
        if (status === "free") await repo.freeRange(apartmentId, start, end);
        else await repo.setAvailability(parsed.data);
      } catch (err) {
        if (err instanceof AvailabilityConflictError) {
          throw new HttpError(409, "range_conflict");
        }
        throw err;
      }
      await afterSiteCalendarChange(apartmentId);
      return json({ ok: true }, 200, NO_STORE);
    }

    // DELETE
    const parsed = availabilityClearSchema.safeParse(await readJson<unknown>(req));
    if (!parsed.success) {
      throw new HttpError(400, `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
    await repo.clearAvailability(parsed.data.apartmentId, parsed.data.start, parsed.data.end);
    await afterSiteCalendarChange(parsed.data.apartmentId);
    return json({ ok: true }, 200, NO_STORE);
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/admin/availability" };
