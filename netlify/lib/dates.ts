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
