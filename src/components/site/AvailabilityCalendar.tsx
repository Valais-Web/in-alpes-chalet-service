import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailabilityRange, AvailabilityStatus } from "@/data/types";
import { effectiveStatus } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { localISO } from "@/lib/dates";

interface Props {
  ranges: AvailabilityRange[];
  months?: number;
  editable?: boolean;
  onRangeSelect?: (start: string, end: string) => void;
}

const toISO = localISO;
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
  // Selection works three ways: mouse drag; or tap/click (or Enter/Space) a
  // first day, then a second day. `dragStart` doubles as that pending anchor.
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const drag = useRef<{ start: string; end: string } | null>(null);
  const suppressClick = useRef(false);

  const monthList = useMemo(() => {
    return Array.from(
      { length: months },
      (_, i) => new Date(cursor.getFullYear(), cursor.getMonth() + i, 1),
    );
  }, [cursor, months]);

  const commit = (from: string, to: string) => {
    const [a, b] = [from, to].sort();
    onRangeSelect?.(a, b);
    setDragStart(null);
    setDragEnd(null);
  };
  const cancel = () => {
    drag.current = null;
    setDragStart(null);
    setDragEnd(null);
  };

  // Mouse/pen drag. Touch is left to tap-tap so the page still scrolls.
  const onPointerDown = (iso: string, e: ReactPointerEvent) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    drag.current = { start: iso, end: iso };
    // Released anywhere (even outside the calendar) ends the drag.
    window.addEventListener(
      "pointerup",
      () => {
        const d = drag.current;
        drag.current = null;
        if (!d || d.end === d.start) return; // a plain click: handled by onPick
        // Swallow the click this release may fire, then forget about it.
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
        commit(d.start, d.end);
      },
      { once: true },
    );
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const cell = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest(
      "[data-iso]",
    ) as HTMLElement | null;
    const iso = cell?.dataset.iso;
    if (!iso || iso === d.end) return;
    d.end = iso;
    setDragStart(d.start);
    setDragEnd(iso);
  };
  // Tap/click or keyboard: first day = anchor, second day = commit.
  const onPick = (iso: string) => {
    if (suppressClick.current) return;
    if (!dragStart) {
      setDragStart(iso);
      setDragEnd(iso);
    } else {
      commit(dragStart, iso);
    }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="grid h-11 w-11 place-items-center border border-border hover:bg-secondary"
          aria-label="previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs">
          <Legend swatch="bg-background border" label={t("status.free")} />
          <Legend swatch="bg-foreground" label={t("status.booked")} />
          <Legend swatch="bg-accent/30 border border-accent" label={t("status.prebooked")} />
          <Legend swatch="bg-muted" label={t("status.blocked")} />
        </div>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="grid h-11 w-11 place-items-center border border-border hover:bg-secondary"
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
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPick={onPick}
            onHover={(d) => {
              if (dragStart && !drag.current) setDragEnd(d);
            }}
            onCancel={cancel}
          />
        ))}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 ${swatch}`} />
      {label}
    </span>
  );
}

function MonthView({
  month,
  ranges,
  locale,
  editable,
  dragStart,
  dragEnd,
  onPointerDown,
  onPointerMove,
  onPick,
  onHover,
  onCancel,
}: {
  month: Date;
  ranges: AvailabilityRange[];
  locale: string;
  editable?: boolean;
  dragStart: string | null;
  dragEnd: string | null;
  onPointerDown: (iso: string, e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPick: (iso: string) => void;
  onHover: (iso: string) => void;
  onCancel: () => void;
}) {
  const first = startOfMonth(month);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++)
    cells.push(new Date(month.getFullYear(), month.getMonth(), i));

  const monthLabel = first.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const dowFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dow = Array.from({ length: 7 }, (_, i) =>
    dowFormatter.format(addDays(new Date(2024, 0, 1), i)),
  );

  const inDrag = (iso: string) => {
    if (!dragStart || !dragEnd) return false;
    const [a, b] = [dragStart, dragEnd].sort();
    return iso >= a && iso <= b;
  };

  return (
    <div className="border border-border p-4">
      <div className="mb-3 text-sm font-medium capitalize">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        {dow.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div
        className="mt-1 grid grid-cols-7 gap-1"
        onPointerMove={editable ? onPointerMove : undefined}
        onKeyDown={editable ? (e) => e.key === "Escape" && onCancel() : undefined}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const s = statusForDate(iso, ranges);
          const selected = inDrag(iso);
          return (
            <button
              key={iso}
              type="button"
              data-iso={iso}
              disabled={!editable && s !== "free"}
              aria-pressed={editable ? selected : undefined}
              onPointerDown={editable ? (e) => onPointerDown(iso, e) : undefined}
              onPointerEnter={editable ? () => onHover(iso) : undefined}
              onFocus={editable ? () => onHover(iso) : undefined}
              onClick={editable ? () => onPick(iso) : undefined}
              className={
                "aspect-square text-xs transition-colors " +
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
