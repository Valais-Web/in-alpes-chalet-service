/**
 * POST /api/submit-booking  (public)
 *
 * The one write the public site performs. Flow (CLAUDE.md §5):
 *   1. validate with Zod + per-apartment capacity
 *   2. atomically insert the request (status = pending) AND lay a 48h
 *      pre-reservation (status = prebooked, expires_at = now + TTL); the DB
 *      exclusion constraint rejects any overlap → HTTP 409
 *   3. republish availability.json to Blobs
 *   4. email the owner + acknowledge the guest (a REQUEST, not a confirmation)
 *
 * Steps 3–4 are best-effort: the guest must still get a success response even if
 * Blobs/Resend hiccup, because the request is already safely persisted in Neon.
 */
import { repo, AvailabilityConflictError } from "../lib/db";
import { publishAvailability } from "../lib/publish";
import { sendBookingEmails } from "../lib/email";
import { bookingInputSchema } from "../lib/validation";
import {
  json,
  readJson,
  requireMethod,
  toErrorResponse,
  HttpError,
  honeypotTripped,
} from "../lib/http";
import { env, logMode } from "../lib/env";
import { lastNightISO } from "../lib/dates";
import { hitRateLimit, clientIp } from "../lib/ratelimit";

export default async (req: Request): Promise<Response> => {
  logMode();
  try {
    requireMethod(req, "POST");

    const rl = await hitRateLimit(`booking:${clientIp(req)}`, { max: 10, windowSec: 600 });
    if (rl.limited) {
      return json({ error: "too_many_requests" }, 429, { "retry-after": String(rl.retryAfterSec) });
    }

    const body = await readJson<unknown>(req);
    // Silently accept (and drop) submissions that fill the honeypot.
    if (honeypotTripped(body)) return json({ ok: true, id: "ignored" });

    const parsed = bookingInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
    const { locale, ...input } = parsed.data;

    const apartment = await repo.getApartment(input.apartmentId);
    if (!apartment) throw new HttpError(404, "apartment_not_found");

    // Capacity check against the specific apartment (the Zod cap is only a
    // sanity bound; the real limit is per-apartment).
    if (input.guests > apartment.maxGuests) throw new HttpError(400, "too_many_guests");

    // 2 + 3. persist the request AND lay the 48h hold in one atomic transaction.
    // The checkout day stays free (hold ends the night before departure); a
    // conflicting range is rejected by the DB exclusion constraint → 409.
    const expiresAt = new Date(Date.now() + env.PREBOOKING_TTL_HOURS * 3600 * 1000).toISOString();
    let booking;
    try {
      booking = await repo.createBooking({
        input,
        holdEnd: lastNightISO(input.departure),
        expiresAt,
      });
    } catch (err) {
      if (err instanceof AvailabilityConflictError) {
        throw new HttpError(409, "dates_unavailable");
      }
      throw err;
    }

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
