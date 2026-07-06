/**
 * Long-form legal content, kept out of the i18n UI dictionary because it's
 * prose rather than interface strings. Rendered by the /mentions-legales and
 * /confidentialite routes via LegalPage.
 *
 * ⚠️ Placeholders marked [comme ceci] must be completed by the owner before a
 * real launch: exact postal address, IDE/UID number, publication director.
 */
import type { Locale } from "@/data/types";

export interface LegalDoc {
  title: string;
  updated: string;
  intro?: string;
  sections: { heading: string; paragraphs: string[] }[];
}

export const mentionsLegales: Record<Locale, LegalDoc> = {
  fr: {
    title: "Mentions légales",
    updated: "Dernière mise à jour : juillet 2026",
    sections: [
      {
        heading: "Éditeur du site",
        paragraphs: [
          "In-Alpes Chalet Services Sàrl",
          "Société à responsabilité limitée — capital social : CHF 20'000",
          "Chemin de Sofleu 31, Batterie de la Combe 328, 1997 Haute-Nendaz, Valais, Suisse",
          "Siège : Nendaz (VS)",
          "Téléphone : +41 77 511 59 09",
          "Email : info@in-alpes.ch",
          "N° IDE : CHE-221.566.159",
        ],
      },
      {
        heading: "Directeur de la publication",
        paragraphs: ["Bart Goes, gérant, In-Alpes Chalet Services Sàrl."],
      },
      {
        heading: "Hébergement",
        paragraphs: [
          "Le site est hébergé par Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis (netlify.com).",
          "Les données des voyageurs sont stockées dans l'Union européenne (Francfort, Allemagne) via Neon.",
        ],
      },
      {
        heading: "Propriété intellectuelle",
        paragraphs: [
          "L'ensemble des contenus (textes, images, logo, charte graphique) est la propriété d'In-Alpes Chalet Services Sàrl ou de ses partenaires, sauf mention contraire. Toute reproduction sans autorisation préalable est interdite.",
        ],
      },
      {
        heading: "Responsabilité",
        paragraphs: [
          "Les informations publiées (tarifs, disponibilités, descriptifs) sont fournies à titre indicatif et peuvent être modifiées sans préavis. Une demande de réservation ne constitue pas une confirmation ; celle-ci intervient après échange avec le propriétaire.",
        ],
      },
    ],
  },
  en: {
    title: "Legal notice",
    updated: "Last updated: July 2026",
    sections: [
      {
        heading: "Site publisher",
        paragraphs: [
          "In-Alpes Chalet Services Sàrl",
          "Limited liability company (Sàrl) — share capital: CHF 20,000",
          "Chemin de Sofleu 31, Batterie de la Combe 328, 1997 Haute-Nendaz, Valais, Switzerland",
          "Registered seat: Nendaz (VS)",
          "Phone: +41 77 511 59 09",
          "Email: info@in-alpes.ch",
          "Business ID (UID): CHE-221.566.159",
        ],
      },
      {
        heading: "Publication director",
        paragraphs: ["Bart Goes, manager, In-Alpes Chalet Services Sàrl."],
      },
      {
        heading: "Hosting",
        paragraphs: [
          "The site is hosted by Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, USA (netlify.com).",
          "Guest data is stored in the European Union (Frankfurt, Germany) via Neon.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "All content (text, images, logo, design) is the property of In-Alpes Chalet Services Sàrl or its partners unless stated otherwise. Any reproduction without prior authorisation is prohibited.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "Published information (prices, availability, descriptions) is indicative and may change without notice. A booking request is not a confirmation; confirmation follows an exchange with the owner.",
        ],
      },
    ],
  },
  nl: {
    title: "Wettelijke vermeldingen",
    updated: "Laatst bijgewerkt: juli 2026",
    sections: [
      {
        heading: "Uitgever van de site",
        paragraphs: [
          "In-Alpes Chalet Services Sàrl",
          "Besloten vennootschap (Sàrl) — maatschappelijk kapitaal: CHF 20.000",
          "Chemin de Sofleu 31, Batterie de la Combe 328, 1997 Haute-Nendaz, Wallis, Zwitserland",
          "Zetel: Nendaz (VS)",
          "Telefoon: +41 77 511 59 09",
          "E-mail: info@in-alpes.ch",
          "Ondernemingsnr. (UID): CHE-221.566.159",
        ],
      },
      {
        heading: "Verantwoordelijke uitgever",
        paragraphs: ["Bart Goes, zaakvoerder, In-Alpes Chalet Services Sàrl."],
      },
      {
        heading: "Hosting",
        paragraphs: [
          "De site wordt gehost door Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, VS (netlify.com).",
          "Gegevens van gasten worden opgeslagen in de Europese Unie (Frankfurt, Duitsland) via Neon.",
        ],
      },
      {
        heading: "Intellectuele eigendom",
        paragraphs: [
          "Alle inhoud (teksten, afbeeldingen, logo, vormgeving) is eigendom van In-Alpes Chalet Services Sàrl of haar partners, tenzij anders vermeld. Reproductie zonder voorafgaande toestemming is verboden.",
        ],
      },
      {
        heading: "Aansprakelijkheid",
        paragraphs: [
          "Gepubliceerde informatie (prijzen, beschikbaarheid, beschrijvingen) is indicatief en kan zonder kennisgeving wijzigen. Een aanvraag is geen bevestiging; deze volgt na contact met de eigenaar.",
        ],
      },
    ],
  },
};

export const confidentialite: Record<Locale, LegalDoc> = {
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : juillet 2026",
    intro:
      "In-Alpes Chalet Services Sàrl accorde une grande importance à la protection de vos données personnelles, conformément à la loi fédérale suisse sur la protection des données (nLPD) et au Règlement général sur la protection des données (RGPD).",
    sections: [
      {
        heading: "Responsable du traitement",
        paragraphs: [
          "In-Alpes Chalet Services Sàrl, Chemin de Sofleu 31, 1997 Haute-Nendaz (Valais), Suisse — info@in-alpes.ch.",
        ],
      },
      {
        heading: "Données que nous collectons",
        paragraphs: [
          "Formulaire de demande de réservation : nom, adresse email, téléphone, dates de séjour, nombre de voyageurs et message éventuel.",
          "Formulaire de contact : nom, adresse email, téléphone et message.",
          "Nous ne collectons aucune donnée sensible et n'achetons pas de données auprès de tiers.",
        ],
      },
      {
        heading: "Finalités et base légale",
        paragraphs: [
          "Vos données sont utilisées uniquement pour traiter et suivre votre demande de réservation ou de contact. La base légale est l'exécution de mesures précontractuelles prises à votre demande, ainsi que notre intérêt légitime à répondre à vos sollicitations.",
        ],
      },
      {
        heading: "Destinataires et sous-traitants",
        paragraphs: [
          "Vos données sont traitées par des prestataires agissant pour notre compte : Neon (base de données, hébergée dans l'UE à Francfort), Resend (envoi des emails), et Netlify (hébergement du site). Cloudinary héberge les photos des logements et ne traite pas de données de voyageurs.",
          "Nous ne vendons ni ne louons vos données à des tiers.",
        ],
      },
      {
        heading: "Durée de conservation",
        paragraphs: [
          "Les demandes sont conservées le temps nécessaire au traitement de votre séjour, puis archivées, et supprimées sur simple demande.",
        ],
      },
      {
        heading: "Cookies et traceurs",
        paragraphs: [
          "Le site n'utilise pas de cookies publicitaires ou de suivi. Un stockage local conserve uniquement votre choix de langue, et un cookie technique sécurise l'accès à l'espace d'administration.",
          "Si des outils de mesure d'audience (par exemple Google Analytics) sont ajoutés ultérieurement, cette section sera mise à jour et votre consentement recueilli le cas échéant.",
        ],
      },
      {
        heading: "Vos droits",
        paragraphs: [
          "Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur vos données. Pour l'exercer, écrivez à info@in-alpes.ch.",
        ],
      },
      {
        heading: "Sécurité",
        paragraphs: [
          "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données (chiffrement en transit, accès restreint).",
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    updated: "Last updated: July 2026",
    intro:
      "In-Alpes Chalet Services Sàrl takes the protection of your personal data seriously, in accordance with the Swiss Federal Act on Data Protection (nFADP) and the General Data Protection Regulation (GDPR).",
    sections: [
      {
        heading: "Data controller",
        paragraphs: [
          "In-Alpes Chalet Services Sàrl, Chemin de Sofleu 31, 1997 Haute-Nendaz (Valais), Switzerland — info@in-alpes.ch.",
        ],
      },
      {
        heading: "Data we collect",
        paragraphs: [
          "Booking request form: name, email address, phone, stay dates, number of guests and an optional message.",
          "Contact form: name, email address, phone and message.",
          "We collect no sensitive data and do not buy data from third parties.",
        ],
      },
      {
        heading: "Purposes and legal basis",
        paragraphs: [
          "Your data is used solely to handle and follow up on your booking or contact request. The legal basis is pre-contractual steps taken at your request and our legitimate interest in responding to you.",
        ],
      },
      {
        heading: "Recipients and processors",
        paragraphs: [
          "Your data is processed by providers acting on our behalf: Neon (database, hosted in the EU in Frankfurt), Resend (email delivery), and Netlify (site hosting). Cloudinary hosts apartment photos and does not process guest data.",
          "We do not sell or rent your data to third parties.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Requests are kept for as long as needed to handle your stay, then archived, and deleted on request.",
        ],
      },
      {
        heading: "Cookies and trackers",
        paragraphs: [
          "The site uses no advertising or tracking cookies. Local storage only keeps your language choice, and a technical cookie secures access to the admin area.",
          "If audience-measurement tools (e.g. Google Analytics) are added later, this section will be updated and your consent obtained where required.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You have the right to access, rectify, erase and object to the processing of your data. To exercise these rights, email info@in-alpes.ch.",
        ],
      },
      {
        heading: "Security",
        paragraphs: [
          "We apply appropriate technical and organisational measures to protect your data (encryption in transit, restricted access).",
        ],
      },
    ],
  },
  nl: {
    title: "Privacybeleid",
    updated: "Laatst bijgewerkt: juli 2026",
    intro:
      "In-Alpes Chalet Services Sàrl hecht veel belang aan de bescherming van uw persoonsgegevens, overeenkomstig de Zwitserse wet op de gegevensbescherming (nFADP) en de Algemene Verordening Gegevensbescherming (AVG).",
    sections: [
      {
        heading: "Verwerkingsverantwoordelijke",
        paragraphs: [
          "In-Alpes Chalet Services Sàrl, Chemin de Sofleu 31, 1997 Haute-Nendaz (Wallis), Zwitserland — info@in-alpes.ch.",
        ],
      },
      {
        heading: "Gegevens die wij verzamelen",
        paragraphs: [
          "Reserveringsformulier: naam, e-mailadres, telefoon, verblijfsdata, aantal gasten en een eventueel bericht.",
          "Contactformulier: naam, e-mailadres, telefoon en bericht.",
          "Wij verzamelen geen gevoelige gegevens en kopen geen gegevens van derden.",
        ],
      },
      {
        heading: "Doeleinden en rechtsgrond",
        paragraphs: [
          "Uw gegevens worden uitsluitend gebruikt om uw reserverings- of contactaanvraag te behandelen en op te volgen. De rechtsgrond is de precontractuele maatregelen op uw verzoek en ons gerechtvaardigd belang om u te antwoorden.",
        ],
      },
      {
        heading: "Ontvangers en verwerkers",
        paragraphs: [
          "Uw gegevens worden verwerkt door dienstverleners die namens ons handelen: Neon (database, gehost in de EU in Frankfurt), Resend (verzending van e-mails) en Netlify (hosting van de site). Cloudinary host de foto's van de woningen en verwerkt geen gastgegevens.",
          "Wij verkopen of verhuren uw gegevens niet aan derden.",
        ],
      },
      {
        heading: "Bewaartermijn",
        paragraphs: [
          "Aanvragen worden bewaard zolang nodig is om uw verblijf te behandelen, daarna gearchiveerd en op verzoek verwijderd.",
        ],
      },
      {
        heading: "Cookies en trackers",
        paragraphs: [
          "De site gebruikt geen advertentie- of trackingcookies. Lokale opslag bewaart alleen uw taalkeuze, en een technische cookie beveiligt de toegang tot het beheer.",
          "Als er later meetinstrumenten (bijv. Google Analytics) worden toegevoegd, wordt deze sectie bijgewerkt en zo nodig uw toestemming gevraagd.",
        ],
      },
      {
        heading: "Uw rechten",
        paragraphs: [
          "U hebt recht op inzage, correctie, verwijdering en bezwaar tegen de verwerking van uw gegevens. Stuur hiervoor een e-mail naar info@in-alpes.ch.",
        ],
      },
      {
        heading: "Beveiliging",
        paragraphs: [
          "Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen (versleuteling tijdens verzending, beperkte toegang).",
        ],
      },
    ],
  },
};
