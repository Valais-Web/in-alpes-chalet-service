import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { submitBookingRequest } from "@/data/api";
import type { Apartment } from "@/data/types";
import { CheckCircle2 } from "lucide-react";

export function BookingForm({ apartment }: { apartment: Apartment }) {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    arrival: "",
    departure: "",
    guests: 2,
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: k === "guests" ? Number(v) : v }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await submitBookingRequest({ apartmentId: apartment.id, ...form });
    setSubmitting(false);
    setSuccess(true);
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

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2";
  const label = "text-xs font-medium text-muted-foreground";

  return (
    <form onSubmit={onSubmit} className="card-soft space-y-4 p-6">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={label}>{t("form.arrival")}</span>
          <input type="date" required className={input} value={form.arrival} onChange={onChange("arrival")} />
        </label>
        <label className="space-y-1">
          <span className={label}>{t("form.departure")}</span>
          <input type="date" required className={input} value={form.departure} onChange={onChange("departure")} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className={label}>{t("form.guests")}</span>
        <input type="number" min={1} max={apartment.maxGuests} required className={input} value={form.guests} onChange={onChange("guests")} />
      </label>
      <label className="block space-y-1">
        <span className={label}>{t("form.name")}</span>
        <input type="text" required className={input} value={form.name} onChange={onChange("name")} />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className={label}>{t("form.email")}</span>
          <input type="email" required className={input} value={form.email} onChange={onChange("email")} />
        </label>
        <label className="space-y-1">
          <span className={label}>{t("form.phone")}</span>
          <input type="tel" required className={input} value={form.phone} onChange={onChange("phone")} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className={label}>{t("form.message")}</span>
        <textarea rows={4} className={input} value={form.message} onChange={onChange("message")} />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="btn-base w-full bg-primary text-primary-foreground hover:bg-foreground/90 disabled:opacity-60"
      >
        {t("form.submit")}
      </button>
    </form>
  );
}
