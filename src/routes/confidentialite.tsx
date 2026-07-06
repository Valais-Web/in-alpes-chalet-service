import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { LegalPage } from "@/components/site/LegalPage";
import { confidentialite } from "@/content/legal";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — In-Alpes Chalet Services" },
      {
        name: "description",
        content: "Comment In-Alpes Chalet Services protège vos données personnelles (nLPD/RGPD).",
      },
      { property: "og:title", content: "Politique de confidentialité — In-Alpes" },
      { property: "og:url", content: "/confidentialite" },
    ],
    links: [{ rel: "canonical", href: "/confidentialite" }],
  }),
  component: Confidentialite,
});

function Confidentialite() {
  const { locale } = useI18n();
  return <LegalPage doc={confidentialite[locale]} />;
}
