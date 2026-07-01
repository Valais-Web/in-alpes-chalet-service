import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/apartments", label: t("nav.apartments") },
    { to: "/services", label: t("nav.services") },
    { to: "/contact", label: t("nav.contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
            iA
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{t("brand")}</div>
            <div className="text-[11px] text-muted-foreground">{t("brand.tagline")}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={
                  "rounded-full px-3 py-2 text-sm transition-colors " +
                  (active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground">
            {t("nav.admin")}
          </Link>
        </div>

        <button
          type="button"
          className="rounded-full border border-border p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <div className="container-page flex flex-col gap-2 py-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">
              {t("nav.admin")}
            </Link>
            <div className="pt-2"><LanguageSwitcher /></div>
          </div>
        </div>
      )}
    </header>
  );
}
