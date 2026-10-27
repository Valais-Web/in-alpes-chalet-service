/**
 * Scheduled Airbnb → site calendar sync (every 30 min). CLAUDE.md §2 permits
 * Netlify Scheduled Functions; this is NOT a keep-alive: it reads its config
 * and the previous feed fingerprints from private blobs and only wakes Neon
 * when an Airbnb calendar actually changed. See netlify/lib/calendarSync.ts.
 */
import { runCalendarSync } from "../lib/calendarSync";
import { logMode } from "../lib/env";

export default async (): Promise<Response> => {
  logMode();
  const { changed } = await runCalendarSync();
  console.info(
    changed.length
      ? `[calendar-sync] updated ${changed.join(", ")}`
      : "[calendar-sync] no Airbnb calendar changed (Neon not touched)",
  );
  return new Response("ok");
};

export const config = { schedule: "*/30 * * * *" };
