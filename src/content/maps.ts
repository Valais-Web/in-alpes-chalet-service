/**
 * Owner-provided Google Maps place links, keyed by apartment slug. Preferred
 * over a coordinate lookup because they point at the exact registered place.
 * Slugs not listed fall back to a coordinate search (see apartments.$slug.tsx).
 */
export const GOOGLE_MAPS_LINKS: Record<string, string> = {
  "studio-in-alpes": "https://maps.app.goo.gl/3xijKDn4z3WRabf66",
  "studio-la-petite-marmotte": "https://maps.app.goo.gl/7P1qN3hsVkaNaUhp7",
};

/** Resolve the Google Maps link for an apartment, falling back to coordinates. */
export function googleMapsLink(slug: string, lat: number, lng: number): string {
  return (
    GOOGLE_MAPS_LINKS[slug] ?? `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`
  );
}
