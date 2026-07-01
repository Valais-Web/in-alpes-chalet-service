import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listApartments, listAvailability, setAvailability } from "@/data/api";
import type { AvailabilityStatus } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";

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

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("admin.nav.availability")}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select value={active} onChange={(e) => setAptId(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          {apartments.map((a) => <option key={a.id} value={a.id}>{tx(a.title)}</option>)}
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
            <select value={status} onChange={(e) => setStatus(e.target.value as AvailabilityStatus)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option value="free">{t("status.free")}</option>
              <option value="booked">{t("status.booked")}</option>
              <option value="prebooked">{t("status.prebooked")}</option>
              <option value="blocked">{t("status.blocked")}</option>
            </select>
            <button onClick={() => setPending(null)} className="btn-base bg-secondary text-foreground">{t("admin.avail.clear")}</button>
            <button onClick={apply} className="btn-base bg-primary text-primary-foreground">{t("admin.apt.save")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
