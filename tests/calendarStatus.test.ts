import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { statusForDate } from "../src/lib/calendarStatus";
import type { AvailabilityRange } from "../shared/domain";

const hold: AvailabilityRange = {
  apartmentId: "apt-01",
  start: "2030-11-10",
  end: "2030-11-20",
  status: "prebooked",
  expiresAt: "2030-12-01T00:00:00Z",
};

describe("calendar status priority", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-11-01T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());
  it.each(["booked", "blocked"] as const)(
    "shows %s over overlapping pending holds regardless of input order",
    (status) => {
      const confirmed = { ...hold, start: "2030-11-15", end: "2030-11-16", status };
      expect(statusForDate("2030-11-15", [hold, confirmed])).toBe(status);
      expect(statusForDate("2030-11-15", [confirmed, hold])).toBe(status);
      expect(statusForDate("2030-11-14", [hold, confirmed])).toBe("prebooked");
    },
  );
  it("ignores expired holds and explicitly free ranges", () => {
    expect(statusForDate("2030-11-15", [{ ...hold, expiresAt: "2020-01-01T00:00:00Z" }])).toBe(
      "free",
    );
    expect(statusForDate("2030-11-15", [{ ...hold, status: "free" }, hold])).toBe("prebooked");
    expect(statusForDate("2030-11-21", [hold])).toBe("free");
  });
});
