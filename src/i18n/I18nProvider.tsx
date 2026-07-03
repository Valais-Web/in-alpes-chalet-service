import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale, LocalizedText } from "@/data/types";
import { dictionaries } from "./translations";

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  tx: (v: LocalizedText | undefined) => string;
}

const Ctx = createContext<I18nCtx | null>(null);
const STORAGE_KEY = "inalpes.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && (saved === "fr" || saved === "en" || saved === "nl")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  // Keep the <html lang> attribute in sync with the active locale (a11y + SEO).
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nCtx>(() => {
    const dict = dictionaries[locale];
    return {
      locale,
      setLocale,
      t: (key) => dict[key] ?? dictionaries.fr[key] ?? key,
      tx: (v) => (v ? (v[locale] ?? v.fr) : ""),
    };
  }, [locale, setLocale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
