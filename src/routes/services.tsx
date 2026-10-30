import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  House,
  Sparkles,
  WashingMachine,
  Hammer,
  KeyRound,
  Sprout,
  Snowflake,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE_IMAGES } from "@/content/media";
import { PageIntro } from "@/components/site/editorial";
import { H2, H3, LEAD, SECTION, grade } from "@/components/site/editorialStyles";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services de gérance · In-Alpes Chalet Services" },
      {
        name: "description",
        content:
          "Gérance complète de résidences secondaires à Haute-Nendaz : location, nettoyage, blanchisserie, chantier, clés, jardinage, déneigement. Un interlocuteur unique.",
      },
      { property: "og:title", content: "Services de gérance · In-Alpes" },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Services,
});

const SERVICES = [
  { key: "rental", icon: House },
  { key: "cleaning", icon: Sparkles },
  { key: "laundry", icon: WashingMachine },
  { key: "works", icon: Hammer },
  { key: "keys", icon: KeyRound },
  { key: "garden", icon: Sprout },
  { key: "snow", icon: Snowflake },
];
const BENEFITS = ["1", "2", "3"];
const FAQ = ["1", "2", "3", "4", "5", "6"];

function Services() {
  const { t } = useI18n();

  return (
    <div>
      <PageIntro title={t("services.hero.title")} lead={t("services.hero.sub")}>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            to="/contact"
            className="btn-base bg-accent-bright px-7 py-4 text-base text-accent-foreground hover:bg-accent-bright-hover"
          >
            {t("services.hero.cta1")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/apartments"
            className="group inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-medium"
          >
            <span className="border-b border-foreground/30 pb-0.5 group-hover:border-foreground">
              {t("services.hero.cta2")}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </PageIntro>

      <div className="container-page">
        <div className="aspect-[4/3] overflow-hidden bg-secondary md:aspect-[21/8]">
          <img
            src={grade(SITE_IMAGES.cosyLiving.replace("q_auto", "q_auto,w_2000"))}
            alt="Le Combin, Haute-Nendaz"
            width={2000}
            height={762}
            className="h-full w-full object-cover object-[50%_60%]"
          />
        </div>
      </div>

      {/* WHO WE ARE + WHY US */}
      <section className={SECTION}>
        <div className="container-page grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6">
            <h2 className={H2}>{t("services.intro.title")}</h2>
            <p className={LEAD + " mt-6"}>{t("services.intro.body")}</p>
            <p className={LEAD + " mt-4"}>{t("services.intro.body2")}</p>
          </div>
          <dl className="border-t border-foreground/15 md:col-span-5 md:col-start-8">
            {BENEFITS.map((k) => (
              <div key={k} className="border-b border-foreground/15 py-6">
                <dt className={H3}>{t(`benefit.${k}.t`)}</dt>
                <dd className="mt-2 text-base leading-relaxed text-foreground/80">
                  {t(`benefit.${k}.d`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ALL SERVICES */}
      <section className={"bg-secondary " + SECTION}>
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <h2 className={H2 + " md:col-span-6"}>{t("services.assort.title")}</h2>
            <p className={LEAD + " max-w-md md:col-span-5 md:col-start-8"}>
              {t("services.assort.lead")}
            </p>
          </div>
          <dl className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ key: k, icon: Icon }) => (
              <div key={k} className="border border-border bg-background p-6">
                <dt>
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center bg-accent-tint text-accent">
                    <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span className={H3 + " block"}>{t(`svc.${k}.title`)}</span>
                </dt>
                <dd className="mt-2 text-base leading-relaxed text-foreground/80">
                  {t(`svc.${k}.body`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* HOW TO BECOME A CLIENT */}
      <section className={SECTION}>
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <h2 className={H2 + " md:col-span-6"}>{t("services.ownerhow.title")}</h2>
            <p className={LEAD + " max-w-md md:col-span-5 md:col-start-8"}>
              {t("services.ownerhow.lead")}
            </p>
          </div>
          <ol className="mt-12 grid border-t border-foreground/15 md:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <li
                key={n}
                className="grid grid-cols-[3.5rem_1fr] gap-x-4 border-b border-foreground/15 py-6 md:block md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"
              >
                <span className="font-[family-name:var(--font-display)] text-4xl font-light tabular-nums text-accent">
                  {String(n).padStart(2, "0")}
                </span>
                <div className="md:mt-6">
                  <div className={H3}>{t(`owner.step.${n}.t`)}</div>
                  <div className="mt-2 text-base leading-relaxed text-foreground/80">
                    {t(`owner.step.${n}.d`)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <Link
            to="/contact"
            className="btn-base mt-12 bg-accent-bright px-7 py-4 text-base text-accent-foreground hover:bg-accent-bright-hover"
          >
            {t("services.cta.btn")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className={"bg-secondary " + SECTION}>
        <div className="container-page grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className={H2}>{t("services.faq.title")}</h2>
            <p className={LEAD + " mt-5 max-w-sm"}>{t("services.faq.lead")}</p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="w-full border-t border-foreground/15 md:col-span-7"
          >
            {FAQ.map((n) => (
              <AccordionItem key={n} value={n} className="border-b border-foreground/15">
                <AccordionTrigger className="py-6 text-left font-[family-name:var(--font-display)] text-lg font-medium hover:no-underline">
                  {t(`faq.${n}.q`)}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-foreground/80">
                  {t(`faq.${n}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
