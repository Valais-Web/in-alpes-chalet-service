import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { listApartments } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { GLOBAL_RATING, HOME_REVIEWS, formatRating } from "@/content/reviews";
import { AMBIANCE, DEPTH_MAPS, SITE_IMAGES } from "@/content/media";
import { DepthPhoto } from "@/components/site/DepthPhoto";
import { AirbnbRating } from "@/components/site/AirbnbRating";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";
import { StayTile } from "@/components/site/editorial";
import { H2, LEAD, SECTION, grade } from "@/components/site/editorialStyles";

type Season = "hiver" | "ete";

export const Route = createFileRoute("/")({
  // ?saison=hiver | ete forces the hero season (preview); anything else is ignored.
  validateSearch: (search: Record<string, unknown>): { saison?: Season } =>
    search.saison === "hiver" || search.saison === "ete" ? { saison: search.saison } : {},
  component: Home_,
});

/** The five owner services of the brief, in its order. */
const OWNER_SERVICES = ["rental", "cleaning", "laundry", "works", "keys"];
const STEPS = [1, 2, 3, 4, 5, 6, 7];

function Home_() {
  const { t, locale } = useI18n();
  const { saison } = Route.useSearch();
  // Seasonal hero: summer photo May–October, winter photo November–April,
  // unless ?saison= forces one.
  const heroMonth = new Date().getMonth() + 1;
  // Compare exactly: the root route passes unvalidated params through.
  const summer =
    saison === "ete" ? true : saison === "hiver" ? false : heroMonth >= 5 && heroMonth <= 10;
  const heroImg = summer ? SITE_IMAGES.heroSummer : SITE_IMAGES.heroWinter;
  const heroDepth = summer ? DEPTH_MAPS.heroSummer : DEPTH_MAPS.heroWinter;
  const { data: apartments = [], isPending } = useQuery({
    queryKey: ["apartments"],
    queryFn: listApartments,
  });
  const rating = formatRating(GLOBAL_RATING.rating, locale);

  return (
    <>
      {/* HERO — one photo, the slogan, two doors (the stay door in green) */}
      <section className="relative -mt-20 w-full overflow-hidden bg-foreground">
        <div className="absolute inset-0">
          {/* Real photo + generated depth map → pointer/scroll parallax and
              cloud shadows in summer. */}
          <DepthPhoto
            src={heroImg}
            depthSrc={heroDepth}
            weather={summer ? "clouds" : "none"}
            className="h-full w-full"
            imgClassName="h-full w-full animate-kenburns object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, oklch(0.14 0 0 / 0.86) 0%, oklch(0.14 0 0 / 0.55) 40%, oklch(0.14 0 0 / 0) 72%), linear-gradient(to bottom, oklch(0.14 0 0 / 0.35), oklch(0.14 0 0 / 0) 18%)",
            }}
          />
          {/* Phones put the headline over the snowfields: an even veil keeps it legible. */}
          <div className="absolute inset-0 bg-[oklch(0.14_0_0/0.32)] md:hidden" />
        </div>
        <div className="container-page relative flex min-h-[100svh] flex-col justify-end pb-8 pt-36 md:pb-10">
          <div className="rise-in">
            <AirbnbRating
              onDark
              rating={rating}
              count={GLOBAL_RATING.count}
              label={t("reviews.word")}
            />
          </div>
          <h1
            className="hero-copy rise-in mt-7 max-w-[17ch] text-[clamp(2.6rem,6.4vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.03em] text-white"
            style={{ animationDelay: "60ms" }}
          >
            {t("hero.title")}
          </h1>
          <p
            className="rise-in mt-7 max-w-xl text-lg leading-relaxed text-white md:text-xl"
            style={{ animationDelay: "140ms" }}
          >
            {t("hero.lead")}
          </p>
          <div
            className="rise-in mt-10 grid gap-3 md:grid-cols-2 md:gap-0"
            style={{ animationDelay: "220ms" }}
          >
            <Link
              to="/apartments"
              className="group block bg-accent-bright px-6 py-5 text-accent-foreground transition-colors hover:bg-accent-bright-hover md:px-8 md:py-7"
            >
              <span className="block text-[15px] text-white/85">{t("hero.entry.stay")}</span>
              <span className="mt-1.5 flex items-center justify-between gap-4 font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.1vw,1.9rem)] font-medium tracking-[-0.01em]">
                {t("cta.viewAll")}
                <ArrowRight className="h-5 w-5 flex-none transition-transform duration-300 group-hover:translate-x-1.5" />
              </span>
            </Link>
            <Link
              to="/services"
              className="group block border border-white/35 px-6 py-5 text-white transition-colors hover:bg-white/10 md:border-l-0 md:px-8 md:py-7"
            >
              <span className="block text-[15px] text-white/80">{t("hero.entry.own")}</span>
              <span className="mt-1.5 flex items-center justify-between gap-4 font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.1vw,1.9rem)] font-medium tracking-[-0.01em]">
                {t("hero.link.manage")}
                <ArrowRight className="h-5 w-5 flex-none transition-transform duration-300 group-hover:translate-x-1.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* APARTMENTS — four places on one baseline, the offer said once */}
      <section className={SECTION}>
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <h2 className={H2 + " md:col-span-6"}>{t("home.apartments.title")}</h2>
            <p className={LEAD + " max-w-md md:col-span-5 md:col-start-8"}>
              <span className="font-[family-name:var(--font-display)] font-medium text-accent">
                {t("home.offer.big")}
              </span>{" "}
              {t("home.offer.inline")}
            </p>
          </div>
          <div className="-mx-5 mt-12 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
            {isPending
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] w-[80vw] flex-none animate-pulse bg-secondary md:w-auto"
                  />
                ))
              : apartments
                  .slice(0, 4)
                  .map((a) => (
                    <StayTile
                      key={a.id}
                      apartment={a}
                      className="w-[80vw] flex-none snap-start md:w-auto"
                    />
                  ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — seven steps on one line */}
      <section className={"bg-foreground text-background " + SECTION}>
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <h2 className={H2 + " text-background md:col-span-7"}>{t("home.how.title")}</h2>
            <p className="max-w-md text-[17px] leading-relaxed text-background/75 md:col-span-4 md:col-start-9">
              {t("home.how.lead")}
            </p>
          </div>
          <ol className="mt-14 grid border-t border-background/20 md:grid-cols-7">
            {STEPS.map((n) => (
              <li
                key={n}
                className="grid grid-cols-[3.5rem_1fr] gap-x-4 border-b border-background/20 py-5 md:block md:border-b-0 md:border-r md:px-4 md:py-6 md:first:pl-0 md:last:border-r-0"
              >
                <span className="font-[family-name:var(--font-display)] text-3xl font-light tabular-nums text-accent-bright md:text-4xl">
                  {String(n).padStart(2, "0")}
                </span>
                <div className="md:mt-6">
                  <div className="font-[family-name:var(--font-display)] text-base font-medium text-background">
                    {t(`step.${n}.t`)}
                  </div>
                  <div className="mt-1.5 text-[15px] leading-snug text-background/65">
                    {t(`step.${n}.d`)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <Link
            to="/apartments"
            className="btn-base mt-12 bg-accent-bright px-7 py-4 text-base text-accent-foreground hover:bg-accent-bright-hover"
          >
            {t("cta.bookRequest")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* OWNERS — the promise, the work, the list */}
      <section className={"bg-secondary " + SECTION}>
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <h2 className={H2 + " md:col-span-6"}>{t("home.owners.title")}</h2>
            <p className={LEAD + " max-w-md md:col-span-5 md:col-start-8"}>{t("home.svc.lead")}</p>
          </div>
          <div className="mt-12 aspect-[4/3] overflow-hidden bg-background md:aspect-[21/8]">
            <img
              src={AMBIANCE.linen.replace("w_1100", "w_1800")}
              alt=""
              aria-hidden
              loading="lazy"
              width={1800}
              height={686}
              className="h-full w-full object-cover object-[50%_70%]"
            />
          </div>
          <dl className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {OWNER_SERVICES.map((k) => (
              <div key={k} className="border-t border-foreground/15 py-6">
                <dt className="font-[family-name:var(--font-display)] text-xl font-medium">
                  {t(`svc.${k}.title`)}
                </dt>
                <dd className="mt-2 text-base leading-relaxed text-foreground/80">
                  {t(`svc.${k}.body`)}
                </dd>
              </div>
            ))}
            <div className="flex flex-col items-start gap-4 border-t border-foreground/15 py-6">
              <Link
                to="/contact"
                className="btn-base bg-accent px-7 py-4 text-base text-accent-foreground hover:bg-accent-hover"
              >
                {t("hero.link.manage")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="group inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-medium text-foreground"
              >
                <span className="border-b border-foreground/30 pb-0.5 group-hover:border-foreground">
                  {t("home.svc.cta")}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </dl>
        </div>
      </section>

      {/* NENDAZ — one panorama, a short introduction, two figures */}
      <section className="relative overflow-hidden bg-foreground">
        <img
          src={grade(SITE_IMAGES.fourValleysHike.replace("q_auto", "q_auto,w_2000"))}
          alt={t("home.place.title")}
          loading="lazy"
          width={2000}
          height={1000}
          className="absolute inset-0 h-full w-full object-cover object-[50%_40%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.14 0 0 / 0.8), oklch(0.14 0 0 / 0.25) 60%, oklch(0.14 0 0 / 0.1))",
          }}
        />
        <div className="container-page relative flex min-h-[80svh] items-end py-14 text-white md:py-16">
          <div className="grid w-full gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-6">
              <h2 className={H2 + " text-white"}>{t("home.local.title")}</h2>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-white/90">
                {t("home.local.body2")}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-6 border-t border-white/35 pt-6 md:col-span-5 md:col-start-8">
              {[1, 2].map((n) => (
                <div key={n}>
                  <dt className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,3.4vw,3rem)] font-light leading-none tracking-[-0.03em] tabular-nums">
                    {t(`home.place.${n}.v`)}
                  </dt>
                  <dd className="mt-2 text-[15px] leading-snug text-white/85">
                    {t(`home.place.${n}.l`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* PERSON — who answers */}
      <section className={SECTION}>
        <div className="container-page grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <h2 className={H2}>{t("home.bart.title")}</h2>
            <p className="mt-8 font-[family-name:var(--font-display)] text-[clamp(1.35rem,1.9vw,1.65rem)] font-normal leading-[1.4] tracking-[-0.01em]">
              {t("home.founder.text")}
            </p>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <div className="aspect-[4/5] overflow-hidden bg-secondary">
              <img
                src={AMBIANCE.doorstep}
                alt=""
                aria-hidden
                loading="lazy"
                width={1100}
                height={1375}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS — guests in their own words */}
      <section className={"bg-secondary " + SECTION}>
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <h2 className={H2}>{t("home.reviews.title")}</h2>
            <AirbnbRating rating={rating} count={GLOBAL_RATING.count} label={t("reviews.word")} />
          </div>
          <div className="mt-12">
            <ReviewsCarousel reviews={HOME_REVIEWS} />
          </div>
        </div>
      </section>
    </>
  );
}
