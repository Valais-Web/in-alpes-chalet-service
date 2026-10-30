import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/data/types";

const LOCALES: Locale[] = ["fr", "en", "nl"];

/** Plain-text FR EN NL at nav weight; only the active language is in full ink. */
export function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center gap-3 font-[family-name:var(--font-display)] text-base">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={
            "py-1 uppercase transition-colors " +
            (locale === l
              ? onDark
                ? "text-white"
                : "text-foreground"
              : onDark
                ? "text-white/50 hover:text-white"
                : "text-foreground/40 hover:text-foreground")
          }
        >
          {l}
        </button>
      ))}
    </div>
  );
}
