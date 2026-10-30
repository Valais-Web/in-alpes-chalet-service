/** YYYY-MM-DD from a Date's LOCAL calendar day. Never use toISOString() for
 * this: it converts to UTC first, so local midnight in Switzerland (UTC+1/+2)
 * becomes the previous day. */
export function localISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Today's local calendar day as YYYY-MM-DD. */
export const todayLocalISO = () => localISO(new Date());
