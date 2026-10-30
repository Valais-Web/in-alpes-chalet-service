import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import logoWhite from "@/assets/logo-white.png";

/** The site's one closing block: a question, a phone number, the address. */
export function Footer() {
  const { t } = useI18n();
  const links = [
    { to: "/apartments", label: t("nav.apartments") },
    { to: "/services", label: t("nav.services") },
    { to: "/contact", label: t("nav.contact") },
  ] as const;
  return (
    <footer className="bg-foreground text-background">
      <div className="container-page grid gap-12 pb-16 pt-24 md:grid-cols-12 md:gap-10 md:pt-28">
        <div className="md:col-span-5">
          <h2 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-medium leading-[1.1] tracking-[-0.02em] text-background">
            {t("footer.title")}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-background/70">
            {t("footer.sub")}
          </p>
          <Link
            to="/contact"
            className="btn-base mt-10 bg-background px-7 py-4 text-base text-foreground hover:bg-background/90"
          >
            {t("home.cta.btn")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <address className="not-italic md:col-span-7 md:pl-10">
          <a
            href={`tel:${t("contact.phone").replace(/\s/g, "")}`}
            className="block font-[family-name:var(--font-display)] text-[clamp(2.6rem,5.4vw,4.8rem)] font-light leading-none tracking-[-0.03em] tabular-nums hover:text-accent-bright"
          >
            {t("contact.phone")}
          </a>
          <a
            href={`mailto:${t("contact.email")}`}
            className="mt-5 block font-[family-name:var(--font-display)] text-2xl hover:text-accent-bright"
          >
            {t("contact.email")}
          </a>
          <p className="mt-6 text-base leading-relaxed text-background/65">
            {t("contact.address")}
          </p>
        </address>
      </div>
      <div className="container-page">
        <div className="flex flex-col gap-6 border-t border-background/15 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logoWhite}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="font-[family-name:var(--font-display)] text-sm font-medium uppercase tracking-[0.16em]">
              {t("brand")}
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="font-[family-name:var(--font-display)] text-[15px] text-background/80 hover:text-background"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 pb-8 text-sm text-background/45 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} {t("brand")}. {t("footer.rights")}.
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link to="/mentions-legales" className="hover:text-background">
              {t("footer.legal")}
            </Link>
            <Link to="/confidentialite" className="hover:text-background">
              {t("footer.privacy")}
            </Link>
            <Link to="/admin" className="text-background/25 hover:text-background">
              {t("nav.admin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
