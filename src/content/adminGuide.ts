/**
 * Owner's guide shown in the admin ("Aide" tab, /admin/guide). Prose, so kept
 * out of the i18n UI dictionary like legal.ts. Keep it in step with the real
 * behaviour: delays come from calendar-sync.ts (every 30 min),
 * PREBOOKING_TTL_HOURS (48h), the session (12h) and RETENTION_MONTHS (12).
 */
import type { Locale } from "@/data/types";

export interface GuideSection {
  id: string;
  title: string;
  intro?: string;
  /** Numbered steps. */
  steps?: string[];
  /** Bullet points, as [label, text] (label shown in bold) or plain text. */
  points?: (string | [string, string])[];
  /** Highlighted advice at the end of the section. */
  note?: string;
}

export interface AdminGuide {
  title: string;
  lead: string;
  contents: string;
  delaysTitle: string;
  delays: [string, string][];
  sections: GuideSection[];
}

export const adminGuide: Record<Locale, AdminGuide> = {
  fr: {
    title: "Aide & mode d'emploi",
    lead: "Tout ce qu'il faut savoir pour gérer le site au quotidien : les demandes, la synchronisation avec Airbnb, le calendrier et les logements.",
    contents: "Sommaire",
    delaysTitle: "Les délais en un coup d'œil",
    delays: [
      ["Réservation Airbnb → calendrier du site", "30 minutes au plus"],
      ["Confirmation ou blocage sur le site → Airbnb", "environ 2 à 3 heures (rythme d'Airbnb)"],
      ["Pré-réservation d'une demande du site", "48 heures, puis elle disparaît seule"],
      ["Modification d'un logement → site public", "en général moins d'une minute"],
      ["Connexion à l'admin", "12 heures, puis il faut se reconnecter"],
      ["Données personnelles des voyageurs", "anonymisées 12 mois après le départ"],
    ],
    sections: [
      {
        id: "principes",
        title: "Comment fonctionne le site",
        points: [
          [
            "Une demande, pas une réservation",
            "Le formulaire du site envoie une demande de réservation. Rien n'est confirmé ni payé en ligne : c'est vous qui répondez, envoyez l'offre et confirmez.",
          ],
          [
            "Deux emails à chaque demande",
            "Vous recevez la demande sur info@in-alpes.ch, et le voyageur reçoit un accusé de réception qui précise que sa demande n'est pas encore confirmée.",
          ],
          [
            "Le site n'envoie pas d'autre email au voyageur",
            "Confirmer ou refuser dans l'admin met seulement le calendrier à jour. La réponse au voyageur (offre, paiement, confirmation) se fait par vous, par email ou téléphone.",
          ],
          [
            "Messages du formulaire de contact",
            "Ils arrivent sur info@in-alpes.ch et n'apparaissent pas dans l'admin.",
          ],
        ],
      },
      {
        id: "demandes",
        title: "Traiter une demande de réservation",
        intro:
          "Quand un voyageur envoie une demande, ses dates passent en « Pré-réservé » pendant 48 heures. Le compteur vert de l'onglet Demandes indique les demandes en attente.",
        steps: [
          "Ouvrez Demandes et cliquez sur le nom du voyageur pour voir le logement, le téléphone et son message.",
          "Vérifiez que les dates sont libres, aussi sur Airbnb : une réservation Airbnb faite dans la dernière demi-heure n'est peut-être pas encore sur le site.",
          "Répondez au voyageur par email avec les détails et l'offre (prix, -10 % dès 7 nuits, conditions de paiement).",
          "Une fois le paiement reçu, cliquez sur « Confirmer ». Les dates passent en « Occupé » sur le site et partent vers Airbnb.",
          "Si le séjour ne se fait pas, cliquez sur « Décliner » : les dates redeviennent libres. Prévenez le voyageur vous-même.",
          "« Archiver » range une demande traitée sans toucher au calendrier : un séjour confirmé reste réservé.",
        ],
        note: "Sans réponse de votre part, la pré-réservation tombe d'elle-même après 48 heures et les dates redeviennent libres. Si le voyageur a besoin de plus de temps, confirmez dès que c'est sûr ou bloquez les dates à la main. Les pré-réservations ne sont pas envoyées à Airbnb : tant que la demande n'est pas confirmée, Airbnb peut encore vendre ces dates.",
      },
      {
        id: "synchro",
        title: "La synchronisation avec Airbnb",
        intro:
          "Airbnb ne propose pas d'API aux particuliers ; les deux calendriers s'échangent donc leurs dates par des liens de calendrier (.ics), dans les deux sens.",
        points: [
          [
            "Airbnb → site",
            "Toutes les 30 minutes, le site relit le calendrier Airbnb. Les réservations Airbnb apparaissent en « Occupé », les dates bloquées sur Airbnb en « Bloqué ». Elles portent la mention Airbnb et ne se modifient que sur Airbnb.",
          ],
          [
            "Site → Airbnb",
            "Airbnb relit le calendrier du site environ toutes les 2 à 3 heures (Airbnb décide, on ne peut pas l'accélérer). Il reçoit les séjours confirmés et les blocages faits dans l'admin, jamais les pré-réservations.",
          ],
          [
            "« Synchroniser maintenant »",
            "Relit tout de suite le calendrier Airbnb (utile juste après une réservation Airbnb). Il ne peut pas forcer Airbnb à relire le site.",
          ],
        ],
      },
      {
        id: "synchro-setup",
        title: "Connecter un logement à Airbnb",
        intro:
          "À faire une seule fois par logement, dans Disponibilités, encadré « Synchronisation Airbnb ».",
        steps: [
          "Sur Airbnb : Calendrier → Disponibilités → Connecter des calendriers → Connecter à un autre site web.",
          "Copiez le « Lien Airbnb » (il se termine par .ics) et collez-le dans le champ 1 de l'admin, puis « Enregistrer ».",
          "Dans l'admin, copiez le lien du champ 2 (le calendrier du site).",
          "Sur la même page Airbnb, collez-le comme calendrier à importer et nommez-le « In-Alpes ».",
          "Cliquez sur « Synchroniser maintenant » et vérifiez que les réservations Airbnb apparaissent dans le calendrier.",
        ],
        note: "Si Airbnb régénère le lien de votre calendrier, collez le nouveau lien dans le champ 1. « Désactiver » coupe la synchronisation et retire les dates Airbnb du site.",
      },
      {
        id: "cas",
        title: "Cas de figure",
        points: [
          [
            "Réservation sur Airbnb",
            "Rien à faire sur le site : les dates s'y bloquent seules en 30 minutes au plus.",
          ],
          [
            "Demande reçue par le site",
            "Suivez « Traiter une demande ». Après confirmation, Airbnb reçoit les dates dans les 2 à 3 heures. Pour un séjour proche ou en haute saison, bloquez aussi les dates directement sur Airbnb pour fermer ce délai.",
          ],
          [
            "Réservation par téléphone ou email",
            "Dans Disponibilités, sélectionnez les dates et choisissez « Occupé ». Elles partent vers Airbnb comme une confirmation.",
          ],
          [
            "Logement indisponible (travaux, usage personnel)",
            "Sélectionnez les dates et choisissez « Bloqué ». Pour libérer, sélectionnez-les à nouveau et choisissez « Libre », ou supprimez la plage.",
          ],
          [
            "Double réservation possible",
            "Si Airbnb vend des dates qui ont déjà une demande ou une réservation du site, vous recevez un email d'alerte et l'encadré Airbnb affiche les dates concernées. Contactez l'un des deux voyageurs pour trouver une solution, puis déclinez la demande ou annulez sur Airbnb.",
          ],
          [
            "« Confirmer » refusé",
            "Les dates sont déjà prises (souvent par une réservation Airbnb). Vérifiez sur Airbnb avant de répondre au voyageur.",
          ],
          [
            "Erreur dans l'encadré Airbnb",
            "Une erreur de temps en temps se corrige toute seule au passage suivant. Si elle reste plusieurs heures, vérifiez le lien Airbnb (champ 1).",
          ],
        ],
      },
      {
        id: "calendrier",
        title: "Les statuts du calendrier",
        points: [
          [
            "Libre",
            "Réservable. Sur une plage existante, « Libre » efface la partie sélectionnée.",
          ],
          [
            "Pré-réservé",
            "Une demande en attente (48 h). Visible des voyageurs, qui peuvent encore faire une demande sur ces dates, avec un avertissement. Pas envoyé à Airbnb.",
          ],
          ["Occupé", "Séjour confirmé. Bloque le site et part vers Airbnb."],
          ["Bloqué", "Indisponible pour une autre raison. Bloque le site et part vers Airbnb."],
        ],
        note: "Les plages liées à une demande (lien « Demande ») se gèrent depuis Demandes, avec Confirmer ou Décliner, et celles venues d'Airbnb depuis Airbnb : elles ne se suppriment pas dans Disponibilités.",
      },
      {
        id: "logements",
        title: "Ajouter ou modifier un logement",
        steps: [
          "Logements → « Ajouter un logement ».",
          "Le plus rapide : collez le lien de l'annonce Airbnb dans « Importer depuis Airbnb ». Titre, textes en FR/EN/NL, caractéristiques et photos sont repris. Relisez tout, surtout les champs listés sous « À vérifier ».",
          "Complétez les textes dans les trois langues (français, anglais, néerlandais), le prix par nuit en CHF, le nombre de voyageurs, les horaires d'arrivée et de départ et les règles.",
          "Photos : la première est la photo de couverture ; les flèches changent l'ordre. Photos en JPG ou PNG.",
          "L'identifiant URL (slug) devient l'adresse de la page, par exemple in-alpes.ch/apartments/studio-in-alpes. Évitez de le changer ensuite : les anciens liens ne marcheraient plus.",
          "Enregistrez : le site public est à jour en général en moins d'une minute.",
          "Pour un nouveau logement, connectez ensuite son calendrier Airbnb (voir plus haut).",
        ],
        note: "Un logement qui a déjà des demandes ne peut pas être supprimé. Le bouton « Ouvrir dans Google Maps » d'une page logement utilise la latitude et la longitude ; pour pointer vers une fiche Google Maps précise, demandez au développeur.",
      },
      {
        id: "divers",
        title: "Bon à savoir",
        points: [
          [
            "Connexion",
            "La session dure 12 heures. Si une page de l'admin paraît vide, reconnectez-vous.",
          ],
          [
            "Données personnelles",
            "Le nom, l'email, le téléphone et le message des voyageurs sont anonymisés 12 mois après leur départ (loi suisse sur la protection des données).",
          ],
          [
            "Si le site ne répond pas",
            "Le site public continue d'afficher les dernières informations publiées même en cas de panne de la base de données. Seuls l'envoi de nouvelles demandes et les modifications dans l'admin peuvent échouer : réessayez quelques minutes plus tard.",
          ],
          [
            "Un problème persistant",
            "Notez ce que vous faisiez, à quelle heure et le message affiché, et transmettez-le au développeur.",
          ],
        ],
      },
    ],
  },

  en: {
    title: "Help & how-to",
    lead: "Everything you need to run the site day to day: requests, the Airbnb sync, the calendar and the rentals.",
    contents: "Contents",
    delaysTitle: "Timings at a glance",
    delays: [
      ["Airbnb booking → site calendar", "30 minutes at most"],
      ["Confirmation or block on the site → Airbnb", "about 2–3 hours (Airbnb's pace)"],
      ["Hold from a site request", "48 hours, then it lapses on its own"],
      ["Rental edit → public site", "usually under a minute"],
      ["Admin login", "12 hours, then log in again"],
      ["Guests' personal data", "anonymised 12 months after departure"],
    ],
    sections: [
      {
        id: "principes",
        title: "How the site works",
        points: [
          [
            "A request, not a booking",
            "The site's form sends a booking request. Nothing is confirmed or paid online: you reply, send the offer and confirm.",
          ],
          [
            "Two emails per request",
            "You receive the request at info@in-alpes.ch, and the guest gets an acknowledgement stating the request is not confirmed yet.",
          ],
          [
            "The site sends the guest nothing else",
            "Confirming or declining in the admin only updates the calendar. You reply to the guest yourself (offer, payment, confirmation) by email or phone.",
          ],
          ["Contact form messages", "They go to info@in-alpes.ch and don't appear in the admin."],
        ],
      },
      {
        id: "demandes",
        title: "Handling a booking request",
        intro:
          'When a guest sends a request, the dates are shown as "Pre-booked" for 48 hours. The green counter on the Requests tab shows pending requests.',
        steps: [
          "Open Requests and click the guest's name to see the rental, phone number and message.",
          "Check the dates are free, on Airbnb too: an Airbnb booking from the last half hour may not be on the site yet.",
          "Email the guest the details and the offer (price, 10% off from 7 nights, payment terms).",
          'Once payment is in, click "Confirm". The dates become "Booked" on the site and are sent to Airbnb.',
          'If the stay won\'t happen, click "Decline": the dates are freed. Let the guest know yourself.',
          '"Archive" files a handled request without touching the calendar: a confirmed stay stays booked.',
        ],
        note: "If you don't respond, the hold lapses after 48 hours and the dates are free again. If the guest needs more time, confirm as soon as it's certain or block the dates by hand. Holds are not sent to Airbnb: until the request is confirmed, Airbnb can still sell those dates.",
      },
      {
        id: "synchro",
        title: "The Airbnb sync",
        intro:
          "Airbnb has no API for individual hosts, so the two calendars exchange dates through calendar links (.ics), both ways.",
        points: [
          [
            "Airbnb → site",
            'Every 30 minutes the site reads the Airbnb calendar. Airbnb bookings show as "Booked", dates blocked on Airbnb as "Blocked". They are marked Airbnb and can only be changed on Airbnb.',
          ],
          [
            "Site → Airbnb",
            "Airbnb reads the site's calendar about every 2–3 hours (Airbnb decides; it can't be sped up). It receives confirmed stays and blocks made in the admin, never holds.",
          ],
          [
            '"Sync now"',
            "Reads the Airbnb calendar immediately (handy right after an Airbnb booking). It can't make Airbnb read the site sooner.",
          ],
        ],
      },
      {
        id: "synchro-setup",
        title: "Connecting a rental to Airbnb",
        intro: 'Once per rental, in Availability, "Airbnb sync" panel.',
        steps: [
          "On Airbnb: Calendar → Availability → Connect calendars → Connect to another website.",
          'Copy the "Airbnb link" (ending in .ics), paste it into field 1 in the admin, then "Save".',
          "In the admin, copy the link in field 2 (the site's calendar).",
          'On the same Airbnb page, paste it as a calendar to import and name it "In-Alpes".',
          'Click "Sync now" and check the Airbnb bookings appear in the calendar.',
        ],
        note: 'If Airbnb regenerates your calendar link, paste the new one into field 1. "Turn off" stops the sync and removes the Airbnb dates from the site.',
      },
      {
        id: "cas",
        title: "Common situations",
        points: [
          [
            "Booking on Airbnb",
            "Nothing to do on the site: the dates block themselves within 30 minutes.",
          ],
          [
            "Request through the site",
            'Follow "Handling a booking request". After confirmation, Airbnb gets the dates within 2–3 hours. For a stay coming up soon or in high season, also block the dates directly on Airbnb to close that gap.',
          ],
          [
            "Booking by phone or email",
            'In Availability, select the dates and choose "Booked". They go to Airbnb like a confirmation.',
          ],
          [
            "Rental unavailable (works, personal use)",
            'Select the dates and choose "Blocked". To free them, select them again and choose "Free", or delete the range.',
          ],
          [
            "Possible double booking",
            "If Airbnb sells dates that already have a request or booking from the site, you get an alert email and the Airbnb panel lists the dates. Contact one of the two guests to sort it out, then decline the request or cancel on Airbnb.",
          ],
          [
            '"Confirm" refused',
            "The dates are already taken (usually by an Airbnb booking). Check Airbnb before replying to the guest.",
          ],
          [
            "Error in the Airbnb panel",
            "An occasional error clears itself on the next run. If it stays for several hours, check the Airbnb link (field 1).",
          ],
        ],
      },
      {
        id: "calendrier",
        title: "Calendar statuses",
        points: [
          ["Free", 'Bookable. Over an existing range, "Free" clears the selected part.'],
          [
            "Pre-booked",
            "A pending request (48 h). Visible to guests, who can still request those dates, with a warning. Not sent to Airbnb.",
          ],
          ["Booked", "Confirmed stay. Blocks the site and goes to Airbnb."],
          ["Blocked", "Unavailable for another reason. Blocks the site and goes to Airbnb."],
        ],
        note: 'Ranges tied to a request ("Request" link) are handled from Requests with Confirm or Decline, and those from Airbnb on Airbnb: they can\'t be deleted in Availability.',
      },
      {
        id: "logements",
        title: "Adding or editing a rental",
        steps: [
          'Rentals → "Add rental".',
          'Fastest: paste the Airbnb listing link into "Import from Airbnb". Title, FR/EN/NL texts, details and photos are copied. Proofread everything, especially the fields listed under "Please check".',
          "Complete the texts in all three languages (French, English, Dutch), the nightly price in CHF, the number of guests, check-in/check-out times and the rules.",
          "Photos: the first one is the cover; the arrows change the order. JPG or PNG.",
          "The URL identifier (slug) becomes the page address, e.g. in-alpes.ch/apartments/studio-in-alpes. Avoid changing it later: old links would stop working.",
          "Save: the public site is usually updated within a minute.",
          "For a new rental, then connect its Airbnb calendar (see above).",
        ],
        note: 'A rental that already has requests can\'t be deleted. The "Open in Google Maps" button on a rental page uses the latitude and longitude; to point it at a specific Google Maps place, ask the developer.',
      },
      {
        id: "divers",
        title: "Good to know",
        points: [
          ["Login", "The session lasts 12 hours. If an admin page looks empty, log in again."],
          [
            "Personal data",
            "Guests' name, email, phone and message are anonymised 12 months after departure (Swiss data protection law).",
          ],
          [
            "If the site is unresponsive",
            "The public site keeps showing the last published information even if the database is down. Only new requests and admin changes can fail: try again a few minutes later.",
          ],
          [
            "A persistent problem",
            "Note what you were doing, the time and the message shown, and pass it on to the developer.",
          ],
        ],
      },
    ],
  },

  nl: {
    title: "Hulp & handleiding",
    lead: "Alles wat u nodig hebt om de site dagelijks te beheren: aanvragen, de synchronisatie met Airbnb, de kalender en de woningen.",
    contents: "Inhoud",
    delaysTitle: "Termijnen in één oogopslag",
    delays: [
      ["Airbnb-boeking → kalender van de site", "hoogstens 30 minuten"],
      ["Bevestiging of blokkering op de site → Airbnb", "ongeveer 2 à 3 uur (tempo van Airbnb)"],
      ["Voorlopige reservering van een aanvraag", "48 uur, daarna vervalt ze vanzelf"],
      ["Wijziging van een woning → publieke site", "meestal binnen een minuut"],
      ["Aanmelding in de admin", "12 uur, daarna opnieuw aanmelden"],
      ["Persoonsgegevens van gasten", "geanonimiseerd 12 maanden na vertrek"],
    ],
    sections: [
      {
        id: "principes",
        title: "Hoe de site werkt",
        points: [
          [
            "Een aanvraag, geen boeking",
            "Het formulier op de site verstuurt een boekingsaanvraag. Er wordt online niets bevestigd of betaald: u antwoordt, stuurt de offerte en bevestigt.",
          ],
          [
            "Twee e-mails per aanvraag",
            "U ontvangt de aanvraag op info@in-alpes.ch en de gast krijgt een ontvangstbevestiging waarin staat dat de aanvraag nog niet bevestigd is.",
          ],
          [
            "De site stuurt de gast verder niets",
            "Bevestigen of weigeren in de admin werkt alleen de kalender bij. U antwoordt de gast zelf (offerte, betaling, bevestiging) per e-mail of telefoon.",
          ],
          [
            "Berichten via het contactformulier",
            "Die komen binnen op info@in-alpes.ch en verschijnen niet in de admin.",
          ],
        ],
      },
      {
        id: "demandes",
        title: "Een boekingsaanvraag behandelen",
        intro:
          'Wanneer een gast een aanvraag verstuurt, staan de data 48 uur op "Voorlopig". De groene teller bij Aanvragen toont de openstaande aanvragen.',
        steps: [
          "Open Aanvragen en klik op de naam van de gast om de woning, het telefoonnummer en het bericht te zien.",
          "Controleer of de data vrij zijn, ook op Airbnb: een Airbnb-boeking van het laatste halfuur staat misschien nog niet op de site.",
          "Mail de gast de details en de offerte (prijs, -10% vanaf 7 nachten, betalingsvoorwaarden).",
          'Zodra de betaling binnen is, klikt u op "Bevestigen". De data worden "Bezet" op de site en gaan naar Airbnb.',
          'Gaat het verblijf niet door, klik dan op "Weigeren": de data komen weer vrij. Breng de gast zelf op de hoogte.',
          '"Archiveren" berg een behandelde aanvraag op zonder de kalender te wijzigen: een bevestigd verblijf blijft geboekt.',
        ],
        note: "Zonder reactie van u vervalt de voorlopige reservering na 48 uur en zijn de data weer vrij. Heeft de gast meer tijd nodig, bevestig dan zodra het zeker is of blokkeer de data met de hand. Voorlopige reserveringen gaan niet naar Airbnb: zolang de aanvraag niet bevestigd is, kan Airbnb die data nog verkopen.",
      },
      {
        id: "synchro",
        title: "De synchronisatie met Airbnb",
        intro:
          "Airbnb heeft geen API voor particulieren; de twee kalenders wisselen hun data dus uit via kalenderlinks (.ics), in beide richtingen.",
        points: [
          [
            "Airbnb → site",
            'Elke 30 minuten leest de site de Airbnb-kalender. Airbnb-boekingen verschijnen als "Bezet", op Airbnb geblokkeerde data als "Geblokkeerd". Ze dragen het label Airbnb en kunnen alleen op Airbnb gewijzigd worden.',
          ],
          [
            "Site → Airbnb",
            "Airbnb leest de kalender van de site ongeveer elke 2 à 3 uur (Airbnb beslist, dit kan niet sneller). Het ontvangt bevestigde verblijven en blokkeringen uit de admin, nooit voorlopige reserveringen.",
          ],
          [
            '"Nu synchroniseren"',
            "Leest de Airbnb-kalender meteen (handig vlak na een Airbnb-boeking). Het kan Airbnb niet dwingen de site sneller te lezen.",
          ],
        ],
      },
      {
        id: "synchro-setup",
        title: "Een woning aan Airbnb koppelen",
        intro: 'Eén keer per woning, in Beschikbaarheid, kader "Airbnb-synchronisatie".',
        steps: [
          "Op Airbnb: Kalender → Beschikbaarheid → Agenda's koppelen → Koppelen aan een andere website.",
          'Kopieer de "Airbnb-link" (eindigt op .ics), plak hem in veld 1 van de admin en klik op "Opslaan".',
          "Kopieer in de admin de link in veld 2 (de kalender van de site).",
          'Plak hem op dezelfde Airbnb-pagina als te importeren kalender en noem hem "In-Alpes".',
          'Klik op "Nu synchroniseren" en controleer dat de Airbnb-boekingen in de kalender verschijnen.',
        ],
        note: 'Als Airbnb de link van uw kalender vernieuwt, plak de nieuwe link in veld 1. "Uitschakelen" stopt de synchronisatie en haalt de Airbnb-data van de site.',
      },
      {
        id: "cas",
        title: "Veelvoorkomende situaties",
        points: [
          [
            "Boeking op Airbnb",
            "Niets te doen op de site: de data worden binnen 30 minuten vanzelf geblokkeerd.",
          ],
          [
            "Aanvraag via de site",
            'Volg "Een boekingsaanvraag behandelen". Na bevestiging krijgt Airbnb de data binnen 2 à 3 uur. Voor een verblijf dat er snel aankomt of in het hoogseizoen: blokkeer de data ook rechtstreeks op Airbnb om die termijn te overbruggen.',
          ],
          [
            "Boeking per telefoon of e-mail",
            'Selecteer in Beschikbaarheid de data en kies "Bezet". Ze gaan naar Airbnb zoals een bevestiging.',
          ],
          [
            "Woning niet beschikbaar (werken, eigen gebruik)",
            'Selecteer de data en kies "Geblokkeerd". Om ze vrij te maken: selecteer ze opnieuw en kies "Vrij", of verwijder de periode.',
          ],
          [
            "Mogelijke dubbele boeking",
            "Verkoopt Airbnb data waarvoor al een aanvraag of boeking van de site bestaat, dan krijgt u een waarschuwingsmail en toont het Airbnb-kader de betrokken data. Neem contact op met een van beide gasten om een oplossing te vinden, en weiger dan de aanvraag of annuleer op Airbnb.",
          ],
          [
            '"Bevestigen" geweigerd',
            "De data zijn al bezet (meestal door een Airbnb-boeking). Controleer Airbnb voordat u de gast antwoordt.",
          ],
          [
            "Fout in het Airbnb-kader",
            "Een fout af en toe verdwijnt vanzelf bij de volgende controle. Blijft ze enkele uren staan, controleer dan de Airbnb-link (veld 1).",
          ],
        ],
      },
      {
        id: "calendrier",
        title: "De statussen van de kalender",
        points: [
          ["Vrij", 'Boekbaar. Op een bestaande periode wist "Vrij" het geselecteerde deel.'],
          [
            "Voorlopig",
            "Een openstaande aanvraag (48 u). Zichtbaar voor gasten, die met een waarschuwing nog een aanvraag voor die data kunnen doen. Niet naar Airbnb gestuurd.",
          ],
          ["Bezet", "Bevestigd verblijf. Blokkeert de site en gaat naar Airbnb."],
          [
            "Geblokkeerd",
            "Om een andere reden niet beschikbaar. Blokkeert de site en gaat naar Airbnb.",
          ],
        ],
        note: 'Periodes die aan een aanvraag gekoppeld zijn (link "Aanvraag") beheert u via Aanvragen met Bevestigen of Weigeren, en die van Airbnb op Airbnb: ze kunnen niet verwijderd worden in Beschikbaarheid.',
      },
      {
        id: "logements",
        title: "Een woning toevoegen of wijzigen",
        steps: [
          'Woningen → "Woning toevoegen".',
          'Het snelst: plak de link van de Airbnb-advertentie in "Importeren van Airbnb". Titel, teksten in FR/EN/NL, kenmerken en foto\'s worden overgenomen. Lees alles na, vooral de velden onder "Te controleren".',
          "Vul de teksten aan in de drie talen (Frans, Engels, Nederlands), de prijs per nacht in CHF, het aantal gasten, de aankomst- en vertrektijden en de regels.",
          "Foto's: de eerste is de omslagfoto; met de pijlen wijzigt u de volgorde. JPG of PNG.",
          "De URL-identificatie (slug) wordt het adres van de pagina, bv. in-alpes.ch/apartments/studio-in-alpes. Wijzig die later liever niet: oude links werken dan niet meer.",
          "Opslaan: de publieke site is meestal binnen een minuut bijgewerkt.",
          "Koppel bij een nieuwe woning daarna de Airbnb-kalender (zie hierboven).",
        ],
        note: 'Een woning met aanvragen kan niet verwijderd worden. De knop "Openen in Google Maps" op een woningpagina gebruikt de breedte- en lengtegraad; om naar een specifieke Google Maps-locatie te verwijzen, vraag het aan de ontwikkelaar.',
      },
      {
        id: "divers",
        title: "Goed om te weten",
        points: [
          [
            "Aanmelding",
            "De sessie duurt 12 uur. Lijkt een pagina van de admin leeg, meld u dan opnieuw aan.",
          ],
          [
            "Persoonsgegevens",
            "Naam, e-mail, telefoon en bericht van gasten worden 12 maanden na hun vertrek geanonimiseerd (Zwitserse wet op gegevensbescherming).",
          ],
          [
            "Als de site niet reageert",
            "De publieke site blijft de laatst gepubliceerde informatie tonen, ook als de database uitvalt. Alleen nieuwe aanvragen en wijzigingen in de admin kunnen mislukken: probeer het enkele minuten later opnieuw.",
          ],
          [
            "Een aanhoudend probleem",
            "Noteer wat u deed, het tijdstip en de getoonde melding, en geef dit door aan de ontwikkelaar.",
          ],
        ],
      },
    ],
  },
};
