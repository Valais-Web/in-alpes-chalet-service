/**
 * Real Airbnb guest reviews for the four listings.
 *
 * Scraped from Airbnb (July 2026) and curated by hand: a few standout reviews
 * per apartment plus per-listing ratings. Airbnb serves reviews auto-translated
 * to English; the FR (primary) and NL versions here are translations of those.
 *
 * Aggregate rating/count come from Bart's Superhost profile (603 reviews,
 * 4.95★ across all listings). Full scraped set lived in .scrape/reviews.json.
 */
import type { Locale, LocalizedText } from "@/data/types";

export interface Review {
  author: string;
  meta: LocalizedText; // when they stayed, localized
  quote: LocalizedText;
}

export interface ApartmentReviews {
  rating: number; // e.g. 4.96
  count: number; // number of Airbnb reviews
  airbnbUrl: string;
  reviews: Review[];
}

/** Aggregate across all of Bart's listings (Superhost profile). */
export const GLOBAL_RATING = { rating: 4.95, count: 603 };

/** Format a rating for display in the active locale (4.96 → "4,96" in FR). */
export function formatRating(rating: number, locale: Locale): string {
  const tag = locale === "en" ? "en-US" : locale === "nl" ? "nl-NL" : "fr-CH";
  return rating.toLocaleString(tag, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export const APARTMENT_REVIEWS: Record<string, ApartmentReviews> = {
  "le-combin": {
    rating: 5.0,
    count: 14,
    airbnbUrl: "https://www.airbnb.com/rooms/1577629186881048894",
    reviews: [
      {
        author: "Alicia",
        meta: { fr: "Mars 2026", en: "March 2026", nl: "Maart 2026" },
        quote: {
          fr: "Séjour ravissant ! Le chalet et ses vues sont magnifiques et si paisibles. Bart est très sympathique et réactif. On ne peut que recommander cet endroit !",
          en: "Delightful stay! The chalet and its views are beautiful and so peaceful. Bart is very friendly and responsive. Cannot recommend this place enough!",
          nl: "Heerlijk verblijf! Het chalet en het uitzicht zijn prachtig en zo rustig. Bart is heel vriendelijk en reageert snel. We kunnen deze plek enorm aanbevelen!",
        },
      },
      {
        author: "Elmar",
        meta: { fr: "Février 2026", en: "February 2026", nl: "Februari 2026" },
        quote: {
          fr: "Le logement était vraiment agréable et correspondait à nos attentes. Parfait pour une belle escapade à la montagne ! La maison est très charmante et entièrement équipée. La vue depuis la terrasse est tout simplement fantastique, à toute heure !",
          en: "The place was really nice and matched what we expected. Perfect for a nice break in the mountains! The house is very charming and is fully equipped. The view from the terrace is simply fantastic at any time!",
          nl: "De woning was echt aangenaam en kwam overeen met onze verwachtingen. Perfect voor een fijne onderbreking in de bergen! Het huis is heel charmant en volledig uitgerust. Het uitzicht vanaf het terras is gewoonweg fantastisch, op elk moment!",
        },
      },
    ],
  },
  "studio-in-alpes": {
    rating: 4.96,
    count: 506,
    airbnbUrl: "https://www.airbnb.com/rooms/37198545",
    reviews: [
      {
        author: "Sam",
        meta: { fr: "Récemment", en: "Recently", nl: "Onlangs" },
        quote: {
          fr: "Un endroit charmant et paisible, avec un paysage incroyable. Bart s'est montré très serviable et c'était l'endroit idéal pour se détendre à la fin de vacances bien remplies.",
          en: "Lovely, peaceful place to stay with incredible scenery. Bart was extremely helpful and it was the perfect place to relax at the end of a busy holiday.",
          nl: "Een heerlijke, rustige plek met een ongelooflijk landschap. Bart was buitengewoon behulpzaam en het was de ideale plek om te ontspannen aan het einde van een drukke vakantie.",
        },
      },
      {
        author: "Charlotte",
        meta: { fr: "Janvier 2026", en: "January 2026", nl: "Januari 2026" },
        quote: {
          fr: "Un joli petit espace avec un poêle à bois et une vue à couper le souffle ! Nous avions fait des courses avant d'arriver et cuisiné chaque soir, mais les cafés et restaurants sont à quelques minutes à pied dans le village.",
          en: "Lovely little space with a log burner and the most amazing view! We did a food shop before we arrived and cooked every evening, however cafes and restaurants are just a short walk away down in the village.",
          nl: "Een leuke kleine ruimte met een houtkachel en een adembenemend uitzicht! We hadden vóór aankomst boodschappen gedaan en kookten elke avond, maar cafés en restaurants liggen op korte loopafstand in het dorp.",
        },
      },
    ],
  },
  "perce-neige-21": {
    rating: 4.9,
    count: 30,
    airbnbUrl: "https://www.airbnb.com/rooms/38210578",
    reviews: [
      {
        author: "Léanne",
        meta: { fr: "Janvier 2026", en: "January 2026", nl: "Januari 2026" },
        quote: {
          fr: "Séjour incroyable, emplacement exceptionnel. Logement impeccable et hôte accommodant. Nous avons déjà hâte de revenir !",
          en: "Amazing stay, exceptional location. Impeccable accommodation and accommodating host. We are already looking forward to coming back!",
          nl: "Geweldig verblijf, uitzonderlijke ligging. Onberispelijk logement en een gastvrije host. We kijken nu al uit naar een volgend bezoek!",
        },
      },
      {
        author: "Karin",
        meta: { fr: "Février 2024", en: "February 2024", nl: "Februari 2024" },
        quote: {
          fr: "Idéalement situé juste à côté du départ de la télécabine. À 2 minutes du funiculaire pour rejoindre le centre du village. Appartement très confortable et très agréable. Nous y retournerons avec plaisir.",
          en: "Ideally located right next to the cable car departure. 2 minutes from the funicular to reach the centre of the village. Very comfortable and very nice apartment. We'll be happy to go back.",
          nl: "Ideaal gelegen vlak naast het vertrek van de kabelbaan. Op 2 minuten van de funiculaire naar het centrum van het dorp. Zeer comfortabel en heel aangenaam appartement. We komen graag terug.",
        },
      },
    ],
  },
  "studio-la-petite-marmotte": {
    rating: 4.8,
    count: 5,
    airbnbUrl: "https://www.airbnb.com/rooms/563156915755814550",
    reviews: [
      {
        author: "Krystal",
        meta: { fr: "Février 2023", en: "February 2023", nl: "Februari 2023" },
        quote: {
          fr: "Un super petit espace, propre et pratique ! Idéal pour le ski. À quelques pas du bus et des remontées. Excellente boulangerie juste en bas pour le petit-déjeuner. Le casier à ski était très appréciable.",
          en: "Great little space, clean and convenient! Perfect spot for skiing. Short walk to bus or lift. Awesome bakery down below for breakfast. Ski locker was great to have.",
          nl: "Een fijne kleine ruimte, netjes en praktisch! Ideaal om te skiën. Op korte loopafstand van de bus of de lift. Heerlijke bakkerij beneden voor het ontbijt. De skilocker was erg handig.",
        },
      },
      {
        author: "Alex",
        meta: { fr: "Février 2023", en: "February 2023", nl: "Februari 2023" },
        quote: {
          fr: "Nous avons vraiment apprécié le séjour et reviendrons sans hésiter. Merci Bart !",
          en: "Really enjoyed the stay and will definitely come back. Thanks Bart!",
          nl: "We hebben echt genoten van het verblijf en komen zeker terug. Bedankt Bart!",
        },
      },
    ],
  },
};

/** A curated pair for the home page, drawn from different apartments. */
export const HOME_REVIEWS: Review[] = [
  APARTMENT_REVIEWS["le-combin"].reviews[0],
  APARTMENT_REVIEWS["perce-neige-21"].reviews[0],
];
