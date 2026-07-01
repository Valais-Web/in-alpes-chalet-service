import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getApartmentBySlug, listAvailability, resolveImage } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";
import { BookingForm } from "@/components/site/BookingForm";
import { BedDouble, Bath, Users, Ruler, Building2, MapPin, Clock } from "lucide-react";
import { useState } from "react";

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
        { title: `${title} — In-Alpes` },
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
  const { t, tx } = useI18n();
  const [current, setCurrent] = useState(0);
  const { data: ranges = [] } = useQuery({
    queryKey: ["availability", apartment.id],
    queryFn: () => listAvailability(apartment.id),
  });

  return (
    <div className="container-page py-8">
      {/* Gallery */}
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-secondary md:aspect-[16/10]">
          <img src={resolveImage(apartment.images[current])} alt={tx(apartment.title)} className="h-full w-full object-cover" width={1280} height={800} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          {apartment.images.slice(0, 4).map((img: string, i: number) => (
            <button key={i} onClick={() => setCurrent(i)} className={`aspect-[4/3] overflow-hidden rounded-2xl bg-secondary ${i === current ? "ring-2 ring-accent" : ""}`}>
              <img src={resolveImage(img)} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      {/* Title + facts */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="text-3xl font-semibold md:text-4xl">{tx(apartment.title)}</h1>
          <p className="mt-2 text-muted-foreground">{tx(apartment.summary)}</p>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Fact icon={<Users className="h-4 w-4" />} label={t("apt.guests")} value={apartment.maxGuests} />
            <Fact icon={<BedDouble className="h-4 w-4" />} label={t("apt.bedrooms")} value={apartment.bedrooms} />
            <Fact icon={<Bath className="h-4 w-4" />} label={t("apt.bathrooms")} value={apartment.bathrooms} />
            <Fact icon={<Ruler className="h-4 w-4" />} label={t("apt.surface")} value={apartment.surfaceM2} />
            <Fact icon={<Building2 className="h-4 w-4" />} label={t("apt.floor")} value={apartment.floor} />
          </dl>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">{t("apt.amenities")}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {apartment.amenities.map((a: string) => (
                <li key={a} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs">
                  {t(`amenity.${a}`)}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">{t("apt.description")}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{tx(apartment.description)}</p>
          </section>

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
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> {t("apt.checkIn")} : {apartment.practical.checkIn}</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> {t("apt.checkOut")} : {apartment.practical.checkOut}</li>
                <li><span className="font-medium text-foreground">{t("apt.rules")}</span> : {tx(apartment.practical.rules)}</li>
              </ul>
            </div>
            <div className="card-soft p-5">
              <h3 className="text-sm font-semibold">{t("apt.location")}</h3>
              <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 text-accent" /> {apartment.location.address}
              </p>
              <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-border">
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
            <span className="text-xs text-muted-foreground">{t("apt.from")}</span>
            <span className="text-2xl font-semibold">CHF {apartment.pricePerNight}</span>
            <span className="text-xs text-muted-foreground">{t("apt.night")}</span>
          </div>
          <BookingForm apartment={apartment} />
        </aside>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="card-soft p-3 text-center">
      <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">{icon}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
