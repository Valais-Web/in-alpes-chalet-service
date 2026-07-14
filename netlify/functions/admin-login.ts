/**
 * POST /api/admin/login   { password }   → sets HttpOnly session cookie
 * POST /api/admin/logout                 → clears it
 *
 * Shared-password owner auth. In dev-open mode (no ADMIN_PASSWORD configured,
 * ALLOW_DEV_OPEN_AUTH=1, non-production) login succeeds so the admin is reachable locally.
 */
import { verifyPassword, createSessionCookie, clearSessionCookie } from "../lib/auth";
import { json, readJson, requireMethod, toErrorResponse, HttpError, NO_STORE } from "../lib/http";
import { flags, allowDevOpenAuth } from "../lib/env";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "POST");
    const isLogout = new URL(req.url).pathname.endsWith("/logout");

    if (isLogout) {
      return json({ ok: true }, 200, { ...NO_STORE, "set-cookie": clearSessionCookie() });
    }

    // No auth configured. Grant open access ONLY with the explicit non-production
    // opt-in; otherwise fail closed so a missing secret never opens the admin.
    if (!flags.hasPasswordAuth) {
      if (!allowDevOpenAuth) throw new HttpError(503, "auth_not_configured");
      return json({ ok: true, devOpen: true }, 200, NO_STORE);
    }

    const { password } = await readJson<{ password?: string }>(req);
    if (!password || !verifyPassword(password)) {
      throw new HttpError(401, "invalid_password");
    }
    return json({ ok: true }, 200, { ...NO_STORE, "set-cookie": createSessionCookie() });
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: ["/api/admin/login", "/api/admin/logout"] };
