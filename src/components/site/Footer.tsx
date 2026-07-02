import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
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
          <div>
            <Link to="/admin" className="hover:text-foreground">
              {t("nav.admin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
