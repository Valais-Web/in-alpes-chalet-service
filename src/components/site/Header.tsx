import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import logoInk from "@/assets/logo-ink.png";
import logoWhite from "@/assets/logo-white.png";

export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The home page opens on a full-bleed photo hero, so the header floats over it
  // in white until the user scrolls, then it settles into the solid bar.
  const overHero = pathname === "/" && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = overHero && !scrolled; // white-on-photo mode

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/apartments", label: t("nav.apartments") },
    { to: "/services", label: t("nav.services") },
    { to: "/contact", label: t("nav.contact") },
  ] as const;

  return (
    <header
      className={
        "sticky top-0 z-40 transition-colors duration-300 " +
        (dark
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border bg-background/85 backdrop-blur")
      }
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src={dark ? logoWhite : logoInk}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div className="leading-tight">
            <div
              className={
                "font-[family-name:var(--font-display)] text-[0.95rem] font-semibold uppercase tracking-[0.16em] " +
                (dark ? "text-white" : "text-foreground")
              }
            >
              {t("brand")}
            </div>
            <div className={"text-[11px] " + (dark ? "text-white/70" : "text-muted-foreground")}>
              {t("brand.tagline")}
            </div>
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
                  "px-3 py-2 text-sm font-[family-name:var(--font-display)] transition-colors " +
                  (dark
                    ? active
                      ? "text-white"
                      : "text-white/75 hover:text-white"
                    : active
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground")
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link
            to="/admin"
            className={
              "text-xs transition-colors " +
              (dark
                ? "text-white/70 hover:text-white"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {t("nav.admin")}
          </Link>
        </div>

        <button
          type="button"
          className={
            "border p-2 transition-colors md:hidden " +
            (dark ? "border-white/40 text-white" : "border-border text-foreground")
          }
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container-page flex flex-col gap-2 py-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm hover:bg-secondary"
            >
              {t("nav.admin")}
            </Link>
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
