/**
 * Two-way availability sync with Airbnb, through Airbnb's iCal calendars
 * (Airbnb has no API for individual hosts).
 *
 *   Airbnb → site: the scheduled `calendar-sync` function fetches each
 *     listing's Airbnb export URL and mirrors its busy dates as availability
 *     rows tagged `source = 'airbnb'`.
 *   Site → Airbnb: `/api/calendar/<slug>.ics` (calendar-export function)
 *     publishes the site's confirmed bookings + manual blocks, which the owner
 *     imports into Airbnb ("Connect calendars"). Airbnb rows are never
 *     exported back.
 *
 * Neon stays asleep unless something changed (CLAUDE.md §2/§3): the config is
 * mirrored to a private blob, and each feed's parsed busy dates are fingerprinted
 * in that blob, so an unchanged feed is detected without touching the database.
 */
import { createHash } from "node:crypto";
import { addDaysISO } from "./dates";
import { parseIcal, type IcalEvent } from "./ical";
import { getJson, putJson } from "./blobs";
import { repo, type SyncRow } from "./db";
import { publishAvailability } from "./publish";
import { sendCalendarConflictEmail } from "./email";
import type { CalendarSyncStatus } from "./types";

/** Private blobs — never served by /api/content (it only reads fixed keys). */
export const SYNC_CONFIG_KEY = "calendar-sync-config.json";
export const SYNC_STATE_KEY = "calendar-sync-state.json";

export type SyncConfig = Record<string, string>; // apartmentId → Airbnb iCal URL

interface ApartmentSyncState {
  fingerprint?: string;
  lastSyncedAt?: string;
  lastError?: string | null;
  conflicts?: { start: string; end: string }[];
}
export type SyncState = Record<string, ApartmentSyncState>;

// --- URL --------------------------------------------------------------------

/** Only Airbnb's own calendar export endpoint may be fetched (SSRF guard):
 * https://www.airbnb.<tld>/calendar/ical/<listing id>.ics?s=<token> */
export function isAirbnbIcalUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    /^(www\.)?airbnb\.[a-z]{2,3}(\.[a-z]{2})?$/i.test(url.hostname) &&
    /^\/calendar\/ical\/\d{5,25}\.ics$/.test(url.pathname)
  );
}

// --- pure planning ------------------------------------------------------------

export interface PlannedRange {
  start: string;
  end: string;
  status: "booked" | "blocked";
}

export interface SyncPlan {
  ranges: PlannedRange[]; // what the apartment's Airbnb rows must become
  conflicts: { start: string; end: string }[];
}

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) =>
  a.start <= b.end && b.start <= a.end;

/** The parts of `r` not covered by any of `blockers` (all inclusive ranges). */
export function subtractRanges(
  r: { start: string; end: string },
  blockers: { start: string; end: string }[],
): { start: string; end: string }[] {
  let pieces = [r];
  for (const b of blockers) {
    const next: { start: string; end: string }[] = [];
    for (const p of pieces) {
      if (!overlaps(p, b)) {
        next.push(p);
        continue;
      }
      if (p.start < b.start) next.push({ start: p.start, end: addDaysISO(b.start, -1) });
      if (p.end > b.end) next.push({ start: addDaysISO(b.end, 1), end: p.end });
    }
    pieces = next;
  }
  return pieces;
}

/** Airbnb marks guest stays "Reserved"; owner blocks and dates blocked by an
 * imported calendar (i.e. our own export echoed back) are "Not available". */
const isReservation = (e: IcalEvent) => /^reserved$/i.test(e.summary);

/**
 * Decide the apartment's Airbnb rows from the feed and the site's own rows.
 * Site rows (`source` null) always win: Airbnb dates they already cover are
 * dropped so the DB exclusion constraint never fires. An Airbnb *reservation*
 * overlapping a site booking is a real double booking → conflict. A "Not
 * available" overlap is just our export coming back → ignored.
 */
export function planSync(events: IcalEvent[], siteRows: SyncRow[], today: string): SyncPlan {
  const blockers = siteRows.filter((r) => r.status === "booked" || r.status === "blocked");
  const ranges: PlannedRange[] = [];
  const conflicts: { start: string; end: string }[] = [];

  for (const e of events) {
    if (e.end < today) continue; // past stays don't matter
    const reserved = isReservation(e);
    if (reserved && siteRows.some((r) => r.bookingRequestId && overlaps(e, r))) {
      conflicts.push({ start: e.start, end: e.end });
    }
    for (const piece of subtractRanges(e, blockers)) {
      ranges.push({ start: piece.start, end: piece.end, status: reserved ? "booked" : "blocked" });
    }
  }
  ranges.sort((a, b) => a.start.localeCompare(b.start));
  return { ranges, conflicts };
}

/** Stable fingerprint of a feed's future busy dates. Raw-text hashing would
 * change on every fetch (Airbnb stamps each download). */
export function fingerprint(events: IcalEvent[], today: string): string {
  const key = events
    .filter((e) => e.end >= today)
    .map((e) => `${e.start}/${e.end}/${isReservation(e) ? "R" : "B"}`)
    .sort()
    .join(",");
  return createHash("sha256").update(key).digest("hex");
}

// --- runner ---------------------------------------------------------------------

const todayISO = () => new Date().toISOString().slice(0, 10);

async function fetchFeed(url: string): Promise<IcalEvent[]> {
  const res = await fetch(url, {
    headers: { accept: "text/calendar" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`airbnb_feed_http_${res.status}`);
  const text = await res.text();
  if (!text.includes("BEGIN:VCALENDAR")) throw new Error("airbnb_feed_not_ical");
  return parseIcal(text);
}

export async function readSyncConfig(): Promise<SyncConfig> {
  return (await getJson<SyncConfig>(SYNC_CONFIG_KEY)) ?? {};
}

export async function readSyncState(): Promise<SyncState> {
  return (await getJson<SyncState>(SYNC_STATE_KEY)) ?? {};
}

/**
 * Sync the given apartments (all configured ones by default). Only apartments
 * whose feed changed — or `force` — touch Neon. Returns the ids whose rows
 * were rewritten. Errors are recorded per apartment, never thrown, so one
 * broken feed can't block the others.
 */
export async function runCalendarSync(
  opts: { only?: string[]; force?: boolean } = {},
): Promise<{ changed: string[] }> {
  const config = await readSyncConfig();
  const state = await readSyncState();
  const today = todayISO();
  const changed: string[] = [];

  const ids = Object.keys(config).filter((id) => !opts.only || opts.only.includes(id));
  for (const apartmentId of ids) {
    const st: ApartmentSyncState = state[apartmentId] ?? {};
    try {
      const events = await fetchFeed(config[apartmentId]);
      const fp = fingerprint(events, today);
      if (!opts.force && fp === st.fingerprint) {
        state[apartmentId] = { ...st, lastSyncedAt: new Date().toISOString(), lastError: null };
        continue;
      }
      const siteRows = await repo.listSiteRowsForSync(apartmentId);
      const plan = planSync(events, siteRows, today);
      await repo.replaceAirbnbRanges(apartmentId, plan.ranges);
      changed.push(apartmentId);

      const known = new Set((st.conflicts ?? []).map((c) => `${c.start}/${c.end}`));
      const fresh = plan.conflicts.filter((c) => !known.has(`${c.start}/${c.end}`));
      if (fresh.length) {
        await sendCalendarConflictEmail(apartmentId, fresh).catch((err) =>
          console.error("[calendar-sync] conflict email failed:", err),
        );
      }
      state[apartmentId] = {
        fingerprint: fp,
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
        conflicts: plan.conflicts,
      };
    } catch (err) {
      // Keep the old fingerprint so the next run retries the write.
      console.error(`[calendar-sync] ${apartmentId}:`, err);
      state[apartmentId] = { ...st, lastError: (err as Error).message || "sync_failed" };
    }
  }

  // Drop state for apartments whose sync was turned off.
  for (const id of Object.keys(state)) if (!config[id]) delete state[id];
  await putJson(SYNC_STATE_KEY, state);
  if (changed.length) await publishAvailability();
  return { changed };
}

/** Admin view: config (Neon) + last run (state blob). */
export async function listSyncStatus(): Promise<CalendarSyncStatus[]> {
  const [urls, state] = await Promise.all([repo.listCalendarSync(), readSyncState()]);
  return urls.map(({ apartmentId, importUrl }) => ({
    apartmentId,
    importUrl,
    lastSyncedAt: state[apartmentId]?.lastSyncedAt ?? null,
    lastError: state[apartmentId]?.lastError ?? null,
    conflicts: state[apartmentId]?.conflicts ?? [],
  }));
}

/** Save (or clear, with "") an apartment's Airbnb URL; Neon first, then the
 * private blob the scheduled job reads. Clearing also removes its Airbnb rows. */
export async function saveSyncUrl(apartmentId: string, importUrl: string): Promise<void> {
  await repo.setCalendarSyncUrl(apartmentId, importUrl);
  const config: SyncConfig = {};
  for (const c of await repo.listCalendarSync())
    if (c.importUrl) config[c.apartmentId] = c.importUrl;
  await putJson(SYNC_CONFIG_KEY, config);
  if (!importUrl) {
    await repo.replaceAirbnbRanges(apartmentId, []);
    await publishAvailability();
  }
}
