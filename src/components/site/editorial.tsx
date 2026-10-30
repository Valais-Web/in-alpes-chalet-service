import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { imageAt, imageSrcSet } from "@/data/api";
import type { Apartment } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import { NightlyPrice } from "./NightlyPrice";
import { H1, LEAD, grade } from "./editorialStyles";

/**
 * Shared editorial components for the public pages: the inner-page intro and
 * the apartment tile. Class tokens live in ./editorialStyles.
 */

/** Inner-page opening: the title large on the left, the lead on the right. */
export function PageIntro({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="pb-14 pt-16 md:pb-20 md:pt-24">
      <div className="container-page grid gap-8 md:grid-cols-12 md:items-end">
        <h1 className={H1 + " md:col-span-7"}>{title}</h1>
        {(lead || children) && (
          <div className="md:col-span-4 md:col-start-9">
            {lead && <p className={LEAD}>{lead}</p>}
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/** Home covers: the straightest, least cluttered shot of each apartment
 * (index into its gallery; falls back to the cover). */
const COVER: Record<string, number> = {
  "le-combin": 8,
  "studio-in-alpes": 3,
  "perce-neige-21": 0,
  "studio-la-petite-marmotte": 7,
};

/** One bounded card keeps each photo, title and tariff visually associated. */
export function StayTile({
  apartment: a,
  withSummary = false,
  className = "",
}: {
  apartment: Apartment;
  withSummary?: boolean;
  className?: string;
}) {
  const { t, tx } = useI18n();
  const img = a.images[COVER[a.slug] ?? 0] ?? a.images[0];
  const srcSet = imageSrcSet(img, [480, 800, 1200]);
  return (
    <Link
      to="/apartments/$slug"
      params={{ slug: a.slug }}
      className={
        "group flex flex-col overflow-hidden border border-border bg-background shadow-[var(--shadow-soft)] transition-colors hover:border-accent " +
        className
      }
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={grade(imageAt(img, 800))}
          srcSet={srcSet && grade(srcSet)}
          sizes="(min-width: 1200px) 282px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          alt={tx(a.title)}
          loading="lazy"
          width={800}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className=" text-[1.4rem] font-medium leading-[1.15] tracking-[-0.015em] transition-colors group-hover:text-accent">
          {tx(a.title)}
        </h3>
        <p className="mt-2 text-[15px] tabular-nums text-foreground/80">
          {a.maxGuests} {t("apt.guests")} · {a.bedrooms} {t("apt.bedrooms")} · {a.surfaceM2} m²
        </p>
        <NightlyPrice
          price={a.pricePerNight}
          className="mt-4 w-full border-t border-border pt-4 text-xl"
        />
        {withSummary && (
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/75">{tx(a.summary)}</p>
        )}
      </div>
    </Link>
  );
}
