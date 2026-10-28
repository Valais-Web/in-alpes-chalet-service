import { describe, it, expect } from "vitest";
import exportHandler from "../netlify/functions/calendar-export";
import adminHandler from "../netlify/functions/admin-calendar-sync";
import { putJson } from "../netlify/lib/blobs";
import { APARTMENTS_KEY, AVAILABILITY_KEY } from "../netlify/lib/publish";
import { createSessionCookie } from "../netlify/lib/auth";
import { parseIcal } from "../netlify/lib/ical";

const get = (path: string) => exportHandler(new Request(`http://localhost${path}`));

describe("GET /api/calendar/<slug>.ics", () => {
  it("exports only the site's confirmed bookings and manual blocks", async () => {
    await putJson(APARTMENTS_KEY, [
      { id: "apt-x", slug: "le-test", title: { fr: "Le Test", en: "", nl: "" } },
    ]);
    await putJson(AVAILABILITY_KEY, [
      { apartmentId: "apt-x", start: "2030-02-01", end: "2030-02-04", status: "booked" },
      { apartmentId: "apt-x", start: "2030-03-01", end: "2030-03-02", status: "blocked" },
      {
        apartmentId: "apt-x",
        start: "2030-04-01",
        end: "2030-04-03",
        status: "prebooked",
        expiresAt: "2030-01-01T00:00:00Z",
      },
      { apartmentId: "apt-x", start: "2030-05-01", end: "2030-05-03", status: "free" },
      {
        apartmentId: "apt-x",
        start: "2030-06-01",
        end: "2030-06-05",
        status: "booked",
        source: "airbnb",
      },
      { apartmentId: "apt-other", start: "2030-07-01", end: "2030-07-02", status: "booked" },
    ]);
    const res = await get("/api/calendar/le-test.ics");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    const events = parseIcal(await res.text());
    expect(events.map((e) => [e.start, e.end])).toEqual([
      ["2030-02-01", "2030-02-04"],
      ["2030-03-01", "2030-03-02"],
    ]);
  });

  it("404s for unknown apartments and malformed paths", async () => {
    expect((await get("/api/calendar/nope.ics")).status).toBe(404);
    expect((await get("/api/calendar/le-test")).status).toBe(404);
    expect((await get("/api/calendar/../secret.ics")).status).toBe(404);
  });
});

describe("/api/admin/calendar-sync", () => {
  const post = (body: unknown, cookie?: string) =>
    adminHandler(
      new Request("http://localhost/api/admin/calendar-sync", {
        method: "POST",
        headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(body),
      }),
    );
  const session = () => createSessionCookie().split(";")[0];

  it("requires the owner session", async () => {
    const res = await post({ action: "sync", apartmentId: "apt-le-combin" });
    expect(res.status).toBe(401);
  });

  it("rejects a non-Airbnb calendar URL", async () => {
    const res = await post(
      { action: "save", apartmentId: "apt-le-combin", importUrl: "https://evil.com/x.ics" },
      session(),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_airbnb_ical_url" });
  });

  it("lists every apartment with its sync status", async () => {
    const res = await adminHandler(
      new Request("http://localhost/api/admin/calendar-sync", { headers: { cookie: session() } }),
    );
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toMatchObject({ importUrl: "", lastSyncedAt: null, conflicts: [] });
  });
});
