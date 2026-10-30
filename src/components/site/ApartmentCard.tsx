import { NightlyPrice } from "./NightlyPrice";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { imageAt, imageSrcSet } from "@/data/api";
import type { Apartment } from "@/data/types";
import { BedDouble, Bath, Users, Ruler } from "lucide-react";

export function ApartmentCard({ apartment }: { apartment: Apartment }) {
  const { t, tx } = useI18n();
  return (
    <Link
      to="/apartments/$slug"
      params={{ slug: apartment.slug }}
      className="group card-soft overflow-hidden transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-[3px] hover:shadow-[var(--shadow-lift)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={imageAt(apartment.images[0], 800)}
          srcSet={imageSrcSet(apartment.images[0], [480, 800, 1280])}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          alt={tx(apartment.title)}
          loading="lazy"
          width={1280}
          height={960}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold">{tx(apartment.title)}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tx(apartment.summary)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {apartment.maxGuests}
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {apartment.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {apartment.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {apartment.surfaceM2} m²
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <NightlyPrice price={apartment.pricePerNight} className="text-lg" />
          <span className="text-xs font-medium text-accent">{t("cta.discover")} →</span>
        </div>
      </div>
    </Link>
  );
}
