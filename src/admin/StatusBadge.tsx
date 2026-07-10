import type { BookingStatus } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Colour-coded booking-status badge (admin only).
 * Red is used here for "declined" by owner request — an intentional exception
 * to the public "no red" branding rule (CLAUDE.md §9).
 */
const STYLES: Record<BookingStatus, string> = {
  pending: "bg-[#FCEFD6] text-[#9A6700]", // amber / orange
  accepted: "bg-accent-tint text-accent", // brand green
  declined: "bg-[#FBE4E4] text-[#B42318]", // red
  archived: "bg-secondary text-muted-foreground", // grey
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {t(`admin.requests.status.${status}`)}
    </span>
  );
}
