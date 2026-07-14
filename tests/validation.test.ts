import { describe, it, expect } from "vitest";
import {
  bookingInputSchema,
  requestUpdateSchema,
  availabilityInputSchema,
  apartmentInputSchema,
} from "../netlify/lib/validation";

const futureBooking = {
  apartmentId: "apt-01",
  arrival: "2030-06-01",
  departure: "2030-06-05",
  guests: 2,
  name: "Alice",
  email: "alice@example.com",
  phone: "0791234567",
};

describe("bookingInputSchema", () => {
  it("accepts a valid future booking", () => {
    expect(bookingInputSchema.safeParse(futureBooking).success).toBe(true);
  });

  it("rejects a past arrival", () => {
    const r = bookingInputSchema.safeParse({
      ...futureBooking,
      arrival: "2020-01-01",
      departure: "2020-01-05",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an impossible calendar date", () => {
    const r = bookingInputSchema.safeParse({
      ...futureBooking,
      arrival: "2030-02-31",
      departure: "2030-03-05",
    });
    expect(r.success).toBe(false);
  });

  it("rejects departure on/before arrival", () => {
    const r = bookingInputSchema.safeParse({ ...futureBooking, departure: "2030-06-01" });
    expect(r.success).toBe(false);
  });
});

describe("requestUpdateSchema", () => {
  it("rejects an inconsistent status/action combo", () => {
    expect(
      requestUpdateSchema.safeParse({ id: "x", status: "declined", action: "confirm" }).success,
    ).toBe(false);
  });
  it("accepts consistent combos", () => {
    expect(
      requestUpdateSchema.safeParse({ id: "x", status: "accepted", action: "confirm" }).success,
    ).toBe(true);
    expect(
      requestUpdateSchema.safeParse({ id: "x", status: "declined", action: "decline" }).success,
    ).toBe(true);
    expect(requestUpdateSchema.safeParse({ id: "x", status: "archived" }).success).toBe(true);
  });
});

describe("availabilityInputSchema", () => {
  it("requires expiresAt for prebooked", () => {
    const bad = availabilityInputSchema.safeParse({
      apartmentId: "a",
      start: "2030-01-01",
      end: "2030-01-02",
      status: "prebooked",
    });
    expect(bad.success).toBe(false);
    const ok = availabilityInputSchema.safeParse({
      apartmentId: "a",
      start: "2030-01-01",
      end: "2030-01-02",
      status: "prebooked",
      expiresAt: "2030-01-01T00:00:00.000Z",
    });
    expect(ok.success).toBe(true);
  });
});

describe("apartmentInputSchema", () => {
  const base = {
    slug: "le-combin",
    title: { fr: "T" },
    summary: { fr: "S" },
    description: { fr: "D" },
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    surfaceM2: 60,
    pricePerNight: 150,
    location: { lat: 46.18, lng: 7.29, address: "Rue X" },
    practical: { rules: { fr: "R" } },
  };
  it("accepts a Cloudinary HTTPS image", () => {
    const r = apartmentInputSchema.safeParse({
      ...base,
      images: ["https://res.cloudinary.com/crxvfdmr/image/upload/x.jpg"],
    });
    expect(r.success).toBe(true);
  });
  it("rejects a javascript: image", () => {
    const r = apartmentInputSchema.safeParse({ ...base, images: ["javascript:alert(1)"] });
    expect(r.success).toBe(false);
  });
  it("rejects out-of-range coordinates", () => {
    expect(
      apartmentInputSchema.safeParse({ ...base, location: { lat: 9999, lng: 0, address: "x" } })
        .success,
    ).toBe(false);
  });
});
