import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { submitContact } from "@/data/api";
import { CheckCircle2, Mail, Phone, MapPin, Loader2, ArrowRight } from "lucide-react";
import { SITE_IMAGES } from "@/content/media";

const panelImg = SITE_IMAGES.fourValleysHike;

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
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", company: "" });

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
    "w-full border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-ring transition focus:border-accent focus:ring-2";
  const label = "mb-1 block text-xs font-medium text-muted-foreground";

  const contactLinks = [
    { icon: Phone, value: t("contact.phone"), href: `tel:${t("contact.phone")}` },
    { icon: Mail, value: t("contact.email"), href: `mailto:${t("contact.email")}` },
    { icon: MapPin, value: t("contact.address"), href: undefined },
  ];

  return (
    <div className="container-page py-12 md:py-16">
      <div className="grid overflow-hidden border border-border shadow-[var(--shadow-soft)] lg:grid-cols-[0.85fr_1fr]">
        {/* IMAGE + INFO PANEL */}
        <div className="relative min-h-[360px] overflow-hidden bg-foreground text-background lg:min-h-full">
          <img src={panelImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, oklch(0.14 0 0 / 0.92) 0%, oklch(0.14 0 0 / 0.62) 46%, oklch(0.14 0 0 / 0.45) 100%)",
            }}
          />
          <div className="relative flex h-full flex-col justify-between gap-10 p-8 md:p-10">
            <div>
              <div className="eyebrow text-accent-bright">{t("brand.tagline")}</div>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-background md:text-5xl">
                {t("contact.title")}
              </h1>
              <p className="mt-4 max-w-sm leading-relaxed text-background/80">{t("contact.sub")}</p>
            </div>
            <ul className="space-y-4">
              {contactLinks.map(({ icon: Icon, value, href }) => {
                const body = (
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-background/25 bg-background/10 text-accent-bright">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm leading-snug text-background/90">{value}</span>
                  </>
                );
                return (
                  <li key={value}>
                    {href ? (
                      <a
                        href={href}
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* FORM PANEL */}
        <div className="bg-background p-6 md:p-10">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-accent" />
              <h2 className="mt-4 text-xl font-semibold">{t("contact.sent.title")}</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                {t("contact.sent.body")}
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              {/* Honeypot: hidden from real users, tempting to bots. */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-[-9999px] top-[-9999px]"
              >
                <label>
                  Company
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={set("company")}
                  />
                </label>
              </div>
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
                  rows={7}
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
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {submitting ? t("contact.sending") : t("cta.send")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
