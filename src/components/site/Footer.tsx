import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import logoInk from "@/assets/logo-ink.png";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <img
            src={logoInk}
            alt=""
            width={48}
            height={48}
            className="mb-3 h-12 w-12 object-contain"
          />
          <div className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.14em]">
            {t("brand")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{t("brand.tagline")}</div>
        </div>
        <div className="text-sm">
          <div className="mb-2 font-medium">{t("nav.apartments")}</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <Link to="/apartments" className="hover:text-foreground">
                {t("cta.viewAll")}
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="mb-2 font-medium">{t("nav.services")}</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <Link to="/services" className="hover:text-foreground">
                {t("services.title")}
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="mb-2 font-medium">{t("nav.contact")}</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>{t("contact.address")}</li>
            <li>{t("contact.phone")}</li>
            <li>{t("contact.email")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-start justify-between gap-2 py-4 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>
            © {new Date().getFullYear()} {t("brand")}. {t("footer.rights")}.
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/mentions-legales" className="hover:text-foreground">
              {t("footer.legal")}
            </Link>
            <Link to="/confidentialite" className="hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link to="/admin" className="hover:text-foreground">
              {t("nav.admin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
