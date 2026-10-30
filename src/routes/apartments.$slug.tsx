import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getApartmentBySlug, imageAt, imageSrcSet, listAvailability } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { APARTMENT_REVIEWS, formatRating } from "@/content/reviews";
import { googleMapsLink } from "@/content/maps";
import { AirbnbRating } from "@/components/site/AirbnbRating";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";
import { NightlyPrice } from "@/components/site/NightlyPrice";
import { BookingForm } from "@/components/site/BookingForm";
import {
  BedDouble,
  Bath,
  Users,
  Ruler,
  Building2,
  MapPin,
  Clock,
  Star,
  Percent,
  DoorOpen,
  Sparkles,
  Expand,
  ChevronLeft,
  ChevronRight,
  X,
  Navigation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/apartments/$slug")({
  loader: async ({ params }) => {
    const apt = await getApartmentBySlug(params.slug);
    if (!apt) throw notFound();
    return { apartment: apt };
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.apartment.title.fr ?? params.slug;
    const desc = loaderData?.apartment.summary.fr ?? "";
    const img = loaderData ? imageAt(loaderData.apartment.images[0], 1200) : undefined;
    return {
      meta: [
        { title: `${title} · In-Alpes` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: `/apartments/${params.slug}` },
        { property: "og:type", content: "product" },
        ...(img ? [{ property: "og:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: `/apartments/${params.slug}` }],
    };
  },
  component: Detail,
});

function Detail() {
  const { apartment } = Route.useLoaderData();
  const { t, tx, locale } = useI18n();
  const reviews = APARTMENT_REVIEWS[apartment.slug];
  const images = apartment.images;
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);

  const { lat, lng } = apartment.location;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.005}%2C${lng + 0.01}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  const gmapsLink = googleMapsLink(apartment.slug, lat, lng);
  const { data: ranges = [] } = useQuery({
    queryKey: ["availability", apartment.id],
    queryFn: () => listAvailability(apartment.id),
  });

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, images.length]);

  useEffect(() => {
    if (!mapExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMapExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapExpanded]);

  return (
    <div className="container-page pb-24 pt-8 md:pb-32">
      {/* Gallery — compact desktop panorama + scrollable thumbnails */}
      <div>
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label={t("apt.enlarge")}
          className="group relative block aspect-[16/9] w-full overflow-hidden bg-secondary lg:aspect-auto lg:h-[min(34vh,300px)]"
        >
          <img
            src={imageAt(images[current], 1600)}
            srcSet={imageSrcSet(images[current], [800, 1200, 1600, 2000])}
            sizes="(min-width: 1280px) 1200px, 100vw"
            alt={tx(apartment.title)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            width={1600}
            height={900}
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-foreground/70 px-2.5 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
            <Expand className="h-3.5 w-3.5" /> {t("apt.enlarge")}
          </span>
        </button>

        {images.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {images.map((img: string, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`${tx(apartment.title)} · ${t("apt.photo")} ${i + 1}`}
                aria-current={i === current}
                className={`h-20 w-28 shrink-0 lg:h-14 lg:w-20 overflow-hidden bg-secondary transition ${
                  i === current ? "ring-2 ring-accent" : "opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={imageAt(img, 240)}
                  alt={`${tx(apartment.title)} ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label={t("apt.close")}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center text-background hover:bg-background/10"
          >
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Précédent"
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-background hover:bg-background/10 sm:left-4"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}
          <img
            src={imageAt(images[current], 2000)}
            srcSet={imageSrcSet(images[current], [1200, 2000, 2800])}
            sizes="92vw"
            alt={tx(apartment.title)}
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Suivant"
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-background hover:bg-background/10 sm:right-4"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-background/80">
            {current + 1} / {images.length}
          </div>
        </div>
      )}

      {/* Expanded map */}
      {mapExpanded && (
        <div
          className="fixed inset-0 z-50 flex flex-col gap-3 bg-foreground/90 p-4"
          onClick={() => setMapExpanded(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 text-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <a
                href={gmapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
              >
                <Navigation className="h-4 w-4" /> {t("apt.openGoogleMaps")}
              </a>
              <a
                href={osmLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {t("apt.openMap")}
              </a>
            </div>
            <button
              type="button"
              onClick={() => setMapExpanded(false)}
              aria-label={t("apt.close")}
              className="grid h-10 w-10 shrink-0 place-items-center text-background hover:bg-background/10"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div
            className="mx-auto w-full max-w-5xl flex-1 overflow-hidden border border-background/20"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              title="map-large"
              className="h-full w-full"
              referrerPolicy="no-referrer"
              src={osmEmbed}
            />
          </div>
        </div>
      )}

      {/* Title + facts */}
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <a
            href={gmapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[15px] text-foreground/70 underline-offset-4 hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" /> {apartment.location.address}
          </a>
          <h1 className="mt-4 text-[clamp(2.4rem,4.6vw,4rem)] font-medium leading-[1] tracking-[-0.03em]">
            {tx(apartment.title)}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/80">
            {tx(apartment.summary)}
          </p>

          {/* USP strip */}
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y border-foreground/15 py-4 text-[15px]">
            {[
              {
                icon: Star,
                label: reviews
                  ? `${formatRating(reviews.rating, locale)}/5 · ${reviews.count} ${t("reviews.word")}`
                  : t("apt.usp.rating"),
              },
              { icon: Percent, label: t("apt.usp.promo") },
              { icon: DoorOpen, label: t("apt.usp.flex") },
              { icon: Sparkles, label: t("apt.usp.clean") },
            ].map(({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
              <li key={label} className="inline-flex items-center gap-2 text-foreground/80">
                <Icon className="h-4 w-4 text-accent" /> {label}
              </li>
            ))}
          </ul>

          <dl className="mt-8 grid grid-cols-3 gap-y-6 sm:grid-cols-5">
            <Fact
              icon={<Users className="h-4 w-4" />}
              label={t("apt.guests")}
              value={apartment.maxGuests}
            />
            <Fact
              icon={<BedDouble className="h-4 w-4" />}
              label={t("apt.bedrooms")}
              value={apartment.bedrooms}
            />
            <Fact
              icon={<Bath className="h-4 w-4" />}
              label={t("apt.bathrooms")}
              value={apartment.bathrooms}
            />
            <Fact
              icon={<Ruler className="h-4 w-4" />}
              label={t("apt.surface")}
              value={apartment.surfaceM2}
            />
            <Fact
              icon={<Building2 className="h-4 w-4" />}
              label={t("apt.floor")}
              value={apartment.floor}
            />
          </dl>

          <section className="mt-14 border-t border-foreground/15 pt-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-[-0.015em]">
              {t("apt.amenities")}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {apartment.amenities.map((a: string) => (
                <li key={a} className="border border-foreground/15 px-3 py-1.5 text-sm">
                  {t(`amenity.${a}`)}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14 border-t border-foreground/15 pt-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-[-0.015em]">
              {t("apt.description")}
            </h2>
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/80">
              {tx(apartment.description)}
            </p>
          </section>

          {reviews && (
            <section className="mt-14 border-t border-foreground/15 pt-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-[-0.015em]">
                    {t("apt.reviews.title")}
                  </h2>
                  <AirbnbRating
                    rating={formatRating(reviews.rating, locale)}
                    count={reviews.count}
                    label={t("reviews.word")}
                  />
                </div>
                <a
                  href={reviews.airbnbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  {t("apt.reviews.seeOnAirbnb")}
                </a>
              </div>
              <div className="mt-6">
                <ReviewsCarousel reviews={reviews.reviews} />
              </div>
            </section>
          )}

          <section
            id="availability"
            tabIndex={-1}
            className="mt-14 scroll-mt-28 border-t border-foreground/15 pt-8"
          >
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-[-0.015em]">
              {t("apt.availability")}
            </h2>
            <div className="mt-4">
              <AvailabilityCalendar ranges={ranges} months={2} />
            </div>
          </section>

          <section className="mt-14 grid gap-10 border-t border-foreground/15 pt-8 sm:grid-cols-2">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-medium">
                {t("apt.practical")}
              </h3>
              <ul className="mt-4 space-y-2 text-base text-foreground/80">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" /> {t("apt.checkIn")} :{" "}
                  {apartment.practical.checkIn}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" /> {t("apt.checkOut")} :{" "}
                  {apartment.practical.checkOut}
                </li>
                <li>
                  <span className="font-medium text-foreground">{t("apt.rules")}</span> :{" "}
                  {tx(apartment.practical.rules)}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-medium">
                {t("apt.location")}
              </h3>
              <p className="mt-4 flex items-start gap-2 text-base text-foreground/80">
                <MapPin className="mt-0.5 h-4 w-4 text-accent" /> {apartment.location.address}
              </p>
              <div className="relative mt-3 aspect-video overflow-hidden border border-border">
                <iframe
                  title="map"
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  src={osmEmbed}
                />
                <button
                  type="button"
                  onClick={() => setMapExpanded(true)}
                  aria-label={t("apt.enlarge")}
                  className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 border border-border bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-[var(--shadow-soft)] hover:bg-background"
                >
                  <Expand className="h-3.5 w-3.5" /> {t("apt.enlarge")}
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside
          id="booking"
          tabIndex={-1}
          className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start"
        >
          <div className="mb-4">
            <NightlyPrice price={apartment.pricePerNight} className="text-3xl" />
          </div>
          <BookingForm apartment={apartment} ranges={ranges} />
        </aside>
      </div>
      <div className="mobile-booking-bar fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background px-5 pt-3 shadow-[0_-4px_20px_oklch(0.16_0_0/0.06)] lg:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-3">
          <a href="#booking" className="min-w-0 py-2" aria-label={t("form.title")}>
            <NightlyPrice price={apartment.pricePerNight} className="text-xl" />
            <span className="mt-1 block text-xs font-medium text-accent underline underline-offset-2">
              {t("form.title")}
            </span>
          </a>
          <a
            href="#availability"
            className="btn-base min-h-11 whitespace-normal bg-accent px-3 text-center text-sm leading-snug text-accent-foreground hover:bg-accent-hover"
          >
            {t("apt.viewAvailability")}
          </a>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="border-l border-foreground/15 pl-4 first:border-l-0 first:pl-0">
      <div
        className={
          "font-[family-name:var(--font-display)] font-light tabular-nums " +
          (typeof value === "number" ? "text-3xl" : "pt-1.5 text-lg leading-tight")
        }
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-foreground/70">{label}</div>
    </div>
  );
}
