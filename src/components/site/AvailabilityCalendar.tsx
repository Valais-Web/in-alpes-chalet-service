import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailabilityRange, AvailabilityStatus } from "@/data/types";
import { effectiveStatus } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";

interface Props {
  ranges: AvailabilityRange[];
  months?: number;
  editable?: boolean;
  onRangeSelect?: (start: string, end: string) => void;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function statusForDate(iso: string, ranges: AvailabilityRange[]): AvailabilityStatus {
  for (const r of ranges) {
    const s = effectiveStatus(r);
    if (s === "free") continue;
    if (iso >= r.start && iso <= r.end) return s;
  }
  return "free";
}

const STATUS_CLASS: Record<AvailabilityStatus, string> = {
  free: "bg-background text-foreground hover:bg-secondary",
  booked: "bg-foreground text-background",
  prebooked: "bg-accent/20 text-accent-foreground border border-accent",
  blocked: "bg-muted text-muted-foreground line-through",
};

export function AvailabilityCalendar({ ranges, months = 2, editable, onRangeSelect }: Props) {
  const { t, locale } = useI18n();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);

  const monthList = useMemo(() => {
    return Array.from({ length: months }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth() + i, 1));
  }, [cursor, months]);

  const commit = () => {
    if (dragStart && dragEnd) {
      const [a, b] = [dragStart, dragEnd].sort();
      onRangeSelect?.(a, b);
    }
    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="border border-border p-2 hover:bg-secondary"
          aria-label="previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-4 text-xs">
          <Legend swatch="bg-background border" label={t("status.free")} />
          <Legend swatch="bg-foreground" label={t("status.booked")} />
          <Legend swatch="bg-accent/30 border border-accent" label={t("status.prebooked")} />
          <Legend swatch="bg-muted" label={t("status.blocked")} />
        </div>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="border border-border p-2 hover:bg-secondary"
          aria-label="next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {monthList.map((m) => (
          <MonthView
            key={m.toISOString()}
            month={m}
            ranges={ranges}
            locale={locale}
            editable={editable}
            dragStart={dragStart}
            dragEnd={dragEnd}
            onDown={(d) => { setDragStart(d); setDragEnd(d); }}
            onEnter={(d) => { if (dragStart) setDragEnd(d); }}
            onUp={commit}
          />
        ))}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}

function MonthView({
  month, ranges, locale, editable, dragStart, dragEnd, onDown, onEnter, onUp,
}: {
  month: Date;
  ranges: AvailabilityRange[];
  locale: string;
  editable?: boolean;
  dragStart: string | null;
  dragEnd: string | null;
  onDown: (iso: string) => void;
  onEnter: (iso: string) => void;
  onUp: () => void;
}) {
  const first = startOfMonth(month);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(month.getFullYear(), month.getMonth(), i));

  const monthLabel = first.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const dowFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dow = Array.from({ length: 7 }, (_, i) => dowFormatter.format(addDays(new Date(2024, 0, 1), i)));

  const inDrag = (iso: string) => {
    if (!dragStart || !dragEnd) return false;
    const [a, b] = [dragStart, dragEnd].sort();
    return iso >= a && iso <= b;
  };

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-3 text-sm font-medium capitalize">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        {dow.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1" onMouseUp={onUp} onMouseLeave={onUp}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const s = statusForDate(iso, ranges);
          const selected = inDrag(iso);
          return (
            <button
              key={iso}
              type="button"
              disabled={!editable && s !== "free"}
              onMouseDown={editable ? () => onDown(iso) : undefined}
              onMouseEnter={editable ? () => onEnter(iso) : undefined}
              className={
                "aspect-square rounded-md text-xs transition-colors " +
                STATUS_CLASS[s] +
                (selected ? " ring-2 ring-accent" : "")
              }
              aria-label={`${iso} ${s}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
