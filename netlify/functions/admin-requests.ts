/**
 * /api/admin/requests   (owner only)
 *   GET                                      → list booking requests
 *   PATCH { id, status, action }             → update status; optionally act on
 *                                              availability:
 *     action=confirm → replace the soft-hold with a firm `booked` range
 *     action=decline → free the held range
 *     action=none    → status change only
 *
 * A pre-reservation only becomes firm when the owner confirms (CLAUDE.md §5).
 */
import { repo, AvailabilityConflictError } from "../lib/db";
import { requireOwner } from "../lib/auth";
import { publishAvailability } from "../lib/publish";
import { requestUpdateSchema } from "../lib/validation";
import { json, readJson, requireMethod, toErrorResponse, HttpError, NO_STORE } from "../lib/http";
import { lastNightISO } from "../lib/dates";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET", "PATCH");
    await requireOwner(req);

    if (req.method === "GET") {
      return json(await repo.listBookings(), 200, NO_STORE);
    }

    // PATCH
    const parsed = requestUpdateSchema.safeParse(await readJson<unknown>(req));
    if (!parsed.success) {
      throw new HttpError(400, `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
    const { id, status, action } = parsed.data;

    // Verify the request exists BEFORE mutating anything.
    const booking = (await repo.listBookings()).find((b) => b.id === id);
    if (!booking) throw new HttpError(404, "booking_not_found");

    // Status + availability move together in one transaction. `confirm` books
    // the stay's nights [arrival, departure-1] (checkout day stays free) and is
    // rejected if that overlaps another confirmed range.
    try {
      await repo.decideBooking({
        id,
        status,
        apartmentId: booking.apartmentId,
        arrival: booking.arrival,
        lastNight: lastNightISO(booking.departure),
        action,
      });
    } catch (err) {
      if (err instanceof AvailabilityConflictError) throw new HttpError(409, "already_booked");
      throw err;
    }

    if (action !== "none") await publishAvailability();

    return json({ ok: true }, 200, NO_STORE);
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/admin/requests" };
