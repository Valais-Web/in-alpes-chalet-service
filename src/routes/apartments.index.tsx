import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApartments } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageIntro, StayTile } from "@/components/site/editorial";
import { H2, LEAD, SECTION } from "@/components/site/editorialStyles";

const FAQ = ["1", "2", "3", "4", "5", "6"];

export const Route = createFileRoute("/apartments/")({
  head: () => ({
    meta: [
      { title: "Nos logements · In-Alpes Chalet Services" },
      {
        name: "description",
        content: "Chalets et appartements en location à Haute-Nendaz (Valais).",
      },
      { property: "og:title", content: "Nos logements · In-Alpes Chalet Services" },
      { property: "og:url", content: "/apartments" },
    ],
    links: [{ rel: "canonical", href: "/apartments" }],
  }),
  component: List,
});

function List() {
  const { t } = useI18n();
  const {
    data: apartments = [],
    isPending,
    isError,
  } = useQuery({ queryKey: ["apartments"], queryFn: listApartments });

  return (
    <div>
      <PageIntro title={t("apt.banner.title")} lead={t("apt.banner.sub")}>
        <p className="mt-4 text-[17px] leading-relaxed text-foreground">
          <span className="font-[family-name:var(--font-display)] font-medium text-accent">
            {t("home.offer.big")}
          </span>{" "}
          {t("home.offer.inline")}
        </p>
      </PageIntro>

      {/* GRID */}
      <section className="pb-24 md:pb-32">
        <div className="container-page">
          {isPending ? (
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse bg-secondary" />
              ))}
            </div>
          ) : isError ? (
            <p className={LEAD}>{t("state.error")}</p>
          ) : apartments.length === 0 ? (
            <p className={LEAD}>{t("apt.empty")}</p>
          ) : (
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {apartments.map((a) => (
                <StayTile key={a.id} apartment={a} withSummary />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className={"bg-secondary " + SECTION}>
        <div className="container-page grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className={H2}>{t("apt.faq.title")}</h2>
            <p className={LEAD + " mt-5 max-w-sm"}>{t("apt.faq.lead")}</p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="w-full border-t border-foreground/15 md:col-span-7"
          >
            {FAQ.map((n) => (
              <AccordionItem key={n} value={n} className="border-b border-foreground/15">
                <AccordionTrigger className="py-6 text-left font-[family-name:var(--font-display)] text-lg font-medium hover:no-underline">
                  {t(`apt.faq.${n}.q`)}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-foreground/80">
                  {t(`apt.faq.${n}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
