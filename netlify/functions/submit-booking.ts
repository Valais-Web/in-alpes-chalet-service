/**
 * POST /api/submit-booking  (public)
 *
 * The one write the public site performs. Flow (CLAUDE.md §5):
 *   1. validate with Zod
 *   2. insert the request (status = new)
 *   3. lay a 48h pre-reservation (status = prebooked, expires_at = now + TTL)
 *   4. republish availability.json to Blobs
 *   5. email the owner + acknowledge the guest (a REQUEST, not a confirmation)
 *
 * Steps 4–5 are best-effort: the guest must still get a success response even if
 * Blobs/Resend hiccup, because the request is already safely persisted in Neon.
 */
import { repo } from "../lib/db";
import { publishAvailability } from "../lib/publish";
import { sendBookingEmails } from "../lib/email";
import { bookingInputSchema } from "../lib/validation";
import { json, readJson, requireMethod, toErrorResponse, HttpError } from "../lib/http";
import { env, logMode } from "../lib/env";

export default async (req: Request): Promise<Response> => {
  logMode();
  try {
    requireMethod(req, "POST");
    const body = await readJson<unknown>(req);
    const parsed = bookingInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
    const { locale, ...input } = parsed.data;

    const apartment = await repo.getApartment(input.apartmentId);
    if (!apartment) throw new HttpError(404, "apartment_not_found");

    // 2. persist the request
    const booking = await repo.insertBooking(input);

    // 3. soft-hold the range for 48h
    const expiresAt = new Date(Date.now() + env.PREBOOKING_TTL_HOURS * 3600 * 1000).toISOString();
    await repo.setAvailability({
      apartmentId: input.apartmentId,
      start: input.arrival,
      end: input.departure,
      status: "prebooked",
      expiresAt,
    });

    // 4 + 5. best-effort side effects — never fail the guest for these
    await Promise.allSettled([
      publishAvailability(),
      sendBookingEmails({ booking, apartmentName: apartment.title.fr, locale }),
    ]);

    return json({ ok: true, id: booking.id });
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/submit-booking" };
