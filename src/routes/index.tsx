import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { listApartments } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { GLOBAL_RATING, HOME_REVIEWS, formatRating } from "@/content/reviews";
import { ApartmentCard } from "@/components/site/ApartmentCard";
import aptOwner from "@/assets/apt-2.jpg";
import audImg from "@/assets/apt-3.jpg";
import destinationImg from "@/assets/apt-4.jpg";

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
  const { t, tx, locale } = useI18n();
  const { data: apartments = [], isPending } = useQuery({
    queryKey: ["apartments"],
    queryFn: listApartments,
  });

  return (
    <>
      {/* HERO */}
      <section className="bg-secondary">
        <div className="container-page grid items-center gap-10 py-14 md:min-h-[560px] md:grid-cols-[1.05fr_0.95fr] md:py-20">
          <div className="flex flex-col gap-7">
            <RatingBadge t={t} />
            <h1 className="text-4xl font-semibold leading-[1.04] md:text-6xl">{t("hero.title")}</h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/apartments"
                className="btn-base bg-accent-bright text-accent-foreground hover:bg-accent-bright-hover"
              >
                {t("hero.cta.rent")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="btn-base border-[1.5px] border-foreground text-foreground hover:bg-foreground hover:text-background"
              >
                {t("hero.cta.manage")}
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["hero.usp.1", "hero.usp.2", "hero.usp.3"].map((k) => (
                <span key={k} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" /> {t(k)}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden shadow-[var(--shadow-lift)]">
              <img
                src={aptOwner}
                alt="Chalet à Haute-Nendaz"
                width={720}
                height={900}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-[var(--shadow-lift)]">
              <Percent className="h-4 w-4" /> {t("hero.promo")}
            </div>
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
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isPending
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse border border-border bg-secondary"
                  />
                ))
              : apartments.slice(0, 3).map((a) => <ApartmentCard key={a.id} apartment={a} />)}
          </div>
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
        <div className="container-page grid items-center gap-10 md:grid-cols-[0.7fr_1.3fr]">
          <div className="flex flex-col items-start gap-5">
            <SectionHead eyebrow={t("home.rev.eyebrow")} title={t("home.rev.title")} />
            <div className="inline-flex items-center gap-3 border border-border bg-background px-4 py-3">
              <div className="flex text-foreground">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-medium">
                {formatRating(GLOBAL_RATING.rating, locale)}/5 · {GLOBAL_RATING.count}{" "}
                {t("reviews.word")} · Airbnb
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {HOME_REVIEWS.map((r) => (
              <Testimonial key={r.author} quote={tx(r.quote)} author={r.author} meta={tx(r.meta)} />
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATION / LOCAL */}
      <section className="section-y">
        <div className="container-page">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-secondary">
              <img
                src={destinationImg}
                alt="Haute-Nendaz, 4 Vallées"
                className="h-full w-full object-cover"
                width={1280}
                height={960}
                loading="lazy"
              />
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

function RatingBadge({ t }: { t: (k: string) => string }) {
  return (
    <div className="inline-flex w-fit items-center gap-2.5 border border-border bg-background px-3.5 py-2">
      <div className="flex text-foreground">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <span className="text-sm font-medium">{t("hero.proof")}</span>
    </div>
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

function Testimonial({ quote, author, meta }: { quote: string; author: string; meta: string }) {
  return (
    <figure className="flex flex-col gap-4 border border-border bg-background p-6">
      <div className="flex items-center justify-between">
        <div className="flex text-foreground">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">Airbnb</span>
      </div>
      <blockquote className="text-sm leading-relaxed">« {quote} »</blockquote>
      <figcaption className="mt-auto text-sm">
        <span className="font-[family-name:var(--font-display)] font-semibold">{author}</span>
        <span className="text-muted-foreground"> · {meta}</span>
      </figcaption>
    </figure>
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
