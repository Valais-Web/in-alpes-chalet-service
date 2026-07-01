import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { Sparkles, Brush, Shirt, Hammer, KeyRound, Trees, Snowflake } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services de gérance — In-Alpes Chalet Services" },
      { name: "description", content: "Gérance complète de résidences secondaires à Haute-Nendaz : location, nettoyage, blanchisserie, chantier, clés, jardinage, déneigement." },
      { property: "og:title", content: "Services de gérance — In-Alpes" },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Services,
});

const ICONS = {
  rental: Sparkles,
  cleaning: Brush,
  laundry: Shirt,
  works: Hammer,
  keys: KeyRound,
  garden: Trees,
  snow: Snowflake,
} as const;

function Services() {
  const { t } = useI18n();
  const services = ["rental","cleaning","laundry","works","keys","garden","snow"] as const;

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-semibold md:text-4xl">{t("services.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("services.sub")}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((k) => {
          const Icon = ICONS[k];
          return (
            <article key={k} className="card-soft p-6">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold">{t(`svc.${k}.title`)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t(`svc.${k}.body`)}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
