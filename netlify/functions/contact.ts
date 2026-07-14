/**
 * POST /api/contact  (public)
 *
 * Validate (Zod) → email the owner (reply-to the sender). No DB write: contact
 * messages are informational, unlike booking requests.
 */
import { sendContactEmail } from "../lib/email";
import { contactInputSchema } from "../lib/validation";
import {
  json,
  readJson,
  requireMethod,
  toErrorResponse,
  HttpError,
  honeypotTripped,
} from "../lib/http";
import { hitRateLimit, clientIp } from "../lib/ratelimit";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "POST");

    const rl = await hitRateLimit(`contact:${clientIp(req)}`, { max: 10, windowSec: 600 });
    if (rl.limited) {
      return json({ error: "too_many_requests" }, 429, { "retry-after": String(rl.retryAfterSec) });
    }

    const body = await readJson<unknown>(req);
    // Silently accept (and drop) submissions that fill the honeypot.
    if (honeypotTripped(body)) return json({ ok: true });

    const parsed = contactInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
    await sendContactEmail(parsed.data);
    return json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/contact" };
