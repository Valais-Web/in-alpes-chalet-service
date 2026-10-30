/**
 * Owner booking-request state machine.
 *
 * The admin can move a request between statuses; this decides which moves are
 * legal and which calendar mutation each implies. It is the single source of
 * truth for what a transition is allowed to do, so
 * the request status can never disagree with the calendar (e.g. a request that
 * reads `declined` while still holding a `booked` range).
 *
 * Calendar ops, all scoped to the request's OWN availability rows
 * (availability.booking_request_id), never by date overlap — so acting on one
 * request never disturbs another guest's overlapping soft hold (CLAUDE.md §5).
 * Both ops are idempotent and depend only on the TARGET state, because the
 * current status can't tell what the calendar holds (`archived` hides whether
 * the stay was confirmed):
 *   - book   → replace this request's hold and/or booked range with one firm
 *              `booked` range (re-confirming repairs, never duplicates)
 *   - unbook → remove this request's `booked` range and any hold it still owns
 *   - none   → status change only, calendar untouched
 */
import type { BookingStatus } from "./types";

export type CalendarOp = "book" | "unbook" | "none";

/**
 * Resolve an owner's status change into the calendar op it implies. Returns
 * null for an illegal transition (which the boundary rejects with 400).
 */
export function resolveDecision(from: BookingStatus, to: BookingStatus): { op: CalendarOp } | null {
  // Accepting always (re)lays the firm range; the DB exclusion constraint
  // rejects an overlap with another confirmed range.
  if (to === "accepted") return { op: "book" };
  // Declining always frees whatever this request still holds — whether it was
  // pending, accepted, or archived after either.
  if (to === "declined") return { op: "unbook" };
  // Archiving only files the request; it never touches the calendar. An
  // archived confirmed stay keeps its booked range; an abandoned soft hold
  // simply expires (CLAUDE.md §5).
  if (to === "archived") return { op: "none" };
  // No UI path moves a request back to `pending`; reject it explicitly.
  return from === "pending" ? { op: "none" } : null;
}
