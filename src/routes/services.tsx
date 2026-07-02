import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import {
  ArrowRight,
  UserRoundCheck,
  Zap,
  ShieldCheck,
  Star,
  Home,
  Sparkles,
  WashingMachine,
  HardHat,
  KeyRound,
  Trees,
  Snowflake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import servicesHero from "@/assets/apt-4.jpg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services de gérance — In-Alpes Chalet Services" },
      {
        name: "description",
        content:
          "Gérance complète de résidences secondaires à Haute-Nendaz : location, nettoyage, blanchisserie, chantier, clés, jardinage, déneigement. Un interlocuteur unique.",
      },
      { property: "og:title", content: "Services de gérance — In-Alpes" },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Services,
});

const SERVICES: { key: string; icon: LucideIcon }[] = [
  { key: "rental", icon: Home },
  { key: "cleaning", icon: Sparkles },
  { key: "laundry", icon: WashingMachine },
  { key: "works", icon: HardHat },
  { key: "keys", icon: KeyRound },
  { key: "garden", icon: Trees },
  { key: "snow", icon: Snowflake },
];

const BENEFITS: { key: string; icon: LucideIcon }[] = [
  { key: "1", icon: UserRoundCheck },
  { key: "2", icon: Zap },
  { key: "3", icon: ShieldCheck },
];

const FAQ = ["1", "2", "3", "4", "5", "6"];

function Services() {
  const { t } = useI18n();

  return (
    <div>
      {/* HERO (dark) */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <img
          src={servicesHero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.14]"
        />
        <div className="container-page relative py-20 md:py-24">
          <div className="eyebrow text-accent-bright">{t("services.hero.eyebrow")}</div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.06] text-background md:text-5xl">
            {t("services.hero.title")}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-background/75">
            {t("services.hero.sub")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="btn-base bg-accent-bright text-accent-foreground hover:bg-accent-bright-hover"
            >
              {t("services.hero.cta1")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/apartments"
              className="btn-base bg-background text-foreground hover:bg-background/90"
            >
              {t("services.hero.cta2")}
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS / USP */}
      <section className="section-y">
        <div className="container-page">
          <SectionHead
            center
            eyebrow={t("services.benefits.eyebrow")}
            title={t("services.benefits.title")}
            lead={t("services.benefits.lead")}
          />
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.key} className="flex flex-col gap-3">
                <span
                  className="grid place-items-center bg-accent-tint text-accent"
                  style={{ width: 52, height: 52 }}
                >
                  <b.icon className="h-6 w-6" />
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {t(`benefit.${b.key}.t`)}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {t(`benefit.${b.key}.d`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALL SERVICES */}
      <section className="section-y bg-secondary">
        <div className="container-page">
          <SectionHead
            center
            eyebrow={t("services.assort.eyebrow")}
            title={t("services.assort.title")}
            lead={t("services.assort.lead")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <article key={s.key} className="card-soft p-6">
                <div className="grid h-10 w-10 place-items-center bg-accent-tint text-accent">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-base font-semibold">
                  {t(`svc.${s.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`svc.${s.key}.body`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-y">
        <div className="container-page">
          <SectionHead center eyebrow={t("home.how.eyebrow")} title={t("services.how.title")} />
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <li key={n} className="flex flex-col gap-2 border-t-2 border-accent pt-4">
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-accent">
                  {String(n).padStart(2, "0")}
                </span>
                <div className="font-[family-name:var(--font-display)] font-semibold">
                  {t(`step.${n}.t`)}
                </div>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  {t(`step.${n}.d`)}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-y bg-secondary">
        <div className="container-page grid gap-10 md:grid-cols-[0.5fr_1fr]">
          <SectionHead
            eyebrow={t("services.faq.eyebrow")}
            title={t("services.faq.title")}
            lead={t("services.faq.lead")}
          />
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((n) => (
              <AccordionItem key={n} value={n} className="border-b border-border">
                <AccordionTrigger className="py-5 text-left font-[family-name:var(--font-display)] text-base font-semibold hover:no-underline">
                  {t(`faq.${n}.q`)}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`faq.${n}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA (dark) */}
      <section className="pb-20 pt-4">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-between gap-8 bg-foreground px-8 py-14 text-background md:px-12">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold leading-tight text-background md:text-3xl">
                {t("services.cta.title")}
              </h2>
              <p className="mt-3 leading-relaxed text-background/75">{t("services.cta.sub")}</p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <div className="inline-flex items-center gap-2.5 border border-background/20 px-3.5 py-2">
                <div className="flex text-accent-bright">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-medium text-background">{t("hero.proof")}</span>
              </div>
              <Link
                to="/contact"
                className="btn-base bg-accent-bright text-accent-foreground hover:bg-accent-bright-hover"
              >
                {t("services.cta.btn")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
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
    <div className={center ? "mx-auto max-w-[640px] text-center" : "max-w-[420px]"}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      {lead && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}
