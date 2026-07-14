/**
 * Scheduled retention job (daily). CLAUDE.md §2 permits Netlify Scheduled
 * Functions; this is NOT a keep-alive (it does real work and lets Neon sleep
 * afterwards).
 *
 *   1. Anonymise booking PII (name/email/phone/message) once a stay is older
 *      than RETENTION_MONTHS past its departure — the row is kept for business
 *      records, only the personal data is stripped (nLPD/RGPD).
 *   2. Purge expired pre-reservation holds as a backstop to the lazy,
 *      client-side expiry, and republish availability if anything changed.
 */
import { repo } from "../lib/db";
import { publishAvailability } from "../lib/publish";
import { env, logMode } from "../lib/env";

function cutoffISO(monthsAgo: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  return d.toISOString().slice(0, 10);
}

export default async (): Promise<Response> => {
  logMode();
  const cutoff = cutoffISO(env.RETENTION_MONTHS);

  const anonymized = await repo.anonymizeBookingsBefore(cutoff);
  const purged = await repo.purgeExpiredHolds();
  if (purged > 0) await publishAvailability();

  console.info(
    `[retention] anonymized ${anonymized} booking(s) with departure < ${cutoff}; ` +
      `purged ${purged} expired hold(s)`,
  );
  return new Response("ok");
};

export const config = { schedule: "@daily" };
