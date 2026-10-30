/**
 * Date helpers for the availability model.
 *
 * Availability ranges are stored INCLUSIVE on both ends (`start_date`..`end_date`
 * are occupied nights). A booking runs from `arrival` to `departure`, but the
 * departure day is a checkout — the guest does not sleep that night — so the
 * range a booking occupies is `[arrival, departure - 1]`. Using that as the
 * stored/held range keeps the checkout day free for the next arrival (so
 * back-to-back, same-day turnovers are allowed) while the DB exclusion
 * constraint still blocks any genuine overlap.
 */

/** Add (or subtract) whole days to a `YYYY-MM-DD` string, UTC-safe. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The last occupied night of a stay, i.e. the day before checkout. */
export function lastNightISO(departure: string): string {
  return addDaysISO(departure, -1);
}

type DayRange = { start: string; end: string };

/** The parts of `r` not covered by any of `blockers` (all inclusive ranges). */
export function subtractRanges(r: DayRange, blockers: DayRange[]): DayRange[] {
  let pieces = [r];
  for (const b of blockers) {
    const next: DayRange[] = [];
    for (const p of pieces) {
      if (!(p.start <= b.end && b.start <= p.end)) {
        next.push(p);
        continue;
      }
      if (p.start < b.start) next.push({ start: p.start, end: addDaysISO(b.start, -1) });
      if (p.end > b.end) next.push({ start: addDaysISO(b.end, 1), end: p.end });
    }
    pieces = next;
  }
  return pieces;
}
