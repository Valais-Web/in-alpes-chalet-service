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
import { repo } from "../lib/db";
import { requireOwner } from "../lib/auth";
import { publishAvailability } from "../lib/publish";
import { requestUpdateSchema } from "../lib/validation";
import { json, readJson, requireMethod, toErrorResponse, HttpError } from "../lib/http";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET", "PATCH");
    await requireOwner(req);

    if (req.method === "GET") {
      return json(await repo.listBookings());
    }

    // PATCH
    const parsed = requestUpdateSchema.safeParse(await readJson<unknown>(req));
    if (!parsed.success) {
      throw new HttpError(400, `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
    const { id, status, action } = parsed.data;

    await repo.updateBookingStatus(id, status);

    if (action !== "none") {
      const booking = (await repo.listBookings()).find((b) => b.id === id);
      if (!booking) throw new HttpError(404, "booking_not_found");

      // Drop the existing soft-hold for this exact range, then apply the action.
      await repo.clearAvailability(booking.apartmentId, booking.arrival, booking.departure);
      if (action === "confirm") {
        await repo.setAvailability({
          apartmentId: booking.apartmentId,
          start: booking.arrival,
          end: booking.departure,
          status: "booked",
        });
      }
      await publishAvailability();
    }

    return json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/admin/requests" };
