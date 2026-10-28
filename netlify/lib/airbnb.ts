/**
 * Airbnb listing import — prefills the admin "new apartment" form from a public
 * Airbnb listing URL.
 *
 * ⚠ BEST-EFFORT SCRAPING. Airbnb has no public listing API; we read the JSON
 * state embedded in the listing page (`<script id="data-deferred-state-0">`),
 * with the schema.org JSON-LD block as a fallback. Airbnb can change that
 * structure at any time without notice, which will break (part of) the import.
 * The admin always reviews the prefilled form before saving, and every field
 * stays editable by hand.
 *
 * The page is fetched once per site language (airbnb.fr / .com / .nl) so the
 * description and house rules come back in FR / EN / NL: the host's own
 * translation when there is one, Airbnb's otherwise.
 */
import type { AirbnbImport, Locale, LocalizedText } from "./types";
import { HttpError } from "./http";

const LOCALES: Locale[] = ["fr", "en", "nl"];

/** One Airbnb domain per locale. Building the URL ourselves (never fetching the
 * admin-supplied URL as-is) keeps this endpoint from being usable for SSRF. */
const LOCALE_ORIGINS: Record<Locale, { origin: string; acceptLanguage: string }> = {
  fr: { origin: "https://www.airbnb.fr", acceptLanguage: "fr-FR,fr;q=0.9" },
  en: { origin: "https://www.airbnb.com", acceptLanguage: "en-US,en;q=0.9" },
  nl: { origin: "https://www.airbnb.nl", acceptLanguage: "nl-NL,nl;q=0.9" },
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const MAX_IMAGES = 30; // apartmentInputSchema caps images at 30
const SUMMARY_MAX = 200;

// --- URL --------------------------------------------------------------------

/** The numeric listing id from any airbnb.<tld>/rooms/<id> URL, or null. */
export function extractListingId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!/(^|\.)airbnb\.[a-z]{2,3}(\.[a-z]{2})?$/i.test(url.hostname)) return null;
  const m = url.pathname.match(/^\/rooms\/(?:plus\/)?(\d{5,25})(?:\/|$)/);
  return m ? m[1] : null;
}

// --- HTML → listing fields ----------------------------------------------------

/** What one localized page yields. Text is in that page's language. */
export interface ParsedListingPage {
  title: string;
  description: string;
  rules: string[];
  images: string[];
  maxGuests: number | null;
  overview: string[]; // e.g. ["6 guests", "1 bedroom", "6 beds", "1.5 baths"]
  amenityIcons: string[]; // available amenities only, e.g. "SYSTEM_WI_FI"
  lat: number | null;
  lng: number | null;
  address: string;
}

type Json = Record<string, unknown>;

const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null;

/** Safe nested access: get(o, "a", "b", 0, "c"). */
function get(o: unknown, ...path: (string | number)[]): unknown {
  let cur: unknown = o;
  for (const k of path) {
    if (!isObj(cur)) return undefined;
    cur = (cur as Record<string | number, unknown>)[k];
  }
  return cur;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Depth-first search for the first object matching `pred`. */
function findDeep(o: unknown, pred: (x: Json) => boolean, depth = 0): Json | null {
  if (depth > 40 || !isObj(o)) return null;
  if (pred(o)) return o;
  for (const v of Object.values(o)) {
    const hit = findDeep(v, pred, depth + 1);
    if (hit) return hit;
  }
  return null;
}

function scriptJson(html: string, attr: RegExp): unknown[] {
  const out: unknown[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!attr.test(m[1])) continue;
    try {
      out.push(JSON.parse(m[2]));
    } catch {
      // not JSON — ignore
    }
  }
  return out;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Airbnb descriptions are light HTML (<br />, <b>…). Convert to plain text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ent: string) => {
      if (ent[0] === "#") {
        const code =
          ent[1].toLowerCase() === "x" ? parseInt(ent.slice(2), 16) : Number(ent.slice(1));
        return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
      }
      return ENTITIES[ent.toLowerCase()] ?? whole;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Prefer the text shown to a visitor of that locale, falling back to the
 * host's original. */
function ugc(o: unknown): string {
  return (
    str(get(o, "localizedStringWithTranslationPreference")) ||
    str(get(o, "localizedString")) ||
    str(get(o, "source"))
  );
}

/** Strip Airbnb's resize query (?im_w=720…) so Cloudinary gets the original. */
const cleanImage = (u: string) => u.split("?")[0];
const isListingPhoto = (u: string) =>
  /^https:\/\/a0\.muscache\.com\/im\/pictures\//.test(u) && !u.includes("/user/");

export function parseListingPage(html: string): ParsedListingPage | null {
  const [deferred] = scriptJson(html, /id="data-deferred-state-0"/);
  const node =
    findDeep(deferred, (x) => isObj(x.pdpPresentation) && x.__typename !== undefined) ?? null;
  const pdp = get(node, "pdpPresentation");

  // Home listings publish a "VacationRental" block, hotel rooms a "Hotel" one.
  const lds = scriptJson(html, /type="application\/ld\+json"/).filter(isObj);
  const ld =
    lds.find((x) => x["@type"] === "VacationRental") ??
    lds.find((x) => typeof x.name === "string" && x["@type"] !== "Product") ??
    null;

  if (!pdp && !ld) return null;

  // Title: the host's original name — Airbnb's translation of a proper noun is
  // rarely what we want ("Perce Neige 21" → "Snow Piercer 21").
  const title =
    str(get(pdp, "title", "content", "source")) ||
    ugc(get(pdp, "title", "content")) ||
    str(get(pdp, "title", "text")) || // hotel-style listings
    str(get(ld, "name"));

  const descHtml =
    ugc(get(pdp, "descriptions", "longDescriptionHtml")) ||
    ugc(get(pdp, "descriptions", "shortDescriptionHtml", "content"));
  const description = descHtml ? htmlToText(descHtml) : str(get(ld, "description")).trim();

  // Photos: hero first, then the photo tour (room by room), then JSON-LD.
  const images: string[] = [];
  const pushImage = (u: unknown) => {
    const s = str(u);
    if (!s || !isListingPhoto(s)) return;
    const clean = cleanImage(s);
    if (!images.includes(clean)) images.push(clean);
  };
  for (const e of (get(pdp, "heroMedia", "edges") as unknown[]) ?? []) {
    pushImage(get(e, "node", "image", "uri"));
  }
  for (const stop of (get(pdp, "mediaTour", "stops") as unknown[]) ?? []) {
    for (const item of (get(stop, "items") as unknown[]) ?? []) {
      pushImage(get(item, "image", "uri"));
    }
  }
  for (const u of (get(ld, "image") as unknown[]) ?? []) pushImage(u);

  const amenityIcons: string[] = [];
  for (const groupKey of ["seeAllAmenitiesGroups", "previewAmenitiesGroups"]) {
    for (const group of (get(pdp, "amenities", groupKey) as unknown[]) ?? []) {
      for (const a of (get(group, "amenities") as unknown[]) ?? []) {
        const icon = str(get(a, "icon"));
        if (get(a, "available") === true && icon && !amenityIcons.includes(icon)) {
          amenityIcons.push(icon);
        }
      }
    }
  }

  const rules: string[] = [];
  for (const group of (get(pdp, "rules", "groupItems") as unknown[]) ?? []) {
    // Only the structured rules (pets, smoking, parties…). The "host requests"
    // group is just a heading here — its text lives behind a modal.
    if (str(get(group, "type")) !== "HOUSE_RULES_STRUCTURED_RULES") continue;
    for (const item of (get(group, "items") as unknown[]) ?? []) {
      // Capacity is already a key fact on the apartment page; lock-up is a
      // checkout instruction, not a rule.
      const type = str(get(item, "type"));
      if (type === "HOUSE_RULES_PERSON_CAPACITY" || type === "HOUSE_RULES_LOCK_UP") continue;
      const t = str(get(item, "title")).trim();
      if (t) rules.push(t);
    }
  }

  return {
    title: title.trim(),
    description,
    rules,
    images,
    maxGuests:
      num(get(pdp, "personCapacity")) ??
      num(get(node, "personCapacity")) ??
      num(get(ld, "containsPlace", "occupancy", "value")),
    overview: ((get(pdp, "overview", "items") as unknown[]) ?? []).map(str).filter(Boolean),
    amenityIcons,
    lat:
      num(get(pdp, "location", "latitude")) ??
      num(get(node, "location", "coordinate", "latitude")) ??
      num(get(ld, "latitude")),
    lng:
      num(get(pdp, "location", "longitude")) ??
      num(get(node, "location", "coordinate", "longitude")) ??
      num(get(ld, "longitude")),
    address:
      str(get(pdp, "location", "subtitle")) ||
      str(get(pdp, "localizedLocation")) ||
      str(get(ld, "address", "addressLocality")),
  };
}

// --- mapping to our model ------------------------------------------------------

/** Airbnb amenity icon → our amenity key (see AMENITIES in admin.apartments.tsx). */
const AMENITY_RULES: [RegExp, string][] = [
  [/^SYSTEM_WI_FI$/, "wifi"],
  [/FIREPLACE/, "fireplace"],
  [/PARKING|^SYSTEM_MAPS_CAR_RENTAL$/, "parking"],
  [/^SYSTEM_WASHER$/, "washer"],
  [/^SYSTEM_DISHWASHER$/, "dishwasher"],
  [/BALCONY|PATIO/, "balcony"],
  [/VIEW_MOUNTAIN|MOUNTAIN_VIEW/, "mountainView"],
  [/SKI_STORAGE/, "skiStorage"],
  [/^SYSTEM_ELEVATOR$/, "elevator"],
];

export function mapAmenities(icons: string[]): string[] {
  const out: string[] = [];
  for (const icon of icons) {
    if (icon.startsWith("SYSTEM_NO_")) continue;
    for (const [re, key] of AMENITY_RULES) {
      if (re.test(icon) && !out.includes(key)) out.push(key);
    }
  }
  return out;
}

/** Numbers from the English overview line: "1 bedroom", "Studio", "1.5 baths". */
export function parseOverview(items: string[]): {
  bedrooms: number | null;
  bathrooms: number | null;
} {
  let bedrooms: number | null = null;
  let bathrooms: number | null = null;
  for (const raw of items) {
    const s = raw.toLowerCase().replace(",", ".");
    const n = s.match(/(\d+(?:\.\d+)?)/);
    if (/studio/.test(s)) bedrooms = 0;
    else if (/bedroom/.test(s) && n) bedrooms = Number(n[1]);
    else if (/half-bath/.test(s)) bathrooms ??= 1;
    // Our model stores whole bathrooms: 1.5 baths → 2.
    else if (/bath/.test(s) && n) bathrooms = Math.ceil(Number(n[1]));
  }
  return { bedrooms, bathrooms };
}

/** "… a 65m2 flat …", "65 m²", "65 vierkante meter" → 65. */
export function extractSurface(texts: string[]): number | null {
  for (const t of texts) {
    const m = t.match(/(\d{2,4})\s?(?:m2|m²|m ²|sqm|square met|vierkante meter)/i);
    if (m) return Number(m[1]);
  }
  return null;
}

/** First sentence(s) of the description, kept under SUMMARY_MAX characters. */
export function makeSummary(description: string): string {
  const firstPara = description.split(/\n/)[0].trim();
  if (firstPara.length <= SUMMARY_MAX) return firstPara;
  let out = "";
  for (const sentence of firstPara.match(/[^.!?]+[.!?]+/g) ?? []) {
    if ((out + sentence).length > SUMMARY_MAX) break;
    out += sentence;
  }
  return (out || firstPara.slice(0, SUMMARY_MAX - 1) + "…").trim();
}

const emptyText = (): LocalizedText => ({ fr: "", en: "", nl: "" });

/** Merge the per-locale pages into one draft. Missing locales fall back to
 * another language so the form is never empty (flagged in `warnings`). */
export function buildImport(
  listingId: string,
  pages: Partial<Record<Locale, ParsedListingPage | null>>,
): AirbnbImport {
  const available = LOCALES.filter((l) => pages[l]);
  if (available.length === 0) throw new HttpError(502, "airbnb_parse_failed");
  const warnings: string[] = [];
  const pick = (l: Locale) => pages[l] ?? pages[available[0]]!;
  const primary = pages.en ?? pages[available[0]]!;

  for (const l of LOCALES) if (!pages[l]) warnings.push(`locale_missing_${l}`);

  const title = emptyText();
  const description = emptyText();
  const summary = emptyText();
  const rules = emptyText();
  for (const l of LOCALES) {
    const p = pick(l);
    title[l] = p.title;
    description[l] = p.description;
    summary[l] = makeSummary(p.description);
    rules[l] = p.rules.join(". ") + (p.rules.length ? "." : "");
  }

  const { bedrooms, bathrooms } = parseOverview(primary.overview);
  if (bedrooms === null) warnings.push("bedrooms");
  if (bathrooms === null) warnings.push("bathrooms");
  if (primary.maxGuests === null) warnings.push("maxGuests");
  if (primary.lat === null || primary.lng === null) warnings.push("location");
  if (!title.fr) warnings.push("title");
  if (!description.fr) warnings.push("description");
  if (primary.images.length === 0) warnings.push("images");

  const surfaceM2 = extractSurface(LOCALES.map((l) => pick(l).description));
  if (surfaceM2 === null) warnings.push("surfaceM2");

  return {
    listingId,
    title,
    summary,
    description,
    rules,
    images: primary.images.slice(0, MAX_IMAGES),
    maxGuests: primary.maxGuests ?? 2,
    bedrooms: bedrooms ?? 1,
    bathrooms: bathrooms ?? 1,
    surfaceM2,
    amenities: mapAmenities(primary.amenityIcons),
    location: {
      lat: primary.lat ?? 46.18,
      lng: primary.lng ?? 7.31,
      address: pick("fr").address,
    },
    warnings,
  };
}

// --- network -------------------------------------------------------------------

async function fetchLocalePage(
  listingId: string,
  locale: Locale,
): Promise<ParsedListingPage | null> {
  const { origin, acceptLanguage } = LOCALE_ORIGINS[locale];
  try {
    const res = await fetch(`${origin}/rooms/${listingId}`, {
      headers: { "user-agent": USER_AGENT, "accept-language": acceptLanguage, accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn(`[airbnb] ${locale} ${res.status} for listing ${listingId}`);
      return null;
    }
    // A geo/language mismatch returns a tiny "domain switch" page instead.
    return parseListingPage(await res.text());
  } catch (err) {
    console.warn(`[airbnb] ${locale} fetch failed for listing ${listingId}:`, err);
    return null;
  }
}

/** Fetch the listing in FR/EN/NL in parallel and build the draft. */
export async function importAirbnbListing(url: string): Promise<AirbnbImport> {
  const listingId = extractListingId(url);
  if (!listingId) throw new HttpError(400, "invalid_airbnb_url");
  const results = await Promise.all(LOCALES.map((l) => fetchLocalePage(listingId, l)));
  const pages = Object.fromEntries(LOCALES.map((l, i) => [l, results[i]])) as Record<
    Locale,
    ParsedListingPage | null
  >;
  return buildImport(listingId, pages);
}
