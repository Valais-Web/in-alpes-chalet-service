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
import { subtractRanges } from "./dates";

export { subtractRanges };
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
  /** Conflicts the owner was actually emailed about ("start/end"). A failed
   * send leaves them out, so the next run retries. */
  notified?: string[];
  /** The feed's upcoming events, kept so a site calendar change can re-plan
   * the Airbnb rows at once, without refetching (see reconcileAirbnb). */
  events?: IcalEvent[];
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

const conflictKey = (c: { start: string; end: string }) => `${c.start}/${c.end}`;

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
      let conflicts = st.conflicts ?? [];
      if (opts.force || fp !== st.fingerprint) {
        const siteRows = await repo.listSiteRowsForSync(apartmentId);
        const plan = planSync(events, siteRows, today);
        await repo.replaceAirbnbRanges(apartmentId, plan.ranges);
        changed.push(apartmentId);
        conflicts = plan.conflicts;
      }

      // Alert on every conflict not yet successfully emailed — including ones
      // whose earlier alert failed, even if the feed is unchanged since.
      // (State saved before `notified` existed: its conflicts were alerted.)
      const notified = new Set(st.notified ?? (st.conflicts ?? []).map(conflictKey));
      const unsent = conflicts.filter((c) => !notified.has(conflictKey(c)));
      let lastError: string | null = null;
      if (unsent.length) {
        try {
          await sendCalendarConflictEmail(apartmentId, unsent);
          for (const c of unsent) notified.add(conflictKey(c));
        } catch (err) {
          console.error("[calendar-sync] conflict email failed, will retry next run:", err);
          lastError = "conflict_email_failed";
        }
      }
      state[apartmentId] = {
        fingerprint: fp,
        lastSyncedAt: new Date().toISOString(),
        lastError,
        conflicts,
        notified: conflicts.map(conflictKey).filter((k) => notified.has(k)),
        events: events.filter((e) => e.end >= today),
      };
    } catch (err) {
      // Keep the old fingerprint so the next run retries the write.
      console.error(`[calendar-sync] ${apartmentId}:`, err);
      state[apartmentId] = { ...st, lastError: (err as Error).message || "sync_failed" };
    }
  }

  // Drop state for apartments whose sync was turned off.
  for (const id of Object.keys(state)) if (!config[id]) delete state[id];
  // Publish BEFORE saving the fingerprints: if publishing fails, forget them so
  // the next run rewrites and republishes instead of skipping an "unchanged"
  // feed while the public calendar stays stale.
  let publishError: unknown = null;
  if (changed.length) {
    try {
      await publishAvailability();
    } catch (err) {
      publishError = err;
      console.error("[calendar-sync] publish failed, will retry next run:", err);
      for (const id of changed) {
        delete state[id].fingerprint;
        state[id].lastError = "publish_failed";
      }
    }
  }
  await putJson(SYNC_STATE_KEY, state);
  if (publishError) throw publishError;
  return { changed };
}

/**
 * Re-plan an apartment's Airbnb rows against its CURRENT site rows, from the
 * last fetched feed. Needed right after the site calendar changes: Airbnb
 * dates hidden under a site range that just went away must be blocked again
 * immediately, not at the next scheduled run (else the dates read free and
 * could be booked twice in between). Falls back to fetching the feed when no
 * copy was kept yet. Also forgets the fingerprint, so a scheduled run that
 * planned against the old site rows concurrently re-plans next time.
 */
export async function reconcileAirbnb(apartmentId: string): Promise<void> {
  const config = await readSyncConfig();
  if (!config[apartmentId]) return;
  const cached = (await readSyncState())[apartmentId]?.events;
  const events = cached ?? (await fetchFeed(config[apartmentId]));
  const siteRows = await repo.listSiteRowsForSync(apartmentId);
  await repo.replaceAirbnbRanges(apartmentId, planSync(events, siteRows, todayISO()).ranges);
  await invalidateSyncPlan(apartmentId);
}

/**
 * After any change to an apartment's site calendar (admin range, booking
 * decision): put the Airbnb rows back in line, then republish. A failed
 * reconcile still publishes the saved change, leaves the next scheduled run
 * to re-plan, and is rethrown so the admin sees the save didn't fully land.
 */
export async function afterSiteCalendarChange(apartmentId: string): Promise<void> {
  let reconcileError: unknown = null;
  try {
    await reconcileAirbnb(apartmentId);
  } catch (err) {
    reconcileError = err;
    console.error(`[calendar-sync] reconcile ${apartmentId} failed:`, err);
    await invalidateSyncPlan(apartmentId);
  }
  await publishAvailability();
  if (reconcileError) throw reconcileError;
}

/**
 * Make the next run re-plan this apartment even though its Airbnb feed is
 * unchanged. Best effort: a failure only delays the re-plan until the feed
 * next changes, so it is logged, never thrown.
 */
export async function invalidateSyncPlan(apartmentId: string): Promise<void> {
  try {
    const state = await readSyncState();
    if (!state[apartmentId]?.fingerprint) return;
    delete state[apartmentId].fingerprint;
    await putJson(SYNC_STATE_KEY, state);
  } catch (err) {
    console.error(`[calendar-sync] could not invalidate ${apartmentId}:`, err);
  }
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
