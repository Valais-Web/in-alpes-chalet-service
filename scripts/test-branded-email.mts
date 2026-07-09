import { sendBookingEmails, sendContactEmail } from "../netlify/lib/email.ts";
await sendBookingEmails({
  booking: {
    id: "x",
    apartmentId: "apt-01",
    arrival: "2026-08-01",
    departure: "2026-08-08",
    guests: 4,
    name: "Sophie Martin",
    email: "info@in-alpes.ch",
    phone: "+41 79 123 45 67",
    message: "Bonjour, nous serions ravis de séjourner chez vous pour la semaine.",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  apartmentName: "Chalet Arolle — Vue Plaine du Rhône",
  locale: "fr",
});
await sendContactEmail({
  name: "Jean Dupont",
  email: "info@in-alpes.ch",
  phone: "+41 77 000 00 00",
  message: "Bonjour,\nAvez-vous des disponibilités en décembre ?\nMerci.",
});
console.log("branded test emails sent (owner+guest booking, contact)");
