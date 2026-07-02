import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/data/types";

const LOCALES: Locale[] = ["fr", "en", "nl"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex items-center border border-border bg-background p-1 text-xs">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={
            "px-3 py-1 font-[family-name:var(--font-display)] uppercase tracking-wide transition-colors " +
            (locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {l}
        </button>
      ))}
    </div>
  );
}
