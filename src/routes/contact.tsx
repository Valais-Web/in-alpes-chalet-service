import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { submitContact } from "@/data/api";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { SITE_IMAGES } from "@/content/media";
import { PageIntro } from "@/components/site/editorial";
import { H3, LEAD, grade } from "@/components/site/editorialStyles";

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
    "w-full border border-foreground/20 bg-background min-h-12 px-4 py-3.5 text-base outline-none ring-ring transition focus:border-accent focus:ring-2";
  const label = "mb-2 block text-sm font-medium text-foreground/80";

  return (
    <div>
      <PageIntro title={t("contact.title")} lead={t("contact.sub")} />
      <section className="pb-24 md:pb-32">
        <div className="container-page grid gap-14 md:grid-cols-12 md:gap-10">
          {/* DETAILS */}
          <address className="not-italic md:col-span-5">
            <a
              href={`tel:${t("contact.phone").replace(/\s/g, "")}`}
              className="block font-[family-name:var(--font-display)] text-[clamp(2.2rem,3.6vw,3.2rem)] font-light leading-none tracking-[-0.03em] tabular-nums hover:text-accent"
            >
              {t("contact.phone")}
            </a>
            <a
              href={`mailto:${t("contact.email")}`}
              className="mt-5 block font-[family-name:var(--font-display)] text-2xl hover:text-accent"
            >
              {t("contact.email")}
            </a>
            <p className={LEAD + " mt-6"}>{t("contact.address")}</p>
            <div className="mt-10 aspect-[4/3] overflow-hidden bg-secondary">
              <img
                src={grade(panelImg.replace("q_auto", "q_auto,w_1200"))}
                alt="Haute-Nendaz, 4 Vallées"
                loading="lazy"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
              />
            </div>
          </address>

          {/* FORM */}
          <div className="border-t border-foreground pt-10 md:col-span-6 md:col-start-7">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-accent-bright" />
                <h2 className={H3 + " mt-4 text-2xl"}>{t("contact.sent.title")}</h2>
                <p className={LEAD + " mt-2 max-w-xs"}>{t("contact.sent.body")}</p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={onSubmit}>
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
                <div className="grid gap-5 sm:grid-cols-2">
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
                {error && (
                  <p
                    role="alert"
                    className="border-l-4 border-foreground bg-secondary px-4 py-3 text-base font-medium text-foreground"
                  >
                    {t("contact.error")}
                  </p>
                )}
                <button
                  disabled={submitting}
                  className="btn-base flex w-full items-center justify-center gap-2 bg-accent px-7 py-4 text-base text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
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
      </section>
    </div>
  );
}
