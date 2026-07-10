import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { submitContact } from "@/data/api";
import { CheckCircle2, Mail, Phone, MapPin, Loader2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · In-Alpes Chalet Services" },
      {
        name: "description",
        content: "Contactez In-Alpes Chalet Services à Haute-Nendaz (Valais).",
      },
      { property: "og:title", content: "Contact · In-Alpes" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      await submitContact(form);
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const input =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2";
  const label = "mb-1 block text-xs font-medium text-muted-foreground";

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-semibold md:text-4xl">{t("contact.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("contact.sub")}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        {sent ? (
          <div className="card-soft p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-3 text-lg font-semibold">{t("contact.sent.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("contact.sent.body")}</p>
          </div>
        ) : (
          <form className="card-soft space-y-4 p-6" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className={label}>{t("form.name")}</span>
                <input required value={form.name} onChange={set("name")} className={input} />
              </label>
              <label>
                <span className={label}>{t("form.email")}</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  className={input}
                />
              </label>
            </div>
            <label>
              <span className={label}>{t("form.phone")}</span>
              <input type="tel" value={form.phone} onChange={set("phone")} className={input} />
            </label>
            <label>
              <span className={label}>{t("form.message")}</span>
              <textarea
                rows={6}
                required
                value={form.message}
                onChange={set("message")}
                className={input}
              />
            </label>
            {error && <p className="text-sm text-accent">{t("contact.error")}</p>}
            <button
              disabled={submitting}
              className="btn-base flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t("contact.sending") : t("cta.send")}
            </button>
          </form>
        )}

        <aside className="card-soft space-y-3 p-6 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-accent" />
            <span>{t("contact.address")}</span>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 text-accent" />
            <a href={`tel:${t("contact.phone")}`}>{t("contact.phone")}</a>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-accent" />
            <a href={`mailto:${t("contact.email")}`}>{t("contact.email")}</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
