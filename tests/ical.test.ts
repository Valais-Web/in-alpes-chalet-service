import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildIcal, parseIcal } from "../netlify/lib/ical";

// Synthetic feed in Airbnb's export format (CRLF, folded DESCRIPTION line,
// "Reserved" / "Airbnb (Not available)" summaries, all-day DATE values).
const feed = readFileSync(new URL("./fixtures/airbnb/calendar.ics", import.meta.url), "utf8");

describe("parseIcal", () => {
  it("reads all-day events as inclusive night ranges (DTEND = checkout)", () => {
    expect(parseIcal(feed)).toEqual([
      { start: "2025-01-05", end: "2025-01-09", summary: "Reserved" },
      { start: "2030-12-10", end: "2030-12-14", summary: "Reserved" },
      { start: "2030-12-28", end: "2031-01-04", summary: "Airbnb (Not available)" },
    ]);
  });

  it("handles LF line endings, datetime values and a missing DTEND", () => {
    const text = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20300301T150000Z",
      "DTEND:20300303T100000Z",
      "SUMMARY:Blocked\\, owner",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:20300310",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");
    expect(parseIcal(text)).toEqual([
      { start: "2030-03-01", end: "2030-03-02", summary: "Blocked, owner" },
      { start: "2030-03-10", end: "2030-03-10", summary: "" },
    ]);
  });

  it("ignores events without a start and garbage input", () => {
    expect(parseIcal("BEGIN:VEVENT\nSUMMARY:x\nEND:VEVENT")).toEqual([]);
    expect(parseIcal("<html>nope</html>")).toEqual([]);
  });
});

describe("buildIcal", () => {
  const out = buildIcal({
    name: "In-Alpes – Le Combin",
    summary: "In-Alpes – réservé",
    ranges: [
      { start: "2030-12-10", end: "2030-12-14", uid: "apt-1-2030-12-10-2030-12-14@in-alpes.ch" },
    ],
    now: new Date("2030-01-01T12:00:00.000Z"),
  });

  it("writes a valid all-day VEVENT with CRLF endings", () => {
    expect(out.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(out.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(out).not.toMatch(/[^\r]\n/);
    expect(out).toContain("DTSTART;VALUE=DATE:20301210\r\n");
    expect(out).toContain("DTEND;VALUE=DATE:20301215\r\n"); // last night + 1 = checkout
    expect(out).toContain("DTSTAMP:20300101T120000Z\r\n");
    expect(out).toContain("UID:apt-1-2030-12-10-2030-12-14@in-alpes.ch\r\n");
  });

  it("round-trips through the parser", () => {
    expect(parseIcal(out)).toEqual([
      { start: "2030-12-10", end: "2030-12-14", summary: "In-Alpes – réservé" },
    ]);
  });
});
