/**
 * Transactional email via Resend, with a branded HTML template (fir-green
 * header + logo, styled detail table, footer with company info). Two messages
 * per booking request:
 *   1. owner notification (new request to handle)
 *   2. guest acknowledgement — explicitly a REQUEST, not a confirmation
 *      (CLAUDE.md §13), localised to the guest's language.
 *
 * Without RESEND_API_KEY the emails are logged to the console instead of sent,
 * so the booking flow works end-to-end in local dev.
 *
 * Email HTML is deliberately table-based with inline styles (no external CSS,
 * no web fonts) for broad client compatibility; branding comes from colour +
 * layout + the hosted logo.
 */
import { Resend } from "resend";
import { env, flags } from "./env";
import type { BookingRequest, Locale } from "./types";

// --- brand tokens (mirrors src/styles.css) ---------------------------------
const C = {
  green: "#2F6B4F",
  ink: "#141414",
  muted: "#6B6B6B",
  border: "#E4E4E2",
  soft: "#F5F5F4",
  tint: "#E7F1EC",
  white: "#FFFFFF",
};
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
// Hosted on Cloudinary so it renders regardless of the site's current domain.
const LOGO =
  "https://res.cloudinary.com/crxvfdmr/image/upload/h_96,c_fit/in-alpes/brand/logo-white.png";

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

// The company inbox always receives owner-facing notifications (booking requests
// + contact messages), on top of any custom OWNER_NOTIFICATION_EMAIL. Deduped so
// it isn't sent twice when they're the same address.
const BUSINESS_INBOX = "info@in-alpes.ch";
function ownerRecipients(): string[] {
  return Array.from(new Set([env.OWNER_NOTIFICATION_EMAIL, BUSINESS_INBOX].filter(Boolean)));
}

// --- reusable building blocks ----------------------------------------------

function layout(heading: string, content: string): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.soft};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.soft};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.white};border:1px solid ${C.border};">
        <tr><td align="center" bgcolor="${C.green}" style="background:${C.green};padding:26px 32px;">
          <img src="${LOGO}" width="44" height="44" alt="In-Alpes" style="display:block;border:0;margin:0 auto 8px;">
          <div style="color:${C.white};font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">In-Alpes Chalet Services</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 18px;color:${C.ink};font-family:${FONT};font-size:20px;font-weight:700;line-height:1.3;">${heading}</h1>
          ${content}
        </td></tr>
        <tr><td style="padding:22px 32px;background:${C.soft};border-top:1px solid ${C.border};font-family:${FONT};font-size:12px;line-height:1.7;color:${C.muted};">
          <strong style="color:${C.ink};">In-Alpes Chalet Services Sàrl</strong><br>
          Chemin de Sofleu 31, 1997 Haute-Nendaz (Valais), Suisse<br>
          +41 77 511 59 09 &middot; <a href="mailto:info@in-alpes.ch" style="color:${C.green};text-decoration:none;">info@in-alpes.ch</a> &middot; <a href="${env.SITE_URL}" style="color:${C.green};text-decoration:none;">in-alpes.ch</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function p(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:1.65;color:${C.ink};">${html}</p>`;
}

function sectionTitle(label: string): string {
  return `<div style="margin:22px 0 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.green};">${label}</div>`;
}

function detailsTable(rows: [string, string][]): string {
  const cells = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:11px 14px;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:13px;color:${C.muted};white-space:nowrap;vertical-align:top;">${k}</td>
          <td style="padding:11px 14px;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:13px;color:${C.ink};font-weight:600;">${v}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-collapse:collapse;">${cells}</table>`;
}

function notice(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;"><tr>
    <td style="background:${C.tint};border-left:3px solid ${C.green};padding:14px 16px;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.ink};">${html}</td>
  </tr></table>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr>
    <td bgcolor="${C.green}" style="background:${C.green};"><a href="${href}" style="display:inline-block;padding:12px 26px;color:${C.white};font-family:${FONT};font-size:14px;font-weight:600;text-decoration:none;">${label}</a></td>
  </tr></table>`;
}

// --- localised guest content ------------------------------------------------

interface GuestStrings {
  subject: string;
  heading: string;
  hello: (name: string) => string;
  intro: string;
  detailsTitle: string;
  labels: {
    apartment: string;
    arrival: string;
    departure: string;
    guests: string;
    message: string;
  };
  help: string;
}

const GUEST: Record<Locale, GuestStrings> = {
  fr: {
    subject: "Nous avons bien reçu votre demande — In-Alpes",
    heading: "Nous avons bien reçu votre demande",
    hello: (n) => `Bonjour ${esc(n)},`,
    intro:
      "Merci pour votre intérêt ! Il s'agit d'une <strong>demande de réservation</strong>, pas encore d'une confirmation. Nous revenons vers vous très vite avec les détails et notre offre.",
    detailsTitle: "Récapitulatif de votre demande",
    labels: {
      apartment: "Logement",
      arrival: "Arrivée",
      departure: "Départ",
      guests: "Voyageurs",
      message: "Votre message",
    },
    help: "Une question ? Répondez simplement à cet email ou appelez-nous au +41 77 511 59 09.",
  },
  en: {
    subject: "We received your request — In-Alpes",
    heading: "We received your request",
    hello: (n) => `Hello ${esc(n)},`,
    intro:
      "Thank you for your interest! This is a <strong>booking request</strong>, not yet a confirmation. We will get back to you very soon with details and our offer.",
    detailsTitle: "Summary of your request",
    labels: {
      apartment: "Apartment",
      arrival: "Arrival",
      departure: "Departure",
      guests: "Guests",
      message: "Your message",
    },
    help: "Any questions? Just reply to this email or call us at +41 77 511 59 09.",
  },
  nl: {
    subject: "We hebben uw aanvraag ontvangen — In-Alpes",
    heading: "We hebben uw aanvraag ontvangen",
    hello: (n) => `Beste ${esc(n)},`,
    intro:
      "Bedankt voor uw interesse! Dit is een <strong>reserveringsaanvraag</strong>, nog geen bevestiging. We nemen zeer binnenkort contact met u op met details en ons aanbod.",
    detailsTitle: "Overzicht van uw aanvraag",
    labels: {
      apartment: "Woning",
      arrival: "Aankomst",
      departure: "Vertrek",
      guests: "Gasten",
      message: "Uw bericht",
    },
    help: "Vragen? Beantwoord gewoon deze e-mail of bel ons op +41 77 511 59 09.",
  },
};

// --- senders ----------------------------------------------------------------

interface Params {
  booking: BookingRequest;
  apartmentName: string;
  locale?: Locale;
}

export async function sendBookingEmails({
  booking,
  apartmentName,
  locale = "fr",
}: Params): Promise<void> {
  const g = GUEST[locale];

  const guestHtml = layout(
    g.heading,
    p(g.hello(booking.name)) +
      notice(g.intro) +
      sectionTitle(g.detailsTitle) +
      detailsTable([
        [g.labels.apartment, esc(apartmentName)],
        [g.labels.arrival, esc(booking.arrival)],
        [g.labels.departure, esc(booking.departure)],
        [g.labels.guests, String(booking.guests)],
        [g.labels.message, booking.message ? esc(booking.message) : ""],
      ]) +
      p(g.help),
  );

  const ownerHtml = layout(
    "Nouvelle demande de réservation",
    p(`Une nouvelle demande vient d'arriver pour <strong>${esc(apartmentName)}</strong>.`) +
      detailsTable([
        ["Logement", esc(apartmentName)],
        ["Arrivée", esc(booking.arrival)],
        ["Départ", esc(booking.departure)],
        ["Voyageurs", String(booking.guests)],
        ["Nom", esc(booking.name)],
        ["Email", esc(booking.email)],
        ["Téléphone", esc(booking.phone)],
        ["Message", booking.message ? esc(booking.message) : ""],
      ]) +
      button("Ouvrir dans l'admin", `${env.SITE_URL}/admin/requests`),
  );

  if (!flags.hasResend) {
    console.info("[email] (dev, not sent) owner →", ownerRecipients(), {
      subject: `Nouvelle demande — ${apartmentName}`,
    });
    console.info("[email] (dev, not sent) guest →", booking.email, { subject: g.subject });
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  await Promise.all([
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: ownerRecipients(),
      replyTo: booking.email,
      subject: `Nouvelle demande — ${apartmentName} (${booking.arrival} → ${booking.departure})`,
      html: ownerHtml,
    }),
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: booking.email,
      subject: g.subject,
      html: guestHtml,
    }),
  ]);
}

export interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

/** Contact-page message → owner inbox (reply-to the sender). */
export async function sendContactEmail(input: ContactMessage): Promise<void> {
  const html = layout(
    "Nouveau message de contact",
    p("Un nouveau message a été envoyé depuis le formulaire de contact du site.") +
      detailsTable([
        ["Nom", esc(input.name)],
        ["Email", esc(input.email)],
        ["Téléphone", input.phone ? esc(input.phone) : ""],
        ["Message", esc(input.message).replace(/\n/g, "<br>")],
      ]),
  );

  if (!flags.hasResend) {
    console.info("[email] (dev, not sent) contact →", ownerRecipients(), {
      from: input.email,
    });
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: ownerRecipients(),
    replyTo: input.email,
    subject: `Nouveau message de contact — ${input.name}`,
    html,
  });
}
