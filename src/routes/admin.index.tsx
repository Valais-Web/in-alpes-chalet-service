import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApartments, listBookings } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { ArrowRight, Inbox } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { t, tx } = useI18n();
  const { data: apartments = [] } = useQuery({ queryKey: ["apartments"], queryFn: listApartments });
  const { data: bookings = [], isError } = useQuery({
    queryKey: ["bookings"],
    queryFn: listBookings,
    refetchOnMount: "always",
    refetchInterval: 20000,
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{t("admin.dashboard.title")}</h1>
        {pendingCount > 0 && (
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-1.5 bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            <Inbox className="h-3.5 w-3.5" /> {pendingCount} {t("admin.newRequests")}
          </Link>
        )}
      </div>

      {isError && (
        <p className="mt-4 border border-accent bg-accent-tint px-3 py-2 text-sm text-accent">
          {t("state.error")}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label={t("admin.nav.apartments")} value={apartments.length} to="/admin/apartments" />
        <Stat label={t("admin.nav.requests")} value={bookings.length} to="/admin/requests" />
        <Stat
          label={t("admin.requests.status.pending")}
          value={bookings.filter((b) => b.status === "pending").length}
          to="/admin/requests"
        />
      </div>

      <section className="mt-10">
        <Link
          to="/admin/apartments"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          {t("admin.nav.apartments")}
          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {apartments.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{tx(a.title)}</span>
              <span className="text-muted-foreground">
                CHF {a.pricePerNight} / {t("apt.night").replace("/ ", "")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <Link
          to="/admin/requests"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          {t("admin.nav.requests")}
          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {bookings.slice(0, 5).map((b) => (
            <li key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {b.name} — {b.arrival} → {b.departure}
              </span>
              <span className="bg-secondary px-2 py-0.5 text-xs">
                {t(`admin.requests.status.${b.status}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  to,
}: {
  label: string;
  value: number;
  to: "/admin/apartments" | "/admin/requests";
}) {
  return (
    <Link
      to={to}
      className="card-soft group p-5 transition-colors hover:border-accent hover:bg-secondary/40"
    >
      <div className="flex items-center justify-between">
        <div className="text-3xl font-semibold">{value}</div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </Link>
  );
}
