import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Percent,
  Home,
  Sparkles,
  WashingMachine,
  HardHat,
  KeyRound,
  Trees,
  Snowflake,
  CableCar,
  MountainSnow,
  CalendarHeart,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { listApartments } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { GLOBAL_RATING, HOME_REVIEWS, formatRating } from "@/content/reviews";
import { SITE_IMAGES } from "@/content/media";
import { ApartmentCard } from "@/components/site/ApartmentCard";
import { AirbnbRating } from "@/components/site/AirbnbRating";
import { Reveal } from "@/components/site/Reveal";
import { ReviewsCarousel } from "@/components/site/ReviewsCarousel";

const audImg = SITE_IMAGES.valleyView;
const destinationImg = SITE_IMAGES.skiFourValleys;

export const Route = createFileRoute("/")({
  component: Home_,
});

const SERVICE_ICONS: Record<string, LucideIcon> = {
  rental: Home,
  cleaning: Sparkles,
  laundry: WashingMachine,
  works: HardHat,
  keys: KeyRound,
  garden: Trees,
  snow: Snowflake,
};
const LOCAL_ICONS: LucideIcon[] = [CableCar, MountainSnow, CalendarHeart];

function Home_() {
  const { t, locale } = useI18n();
  // Seasonal hero: summer photo May–October, winter photo November–April.
  const heroMonth = new Date().getMonth() + 1;
  const heroImg =
    heroMonth >= 5 && heroMonth <= 10 ? SITE_IMAGES.heroSummer : SITE_IMAGES.heroWinter;
  const { data: apartments = [], isPending } = useQuery({
    queryKey: ["apartments"],
    queryFn: listApartments,
  });

  return (
    <>
      {/* HERO — cinematic full-bleed */}
      <section className="relative -mt-16 w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt=""
            aria-hidden
            className="h-full w-full animate-kenburns object-cover"
          />
          <div className="hero-scrim absolute inset-0" />
        </div>
        <div className="container-page relative flex min-h-[92svh] flex-col justify-end pb-16 pt-28 md:min-h-[90svh] md:justify-center md:pb-24 md:pt-24">
          <div className="hero-copy max-w-2xl">
            <div className="rise-in">
              <AirbnbRating
                onDark
                rating={formatRating(GLOBAL_RATING.rating, locale)}
                count={GLOBAL_RATING.count}
                label={t("reviews.word")}
              />
            </div>
            <h1
              className="rise-in mt-6 text-[2.6rem] font-semibold leading-[1.02] text-white md:text-6xl lg:text-[4.4rem]"
              style={{ animationDelay: "90ms" }}
            >
              {t("hero.title")}
            </h1>
            <p
              className="rise-in mt-5 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl"
              style={{ animationDelay: "170ms" }}
            >
              {t("hero.subtitle")}
            </p>
            <div
              className="rise-in mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "250ms" }}
            >
              <Link
                to="/apartments"
                className="btn-base bg-accent-bright text-accent-foreground shadow-[var(--shadow-lift)] hover:bg-accent-bright-hover"
              >
                {t("hero.cta.rent")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="btn-base border-[1.5px] border-white/85 text-white hover:bg-white hover:text-foreground"
              >
                {t("hero.cta.manage")}
              </Link>
              <span className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <Percent className="h-4 w-4 text-accent-bright" /> {t("hero.promo")}
              </span>
            </div>
            <div
              className="rise-in mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85"
              style={{ animationDelay: "330ms" }}
            >
              {["hero.usp.1", "hero.usp.2", "hero.usp.3"].map((k) => (
                <span key={k} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent-bright" /> {t(k)}
                </span>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto hidden w-fit md:block">
            <ChevronDown className="h-6 w-6 animate-bounce text-white/70" />
          </div>
        </div>
      </section>

      {/* TWO AUDIENCES */}
      <section className="section-y">
        <div className="container-page">
          <SectionHead center eyebrow={t("home.aud.eyebrow")} title={t("home.aud.title")} />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <AudienceCard
              image={audImg}
              eyebrow={t("home.aud.rent.eyebrow")}
              title={t("home.aud.rent.title")}
              desc={t("home.aud.rent.desc")}
              cta={t("home.aud.rent.cta")}
              to="/apartments"
            />
            <AudienceCard
              dark
              eyebrow={t("home.aud.own.eyebrow")}
              title={t("home.aud.own.title")}
              desc={t("home.aud.own.desc")}
              cta={t("home.aud.own.cta")}
              to="/services"
            />
          </div>
        </div>
      </section>

      {/* PROPERTIES PREVIEW */}
      <section className="section-y bg-secondary">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead
              eyebrow={t("home.props.eyebrow")}
              title={t("home.props.title")}
              lead={t("home.props.lead")}
            />
            <Link
              to="/apartments"
              className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-sm font-medium text-accent hover:text-accent-hover"
            >
              {t("cta.viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Reveal className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isPending
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse border border-border bg-secondary"
                  />
                ))
              : apartments.slice(0, 3).map((a) => <ApartmentCard key={a.id} apartment={a} />)}
          </Reveal>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="section-y">
        <div className="container-page">
          <SectionHead
            center
            eyebrow={t("home.svc.eyebrow")}
            title={t("home.svc.title")}
            lead={t("home.svc.lead")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["rental", "cleaning", "laundry", "works"].map((k) => (
              <ServiceCard
                key={k}
                icon={SERVICE_ICONS[k]}
                title={t(`svc.${k}.title`)}
                body={t(`svc.${k}.body`)}
              />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/services"
              className="btn-base border-[1.5px] border-foreground text-foreground hover:bg-foreground hover:text-background"
            >
              {t("home.svc.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (dark) */}
      <section className="section-y bg-foreground text-background">
        <div className="container-page grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <div className="eyebrow text-accent-bright">{t("home.how.eyebrow")}</div>
            <h2 className="text-3xl font-semibold leading-tight text-background md:text-4xl">
              {t("home.how.title")}
            </h2>
            <p className="text-base leading-relaxed text-background/70">{t("home.how.lead")}</p>
            <div className="mt-2">
              <Link
                to="/contact"
                className="btn-base bg-accent-bright text-accent-foreground hover:bg-accent-bright-hover"
              >
                {t("cta.bookRequest")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n} className="flex gap-4 py-2.5">
                <span className="grid h-9 w-9 flex-none place-items-center border border-background/20 bg-background/10 font-[family-name:var(--font-display)] text-sm font-semibold text-accent-bright">
                  {n}
                </span>
                <div>
                  <div className="font-[family-name:var(--font-display)] font-semibold text-background">
                    {t(`step.${n}.t`)}
                  </div>
                  <div className="text-sm leading-snug text-background/60">{t(`step.${n}.d`)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section-y bg-secondary">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <SectionHead eyebrow={t("home.rev.eyebrow")} title={t("home.rev.title")} />
              <AirbnbRating
                rating={formatRating(GLOBAL_RATING.rating, locale)}
                count={GLOBAL_RATING.count}
                label={t("reviews.word")}
              />
            </div>
          </Reveal>
          <Reveal className="mt-10">
            <ReviewsCarousel reviews={HOME_REVIEWS} />
          </Reveal>
        </div>
      </section>

      {/* DESTINATION / LOCAL */}
      <section className="section-y">
        <div className="container-page">
          <Reveal>
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  <img
                    src={destinationImg}
                    alt="Haute-Nendaz, 4 Vallées"
                    className="h-full w-full object-cover"
                    width={1280}
                    height={960}
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-6 -right-8 hidden aspect-square w-44 overflow-hidden border-4 border-background shadow-[var(--shadow-lift)] md:block">
                  <img
                    src={SITE_IMAGES.fourValleysHike}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div>
                <div className="eyebrow">{t("home.local.eyebrow")}</div>
                <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
                  {t("home.local.title")}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {t("home.local.lead")}
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {t("home.local.body")}
                </p>
              </div>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((n) => {
              const Icon = LOCAL_ICONS[n - 1];
              return (
                <div key={n} className="flex gap-4 border border-border p-6">
                  <span className="grid h-11 w-11 flex-none place-items-center bg-accent-tint text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-[family-name:var(--font-display)] font-semibold">
                      {t(`local.${n}.title`)}
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t(`local.${n}.d`)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="pb-20">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-between gap-8 bg-accent px-8 py-14 text-accent-foreground md:px-12">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold leading-tight text-accent-foreground md:text-3xl">
                {t("home.cta.title")}
              </h2>
              <p className="mt-3 leading-relaxed text-accent-foreground/85">{t("home.cta.sub")}</p>
            </div>
            <Link
              to="/contact"
              className="btn-base bg-background text-foreground hover:bg-background/90"
            >
              {t("home.cta.btn")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({
  eyebrow,
  title,
  lead,
  center,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-[680px] text-center" : "max-w-[560px]"}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      {lead && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="card-soft p-6">
      <div className="grid h-10 w-10 place-items-center bg-accent-tint text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-display)] text-base font-semibold">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function AudienceCard({
  image,
  dark,
  eyebrow,
  title,
  desc,
  cta,
  to,
}: {
  image?: string;
  dark?: boolean;
  eyebrow: string;
  title: string;
  desc: string;
  cta: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={
        "group relative flex min-h-[280px] flex-col justify-end overflow-hidden border p-8 transition-transform duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-[3px] " +
        (dark ? "border-foreground bg-foreground text-background" : "border-border")
      }
    >
      {image && (
        <>
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(20,20,20,0.88), rgba(20,20,20,0.35) 55%, rgba(20,20,20,0.12))",
            }}
          />
        </>
      )}
      <div className={"relative flex flex-col gap-3 " + (image ? "text-white" : "")}>
        <div className={"eyebrow " + (dark ? "text-accent-bright" : image ? "text-white/80" : "")}>
          {eyebrow}
        </div>
        <h3
          className={
            "font-[family-name:var(--font-display)] text-2xl font-semibold " +
            (image ? "text-white" : dark ? "text-background" : "")
          }
        >
          {title}
        </h3>
        <p
          className={
            "max-w-sm text-sm leading-relaxed " +
            (image ? "text-white/85" : dark ? "text-background/70" : "text-muted-foreground")
          }
        >
          {desc}
        </p>
        <span
          className={
            "mt-2 inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-sm font-medium " +
            (dark ? "text-accent-bright" : image ? "text-white" : "text-accent")
          }
        >
          {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
