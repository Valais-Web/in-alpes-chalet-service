import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nProvider";
import { submitBookingRequest, effectiveStatus } from "@/data/api";
import type { Apartment, AvailabilityRange } from "@/data/types";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Add whole days to a YYYY-MM-DD string, UTC-safe. */
const addDaysISO = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function BookingForm({
  apartment,
  ranges = [],
}: {
  apartment: Apartment;
  ranges?: AvailabilityRange[];
}) {
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({
    arrival: "",
    departure: "",
    guests: 2,
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const onChange =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [k]: k === "guests" ? Number(v) : v }));
    };

  // Availability check for the selected range (only when both dates are set).
  // The stay occupies nights [arrival, departure-1] inclusive, so the checkout
  // day never conflicts with a range starting that day — hence `> r.start`
  // rather than `>=`, matching the server's same-day-turnover rule.
  const datesChosen = form.arrival && form.departure && form.departure > form.arrival;
  const conflicts = datesChosen
    ? ranges
        .map((r) => ({ r, s: effectiveStatus(r) }))
        .filter(({ s }) => s !== "free")
        .filter(({ r }) => form.arrival <= r.end && form.departure > r.start)
    : [];
  const hardBlock = conflicts.some(({ s }) => s === "booked" || s === "blocked");
  const preWarn = !hardBlock && conflicts.some(({ s }) => s === "prebooked");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hardBlock) return;
    setSubmitting(true);
    setError(false);
    try {
      await submitBookingRequest({ apartmentId: apartment.id, ...form, locale });
      // Reflect the 48h pre-reservation immediately in the shared availability
      // query — the apartment-page calendar reads the same key and updates at once.
      qc.setQueryData<AvailabilityRange[]>(["availability", apartment.id], (old = []) => [
        ...old,
        {
          apartmentId: apartment.id,
          start: form.arrival,
          // Hold ends the night before departure so the checkout day reads free.
          end: addDaysISO(form.departure, -1),
          status: "prebooked",
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        },
      ]);
      setSuccess(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="card-soft p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
        <h3 className="mt-3 text-lg font-semibold">{t("form.success.title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("form.success.body")}</p>
      </div>
    );
  }

  const input =
    "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none ring-ring transition focus:border-accent focus:ring-2";
  const label = "text-xs font-medium text-muted-foreground";

  return (
    <form onSubmit={onSubmit} className="card-soft space-y-4 p-6">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={label}>{t("form.arrival")}</span>
          <input
            type="date"
            required
            min={todayISO()}
            className={input}
            value={form.arrival}
            onChange={onChange("arrival")}
          />
        </label>
        <label className="space-y-1">
          <span className={label}>{t("form.departure")}</span>
          <input
            type="date"
            required
            min={form.arrival || todayISO()}
            className={input}
            value={form.departure}
            onChange={onChange("departure")}
          />
        </label>
      </div>

      {hardBlock && (
        <p className="flex items-center gap-2 border border-border bg-secondary px-3 py-2 text-sm text-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-accent" />
          {t("form.datesUnavailable")}
        </p>
      )}
      {preWarn && (
        <p className="flex items-center gap-2 border border-accent bg-accent-tint px-3 py-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-accent" />
          {t("form.datesPrebookedWarn")}
        </p>
      )}

      <label className="block space-y-1">
        <span className={label}>{t("form.guests")}</span>
        <input
          type="number"
          min={1}
          max={apartment.maxGuests}
          required
          className={input}
          value={form.guests}
          onChange={onChange("guests")}
        />
      </label>
      <label className="block space-y-1">
        <span className={label}>{t("form.name")}</span>
        <input
          type="text"
          required
          className={input}
          value={form.name}
          onChange={onChange("name")}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className={label}>{t("form.email")}</span>
          <input
            type="email"
            required
            className={input}
            value={form.email}
            onChange={onChange("email")}
          />
        </label>
        <label className="space-y-1">
          <span className={label}>{t("form.phone")}</span>
          <input
            type="tel"
            required
            className={input}
            value={form.phone}
            onChange={onChange("phone")}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className={label}>{t("form.message")}</span>
        <textarea rows={4} className={input} value={form.message} onChange={onChange("message")} />
      </label>
      {error && <p className="text-sm text-accent">{t("contact.error")}</p>}
      <button
        type="submit"
        disabled={submitting || hardBlock}
        className="btn-base flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-foreground/90 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? t("contact.sending") : t("form.submit")}
      </button>
    </form>
  );
}
