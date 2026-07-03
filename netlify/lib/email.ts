/**
 * Transactional email via Resend. Two messages per booking request:
 *   1. owner notification (new request to handle)
 *   2. guest acknowledgement — explicitly a REQUEST, not a confirmation
 *      (CLAUDE.md §13: "toujours l'indiquer clairement à l'utilisateur").
 *
 * Without RESEND_API_KEY the emails are logged to the console instead of sent,
 * so the booking flow works end-to-end in local dev.
 */
import { Resend } from "resend";
import { env, flags } from "./env";
import type { BookingRequest, Locale } from "./types";

interface Params {
  booking: BookingRequest;
  apartmentName: string;
  locale?: Locale;
}

const GUEST_SUBJECT: Record<Locale, string> = {
  fr: "Nous avons bien reçu votre demande — In-Alpes",
  en: "We received your request — In-Alpes",
  nl: "We hebben uw aanvraag ontvangen — In-Alpes",
};

const GUEST_INTRO: Record<Locale, string> = {
  fr: "Merci pour votre intérêt. Ceci est une <strong>demande de réservation</strong>, pas encore une confirmation. Nous revenons vers vous très vite avec les détails et notre offre.",
  en: "Thank you for your interest. This is a <strong>booking request</strong>, not yet a confirmation. We will get back to you shortly with details and our offer.",
  nl: "Bedankt voor uw interesse. Dit is een <strong>reserveringsaanvraag</strong>, nog geen bevestiging. We nemen snel contact met u op met details en ons aanbod.",
};

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

function detailsHtml(b: BookingRequest, apartmentName: string): string {
  return `
    <ul style="line-height:1.6">
      <li><strong>Logement :</strong> ${esc(apartmentName)}</li>
      <li><strong>Arrivée :</strong> ${esc(b.arrival)}</li>
      <li><strong>Départ :</strong> ${esc(b.departure)}</li>
      <li><strong>Voyageurs :</strong> ${b.guests}</li>
      <li><strong>Nom :</strong> ${esc(b.name)}</li>
      <li><strong>Email :</strong> ${esc(b.email)}</li>
      <li><strong>Téléphone :</strong> ${esc(b.phone)}</li>
      ${b.message ? `<li><strong>Message :</strong> ${esc(b.message)}</li>` : ""}
    </ul>`;
}

export async function sendBookingEmails({
  booking,
  apartmentName,
  locale = "fr",
}: Params): Promise<void> {
  const ownerHtml = `
    <h2>Nouvelle demande de réservation</h2>
    ${detailsHtml(booking, apartmentName)}
    <p><a href="${env.SITE_URL}/admin/requests">Ouvrir dans l'admin</a></p>`;

  const guestHtml = `
    <h2>${esc(apartmentName)}</h2>
    <p>${GUEST_INTRO[locale]}</p>
    ${detailsHtml(booking, apartmentName)}
    <p>In-Alpes Chalet Services — Haute-Nendaz, Valais</p>`;

  if (!flags.hasResend) {
    console.info("[email] (dev, not sent) owner →", env.OWNER_NOTIFICATION_EMAIL, {
      subject: `Nouvelle demande — ${apartmentName}`,
    });
    console.info("[email] (dev, not sent) guest →", booking.email, {
      subject: GUEST_SUBJECT[locale],
    });
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  await Promise.all([
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: env.OWNER_NOTIFICATION_EMAIL,
      replyTo: booking.email,
      subject: `Nouvelle demande — ${apartmentName} (${booking.arrival} → ${booking.departure})`,
      html: ownerHtml,
    }),
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: booking.email,
      subject: GUEST_SUBJECT[locale],
      html: guestHtml,
    }),
  ]);
}
