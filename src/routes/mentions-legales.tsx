import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { LegalPage } from "@/components/site/LegalPage";
import { mentionsLegales } from "@/content/legal";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales · In-Alpes Chalet Services" },
      { name: "description", content: "Mentions légales du site In-Alpes Chalet Services." },
      { property: "og:title", content: "Mentions légales · In-Alpes" },
      { property: "og:url", content: "/mentions-legales" },
    ],
    links: [{ rel: "canonical", href: "/mentions-legales" }],
  }),
  component: MentionsLegales,
});

function MentionsLegales() {
  const { locale } = useI18n();
  return <LegalPage doc={mentionsLegales[locale]} />;
}
