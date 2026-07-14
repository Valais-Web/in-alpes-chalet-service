import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApartments } from "@/data/api";
import { ApartmentCard } from "@/components/site/ApartmentCard";
import { useI18n } from "@/i18n/I18nProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE_IMAGES } from "@/content/media";

const bannerImg = SITE_IMAGES.valleyView;

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
      {/* BANNER (dark, image) */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <img
          src={bannerImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="container-page relative py-16 md:py-20">
          <div className="eyebrow text-accent-bright">{t("apt.banner.eyebrow")}</div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.06] text-background md:text-5xl">
            {t("apt.banner.title")}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-background/80">
            {t("apt.banner.sub")}
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="container-page py-14">
        {isPending ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse border border-border bg-secondary"
              />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">{t("state.error")}</p>
        ) : apartments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("apt.empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apartments.map((a) => (
              <ApartmentCard key={a.id} apartment={a} />
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="section-y bg-secondary">
        <div className="container-page grid gap-10 md:grid-cols-[0.5fr_1fr]">
          <div className="max-w-[420px]">
            <div className="eyebrow">{t("apt.faq.eyebrow")}</div>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
              {t("apt.faq.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {t("apt.faq.lead")}
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((n) => (
              <AccordionItem key={n} value={n} className="border-b border-border">
                <AccordionTrigger className="py-5 text-left font-[family-name:var(--font-display)] text-base font-semibold hover:no-underline">
                  {t(`apt.faq.${n}.q`)}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
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
