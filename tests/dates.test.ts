import { describe, it, expect } from "vitest";
import { addDaysISO, lastNightISO } from "../netlify/lib/dates";

describe("dates", () => {
  it("adds and subtracts whole days", () => {
    expect(addDaysISO("2030-01-15", -1)).toBe("2030-01-14");
    expect(addDaysISO("2030-01-15", 3)).toBe("2030-01-18");
  });

  it("crosses month and year boundaries", () => {
    expect(addDaysISO("2030-03-01", -1)).toBe("2030-02-28");
    expect(addDaysISO("2030-01-01", -1)).toBe("2029-12-31");
    expect(addDaysISO("2028-03-01", -1)).toBe("2028-02-29"); // leap year
  });

  it("lastNightISO is the day before departure", () => {
    expect(lastNightISO("2030-01-15")).toBe("2030-01-14");
  });
});
