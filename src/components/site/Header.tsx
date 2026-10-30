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
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src={dark ? logoWhite : logoInk}
            alt=""
            width={56}
            height={56}
            className="h-11 w-11 object-contain sm:h-14 sm:w-14"
          />
          <span
            className={
              "font-[family-name:var(--font-display)] whitespace-nowrap text-[0.8rem] font-medium uppercase tracking-[0.14em] sm:text-[1.05rem] sm:tracking-[0.16em] " +
              (dark ? "text-white" : "text-foreground")
            }
          >
            {t("brand")}
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={
                  "px-3.5 py-2 text-[17px] font-[family-name:var(--font-display)] transition-colors " +
                  (dark
                    ? active
                      ? "text-white"
                      : "text-white/80 hover:text-white"
                    : active
                      ? "text-accent"
                      : "text-foreground/65 hover:text-foreground")
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <span className={"h-4 w-px " + (dark ? "bg-white/30" : "bg-border")} aria-hidden />
          <LanguageSwitcher onDark={dark} />
          <Link
            to="/apartments"
            className={
              "btn-base bg-accent-bright px-5 py-3 text-base text-accent-foreground hover:bg-accent-bright-hover"
            }
          >
            {t("nav.book")}
          </Link>
        </div>

        <button
          type="button"
          className={
            "-mr-2 p-2 transition-colors md:hidden " + (dark ? "text-white" : "text-foreground")
          }
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            <div className="px-2 pt-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
