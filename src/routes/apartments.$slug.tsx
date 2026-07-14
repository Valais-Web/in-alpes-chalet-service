import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getApartmentBySlug, listAvailability, resolveImage } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { APARTMENT_REVIEWS, formatRating } from "@/content/reviews";
import { AirbnbRating } from "@/components/site/AirbnbRating";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";
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
    const img = loaderData ? resolveImage(loaderData.apartment.images[0]) : undefined;
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

  return (
    <div className="container-page py-8">
      {/* Gallery — large hero image + scrollable thumbnail strip */}
      <div>
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label={t("apt.enlarge")}
          className="group relative block aspect-[16/9] w-full overflow-hidden bg-secondary"
        >
          <img
            src={resolveImage(images[current])}
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
                className={`h-20 w-28 shrink-0 overflow-hidden bg-secondary transition ${
                  i === current ? "ring-2 ring-accent" : "opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={resolveImage(img)}
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
            src={resolveImage(images[current])}
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

      {/* Title + facts */}
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {apartment.location.address}
          </div>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{tx(apartment.title)}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {tx(apartment.summary)}
          </p>

          {/* USP strip */}
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-border py-4 text-sm">
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
              <li key={label} className="inline-flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4 text-accent" /> {label}
              </li>
            ))}
          </ul>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
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

          <section className="mt-10">
            <h2 className="text-lg font-semibold">{t("apt.amenities")}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {apartment.amenities.map((a: string) => (
                <li key={a} className="border border-border bg-secondary px-3 py-1 text-xs">
                  {t(`amenity.${a}`)}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">{t("apt.description")}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {tx(apartment.description)}
            </p>
          </section>

          {reviews && (
            <section className="mt-10">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold">{t("apt.reviews.title")}</h2>
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

          <section className="mt-10">
            <h2 className="text-lg font-semibold">{t("apt.availability")}</h2>
            <div className="mt-4">
              <AvailabilityCalendar ranges={ranges} months={2} />
            </div>
          </section>

          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="card-soft p-5">
              <h3 className="text-sm font-semibold">{t("apt.practical")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
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
            <div className="card-soft p-5">
              <h3 className="text-sm font-semibold">{t("apt.location")}</h3>
              <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 text-accent" /> {apartment.location.address}
              </p>
              <div className="mt-3 aspect-video overflow-hidden border border-border">
                <iframe
                  title="map"
                  className="h-full w-full"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${apartment.location.lng - 0.01}%2C${apartment.location.lat - 0.005}%2C${apartment.location.lng + 0.01}%2C${apartment.location.lat + 0.005}&layer=mapnik&marker=${apartment.location.lat}%2C${apartment.location.lng}`}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-baseline gap-1">
            {apartment.pricePerNight > 0 ? (
              <>
                <span className="text-xs text-muted-foreground">{t("apt.from")}</span>
                <span className="text-2xl font-semibold">CHF {apartment.pricePerNight}</span>
                <span className="text-xs text-muted-foreground">{t("apt.night")}</span>
              </>
            ) : (
              <span className="text-2xl font-semibold">{t("apt.priceOnRequest")}</span>
            )}
          </div>
          <BookingForm apartment={apartment} ranges={ranges} />
        </aside>
      </div>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="card-soft p-3 text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center bg-accent-tint text-accent">
        {icon}
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
