import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listBookings, updateBookingStatus } from "@/data/api";
import type { BookingStatus } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequests,
});

const STATUSES: (BookingStatus | "all")[] = ["all", "new", "in_progress", "answered", "archived"];

function AdminRequests() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: listBookings });
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const update = async (id: string, status: BookingStatus) => {
    await updateBookingStatus(id, status);
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("admin.nav.requests")}</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value as BookingStatus | "all")} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? t("admin.requests.all") : t(`admin.requests.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("form.name")}</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">{t("form.guests")}</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.email}</div>
                </td>
                <td className="px-4 py-3">{b.arrival} → {b.departure}</td>
                <td className="px-4 py-3">{b.guests}</td>
                <td className="px-4 py-3">
                  <span className="bg-secondary px-2 py-0.5 text-xs">{t(`admin.requests.status.${b.status}`)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => update(b.id, "answered")} className="bg-accent px-2.5 py-1 text-xs text-accent-foreground">{t("admin.requests.confirm")}</button>
                    <button onClick={() => update(b.id, "answered")} className="border border-border px-2.5 py-1 text-xs">{t("admin.requests.decline")}</button>
                    <button onClick={() => update(b.id, "archived")} className="border border-border px-2.5 py-1 text-xs">{t("admin.requests.archive")}</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">—</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
