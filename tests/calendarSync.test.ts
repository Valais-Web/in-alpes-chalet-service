import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  fingerprint,
  isAirbnbIcalUrl,
  planSync,
  readSyncState,
  runCalendarSync,
  saveSyncUrl,
  subtractRanges,
} from "../netlify/lib/calendarSync";
import { repo, type SyncRow } from "../netlify/lib/db";
import type { IcalEvent } from "../netlify/lib/ical";

const TODAY = "2030-01-01";
const ev = (start: string, end: string, summary = "Reserved"): IcalEvent => ({
  start,
  end,
  summary,
});
const site = (start: string, end: string, extra: Partial<SyncRow> = {}): SyncRow => ({
  start,
  end,
  status: "booked",
  bookingRequestId: null,
  ...extra,
});

describe("isAirbnbIcalUrl", () => {
  it("accepts Airbnb calendar export URLs", () => {
    expect(isAirbnbIcalUrl("https://www.airbnb.com/calendar/ical/38210578.ics?s=abc123")).toBe(
      true,
    );
    expect(
      isAirbnbIcalUrl(" https://www.airbnb.ch/calendar/ical/1577629186881048894.ics?s=x "),
    ).toBe(true);
    expect(isAirbnbIcalUrl("https://airbnb.co.uk/calendar/ical/38210578.ics")).toBe(true);
  });
  it("rejects anything else (SSRF guard)", () => {
    expect(isAirbnbIcalUrl("http://www.airbnb.com/calendar/ical/38210578.ics")).toBe(false);
    expect(isAirbnbIcalUrl("https://evil.com/calendar/ical/38210578.ics")).toBe(false);
    expect(isAirbnbIcalUrl("https://www.airbnb.com.evil.com/calendar/ical/38210578.ics")).toBe(
      false,
    );
    expect(isAirbnbIcalUrl("https://www.airbnb.com/rooms/38210578")).toBe(false);
    expect(isAirbnbIcalUrl("https://user@169.254.169.254/calendar/ical/1.ics")).toBe(false);
    expect(isAirbnbIcalUrl("not a url")).toBe(false);
  });
});

describe("subtractRanges", () => {
  it("keeps, trims and splits around blockers", () => {
    const r = { start: "2030-02-01", end: "2030-02-10" };
    expect(subtractRanges(r, [])).toEqual([r]);
    expect(subtractRanges(r, [{ start: "2030-03-01", end: "2030-03-05" }])).toEqual([r]);
    expect(subtractRanges(r, [{ start: "2030-02-04", end: "2030-02-06" }])).toEqual([
      { start: "2030-02-01", end: "2030-02-03" },
      { start: "2030-02-07", end: "2030-02-10" },
    ]);
    expect(subtractRanges(r, [{ start: "2030-01-20", end: "2030-02-03" }])).toEqual([
      { start: "2030-02-04", end: "2030-02-10" },
    ]);
    expect(subtractRanges(r, [{ start: "2030-01-01", end: "2030-12-31" }])).toEqual([]);
  });
});

describe("planSync", () => {
  it("maps Reserved → booked, anything else → blocked, and drops past stays", () => {
    const plan = planSync(
      [
        ev("2029-12-01", "2029-12-05"),
        ev("2030-02-01", "2030-02-04"),
        ev("2030-03-01", "2030-03-10", "Airbnb (Not available)"),
      ],
      [],
      TODAY,
    );
    expect(plan).toEqual({
      ranges: [
        { start: "2030-02-01", end: "2030-02-04", status: "booked" },
        { start: "2030-03-01", end: "2030-03-10", status: "blocked" },
      ],
      conflicts: [],
    });
  });

  it("lets site rows win so the exclusion constraint never fires", () => {
    const plan = planSync(
      [ev("2030-02-01", "2030-02-10", "Airbnb (Not available)")],
      [site("2030-02-04", "2030-02-06", { status: "blocked" })],
      TODAY,
    );
    expect(plan.ranges).toEqual([
      { start: "2030-02-01", end: "2030-02-03", status: "blocked" },
      { start: "2030-02-07", end: "2030-02-10", status: "blocked" },
    ]);
  });

  it("treats our own export coming back as an echo, not a conflict", () => {
    const plan = planSync(
      [ev("2030-02-01", "2030-02-05", "Airbnb (Not available)")],
      [site("2030-02-01", "2030-02-05", { bookingRequestId: "req-1" })],
      TODAY,
    );
    expect(plan).toEqual({ ranges: [], conflicts: [] });
  });

  it("flags an Airbnb reservation overlapping a site booking", () => {
    const plan = planSync(
      [ev("2030-02-03", "2030-02-08")],
      [site("2030-02-01", "2030-02-05", { bookingRequestId: "req-1" })],
      TODAY,
    );
    expect(plan.conflicts).toEqual([{ start: "2030-02-03", end: "2030-02-08" }]);
    expect(plan.ranges).toEqual([{ start: "2030-02-06", end: "2030-02-08", status: "booked" }]);
  });

  it("does not let pending holds block Airbnb dates (soft holds, CLAUDE.md §5)", () => {
    const plan = planSync(
      [ev("2030-02-01", "2030-02-05")],
      [site("2030-02-01", "2030-02-05", { status: "prebooked", bookingRequestId: "req-2" })],
      TODAY,
    );
    expect(plan.ranges).toEqual([{ start: "2030-02-01", end: "2030-02-05", status: "booked" }]);
    expect(plan.conflicts).toEqual([{ start: "2030-02-01", end: "2030-02-05" }]);
  });
});

describe("fingerprint", () => {
  it("ignores order and past events, changes with future dates", () => {
    const a = [ev("2030-02-01", "2030-02-04"), ev("2030-03-01", "2030-03-02", "x")];
    expect(fingerprint(a, TODAY)).toBe(fingerprint([...a].reverse(), TODAY));
    expect(fingerprint([...a, ev("2020-01-01", "2020-01-02")], TODAY)).toBe(fingerprint(a, TODAY));
    expect(fingerprint([ev("2030-02-01", "2030-02-05")], TODAY)).not.toBe(fingerprint(a, TODAY));
  });
});

describe("runCalendarSync (in-memory repo + blobs, network mocked)", () => {
  const feed = readFileSync(new URL("./fixtures/airbnb/calendar.ics", import.meta.url), "utf8");
  const URL_OK = "https://www.airbnb.com/calendar/ical/38210578.ics?s=token";
  afterEach(() => vi.unstubAllGlobals());

  it("mirrors the feed, skips Neon when unchanged, and clears rows when turned off", async () => {
    const fetchMock = vi.fn(async () => new Response(feed, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const [{ apartmentId }] = await repo.listCalendarSync();

    await saveSyncUrl(apartmentId, URL_OK);
    expect(await runCalendarSync()).toEqual({ changed: [apartmentId] });

    const airbnbRows = (await repo.listAvailability(apartmentId)).filter(
      (r) => r.source === "airbnb",
    );
    expect(airbnbRows).toEqual([
      { apartmentId, start: "2030-12-10", end: "2030-12-14", status: "booked", source: "airbnb" },
      { apartmentId, start: "2030-12-28", end: "2031-01-04", status: "blocked", source: "airbnb" },
    ]);
    expect((await readSyncState())[apartmentId]?.lastError).toBeNull();

    // Same feed again: nothing rewritten.
    const spy = vi.spyOn(repo, "replaceAirbnbRanges");
    expect(await runCalendarSync()).toEqual({ changed: [] });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();

    // Admin cannot delete an Airbnb row by hand.
    await repo.clearAvailability(apartmentId, "2030-12-10", "2030-12-14");
    expect((await repo.listAvailability(apartmentId)).some((r) => r.source === "airbnb")).toBe(
      true,
    );

    // Turning the sync off removes the mirrored rows.
    await saveSyncUrl(apartmentId, "");
    expect((await repo.listAvailability(apartmentId)).some((r) => r.source === "airbnb")).toBe(
      false,
    );
  });

  it("records a feed error without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );
    const [{ apartmentId }] = await repo.listCalendarSync();
    await saveSyncUrl(apartmentId, URL_OK);
    expect(await runCalendarSync()).toEqual({ changed: [] });
    expect((await readSyncState())[apartmentId]?.lastError).toBe("airbnb_feed_http_503");
    await saveSyncUrl(apartmentId, "");
  });
});
