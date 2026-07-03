/**
 * One-off: confirm sending from the verified in-alpes.ch domain works, to both
 * the owner address and an arbitrary recipient (proving the sandbox limit is lifted).
 *   set -a; . ./.env; set +a; npx tsx scripts/test-email.mts
 * Safe to delete.
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.EMAIL_FROM!;

async function send(label: string, to: string) {
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `In-Alpes — test (${label})`,
    html: `<p>Test d'envoi depuis le domaine vérifié <strong>in-alpes.ch</strong> (${label}). ✅</p>`,
  });
  if (error) console.log(`❌ ${label} → ${to}:`, JSON.stringify(error));
  else console.log(`✅ ${label} → ${to}  (id: ${data?.id})`);
}

console.log("from:", from);
await send("owner notification", process.env.OWNER_NOTIFICATION_EMAIL!);
await send("guest / arbitrary recipient", "info@in-alpes.ch");
