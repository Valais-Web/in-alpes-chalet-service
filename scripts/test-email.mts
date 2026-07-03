/**
 * One-off: confirm the Resend key works and an email is accepted.
 *   set -a; . ./.env; set +a; npx tsx scripts/test-email.mts
 * Safe to delete. Sends from onboarding@resend.dev (sandbox) to OWNER_NOTIFICATION_EMAIL.
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const to = process.env.OWNER_NOTIFICATION_EMAIL!;

const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM!,
  to,
  subject: "In-Alpes — test d'envoi",
  html: "<p>Test de configuration Resend depuis le backend In-Alpes. ✅</p>",
});

if (error) {
  console.log("❌ Resend error:", JSON.stringify(error));
  process.exit(1);
}
console.log(`✅ Accepted by Resend → ${to}  (id: ${data?.id})`);
