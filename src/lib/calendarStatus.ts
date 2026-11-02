import type { AvailabilityRange, AvailabilityStatus } from "../../shared/domain";

/** Expired pre-reservations read as free (computed client-side, CLAUDE.md §5). */
export function effectiveStatus(r: AvailabilityRange): AvailabilityStatus {
  if (r.status === "prebooked" && r.expiresAt && new Date(r.expiresAt) < new Date()) {
    return "free";
  }
  return r.status;
}

export function statusForDate(iso: string, ranges: AvailabilityRange[]): AvailabilityStatus {
  let status: AvailabilityStatus = "free";
  for (const r of ranges) {
    if (iso < r.start || iso > r.end) continue;
    const s = effectiveStatus(r);
    // Soft holds may overlap confirmed bookings and owner blocks.
    if (s === "booked" || s === "blocked") return s;
    if (s === "prebooked") status = s;
  }
  return status;
}
