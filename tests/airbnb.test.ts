import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildImport,
  extractListingId,
  extractSurface,
  htmlToText,
  importAirbnbListing,
  makeSummary,
  mapAmenities,
  parseListingPage,
  parseOverview,
} from "../netlify/lib/airbnb";
import { apartmentInputSchema } from "../netlify/lib/validation";

// Trimmed copies of the real "Perce Neige 21" listing page (airbnb.fr/.com/.nl,
// fetched 2026-10). If Airbnb changes its page structure, refresh these from a
// live page and see which assertions break.
const fixture = (locale: string) =>
  readFileSync(new URL(`./fixtures/airbnb/perce-neige-21.${locale}.html`, import.meta.url), "utf8");

describe("extractListingId", () => {
  it("reads the id from common Airbnb URLs", () => {
    expect(extractListingId("https://www.airbnb.com/rooms/38210578")).toBe("38210578");
    expect(
      extractListingId("https://fr.airbnb.ch/rooms/38210578?adults=2&check_in=2026-12-01"),
    ).toBe("38210578");
    expect(extractListingId("https://www.airbnb.co.uk/rooms/1577629186881048894/")).toBe(
      "1577629186881048894",
    );
    expect(extractListingId("  https://airbnb.nl/rooms/plus/38210578 ")).toBe("38210578");
  });

  it("rejects non-Airbnb hosts and non-listing paths", () => {
    expect(extractListingId("https://evil.com/rooms/38210578")).toBeNull();
    expect(extractListingId("https://airbnb.com.evil.com/rooms/38210578")).toBeNull();
    expect(extractListingId("https://www.airbnb.com/users/show/123456")).toBeNull();
    expect(extractListingId("not a url")).toBeNull();
    expect(extractListingId("javascript:alert(1)")).toBeNull();
  });
});

describe("parseListingPage (real page fixture)", () => {
  const en = parseListingPage(fixture("en"))!;

  it("reads the core listing fields", () => {
    expect(en.title).toBe("Perce Neige 21"); // host original, not "Snow Piercer 21"
    expect(en.description).toMatch(/^Perce Neige 21 is a ski-in\/ski-out 65m2 flat/);
    expect(en.description).not.toMatch(/<br/);
    expect(en.maxGuests).toBe(6);
    expect(en.lat).toBeCloseTo(46.18092, 4);
    expect(en.lng).toBeCloseTo(7.29087, 4);
    expect(en.overview).toEqual(["6 guests", "1 bedroom", "6 beds", "1.5 baths"]);
  });

  it("collects deduplicated original-size listing photos, hero first", () => {
    expect(en.images.length).toBeGreaterThanOrEqual(8);
    expect(new Set(en.images).size).toBe(en.images.length);
    for (const u of en.images)
      expect(u).toMatch(/^https:\/\/a0\.muscache\.com\/im\/pictures\/[^?]+$/);
    expect(en.images[0]).toContain("730201d6-8563-4cd0-8226-61065bdd6934");
  });

  it("keeps only available amenities", () => {
    expect(en.amenityIcons).toContain("SYSTEM_WI_FI");
    expect(en.amenityIcons.some((i) => i.startsWith("SYSTEM_NO_"))).toBe(false);
  });

  it("returns null for a page without listing data", () => {
    expect(parseListingPage("<html><body>Redirection…</body></html>")).toBeNull();
  });

  it("falls back to JSON-LD when the embedded app state is gone", () => {
    const ldOnly = fixture("en").replace(
      /<script id="data-deferred-state-0"[\s\S]*?<\/script>/,
      "",
    );
    const p = parseListingPage(ldOnly)!;
    expect(p.title).toBe("Snow Piercer 21");
    expect(p.maxGuests).toBe(6);
    expect(p.lat).toBeCloseTo(46.18092, 4);
    expect(p.images.length).toBeGreaterThan(0);
  });
});

describe("parseListingPage (hotel-style listing)", () => {
  // Hotel rooms use a different shape: title.text, only a short description,
  // no overview line, a "Hotel" JSON-LD block.
  const hotel = parseListingPage(
    readFileSync(new URL("./fixtures/airbnb/hotel-casa-luz.en.html", import.meta.url), "utf8"),
  )!;

  it("still reads title, description, photos and location", () => {
    expect(hotel.title).toBe("Hotel Casa Luz");
    expect(hotel.description).toMatch(/^Our hotel allows you to overlook Barcelona/);
    expect(hotel.images.length).toBeGreaterThan(0);
    expect(hotel.lat).toBeCloseTo(41.386, 2);
    expect(hotel.address).toBe("Barcelona");
  });

  it("flags the facts it cannot read instead of failing", () => {
    const draft = buildImport("1608707384900427091", { fr: null, en: hotel, nl: null });
    expect(draft.title.fr).toBe("Hotel Casa Luz");
    expect(draft.warnings).toEqual(expect.arrayContaining(["bedrooms", "bathrooms"]));
    expect(draft.warnings).not.toContain("title");
    expect(draft.warnings).not.toContain("description");
  });
});

describe("buildImport (three locales)", () => {
  const draft = buildImport("38210578", {
    fr: parseListingPage(fixture("fr")),
    en: parseListingPage(fixture("en")),
    nl: parseListingPage(fixture("nl")),
  });

  it("fills every language from its own page", () => {
    expect(draft.description.fr).toMatch(/^Perce Neige 21 est un appartement/);
    expect(draft.description.en).toMatch(/^Perce Neige 21 is a ski-in/);
    expect(draft.description.nl).toMatch(/^Perce Neige 21 is een/);
    expect(draft.rules.fr).toContain("Non fumeur");
    expect(draft.rules.en).toContain("No smoking");
    expect(draft.rules.nl).toContain("Niet roken");
    expect(draft.rules.en).not.toMatch(/guests/); // capacity rule dropped
  });

  it("maps the key facts", () => {
    expect(draft).toMatchObject({
      maxGuests: 6,
      bedrooms: 1,
      bathrooms: 2, // 1.5 baths rounded up
      surfaceM2: 65,
      location: { lat: 46.18092, lng: 7.29087, address: "Haute-Nendaz, Valais, Suisse" },
      warnings: [],
    });
    expect(draft.amenities).toEqual(
      expect.arrayContaining(["wifi", "dishwasher", "balcony", "parking", "elevator"]),
    );
    expect(draft.images.length).toBeLessThanOrEqual(30);
  });

  it("produces content the apartment save schema accepts (once photos are re-hosted)", () => {
    const r = apartmentInputSchema.safeParse({
      slug: "perce-neige-21",
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
      images: draft.images.map(
        (_, i) => `https://res.cloudinary.com/demo/image/upload/in-alpes/apartments/p${i}.jpg`,
      ),
      maxGuests: draft.maxGuests,
      bedrooms: draft.bedrooms,
      bathrooms: draft.bathrooms,
      surfaceM2: draft.surfaceM2,
      floor: "",
      amenities: draft.amenities,
      pricePerNight: 0,
      location: draft.location,
      practical: { checkIn: "16:00", checkOut: "10:00", rules: draft.rules },
    });
    expect(r.success).toBe(true);
  });

  it("falls back to another language and warns when a locale page failed", () => {
    const partial = buildImport("38210578", {
      fr: null,
      en: parseListingPage(fixture("en")),
      nl: null,
    });
    expect(partial.description.fr).toBe(partial.description.en);
    expect(partial.warnings).toEqual(
      expect.arrayContaining(["locale_missing_fr", "locale_missing_nl"]),
    );
  });

  it("fails when no page could be parsed", () => {
    expect(() => buildImport("1", { fr: null, en: null, nl: null })).toThrow("airbnb_parse_failed");
  });
});

describe("helpers", () => {
  it("parseOverview handles studios, half baths and French decimals", () => {
    expect(parseOverview(["2 guests", "Studio", "1 bed", "1 private bath"])).toEqual({
      bedrooms: 0,
      bathrooms: 1,
    });
    expect(parseOverview(["3 bedrooms", "2,5 baths"])).toEqual({ bedrooms: 3, bathrooms: 3 });
    expect(parseOverview(["1 bedroom", "Half-bath"])).toEqual({ bedrooms: 1, bathrooms: 1 });
    expect(parseOverview([])).toEqual({ bedrooms: null, bathrooms: null });
  });

  it("mapAmenities ignores unavailable and unknown icons", () => {
    expect(
      mapAmenities(["SYSTEM_WI_FI", "SYSTEM_NO_WASHER", "SYSTEM_HAIRDRYER", "SYSTEM_WASHER"]),
    ).toEqual(["wifi", "washer"]);
  });

  it("extractSurface reads m2 / m² / vierkante meter", () => {
    expect(extractSurface(["a 65m2 flat"])).toBe(65);
    expect(extractSurface(["", "un studio de 29 m² avec"])).toBe(29);
    expect(extractSurface(["van 50 vierkante meter"])).toBe(50);
    expect(extractSurface(["no size here"])).toBeNull();
  });

  it("htmlToText converts breaks and entities", () => {
    expect(htmlToText("A &amp; B<br />C&#39;est<br/><br/><br/>D &nbsp;<b>E</b>")).toBe(
      "A & B\nC'est\n\nD  E",
    );
  });

  it("makeSummary keeps whole sentences under 200 chars", () => {
    const long = "First sentence here. " + "x".repeat(200) + ". Third one.";
    expect(makeSummary(long)).toBe("First sentence here.");
    expect(makeSummary("Short.\nSecond paragraph.")).toBe("Short.");
  });
});

describe("importAirbnbListing (network mocked)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fetches airbnb.fr/.com/.nl for the listing id only, never the raw URL", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        const locale = url.includes("airbnb.fr") ? "fr" : url.includes("airbnb.nl") ? "nl" : "en";
        return new Response(fixture(locale), { status: 200 });
      }),
    );
    const draft = await importAirbnbListing("https://fr.airbnb.ch/rooms/38210578?check_in=x");
    expect(calls.sort()).toEqual([
      "https://www.airbnb.com/rooms/38210578",
      "https://www.airbnb.fr/rooms/38210578",
      "https://www.airbnb.nl/rooms/38210578",
    ]);
    expect(draft.listingId).toBe("38210578");
    expect(draft.warnings).toEqual([]);
  });

  it("returns 502 when Airbnb serves no listing data on any locale", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html></html>", { status: 200 })),
    );
    await expect(
      importAirbnbListing("https://www.airbnb.com/rooms/38210578"),
    ).rejects.toMatchObject({
      status: 502,
    });
  });

  it("rejects a non-Airbnb URL with 400 before any fetch", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    await expect(importAirbnbListing("https://example.com/rooms/1")).rejects.toMatchObject({
      status: 400,
    });
    expect(f).not.toHaveBeenCalled();
  });
});
