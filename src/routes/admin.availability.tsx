import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { clearAvailability, listApartments, listAvailability, setAvailability } from "@/data/api";
import type { AvailabilityStatus } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";
import { Trash2 } from "lucide-react";

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
                    <button
                      onClick={() => remove(r.start, r.end)}
                      className="border border-border p-1.5 hover:bg-secondary"
                      aria-label={t("admin.avail.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
