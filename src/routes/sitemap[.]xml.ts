import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

interface SitemapEntry {
  path: string;
  changefreq?: string;
  priority?: string;
}

const STATIC: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/apartments", changefreq: "weekly", priority: "0.9" },
  { path: "/services", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "yearly", priority: "0.5" },
  { path: "/mentions-legales", changefreq: "yearly", priority: "0.2" },
  { path: "/confidentialite", changefreq: "yearly", priority: "0.2" },
];

const FALLBACK_SLUGS = [
  "le-combin",
  "studio-in-alpes",
  "perce-neige-21",
  "studio-la-petite-marmotte",
];

/** Live apartment slugs from the published content; static fallback on failure. */
async function apartmentSlugs(origin: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/api/content?type=apartments`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Array<{ slug: string }>;
    const slugs = data.map((a) => a.slug).filter(Boolean);
    return slugs.length ? slugs : FALLBACK_SLUGS;
  } catch {
    return FALLBACK_SLUGS;
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const origin = new URL(request.url).origin;
        const entries: SitemapEntry[] = [
          ...STATIC,
          ...(await apartmentSlugs(origin)).map((s) => ({
            path: `/apartments/${s}`,
            changefreq: "weekly",
            priority: "0.7",
          })),
        ];
        const urls = entries
          .map(
            (e) =>
              `  <url>\n    <loc>${origin}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
