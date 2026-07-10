import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApartments } from "@/data/api";
import { ApartmentCard } from "@/components/site/ApartmentCard";
import { useI18n } from "@/i18n/I18nProvider";

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
    <div className="container-page py-12">
      <h1 className="text-3xl font-semibold md:text-4xl">{t("home.apartments.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("home.apartments.sub")}</p>

      {isPending ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse border border-border bg-secondary" />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-10 text-sm text-muted-foreground">{t("state.error")}</p>
      ) : apartments.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{t("apt.empty")}</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {apartments.map((a) => (
            <ApartmentCard key={a.id} apartment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
