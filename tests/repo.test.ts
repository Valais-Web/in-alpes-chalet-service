import { describe, it, expect } from "vitest";
import { repo, AvailabilityConflictError } from "../netlify/lib/db";

// No NEON_DATABASE_URL in tests → the in-memory repo, which mirrors the Neon
// overlap/transition rules.

const future = "2035-01-01T00:00:00.000Z";
const past = "2000-01-01T00:00:00.000Z";

function booking(apartmentId: string, arrival: string, departure: string) {
  return {
    apartmentId,
    arrival,
    departure,
    guests: 2,
    name: "A",
    email: "a@b.com",
    phone: "1",
    message: "",
  };
}

describe("createBooking overlap rules", () => {
  it("allows overlapping soft holds (prebooked does not block)", async () => {
    const apt = "t-soft";
    const b1 = await repo.createBooking({
      input: booking(apt, "2035-02-10", "2035-02-15"),
      holdEnd: "2035-02-14",
      expiresAt: future,
    });
    const b2 = await repo.createBooking({
      input: booking(apt, "2035-02-12", "2035-02-16"),
      holdEnd: "2035-02-15",
      expiresAt: future,
    });
    expect(b1.id).toBeTruthy();
    expect(b2.id).toBeTruthy();
  });

  it("rejects overlap with a confirmed (booked) range and allows same-day turnover", async () => {
    const apt = "t-confirm";
    const b = await repo.createBooking({
      input: booking(apt, "2035-03-10", "2035-03-15"),
      holdEnd: "2035-03-14",
      expiresAt: future,
    });
    await repo.decideBooking({
      id: b.id,
      status: "accepted",
      apartmentId: apt,
      arrival: "2035-03-10",
      lastNight: "2035-03-14",
      op: "book",
    });

    // Overlapping the booked nights [10..14] → rejected.
    await expect(
      repo.createBooking({
        input: booking(apt, "2035-03-12", "2035-03-14"),
        holdEnd: "2035-03-13",
        expiresAt: future,
      }),
    ).rejects.toBeInstanceOf(AvailabilityConflictError);

    // Arriving on the checkout day (15) → allowed (nights don't overlap).
    const turnover = await repo.createBooking({
      input: booking(apt, "2035-03-15", "2035-03-18"),
      holdEnd: "2035-03-17",
      expiresAt: future,
    });
    expect(turnover.id).toBeTruthy();
  });

  it("confirm rejects overlapping another confirmed range", async () => {
    const apt = "t-double";
    const a = await repo.createBooking({
      input: booking(apt, "2035-04-10", "2035-04-15"),
      holdEnd: "2035-04-14",
      expiresAt: future,
    });
    const b = await repo.createBooking({
      input: booking(apt, "2035-04-12", "2035-04-18"),
      holdEnd: "2035-04-17",
      expiresAt: future,
    });
    await repo.decideBooking({
      id: a.id,
      status: "accepted",
      apartmentId: apt,
      arrival: "2035-04-10",
      lastNight: "2035-04-14",
      op: "book",
    });
    await expect(
      repo.decideBooking({
        id: b.id,
        status: "accepted",
        apartmentId: apt,
        arrival: "2035-04-12",
        lastNight: "2035-04-17",
        op: "book",
      }),
    ).rejects.toBeInstanceOf(AvailabilityConflictError);
  });
});

describe("hold ownership (decisions act only on the request's own range)", () => {
  it("declining one request keeps another guest's overlapping soft hold", async () => {
    const apt = "t-own-decline";
    const alice = await repo.createBooking({
      input: booking(apt, "2036-01-10", "2036-01-15"),
      holdEnd: "2036-01-14",
      expiresAt: future,
    });
    const bob = await repo.createBooking({
      input: booking(apt, "2036-01-12", "2036-01-17"),
      holdEnd: "2036-01-16",
      expiresAt: future,
    });

    // Both holds are live; overlapping soft holds are allowed (CLAUDE.md §5).
    let holds = (await repo.listAvailability(apt)).filter((r) => r.status === "prebooked");
    expect(holds.length).toBe(2);

    // Decline Alice → only Alice's hold disappears; Bob's survives.
    await repo.decideBooking({
      id: alice.id,
      status: "declined",
      apartmentId: apt,
      arrival: "2036-01-10",
      lastNight: "2036-01-14",
      op: "release_hold",
    });
    holds = (await repo.listAvailability(apt)).filter((r) => r.status === "prebooked");
    expect(holds.length).toBe(1);
    expect(holds[0].start).toBe("2036-01-12"); // Bob's

    // Bob can still be confirmed.
    await repo.decideBooking({
      id: bob.id,
      status: "accepted",
      apartmentId: apt,
      arrival: "2036-01-12",
      lastNight: "2036-01-16",
      op: "book",
    });
    const booked = (await repo.listAvailability(apt)).filter((r) => r.status === "booked");
    expect(booked.length).toBe(1);
  });

  it("reversing an accepted booking (unbook) removes its confirmed range", async () => {
    const apt = "t-own-unbook";
    const b = await repo.createBooking({
      input: booking(apt, "2036-02-10", "2036-02-15"),
      holdEnd: "2036-02-14",
      expiresAt: future,
    });
    await repo.decideBooking({
      id: b.id,
      status: "accepted",
      apartmentId: apt,
      arrival: "2036-02-10",
      lastNight: "2036-02-14",
      op: "book",
    });
    expect((await repo.listAvailability(apt)).some((r) => r.status === "booked")).toBe(true);

    // accepted → declined must free the calendar, not leave a phantom booking.
    await repo.decideBooking({
      id: b.id,
      status: "declined",
      apartmentId: apt,
      arrival: "2036-02-10",
      lastNight: "2036-02-14",
      op: "unbook",
    });
    const ranges = await repo.listAvailability(apt);
    expect(ranges.some((r) => r.status === "booked")).toBe(false);

    // The freed nights are now bookable again.
    const rebook = await repo.createBooking({
      input: booking(apt, "2036-02-10", "2036-02-15"),
      holdEnd: "2036-02-14",
      expiresAt: future,
    });
    expect(rebook.id).toBeTruthy();
  });

  it("does not leak the internal owner id into published ranges", async () => {
    const apt = "t-own-leak";
    await repo.createBooking({
      input: booking(apt, "2036-03-10", "2036-03-15"),
      holdEnd: "2036-03-14",
      expiresAt: future,
    });
    const ranges = await repo.listAvailability(apt);
    for (const r of ranges) {
      expect(Object.prototype.hasOwnProperty.call(r, "bookingRequestId")).toBe(false);
    }
  });
});

describe("retention maintenance", () => {
  it("anonymizes bookings past the cutoff and purges expired holds", async () => {
    const apt = "t-retention";
    const b = await repo.createBooking({
      input: booking(apt, "2019-05-10", "2019-05-15"),
      holdEnd: "2019-05-14",
      expiresAt: past,
    });
    const anonymized = await repo.anonymizeBookingsBefore("2021-01-01");
    expect(anonymized).toBeGreaterThanOrEqual(1);
    const found = (await repo.listBookings()).find((x) => x.id === b.id);
    expect(found?.email).toBe("");
    expect(found?.name).toBe("[removed]");

    const purged = await repo.purgeExpiredHolds();
    expect(purged).toBeGreaterThanOrEqual(1);
  });
});
