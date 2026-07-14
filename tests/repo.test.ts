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
      action: "confirm",
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
      action: "confirm",
    });
    await expect(
      repo.decideBooking({
        id: b.id,
        status: "accepted",
        apartmentId: apt,
        arrival: "2035-04-12",
        lastNight: "2035-04-17",
        action: "confirm",
      }),
    ).rejects.toBeInstanceOf(AvailabilityConflictError);
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
