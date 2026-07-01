import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { CheckCircle2, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — In-Alpes Chalet Services" },
      { name: "description", content: "Contactez In-Alpes Chalet Services à Haute-Nendaz (Valais)." },
      { property: "og:title", content: "Contact — In-Alpes" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2";

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-semibold md:text-4xl">{t("contact.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("contact.sub")}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        {sent ? (
          <div className="card-soft p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-3 text-lg font-semibold">{t("form.success.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("form.success.body")}</p>
          </div>
        ) : (
          <form className="card-soft space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required placeholder={t("form.name")} className={input} />
              <input required type="email" placeholder={t("form.email")} className={input} />
            </div>
            <input placeholder={t("form.phone")} className={input} />
            <textarea rows={6} required placeholder={t("form.message")} className={input} />
            <button className="btn-base w-full bg-primary text-primary-foreground">{t("cta.send")}</button>
          </form>
        )}

        <aside className="card-soft space-y-3 p-6 text-sm">
          <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-accent" /><span>{t("contact.address")}</span></div>
          <div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 text-accent" /><a href={`tel:${t("contact.phone")}`}>{t("contact.phone")}</a></div>
          <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-accent" /><a href={`mailto:${t("contact.email")}`}>{t("contact.email")}</a></div>
        </aside>
      </div>
    </div>
  );
}
