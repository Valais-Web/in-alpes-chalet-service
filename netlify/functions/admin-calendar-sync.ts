/**
 * /api/admin/calendar-sync   (owner only)
 *   GET                                         → sync status per apartment
 *   POST { action: "save", apartmentId, importUrl } → set/clear the Airbnb URL, then sync it
 *   POST { action: "sync", apartmentId }        → sync this apartment now
 *
 * See netlify/lib/calendarSync.ts.
 */
import { requireOwner } from "../lib/auth";
import { isAirbnbIcalUrl, listSyncStatus, runCalendarSync, saveSyncUrl } from "../lib/calendarSync";
import { calendarSyncInputSchema } from "../lib/validation";
import { json, readJson, requireMethod, toErrorResponse, HttpError, NO_STORE } from "../lib/http";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "GET", "POST");
    await requireOwner(req);

    if (req.method === "POST") {
      const parsed = calendarSyncInputSchema.safeParse(await readJson<unknown>(req));
      if (!parsed.success) {
        throw new HttpError(
          400,
          `validation_error: ${parsed.error.issues[0]?.message ?? "invalid"}`,
        );
      }
      const input = parsed.data;
      if (input.action === "save") {
        if (input.importUrl && !isAirbnbIcalUrl(input.importUrl)) {
          throw new HttpError(400, "invalid_airbnb_ical_url");
        }
        await saveSyncUrl(input.apartmentId, input.importUrl);
        if (input.importUrl) await runCalendarSync({ only: [input.apartmentId], force: true });
      } else {
        await runCalendarSync({ only: [input.apartmentId], force: true });
      }
    }
    return json(await listSyncStatus(), 200, NO_STORE);
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/admin/calendar-sync" };
