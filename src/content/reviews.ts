/**
 * Real Airbnb guest reviews for the four listings.
 *
 * Scraped from Airbnb (July 2026) and curated by hand. Airbnb serves reviews
 * auto-translated to English; the FR (primary) and NL versions here are
 * translations of those. La petite marmotte has only 5 reviews on Airbnb, so it
 * shows all 5, while the others show 10 apiece. No review is invented.
 *
 * Aggregate rating/count come from Bart's Superhost profile (603 reviews,
 * 4.95★ across all listings).
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

// --- localized "Month Year" labels -----------------------------------------
const MONTHS: Record<Locale, string[]> = {
  fr: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  nl: [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ],
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "2026-03" → { fr: "Mars 2026", en: "March 2026", nl: "Maart 2026" } */
function mon(ym: string): LocalizedText {
  const [y, m] = ym.split("-").map(Number);
  return {
    fr: `${cap(MONTHS.fr[m - 1])} ${y}`,
    en: `${MONTHS.en[m - 1]} ${y}`,
    nl: `${cap(MONTHS.nl[m - 1])} ${y}`,
  };
}
const RECENT: LocalizedText = { fr: "Récemment", en: "Recently", nl: "Onlangs" };

export const APARTMENT_REVIEWS: Record<string, ApartmentReviews> = {
  "le-combin": {
    rating: 5.0,
    count: 14,
    airbnbUrl: "https://www.airbnb.com/rooms/1577629186881048894",
    reviews: [
      {
        author: "Herman",
        meta: RECENT,
        quote: {
          fr: "Nous avons passé un séjour absolument merveilleux chez Bart. Les vues sont tout simplement époustouflantes et le calme des lieux en fait l'endroit idéal pour se détendre. Le logement est exceptionnellement bien équipé et l'on sent le soin apporté au confort des hôtes. Nous reviendrions sans hésiter, vivement recommandé à qui cherche une escapade paisible !",
          en: "We had an absolutely wonderful stay at Bart's place. The views are simply stunning, and the peaceful surroundings make it the perfect place to relax. The accommodation was exceptionally well equipped and you can tell great care has gone into guests' comfort. We would not hesitate to return, highly recommended to anyone looking for a peaceful getaway!",
          nl: "We hebben een absoluut heerlijk verblijf gehad bij Bart. De uitzichten zijn adembenemend en de rust maakt het de ideale plek om te ontspannen. De woning is uitzonderlijk goed uitgerust en je merkt de zorg voor het comfort van de gasten. We zouden zonder aarzelen terugkomen, echt aan te raden voor wie een rustige uitvalsbasis zoekt!",
        },
      },
      {
        author: "Alicia",
        meta: mon("2026-03"),
        quote: {
          fr: "Séjour ravissant ! Le chalet et ses vues sont magnifiques et si paisibles. Bart est très sympathique et réactif. On ne peut que recommander cet endroit !",
          en: "Delightful stay! The chalet and its views are beautiful and so peaceful. Bart is very friendly and responsive. Cannot recommend this place enough!",
          nl: "Heerlijk verblijf! Het chalet en het uitzicht zijn prachtig en zo rustig. Bart is heel vriendelijk en reageert snel. We kunnen deze plek enorm aanbevelen!",
        },
      },
      {
        author: "Elmar",
        meta: mon("2026-02"),
        quote: {
          fr: "Le logement était vraiment agréable et correspondait à nos attentes. Parfait pour une belle escapade à la montagne ! La maison est très charmante et entièrement équipée. La vue depuis la terrasse est tout simplement fantastique, à toute heure !",
          en: "The place was really nice and matched what we expected. Perfect for a nice break in the mountains! The house is very charming and fully equipped. The view from the terrace is simply fantastic at any time!",
          nl: "De woning was echt aangenaam en kwam overeen met onze verwachtingen. Perfect voor een fijne onderbreking in de bergen! Het huis is heel charmant en volledig uitgerust. Het uitzicht vanaf het terras is gewoonweg fantastisch, op elk moment!",
        },
      },
      {
        author: "Théo",
        meta: mon("2026-01"),
        quote: {
          fr: "Le chalet en haut de la montagne est magnifique. Tout est propre, l'équipement est de qualité et la vue est splendide. Très bien situé, assez isolé pour profiter de la nature tout en étant à moins de 5 minutes des pistes. Les hôtes sont accueillants et chaleureux.",
          en: "The chalet at the top of the mountain is beautiful. Everything is clean, quality equipment, and the view is splendid. Very well positioned, isolated enough to enjoy nature yet less than 5 minutes from the ski resorts. The hosts are welcoming and warm.",
          nl: "Het chalet boven op de berg is prachtig. Alles is netjes, kwalitatieve uitrusting en het uitzicht is schitterend. Heel goed gelegen, afgezonderd genoeg om van de natuur te genieten en toch op minder dan 5 minuten van de skipistes. De gastheren zijn gastvrij en hartelijk.",
        },
      },
      {
        author: "Jordan",
        meta: mon("2026-01"),
        quote: {
          fr: "Un séjour absolument parfait ! Le logement est conforme à la description, impeccable et décoré avec goût. L'hôte est extrêmement accueillant, disponible et attentionné, avec d'excellentes recommandations locales. L'emplacement est idéal, à la fois calme et pratique. Je le recommande sans hésiter !",
          en: "An absolutely perfect stay! The accommodation is as described, impeccable and tastefully decorated. The host is extremely welcoming, available and attentive, with excellent local recommendations. The location is ideal, quiet and convenient at once. I'd recommend it without a second thought!",
          nl: "Een absoluut perfect verblijf! De woning is zoals beschreven, onberispelijk en met smaak ingericht. De gastheer is uiterst gastvrij, beschikbaar en attent, met uitstekende lokale tips. De ligging is ideaal, rustig en praktisch tegelijk. Ik raad het zonder twijfel aan!",
        },
      },
      {
        author: "Michelle",
        meta: mon("2025-12"),
        quote: {
          fr: "Nous avons eu la chance d'être les premiers hôtes de ce superbe chalet, entouré de montagnes enneigées et pourvu de tout le nécessaire. À seulement 5 minutes d'un village de ski de carte postale, et pourtant à mille lieues de tout dans un espace si privé. L'intérieur a été restauré avec talent, tout le confort moderne et un linge luxueux, mais la vraie star reste la vue à couper le souffle depuis chaque fenêtre. Bart et sa famille ont rendu nos vacances de Noël de dernière minute parfaites. Merci !",
          en: "We were so lucky to be the first guests in this gorgeous chalet, surrounded by snow-capped mountains with everything we could need. Only 5 minutes from a picture-perfect ski village, yet a world away in such a private space. The interior has been expertly restored, with every modern amenity and luxurious linen, but the real star is the breathtaking view from every window. Bart and his family made our last-minute Christmas holiday perfect. Thank you!",
          nl: "We hadden het geluk de eerste gasten te zijn in dit prachtige chalet, omringd door besneeuwde bergen en met alles wat we nodig hadden. Op slechts 5 minuten van een idyllisch skidorp, en toch ver weg van alles in zo'n private ruimte. Het interieur is vakkundig gerestaureerd, met alle modern comfort en luxueus linnengoed, maar de echte ster is het adembenemende uitzicht uit elk raam. Bart en zijn familie maakten onze last-minute kerstvakantie perfect. Bedankt!",
        },
      },
      {
        author: "Chloé",
        meta: mon("2026-04"),
        quote: {
          fr: "Hôte très chaleureux et accueillant, merci encore pour tout ! Nous avons passé un très beau séjour.",
          en: "Very warm and welcoming host, thank you again for everything! We had a lovely stay.",
          nl: "Zeer warme en gastvrije host, nogmaals bedankt voor alles! We hebben een heerlijk verblijf gehad.",
        },
      },
      {
        author: "Noémie",
        meta: mon("2026-02"),
        quote: {
          fr: "Bart est un hôte formidable, très accueillant et réactif. Nous avons passé un excellent moment dans son chalet.",
          en: "Bart is a great host, very welcoming and responsive. We had a great time at his cottage.",
          nl: "Bart is een geweldige host, heel gastvrij en snel in reactie. We hebben een fijne tijd gehad in zijn chalet.",
        },
      },
      {
        author: "Alexandra",
        meta: mon("2026-02"),
        quote: {
          fr: "Un grand merci à Bart pour son accueil, son petit cadeau de bienvenue et sa disponibilité. L'appartement est propre, cocooning, chaleureux et moderne, avec une literie parfaite, dans un endroit très calme entouré de nature, à 1,5 km du centre de Nendaz et de la télécabine. Tout était parfait, rien ne manquait, nous reviendrons l'an prochain.",
          en: "A big thank you to Bart for his welcome, his little welcome gift and his availability. The apartment is clean, cocooning, warm and modern, with perfect bedding, in a very quiet spot surrounded by nature, 1.5 km from the centre of Nendaz and the cable car. Everything was perfect, nothing was missing, we'll be back next year.",
          nl: "Een grote dankjewel aan Bart voor zijn onthaal, zijn kleine welkomstcadeau en zijn beschikbaarheid. Het appartement is netjes, knus, warm en modern, met perfect beddengoed, op een heel rustige plek omringd door natuur, op 1,5 km van het centrum van Nendaz en de kabelbaan. Alles was perfect, er ontbrak niets, we komen volgend jaar terug.",
        },
      },
      {
        author: "Frank",
        meta: mon("2026-03"),
        quote: {
          fr: "Chalet magnifique et impeccablement entretenu, dans un très bel emplacement surplombant la vallée.",
          en: "Beautiful, well-kept chalet in a lovely location overlooking the valley.",
          nl: "Prachtig, goed onderhouden chalet op een mooie locatie met uitzicht over het dal.",
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
        meta: RECENT,
        quote: {
          fr: "Un endroit charmant et paisible, avec un paysage incroyable. Bart s'est montré très serviable et c'était l'endroit idéal pour se détendre à la fin de vacances bien remplies.",
          en: "Lovely, peaceful place to stay with incredible scenery. Bart was extremely helpful and it was the perfect place to relax at the end of a busy holiday.",
          nl: "Een heerlijke, rustige plek met een ongelooflijk landschap. Bart was buitengewoon behulpzaam en het was de ideale plek om te ontspannen aan het einde van een drukke vakantie.",
        },
      },
      {
        author: "Ethan",
        meta: RECENT,
        quote: {
          fr: "Très calme et paisible, niché dans les montagnes. Le logement était très propre et les vues superbes. Le jacuzzi est génial. C'est un peu délicat à trouver, mais une fois sur place cela en vaut vraiment la peine. Des gens très sympathiques en plus.",
          en: "Very quiet and peaceful, nestled up in the mountains. The place was very clean and the views were amazing. The hot tub is great. It's a little tricky to find, but once you do it's very worth it. Very nice people too.",
          nl: "Heel rustig en vredig, hoog in de bergen. De plek was zeer netjes en de uitzichten waren geweldig. De jacuzzi is top. Het is wat lastig te vinden, maar eenmaal daar is het het echt waard. Ook heel aardige mensen.",
        },
      },
      {
        author: "Alexis",
        meta: mon("2026-03"),
        quote: {
          fr: "Nous avons passé un séjour exceptionnel dans le studio de Bart, au cœur du Valais. Le logement est très bien aménagé, impeccablement propre, et offre une vue imprenable grâce à ses grandes baies vitrées. L'accueil de Bart a été remarquable : il a même déneigé notre voiture le matin avant de partir travailler ! Une attention rare et très appréciée. Nous recommandons vivement !",
          en: "We had an exceptional stay at Bart's studio, in the heart of Valais. The accommodation is very well furnished, impeccably clean, and offers stunning views through its large picture windows. Bart's hospitality was outstanding: he even cleared the snow from our car in the morning before leaving for work! Rare and much appreciated. Highly recommended!",
          nl: "We hebben een uitzonderlijk verblijf gehad in de studio van Bart, in het hart van Wallis. De woning is zeer goed ingericht, onberispelijk schoon en biedt een prachtig uitzicht dankzij de grote raampartijen. Barts gastvrijheid was uitzonderlijk: hij maakte 's ochtends zelfs onze auto sneeuwvrij voordat hij ging werken! Een zeldzame en zeer gewaardeerde attentie. Van harte aanbevolen!",
        },
      },
      {
        author: "Alex",
        meta: mon("2026-03"),
        quote: {
          fr: "Nous avons passé à deux quelques jours merveilleux dans le studio. L'accès fonctionne très bien avec Maps si l'on suit les conseils. Le chemin est raide, mais Bart met à disposition des crampons pour atteindre facilement l'entrée. Le coin jacuzzi est désormais chauffé électriquement et Bart l'avait préchauffé avant notre arrivée. La cuisine dispose de tout le nécessaire, et le chauffage au sol ou la cheminée rendent l'endroit très cosy. Même si la famille habite la même maison, le studio est très privé, et la vue se passe de commentaires à toute heure. Nous recommandons absolument le lieu et l'hôte.",
          en: "The two of us spent a few wonderful days in the studio. Getting there works great with Maps if you follow the tips. The path is steep, but Bart provides spikes for your shoes so you reach the entrance easily. The hot-tub area is now electrically heated and Bart had preheated it before we arrived. The kitchen has everything you need, and the underfloor heating or fireplace make it absolutely cosy. Even though the family lives in the same house, the studio is very private, and the view speaks for itself at any time of day. Absolutely recommend the place and the host.",
          nl: "Met z'n tweeën hebben we een paar heerlijke dagen in de studio doorgebracht. De weg ernaartoe werkt prima met Maps als je de tips volgt. Het pad is steil, maar Bart voorziet spikes voor je schoenen zodat je de ingang gemakkelijk bereikt. De jacuzzihoek wordt nu elektrisch verwarmd en Bart had die voor onze aankomst al voorverwarmd. De keuken heeft alles wat je nodig hebt, en de vloerverwarming of de open haard maken het heerlijk knus. Ook al woont de familie in hetzelfde huis, de studio ligt zeer privé, en het uitzicht spreekt op elk moment voor zich. We raden de plek en de host absoluut aan.",
        },
      },
      {
        author: "Tanja",
        meta: mon("2026-02"),
        quote: {
          fr: "Le studio est un endroit merveilleux pour se détendre. Tout est conforme à la description et le jacuzzi peut être utilisé à tout moment, c'était notre coup de cœur. Merci Bart !",
          en: "The studio is a wonderful place to relax. Everything is as described and the hot tub can be used at any time, that was our highlight. Thank you Bart!",
          nl: "De studio is een heerlijke plek om te ontspannen. Alles is zoals beschreven en de jacuzzi kan op elk moment gebruikt worden, dat was ons hoogtepunt. Bedankt Bart!",
        },
      },
      {
        author: "Melanie",
        meta: mon("2026-02"),
        quote: {
          fr: "Sans conteste le point fort de notre voyage ! Une retraite parfaite pour se détendre, au point d'annuler nos plans de la journée pour rester sur place. La promenade jusqu'au centre du village est superbe. Bart a été si gentil et arrangeant, nous reviendrions sans hésiter.",
          en: "Absolutely the highlight of our trip! The perfect relaxing retreat, we even cancelled our day plans just to stay in. The walk to the village centre is gorgeous. Bart was so kind and accommodating, we'd stay here again in a heartbeat.",
          nl: "Absoluut het hoogtepunt van onze reis! De perfecte plek om te ontspannen, we hebben zelfs onze dagplannen geannuleerd om binnen te blijven. De wandeling naar het dorpscentrum is prachtig. Bart was zo vriendelijk en behulpzaam, we zouden zo weer terugkomen.",
        },
      },
      {
        author: "Charlotte",
        meta: mon("2026-01"),
        quote: {
          fr: "Un joli petit espace avec un poêle à bois et une vue à couper le souffle ! Nous avions fait des courses avant d'arriver et cuisiné chaque soir, mais les cafés et restaurants sont à quelques minutes à pied dans le village.",
          en: "Lovely little space with a log burner and the most amazing view! We did a food shop before we arrived and cooked every evening, however cafes and restaurants are just a short walk away down in the village.",
          nl: "Een leuke kleine ruimte met een houtkachel en een adembenemend uitzicht! We hadden vóór aankomst boodschappen gedaan en kookten elke avond, maar cafés en restaurants liggen op korte loopafstand in het dorp.",
        },
      },
      {
        author: "Hamin",
        meta: mon("2026-05"),
        quote: {
          fr: "Le logement de Bart était excellent, avec des vues encore plus belles que sur les photos. Il est bien équipé, avec notamment un jacuzzi extérieur et un barbecue, et tout est propre et soigné. L'accès à pied est un peu difficile, une voiture aide donc. Toutes mes questions et demandes ont trouvé réponse.",
          en: "Bart's place was excellent, with even better views than the photos. It's well equipped with everything, including an outdoor jacuzzi and barbecue, and it's clean and tidy. It's a bit hard to reach on foot, so a car helps. All my questions and requests were answered.",
          nl: "De plek van Bart was uitstekend, met nog mooiere uitzichten dan op de foto's. Ze is goed uitgerust met alles, waaronder een buitenjacuzzi en barbecue, en alles is netjes en verzorgd. Te voet is de toegang wat lastig, dus een auto helpt. Al mijn vragen en verzoeken werden beantwoord.",
        },
      },
      {
        author: "Leandra",
        meta: mon("2026-04"),
        quote: {
          fr: "Waouh, notre séjour a été merveilleux. Les vues, l'emplacement, le logement et les hôtes sont vraiment exceptionnels. Nous reviendrons avec plaisir !",
          en: "Wow, our stay was wonderful. The views, location, accommodation and hosts are truly outstanding. We'll be happy to come back!",
          nl: "Wow, ons verblijf was heerlijk. De uitzichten, de ligging, de woning en de gastheren zijn werkelijk uitzonderlijk. We komen graag terug!",
        },
      },
      {
        author: "Serena",
        meta: mon("2026-05"),
        quote: {
          fr: "J'ai passé un excellent moment ! L'endroit est merveilleusement calme. Bart a toujours été disponible et très sympathique. Son multilinguisme m'a particulièrement impressionnée et a rendu la communication très facile. J'adorerais revenir !",
          en: "I had a great time! The place is wonderfully quiet. Bart was always available and very friendly. His multilingualism was especially impressive and made communication super easy. I'd love to come back!",
          nl: "Ik heb een geweldige tijd gehad! De plek is heerlijk rustig. Bart was altijd beschikbaar en heel vriendelijk. Zijn meertaligheid was bijzonder indrukwekkend en maakte de communicatie heel gemakkelijk. Ik zou graag terugkomen!",
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
        meta: mon("2026-01"),
        quote: {
          fr: "Séjour incroyable, emplacement exceptionnel. Logement impeccable et hôte accommodant. Nous avons déjà hâte de revenir !",
          en: "Amazing stay, exceptional location. Impeccable accommodation and accommodating host. We are already looking forward to coming back!",
          nl: "Geweldig verblijf, uitzonderlijke ligging. Onberispelijk logement en een gastvrije host. We kijken nu al uit naar een volgend bezoek!",
        },
      },
      {
        author: "Karin",
        meta: mon("2024-02"),
        quote: {
          fr: "Idéalement situé juste à côté du départ de la télécabine. À 2 minutes du funiculaire pour rejoindre le centre du village. Appartement très confortable et très agréable. Nous y retournerons avec plaisir.",
          en: "Ideally located right next to the cable car departure, 2 minutes from the funicular to reach the centre of the village. Very comfortable and very nice apartment. We'll be happy to go back.",
          nl: "Ideaal gelegen vlak naast het vertrek van de kabelbaan, op 2 minuten van de funiculaire naar het centrum van het dorp. Zeer comfortabel en heel aangenaam appartement. We komen graag terug.",
        },
      },
      {
        author: "Maxime",
        meta: mon("2025-01"),
        quote: {
          fr: "Belle surface, décorée avec goût, très bonne literie et un excellent lit d'appoint dans le salon. À quelques mètres de la télécabine de Tracouet, c'est à peu près le meilleur emplacement possible pour skier au pied des pistes. Parking facile et gratuit, très bon Wi-Fi, commerces et restaurants à proximité, funiculaire à 100 m pour le centre du village. Hôte très réactif et extrêmement sympathique. Quatre jours extraordinaires à Nendaz, nous reviendrons.",
          en: "Lovely space, tastefully decorated, very good bedding and a great fold-out bed in the living room. A few metres from the Tracouet gondola, this is about the best possible location for ski-in ski-out. Easy free parking, very good Wi-Fi, shops and restaurants nearby, funicular 100 m away for the village centre. Very responsive and extremely friendly host. Four extraordinary days in Nendaz, we'll be back.",
          nl: "Mooie ruimte, met smaak ingericht, zeer goed beddengoed en een prima opklapbed in de woonkamer. Op enkele meters van de Tracouet-gondel, zowat de best mogelijke ligging om ski-in ski-out te skiën. Gemakkelijk en gratis parkeren, zeer goede wifi, winkels en restaurants dichtbij, funiculaire op 100 m naar het dorpscentrum. Zeer responsieve en uiterst vriendelijke host. Vier buitengewone dagen in Nendaz, we komen terug.",
        },
      },
      {
        author: "Benny",
        meta: mon("2024-02"),
        quote: {
          fr: "L'appartement de Bart est douillet et astucieusement agencé. De la place en suffisance pour une famille de quatre (nous avons utilisé les lits superposés pliants dans le couloir) et des salles de bain propres. Le matin, à deux pas des remontées, et l'on peut rentrer skis aux pieds et ranger skis et chaussures dans le local à ski au rez-de-chaussée. Vivement recommandé.",
          en: "Bart's apartment is cosy and cleverly laid out. Plenty of space for a family of four (we used the foldable bunk beds in the hallway) and clean bathrooms. Literally a stone's throw from the ski lift in the morning, and you can ski home and store skis and boots in the ski room on the ground floor. Highly recommend.",
          nl: "Het appartement van Bart is knus en slim ingedeeld. Ruimte genoeg voor een gezin van vier (we gebruikten de opklapbare stapelbedden in de gang) en nette badkamers. 's Ochtends op een steenworp van de skilift, en je kunt naar huis skiën en ski's en schoenen opbergen in de skiberging op de begane grond. Van harte aanbevolen.",
        },
      },
      {
        author: "Julie",
        meta: mon("2023-03"),
        quote: {
          fr: "Le logement de Bart est parfaitement situé. L'appartement est à deux secondes de la télécabine, à 5 minutes à pied de l'épicerie et à 3 minutes des magasins de location. Les lits sont douillets et la cuisine bien équipée. Mes garçons ont adoré jouer sur le flanc de la montagne après le ski. Merci pour ce beau séjour.",
          en: "Bart's place is in a perfect location. The flat is 2 seconds from the gondola, a 5-minute walk to the grocery store and 3 minutes to the rental shops. The beds are cosy and the kitchen well stocked. My boys loved playing on the mountainside after skiing. Thank you for a lovely stay.",
          nl: "De plek van Bart is perfect gelegen. Het appartement ligt op twee seconden van de gondel, op 5 minuten lopen van de supermarkt en 3 minuten van de verhuurwinkels. De bedden zijn knus en de keuken goed uitgerust. Mijn jongens speelden na het skiën dolgraag op de berghelling. Bedankt voor het fijne verblijf.",
        },
      },
      {
        author: "Sammy",
        meta: mon("2023-02"),
        quote: {
          fr: "L'appartement de Bart est aménagé de façon très chaleureuse, avec tout le confort nécessaire pour de belles vacances, et le tout à 10 m des pistes (idéal avec de jeunes enfants). Pour compléter le tableau, Bart est très serviable, disponible et sa bonne humeur est contagieuse. En un mot, nous avons passé une semaine de rêve et reviendrons sans faute !",
          en: "Bart's apartment is arranged in a very warm way, with all the comforts you need for a great holiday, and all this 10 m from the slopes (ideal with young children). To top it off, Bart is very helpful, available and his good mood is contagious. Simply put, we had a dream week and will definitely come back!",
          nl: "Het appartement van Bart is heel warm ingericht, met alle comfort dat je nodig hebt voor een fijne vakantie, en dat alles op 10 m van de pistes (ideaal met jonge kinderen). Bovendien is Bart heel behulpzaam, beschikbaar en zijn goede humeur is aanstekelijk. Kortom, we hebben een droomweek gehad en komen zeker terug!",
        },
      },
      {
        author: "Julien",
        meta: mon("2022-03"),
        quote: {
          fr: "Nous avons passé un excellent moment en famille à cinq. L'appartement est suffisamment spacieux et bien situé, à deux pas des pistes et proche des commerces. Cuisine très bien équipée et lits confortables. Bart est très sympathique, arrangeant et disponible. Recommandé !",
          en: "We had a great time as a family of five. The apartment is spacious enough and conveniently located, two steps from the slopes and close to shops. Very well equipped kitchen and comfortable beds. Bart is very friendly, accommodating and available. Recommended!",
          nl: "We hebben een geweldige tijd gehad als gezin van vijf. Het appartement is ruim genoeg en gunstig gelegen, op twee stappen van de pistes en dicht bij winkels. Zeer goed uitgeruste keuken en comfortabele bedden. Bart is heel vriendelijk, behulpzaam en beschikbaar. Aanbevolen!",
        },
      },
      {
        author: "Mariana",
        meta: mon("2022-01"),
        quote: {
          fr: "Superbe appartement dans un emplacement idéal, central et parfait pour le ski. Il est en réalité plus grand qu'il n'y paraît sur les photos. Bart a été formidable, il nous a aidés pour l'arrivée et le départ, et la communication a été très facile.",
          en: "Great apartment in a great location, central and perfect for skiing. It's actually larger than it appears in the photos. Bart was great, helped us with check-in and check-out, and communication was super easy.",
          nl: "Prima appartement op een topligging, centraal en perfect om te skiën. Het is eigenlijk groter dan het op de foto's lijkt. Bart was geweldig, hielp ons met de check-in en check-out, en de communicatie verliep heel vlot.",
        },
      },
      {
        author: "Emy",
        meta: mon("2020-02"),
        quote: {
          fr: "Cet appartement est exceptionnel, très bien situé. Je le recommande et l'ai déjà réservé pour l'an prochain. Le propriétaire est très sympathique, très attentionné et très réactif.",
          en: "This apartment is exceptional, very well located. I recommend it and have already booked it for next year. The owner is very nice, very attentive and very responsive.",
          nl: "Dit appartement is uitzonderlijk, heel goed gelegen. Ik raad het aan en heb het al voor volgend jaar geboekt. De eigenaar is heel vriendelijk, heel attent en heel snel in reactie.",
        },
      },
      {
        author: "Marco",
        meta: mon("2022-02"),
        quote: {
          fr: "Appartement très propre, confortable et calme, juste à côté des remontées. Bart est une personne très agréable et nous comptons revenir la saison prochaine. Vivement recommandé !",
          en: "Very clean, comfortable and quiet apartment right beside the ski lift. Bart is a very pleasant person and we're planning to return next season. Highly recommended!",
          nl: "Zeer net, comfortabel en rustig appartement vlak naast de skilift. Bart is een heel aangenaam persoon en we zijn van plan volgend seizoen terug te komen. Van harte aanbevolen!",
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
        author: "Angely",
        meta: mon("2024-12"),
        quote: {
          fr: "Bart est assurément un hôte formidable et l'espace qu'il propose est parfait pour deux personnes. On y trouve exactement ce qu'il décrit, et même davantage ; nous avions tout ce qu'il fallait et Bart répondait toujours à nos questions. Superbe expérience !",
          en: "Bart is definitely a great host and the space he offers is great for two people. It has exactly what he describes and even more, we had everything we needed and Bart always answered our questions. Great experience!",
          nl: "Bart is beslist een geweldige host en de ruimte die hij aanbiedt is perfect voor twee personen. Je vindt er precies wat hij beschrijft en zelfs meer; we hadden alles wat we nodig hadden en Bart beantwoordde altijd onze vragen. Prima ervaring!",
        },
      },
      {
        author: "Joëlle",
        meta: mon("2025-01"),
        quote: {
          fr: "Très bel appartement ! Un réduit séparé pour se déchausser des skis ; l'intérieur est un brin plus ancien mais plein de charme.",
          en: "Very nice apartment! A separate nook to take off your skis; the interior is a touch older but charming.",
          nl: "Heel mooi appartement! Een aparte ruimte om je ski's uit te doen; het interieur is een tikje ouder maar charmant.",
        },
      },
      {
        author: "Jessica",
        meta: mon("2024-01"),
        quote: {
          fr: "Nous avons apprécié notre séjour dans le studio de Bart. Bart est un hôte très sympathique et attentionné. L'emplacement est un vrai plus, proche du domaine skiable ainsi que de plusieurs restaurants et commerces. Un parking est disponible de l'autre côté de la rue. Nous recommandons vivement ce studio et reviendrions avec plaisir.",
          en: "We enjoyed our stay at Bart's studio. Bart is a very friendly and attentive host. The location is a huge plus, close to the ski resort and to several restaurants and shops. Parking is available across the street. We would highly recommend this studio and would gladly come back.",
          nl: "We hebben genoten van ons verblijf in de studio van Bart. Bart is een heel vriendelijke en attente host. De ligging is een groot pluspunt, dicht bij het skigebied en bij verschillende restaurants en winkels. Aan de overkant van de straat is parkeergelegenheid. We raden deze studio van harte aan en zouden graag terugkomen.",
        },
      },
      {
        author: "Krystal",
        meta: mon("2023-02"),
        quote: {
          fr: "Un super petit espace, propre et pratique ! Idéal pour le ski. À quelques pas du bus et des remontées. Excellente boulangerie juste en bas pour le petit-déjeuner. Le casier à ski était très appréciable.",
          en: "Great little space, clean and convenient! Perfect spot for skiing. Short walk to bus or lift. Awesome bakery down below for breakfast. Ski locker was great to have.",
          nl: "Een fijne kleine ruimte, netjes en praktisch! Ideaal om te skiën. Op korte loopafstand van de bus of de lift. Heerlijke bakkerij beneden voor het ontbijt. De skilocker was erg handig.",
        },
      },
      {
        author: "Alex",
        meta: mon("2023-02"),
        quote: {
          fr: "Nous avons vraiment apprécié le séjour et reviendrons sans hésiter. Merci Bart !",
          en: "Really enjoyed the stay and will definitely come back. Thanks Bart!",
          nl: "We hebben echt genoten van het verblijf en komen zeker terug. Bedankt Bart!",
        },
      },
    ],
  },
};

/** A pooled selection for the home page, drawn from all four apartments. */
export const HOME_REVIEWS: Review[] = [
  APARTMENT_REVIEWS["le-combin"].reviews[5], // Michelle
  APARTMENT_REVIEWS["studio-in-alpes"].reviews[2], // Alexis
  APARTMENT_REVIEWS["perce-neige-21"].reviews[5], // Sammy
  APARTMENT_REVIEWS["le-combin"].reviews[1], // Alicia
  APARTMENT_REVIEWS["studio-in-alpes"].reviews[5], // Melanie
  APARTMENT_REVIEWS["studio-la-petite-marmotte"].reviews[0], // Angely
  APARTMENT_REVIEWS["perce-neige-21"].reviews[2], // Maxime
  APARTMENT_REVIEWS["le-combin"].reviews[4], // Jordan
  APARTMENT_REVIEWS["studio-in-alpes"].reviews[1], // Ethan
  APARTMENT_REVIEWS["perce-neige-21"].reviews[4], // Julie
  APARTMENT_REVIEWS["studio-in-alpes"].reviews[9], // Serena
  APARTMENT_REVIEWS["studio-la-petite-marmotte"].reviews[3], // Krystal
];
