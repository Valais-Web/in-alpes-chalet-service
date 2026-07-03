/**
 * POST /api/contact  (public)
 *
 * Validate (Zod) → email the owner (reply-to the sender). No DB write: contact
 * messages are informational, unlike booking requests.
 */
import { sendContactEmail } from "../lib/email";
import { contactInputSchema } from "../lib/validation";
import { json, readJson, requireMethod, toErrorResponse, HttpError } from "../lib/http";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "POST");
    const parsed = contactInputSchema.safeParse(await readJson<unknown>(req));
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
