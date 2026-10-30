import { useI18n } from "@/i18n/I18nProvider";

/** Keep the tariff visible even when no price has been published yet. */
export function NightlyPrice({
  price,
  className = "",
}: {
  price?: number | null;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const available = typeof price === "number" && Number.isFinite(price) && price > 0;
  return (
    <span
      className={"relative inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-1 " + className}
    >
      {available && (
        <span className="text-sm font-normal text-muted-foreground">{t("apt.from")}</span>
      )}
      <span
        className="font-[family-name:var(--font-display)] font-medium tabular-nums text-foreground"
        title={available ? undefined : t("apt.priceOnRequest")}
      >
        CHF {available ? new Intl.NumberFormat(locale).format(price) : "—"}
      </span>
      <span className="text-sm font-normal text-muted-foreground">{t("apt.night")}</span>
      {!available && <span className="sr-only">{t("apt.priceOnRequest")}</span>}
    </span>
  );
}
