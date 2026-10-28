/**
 * Minimal iCalendar (RFC 5545) reading/writing for the Airbnb calendar sync.
 * Only what Airbnb's host calendars use: all-day VEVENTs. No dependency.
 *
 * Date convention: iCal all-day events are half-open — DTEND is the checkout
 * day, not a night spent. Our availability ranges are inclusive occupied
 * nights (netlify/lib/dates.ts), so `[DTSTART, DTEND)` ⇔ `[start, DTEND - 1]`.
 */
import { addDaysISO } from "./dates";

export interface IcalEvent {
  start: string; // first night, YYYY-MM-DD
  end: string; // last night (inclusive), YYYY-MM-DD
  summary: string;
}

/** Undo RFC 5545 line folding (CRLF + space/tab continues the previous line). */
function unfold(text: string): string[] {
  return text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

/** "20261210" or "20261210T150000Z" → "2026-12-10". */
function icalDate(v: string): string | null {
  const m = v.trim().match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function unescapeText(v: string): string {
  return v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
}

/** Parse every VEVENT that has a start date. Events without DTEND last one
 * night (RFC 5545 default for DATE values). */
export function parseIcal(text: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  let cur: { start?: string; endExclusive?: string; summary: string } | null = null;
  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") {
      cur = { summary: "" };
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur?.start) {
        const endExclusive =
          cur.endExclusive && cur.endExclusive > cur.start
            ? cur.endExclusive
            : addDaysISO(cur.start, 1);
        events.push({ start: cur.start, end: addDaysISO(endExclusive, -1), summary: cur.summary });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    const value = line.slice(colon + 1);
    if (name === "DTSTART") cur.start = icalDate(value) ?? undefined;
    else if (name === "DTEND") cur.endExclusive = icalDate(value) ?? undefined;
    else if (name === "SUMMARY") cur.summary = unescapeText(value).trim();
  }
  return events;
}

function escapeText(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/([,;])/g, "\\$1")
    .replace(/\n/g, "\\n");
}

const compact = (iso: string) => iso.replace(/-/g, "");

/** Build a calendar Airbnb can import: one all-day event per busy range. */
export function buildIcal(opts: {
  name: string;
  ranges: { start: string; end: string; uid: string }[];
  summary: string;
  now?: Date;
}): string {
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//In-Alpes Chalet Services//Calendar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
  ];
  for (const r of opts.ranges) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(r.start)}`,
      `DTEND;VALUE=DATE:${compact(addDaysISO(r.end, 1))}`,
      `SUMMARY:${escapeText(opts.summary)}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
