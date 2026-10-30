import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { listApartments, listBookings, updateBookingStatus } from "@/data/api";
import type { BookingStatus } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import { StatusBadge } from "@/admin/StatusBadge";
import { RefreshCw, Archive, ArchiveRestore, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequests,
});

const STATUSES: (BookingStatus | "all")[] = ["all", "pending", "accepted", "declined", "archived"];

function AdminRequests() {
  const { t, tx, locale } = useI18n();
  const qc = useQueryClient();
  const { data: apartments = [] } = useQuery({ queryKey: ["apartments"], queryFn: listApartments });
  const apartmentName = (id: string) => {
    const apt = apartments.find((a) => a.id === id);
    return apt ? tx(apt.title) : id;
  };
  const [openId, setOpenId] = useState<string | null>(null);
  const {
    data: bookings = [],
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: listBookings,
    refetchOnMount: "always",
    refetchInterval: 20000, // new requests surface automatically
  });
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);

  const archivedCount = bookings.filter((b) => b.status === "archived").length;
  const filtered = bookings.filter((b) => {
    if (filter !== "all") return b.status === filter;
    // Default "all" view hides archived unless explicitly revealed.
    return showArchived || b.status !== "archived";
  });

  const update = async (
    id: string,
    status: BookingStatus,
    action: "confirm" | "decline" | "none" = "none",
  ) => {
    setBusyId(id);
    setActionError(false);
    try {
      await updateBookingStatus(id, status, action);
      await qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-availability"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    } catch {
      setActionError(true);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("admin.nav.requests")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {filter === "all" && archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              {showArchived ? (
                <>
                  <Archive className="h-4 w-4" /> {t("admin.requests.hideArchived")}
                </>
              ) : (
                <>
                  <ArchiveRestore className="h-4 w-4" /> {t("admin.requests.showArchived")} (
                  {archivedCount})
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {t("admin.requests.refresh")}
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as BookingStatus | "all")}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? t("admin.requests.all") : t(`admin.requests.status.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError && (
        <p className="mt-4 border border-accent bg-accent-tint px-3 py-2 text-sm text-accent">
          {t("state.error")}
        </p>
      )}

      {actionError && (
        <p className="mt-4 border border-accent bg-accent-tint px-3 py-2 text-sm text-accent">
          {t("admin.requests.actionError")}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("form.name")}</th>
              <th className="px-4 py-3">{t("admin.requests.apartment")}</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">{t("form.guests")}</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((b) => {
              const open = openId === b.id;
              return (
                <Fragment key={b.id}>
                  <tr>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : b.id)}
                        aria-expanded={open}
                        className="inline-flex items-start gap-1.5 text-left"
                      >
                        {open ? (
                          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
                        ) : (
                          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
                        )}
                        <span>
                          <span className="block font-medium">{b.name}</span>
                          <span className="block text-xs text-muted-foreground">{b.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium">{apartmentName(b.apartmentId)}</td>
                    <td className="px-4 py-3">
                      {b.arrival} → {b.departure}
                    </td>
                    <td className="px-4 py-3">{b.guests}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => update(b.id, "accepted", "confirm")}
                          disabled={busyId === b.id}
                          className="bg-accent px-2.5 py-1 text-xs text-accent-foreground disabled:opacity-50"
                        >
                          {t("admin.requests.confirm")}
                        </button>
                        <button
                          onClick={() => update(b.id, "declined", "decline")}
                          disabled={busyId === b.id}
                          className="border border-border px-2.5 py-1 text-xs disabled:opacity-50"
                        >
                          {t("admin.requests.decline")}
                        </button>
                        <button
                          onClick={() => update(b.id, "archived")}
                          disabled={busyId === b.id}
                          className="border border-border px-2.5 py-1 text-xs disabled:opacity-50"
                        >
                          {t("admin.requests.archive")}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-secondary/50">
                      <td colSpan={6} className="px-4 py-4">
                        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
                          <dt className="text-muted-foreground">{t("form.phone")}</dt>
                          <dd>
                            {b.phone ? (
                              <a href={`tel:${b.phone}`} className="text-accent hover:underline">
                                {b.phone}
                              </a>
                            ) : (
                              "—"
                            )}
                          </dd>
                          <dt className="text-muted-foreground">{t("form.email")}</dt>
                          <dd>
                            <a href={`mailto:${b.email}`} className="text-accent hover:underline">
                              {b.email}
                            </a>
                          </dd>
                          <dt className="text-muted-foreground">{t("admin.requests.received")}</dt>
                          <dd>{new Date(b.createdAt).toLocaleString(locale)}</dd>
                          <dt className="text-muted-foreground">{t("form.message")}</dt>
                          <dd className="whitespace-pre-wrap">
                            {b.message || t("admin.requests.noMessage")}
                          </dd>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Aucune demande
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
