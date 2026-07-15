/**
 * Owner booking-request state machine.
 *
 * The admin can move a request between statuses, but the resulting calendar
 * mutation depends on BOTH the current and target status — not just the target.
 * This is the single source of truth for what a transition is allowed to do, so
 * the request status can never disagree with the calendar (e.g. a request that
 * reads `declined` while still holding a `booked` range).
 *
 * Calendar ops, all scoped to the request's OWN availability rows
 * (availability.booking_request_id), never by date overlap — so acting on one
 * request never disturbs another guest's overlapping soft hold (CLAUDE.md §5):
 *   - book         → drop this request's soft hold, lay its firm `booked` range
 *   - unbook       → remove this request's `booked` (and any leftover hold) range
 *   - release_hold → drop this request's soft hold, leaving the calendar free
 *   - none         → status change only, calendar untouched
 */
import type { BookingStatus } from "./types";

export type CalendarOp = "book" | "unbook" | "release_hold" | "none";

/**
 * Resolve an owner's status change into the calendar op it implies, based on
 * the current AND target status. Returns null for an illegal transition (which
 * the boundary rejects with 400). Same-status requests are idempotent no-ops,
 * so re-confirming an already-accepted request can never double-insert its
 * `booked` range.
 */
export function resolveDecision(from: BookingStatus, to: BookingStatus): { op: CalendarOp } | null {
  if (from === to) return { op: "none" }; // idempotent (also: no double-book)
  // Archiving only files the request; it never touches the calendar. An
  // archived confirmed stay keeps its booked range; an abandoned soft hold
  // simply expires (CLAUDE.md §5).
  if (to === "archived") return { op: "none" };
  // Accepting (fresh confirm, or reopening a declined/archived request) lays
  // the firm booked range; the DB exclusion constraint rejects an overlap.
  if (to === "accepted") return { op: "book" };
  // Declining an accepted request must REVERSE its confirmed booking; declining
  // anything else just frees the soft hold it may still own.
  if (to === "declined") return { op: from === "accepted" ? "unbook" : "release_hold" };
  // No UI path moves a request back to `pending`; reject it explicitly.
  return null;
}
