import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApartments, listBookings } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { t, tx } = useI18n();
  const { data: apartments = [] } = useQuery({ queryKey: ["apartments"], queryFn: listApartments });
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: listBookings });

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("admin.dashboard.title")}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label={t("admin.nav.apartments")} value={apartments.length} />
        <Stat label={t("admin.nav.requests")} value={bookings.length} />
        <Stat label={t("admin.requests.status.new")} value={bookings.filter(b => b.status === "new").length} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("admin.nav.apartments")}</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {apartments.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{tx(a.title)}</span>
              <span className="text-muted-foreground">CHF {a.pricePerNight} / {t("apt.night").replace('/ ','')}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("admin.nav.requests")}</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {bookings.slice(0, 5).map((b) => (
            <li key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{b.name} — {b.arrival} → {b.departure}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{t(`admin.requests.status.${b.status}`)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-soft p-5">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
