import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  clearAvailability,
  listApartments,
  listAvailability,
  listCalendarSync,
  setAvailability,
  updateCalendarSync,
} from "@/data/api";
import type { Apartment, AvailabilityStatus } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";
import { Copy, Loader2, RefreshCw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/availability")({
  component: AdminAvailability,
});

function AdminAvailability() {
  const { t, tx } = useI18n();
  const qc = useQueryClient();
  const { data: apartments = [] } = useQuery({ queryKey: ["apartments"], queryFn: listApartments });
  const [aptId, setAptId] = useState<string>("");
  const active = aptId || apartments[0]?.id || "";

  const { data: ranges = [] } = useQuery({
    queryKey: ["availability", active],
    queryFn: () => listAvailability(active),
    enabled: !!active,
  });

  const activeApt = apartments.find((a) => a.id === active);
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null);
  const [status, setStatus] = useState<AvailabilityStatus>("blocked");

  const apply = async () => {
    if (!pending || !active) return;
    await setAvailability({ apartmentId: active, start: pending.start, end: pending.end, status });
    setPending(null);
    qc.invalidateQueries({ queryKey: ["availability", active] });
  };

  const remove = async (start: string, end: string) => {
    if (!active) return;
    await clearAvailability(active, start, end);
    qc.invalidateQueries({ queryKey: ["availability", active] });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("admin.nav.availability")}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={active}
          onChange={(e) => setAptId(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          {apartments.map((a) => (
            <option key={a.id} value={a.id}>
              {tx(a.title)}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{t("admin.avail.pick")}</span>
      </div>

      {activeApt && <AirbnbSyncPanel apartment={activeApt} />}

      <div className="mt-6">
        <AvailabilityCalendar
          ranges={ranges}
          months={2}
          editable
          onRangeSelect={(start, end) => setPending({ start, end })}
        />
      </div>

      {pending && (
        <div className="mt-6 card-soft flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-sm">
            <strong>{pending.start}</strong> → <strong>{pending.end}</strong>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">{t("admin.avail.setStatus")}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="free">{t("status.free")}</option>
              <option value="booked">{t("status.booked")}</option>
              <option value="prebooked">{t("status.prebooked")}</option>
              <option value="blocked">{t("status.blocked")}</option>
            </select>
            <button
              onClick={() => setPending(null)}
              className="btn-base bg-secondary text-foreground"
            >
              {t("admin.avail.clear")}
            </button>
            <button onClick={apply} className="btn-base bg-primary text-primary-foreground">
              {t("admin.apt.save")}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold">{t("admin.avail.existing")}</h2>
        {ranges.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.avail.none")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {[...ranges]
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((r) => (
                <li
                  key={`${r.start}-${r.end}-${r.status}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <span>
                    <strong>{r.start}</strong> → <strong>{r.end}</strong>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="bg-secondary px-2 py-0.5 text-xs">
                      {t(`status.${r.status}`)}
                    </span>
                    {r.source === "airbnb" ? (
                      <span
                        className="border border-border px-2 py-0.5 text-xs text-muted-foreground"
                        title={t("admin.sync.readonly")}
                      >
                        {t("admin.sync.airbnb")}
                      </span>
                    ) : (
                      <button
                        onClick={() => remove(r.start, r.end)}
                        className="border border-border p-1.5 hover:bg-secondary"
                        aria-label={t("admin.avail.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const input =
  "w-full border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

/** Two-way Airbnb calendar sync for one apartment (netlify/lib/calendarSync.ts). */
function AirbnbSyncPanel({ apartment }: { apartment: Apartment }) {
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const { data: statuses = [] } = useQuery({
    queryKey: ["calendar-sync"],
    queryFn: listCalendarSync,
  });
  const status = statuses.find((s) => s.apartmentId === apartment.id);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url = draft ?? status?.importUrl ?? "";
  const exportUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/api/calendar/${apartment.slug}.ics`;

  const run = async (
    input:
      | { action: "save"; apartmentId: string; importUrl: string }
      | { action: "sync"; apartmentId: string },
  ) => {
    setBusy(true);
    setMessage(null);
    try {
      const next = await updateCalendarSync(input);
      qc.setQueryData(["calendar-sync"], next);
      qc.invalidateQueries({ queryKey: ["availability", apartment.id] });
      setDraft(null);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      setMessage(
        msg.includes("calendar_sync_unavailable")
          ? t("admin.sync.unavailable")
          : msg.includes("invalid_airbnb_ical_url")
            ? t("admin.sync.invalidUrl")
            : t("admin.sync.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the field stays selectable for a manual copy.
    }
  };

  const lastSync = status?.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleString(locale)
    : t("admin.sync.never");

  return (
    <section className="mt-6 border border-border p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-accent">
        {t("admin.sync.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("admin.sync.intro")}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="airbnb-ical">
            {t("admin.sync.importLabel")}
          </label>
          <p className="text-xs text-muted-foreground">{t("admin.sync.importHelp")}</p>
          <input
            id="airbnb-ical"
            type="url"
            className={input}
            placeholder={t("admin.sync.importPlaceholder")}
            value={url}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !url.trim() || url.trim() === status?.importUrl}
              onClick={() =>
                run({ action: "save", apartmentId: apartment.id, importUrl: url.trim() })
              }
              className="btn-base inline-flex items-center gap-2 bg-primary text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("admin.sync.save")}
            </button>
            {status?.importUrl && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run({ action: "sync", apartmentId: apartment.id })}
                  className="btn-base inline-flex items-center gap-2 bg-secondary text-foreground disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
                  {t("admin.sync.syncNow")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run({ action: "save", apartmentId: apartment.id, importUrl: "" })}
                  className="btn-base bg-secondary text-foreground disabled:opacity-60"
                >
                  {t("admin.sync.disable")}
                </button>
              </>
            )}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {status?.importUrl ? (
              <p>
                {t("admin.sync.lastSync")} {lastSync}
              </p>
            ) : (
              <p>{t("admin.sync.off")}</p>
            )}
            {status?.lastError && (
              <p className="text-accent">
                {t("admin.sync.error")} {status.lastError}
              </p>
            )}
            {status && status.conflicts.length > 0 && (
              <p className="text-accent">
                {t("admin.sync.conflicts")}{" "}
                {status.conflicts.map((c) => `${c.start} → ${c.end}`).join(", ")}
              </p>
            )}
            {message && <p className="text-accent">{message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="site-ical">
            {t("admin.sync.exportLabel")}
          </label>
          <p className="text-xs text-muted-foreground">{t("admin.sync.exportHelp")}</p>
          <div className="flex gap-2">
            <input
              id="site-ical"
              readOnly
              className={input}
              value={exportUrl}
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={copy}
              className="btn-base inline-flex items-center gap-2 whitespace-nowrap bg-secondary text-foreground"
            >
              <Copy className="h-4 w-4" strokeWidth={1.8} />
              {copied ? t("admin.sync.copied") : t("admin.sync.copy")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
