import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";

// Publishing can be made to fail on demand; otherwise it runs for real.
const publishFails = { on: false };
vi.mock("../netlify/lib/publish", async (orig) => {
  const real = await orig<typeof import("../netlify/lib/publish")>();
  return {
    ...real,
    publishAvailability: vi.fn(async () => {
      if (publishFails.on) throw new Error("blobs down");
      return real.publishAvailability();
    }),
  };
});

// Conflict alerts can be made to fail on demand.
const emailFails = { on: false };
const sentAlerts: { start: string; end: string }[][] = [];
vi.mock("../netlify/lib/email", async (orig) => ({
  ...(await orig<typeof import("../netlify/lib/email")>()),
  sendCalendarConflictEmail: vi.fn(async (_id: string, c: { start: string; end: string }[]) => {
    if (emailFails.on) throw new Error("resend_failed: down");
    sentAlerts.push(c);
  }),
}));

const { runCalendarSync, saveSyncUrl, readSyncState, invalidateSyncPlan, afterSiteCalendarChange } =
  await import("../netlify/lib/calendarSync");
const { repo, AvailabilityConflictError } = await import("../netlify/lib/db");

const feed = readFileSync(new URL("./fixtures/airbnb/calendar.ics", import.meta.url), "utf8");
const URL_OK = "https://www.airbnb.com/calendar/ical/38210578.ics?s=token";

describe("calendar sync retries", () => {
  afterEach(() => {
    publishFails.on = false;
    emailFails.on = false;
    sentAlerts.length = 0;
    vi.unstubAllGlobals();
  });

  it("re-plans and republishes after a failed publish instead of skipping", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(feed, { status: 200 })),
    );
    const [{ apartmentId }] = await repo.listCalendarSync();
    await saveSyncUrl(apartmentId, URL_OK);

    publishFails.on = true;
    await expect(runCalendarSync()).rejects.toThrow("blobs down");
    const st = (await readSyncState())[apartmentId];
    expect(st?.fingerprint).toBeUndefined();
    expect(st?.lastError).toBe("publish_failed");

    publishFails.on = false;
    expect(await runCalendarSync()).toEqual({ changed: [apartmentId] });
    expect((await readSyncState())[apartmentId]?.lastError).toBeNull();
    await saveSyncUrl(apartmentId, "");
  });

  it("re-plans an unchanged feed after the site calendar changed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(feed, { status: 200 })),
    );
    const [{ apartmentId }] = await repo.listCalendarSync();
    await saveSyncUrl(apartmentId, URL_OK);
    // A site block covers the Airbnb stay, so the mirrored range is trimmed.
    await repo.setAvailability({
      apartmentId,
      start: "2030-12-01",
      end: "2030-12-20",
      status: "blocked",
    });
    await runCalendarSync();
    const airbnb = async () =>
      (await repo.listAvailability(apartmentId)).filter((r) => r.source === "airbnb");
    expect((await airbnb()).some((r) => r.start === "2030-12-10")).toBe(false);

    // The block goes away; the feed hasn't changed, but the Airbnb dates must return.
    await repo.clearAvailability(apartmentId, "2030-12-01", "2030-12-20");
    expect(await runCalendarSync()).toEqual({ changed: [] }); // without invalidation: skipped
    await invalidateSyncPlan(apartmentId);
    expect(await runCalendarSync()).toEqual({ changed: [apartmentId] });
    expect((await airbnb()).some((r) => r.start === "2030-12-10")).toBe(true);
    await saveSyncUrl(apartmentId, "");
  });

  it("blocks hidden Airbnb dates again as soon as a site block is removed", async () => {
    const fetchFeed = vi.fn(async () => new Response(feed, { status: 200 }));
    vi.stubGlobal("fetch", fetchFeed);
    const [{ apartmentId }] = await repo.listCalendarSync();
    await saveSyncUrl(apartmentId, URL_OK);
    await repo.setAvailability({
      apartmentId,
      start: "2030-12-01",
      end: "2030-12-20",
      status: "blocked",
    });
    await runCalendarSync();

    // Remove the block the way the admin endpoint does — no feed refetch.
    fetchFeed.mockClear();
    await repo.clearAvailability(apartmentId, "2030-12-01", "2030-12-20");
    await afterSiteCalendarChange(apartmentId);
    expect(fetchFeed).not.toHaveBeenCalled();

    // The Airbnb stay (nights 10–14) is busy again: a request over it is refused.
    await expect(
      repo.createBooking({
        input: {
          apartmentId,
          arrival: "2030-12-11",
          departure: "2030-12-13",
          guests: 2,
          name: "A",
          email: "a@b.com",
          phone: "1",
          message: "",
        },
        holdEnd: "2030-12-12",
        expiresAt: "2035-01-01T00:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(AvailabilityConflictError);
    await saveSyncUrl(apartmentId, "");
  });

  it("retries a failed double-booking alert on the next run, then stops", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(feed, { status: 200 })),
    );
    const [{ apartmentId }] = await repo.listCalendarSync();
    // A site request held on nights an Airbnb guest then also reserves.
    const b = await repo.createBooking({
      input: {
        apartmentId,
        arrival: "2030-12-11",
        departure: "2030-12-13",
        guests: 2,
        name: "A",
        email: "a@b.com",
        phone: "1",
        message: "",
      },
      holdEnd: "2030-12-12",
      expiresAt: "2035-01-01T00:00:00.000Z",
    });
    await saveSyncUrl(apartmentId, URL_OK);

    emailFails.on = true;
    await runCalendarSync();
    expect((await readSyncState())[apartmentId]?.lastError).toBe("conflict_email_failed");

    emailFails.on = false;
    expect(await runCalendarSync()).toEqual({ changed: [] }); // feed unchanged…
    expect(sentAlerts).toEqual([[{ start: "2030-12-10", end: "2030-12-14" }]]); // …alert retried
    expect((await readSyncState())[apartmentId]?.lastError).toBeNull();

    await runCalendarSync();
    expect(sentAlerts).toHaveLength(1); // never twice
    await repo.decideBooking({
      id: b.id,
      status: "declined",
      apartmentId,
      arrival: "2030-12-11",
      lastNight: "2030-12-12",
      op: "unbook",
    });
    await saveSyncUrl(apartmentId, "");
  });
});
