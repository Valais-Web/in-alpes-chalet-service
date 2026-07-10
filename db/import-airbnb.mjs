/**
 * Replace the 3 demo apartments with Bart's 4 real Airbnb listings.
 *
 *   set -a; . ./.env; set +a; node db/import-airbnb.mjs
 *
 * Talks to the DEPLOYED admin API (SITE_URL) — not Neon directly — so the write
 * happens in the Netlify function context and republishes apartments.json to
 * Netlify Blobs automatically (CLAUDE.md §5). A local script has no blob creds.
 *
 * Content: FR primary + EN/NL translations, adapted from the scraped listing
 * descriptions (.scrape/listings.json) and reviews. Photos are the Cloudinary
 * URLs produced by scripts/upload-airbnb-photos.mjs (.scrape/cloudinary.json).
 *
 * ⚠ price_per_night = 0 (placeholder — real nightly prices still owed by owner).
 * ⚠ studio-la-petite-marmotte size_m2 = 20 is an ESTIMATE (not on the listing).
 */
import { readFileSync } from "node:fs";

const SITE = process.env.SITE_URL;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!SITE || !PASSWORD) {
  console.error("Missing SITE_URL / ADMIN_PASSWORD (source .env first)");
  process.exit(1);
}

const cloud = JSON.parse(readFileSync(".scrape/cloudinary.json", "utf8"));

const RULES = {
  fr: "Non-fumeur. Fêtes et événements non autorisés. Animaux sur demande. Merci de respecter la tranquillité du voisinage.",
  en: "No smoking. No parties or events. Pets on request. Please respect the peace and quiet of the neighbourhood.",
  nl: "Niet-roken. Feesten en evenementen niet toegestaan. Huisdieren op aanvraag. Respecteer de rust van de buurt.",
};

const APARTMENTS = [
  {
    id: "apt-le-combin",
    slug: "le-combin",
    sortOrder: 0,
    room: "r1",
    title: { fr: "Le Combin", en: "Le Combin", nl: "Le Combin" },
    summary: {
      fr: "Appartement d'une chambre entièrement rénové (2025) au dernier étage d'un chalet centenaire, avec jardin privé et jacuzzi face aux Alpes.",
      en: "Fully renovated (2025) one-bedroom apartment on the top floor of a century-old chalet, with a private garden and a hot tub facing the Alps.",
      nl: "Volledig gerenoveerd (2025) appartement met één slaapkamer op de bovenste verdieping van een eeuwenoud chalet, met privétuin en jacuzzi met uitzicht op de Alpen.",
    },
    description: {
      fr: "Rénové en 2025 et situé au dernier étage d'un chalet centenaire, cet appartement spacieux de 50 m² dispose de tout le confort pour des vacances reposantes. Il se niche au milieu d'une prairie appelée La Combe, à 1 450 m d'altitude et à 1,5 km du centre de Haute-Nendaz.\n\nLe salon offre un plafond à poutres apparentes, une cuisine moderne entièrement équipée, un grand canapé, une table à manger pour quatre et un poêle à granulés pour les froides nuits d'hiver. La chambre dispose d'un lit queen size (160 × 200 cm) et d'une grande armoire. La salle de bain comprend un double lavabo et une douche à l'italienne.\n\nEn été, profitez de 80 m² de jardin privé clôturé avec mobilier d'extérieur et d'un jacuzzi avec vue sur les Alpes, utilisable toute l'année. Une place de parking privée est réservée à 30 m du chalet.\n\nEn hiver, un chemin est déneigé entre le parking et l'appartement ; si la route est difficile, une cabine Polaris est mise à disposition depuis le parking accessible à 800 m.",
      en: "Renovated in 2025 and set on the top floor of a century-old chalet, this spacious 50 m² apartment has everything you need for a restful holiday. It sits in the middle of a meadow called La Combe, at 1,450 m altitude and 1.5 km from the centre of Haute-Nendaz.\n\nThe living room features an exposed-beam ceiling, a fully equipped modern kitchen, a large sofa, a dining table for four and a pellet stove for cold winter nights. The bedroom has a queen-size bed (160 × 200 cm) and a large wardrobe. The bathroom offers a double basin and a walk-in shower.\n\nIn summer, enjoy 80 m² of fenced private garden with outdoor furniture and a hot tub overlooking the Alps, usable all year round. A private parking space is reserved 30 m from the chalet.\n\nIn winter a path is cleared between the parking and the apartment; if the road is difficult, a Polaris cabin is available from the easily accessible parking 800 m away.",
      nl: "Dit ruime appartement van 50 m², in 2025 gerenoveerd en gelegen op de bovenste verdieping van een eeuwenoud chalet, biedt alle comfort voor een rustgevende vakantie. Het ligt midden in een weide genaamd La Combe, op 1.450 m hoogte en 1,5 km van het centrum van Haute-Nendaz.\n\nDe woonkamer heeft een balkenplafond, een volledig uitgeruste moderne keuken, een grote bank, een eettafel voor vier en een pelletkachel voor koude winternachten. De slaapkamer beschikt over een queensize bed (160 × 200 cm) en een grote kast. De badkamer heeft een dubbele wastafel en een inloopdouche.\n\nIn de zomer geniet u van 80 m² omheinde privétuin met tuinmeubilair en een jacuzzi met uitzicht op de Alpen, het hele jaar bruikbaar. Een privéparkeerplaats is gereserveerd op 30 m van het chalet.\n\nIn de winter wordt een pad vrijgemaakt tussen de parking en het appartement; is de weg lastig, dan staat een Polaris-cabine ter beschikking vanaf de goed bereikbare parking op 800 m.",
    },
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    surfaceM2: 50,
    floor: "Dernier étage",
    amenities: ["wifi", "fireplace", "parking", "dishwasher", "mountainView"],
    location: { lat: 46.17746, lng: 7.30782, address: "La Combe, 1997 Haute-Nendaz, Valais" },
  },
  {
    id: "apt-studio-in-alpes",
    slug: "studio-in-alpes",
    sortOrder: 1,
    room: "r2",
    title: { fr: "Studio In-Alpes", en: "Studio In-Alpes", nl: "Studio In-Alpes" },
    summary: {
      fr: "Studio de charme au niveau jardin d'un chalet de 1930 rénové, lit escamotable et terrasse avec vue de 48 km sur la vallée du Rhône.",
      en: "Charming studio on the garden level of a renovated 1930s chalet, with a fold-away bed and a terrace looking 48 km down the Rhône valley.",
      nl: "Sfeervolle studio op tuinniveau van een gerenoveerd chalet uit 1930, met opklapbed en terras met 48 km uitzicht over het Rhônedal.",
    },
    description: {
      fr: "Le Studio In-Alpes se situe juste à l'extérieur du centre de Haute-Nendaz, en pleine nature, au niveau inférieur d'un chalet de 1930 entièrement rénové en 2018. Son lit escamotable libère l'espace et vous réveille face à une vue de 48 km sur la vallée du Rhône.\n\nEn hiver, la cheminée et le chauffage au sol réchauffent le studio ; en été, la terrasse en pierre naturelle invite à contempler la vallée et les étoiles. D'environ 29 m², le logement est entièrement indépendant, avec son propre accès, sa salle de bain, sa cuisine et son coin couchage.\n\nÀ 1,5 km du télésiège de Tracouet et du centre. Les skieurs de randonnée peuvent rejoindre le domaine des 4 Vallées depuis le jardin ; en été, de nombreux sentiers et promenades le long des bisses partent des environs. Pneus d'hiver nécessaires de novembre à avril.",
      en: "Studio In-Alpes sits just outside the centre of Haute-Nendaz, surrounded by nature, on the lower level of a 1930 chalet fully renovated in 2018. Its fold-away bed frees up the space and wakes you to a 48 km view over the Rhône valley.\n\nIn winter the fireplace and underfloor heating keep the studio warm; in summer the natural-stone terrace invites you to gaze over the valley and the stars. At around 29 m², the studio is fully self-contained, with its own entrance, bathroom, kitchen and sleeping area.\n\nIt is 1.5 km from the Tracouet chairlift and the centre. Ski tourers can reach the 4 Vallées area straight from the garden; in summer, many trails and walks along the bisses start nearby. Winter tyres are required from November to April.",
      nl: "Studio In-Alpes ligt net buiten het centrum van Haute-Nendaz, midden in de natuur, op de benedenverdieping van een chalet uit 1930 dat in 2018 volledig werd gerenoveerd. Het opklapbed maakt ruimte vrij en u wordt wakker met een uitzicht van 48 km over het Rhônedal.\n\nIn de winter zorgen de open haard en vloerverwarming voor warmte; in de zomer nodigt het natuurstenen terras uit om te genieten van het dal en de sterren. Met ongeveer 29 m² is de studio volledig zelfstandig, met eigen ingang, badkamer, keuken en slaaphoek.\n\nOp 1,5 km van de stoeltjeslift van Tracouet en het centrum. Toerskiërs bereiken het gebied 4 Vallées vanuit de tuin; in de zomer starten er talrijke wandelpaden en wandelingen langs de bisses in de buurt. Winterbanden zijn verplicht van november tot april.",
    },
    maxGuests: 2,
    bedrooms: 0,
    bathrooms: 1,
    surfaceM2: 29,
    floor: "Niveau jardin",
    amenities: ["wifi", "fireplace", "parking", "balcony", "mountainView"],
    location: { lat: 46.17794, lng: 7.31021, address: "1997 Haute-Nendaz, Valais" },
  },
  {
    id: "apt-perce-neige-21",
    slug: "perce-neige-21",
    sortOrder: 2,
    room: "r3",
    title: { fr: "Perce Neige 21", en: "Perce Neige 21", nl: "Perce Neige 21" },
    summary: {
      fr: "Appartement de 65 m² au pied de la télécabine de Tracouet, jusqu'à 6 personnes, avec balcon privé et casier à ski.",
      en: "65 m² apartment at the foot of the Tracouet gondola, sleeping up to 6, with a private balcony and a ski locker.",
      nl: "Appartement van 65 m² aan de voet van de Tracouet-gondel, voor maximaal 6 personen, met privébalkon en skilocker.",
    },
    description: {
      fr: "Perce Neige 21 est un appartement de 65 m² récemment rénové, situé au pied des pistes et à 20 m du départ de la télécabine Tracouet / Nendaz — pas besoin de voiture ni de bus.\n\nIl accueille jusqu'à 6 personnes : une chambre double, un lit double pliant dans le salon et deux lits superposés dans le couloir spacieux. La cuisine moderne entièrement équipée ouvre sur la salle à manger et un grand salon. La salle de bain dispose d'une douche à l'italienne, d'un lavabo et de WC ; un second WC séparé complète le logement.\n\nUn balcon privé avec table et chaises ainsi qu'un casier à ski sont à votre disposition.\n\nÀ noter : le linge de lit et deux serviettes par personne sont proposés en option (30 CHF/personne, à régler sur place). Merci de nous indiquer vos besoins lors de la réservation.",
      en: "Perce Neige 21 is a recently renovated 65 m² apartment at the foot of the slopes, just 20 m from the Tracouet / Nendaz gondola — no car or bus needed.\n\nIt sleeps up to 6: a double bedroom, a folding double bed in the living room and two bunk beds in the spacious hallway. The fully equipped modern kitchen opens onto the dining area and a large living room. The bathroom has a walk-in shower, basin and WC; a second separate WC completes the apartment.\n\nA private balcony with table and chairs and a ski locker are at your disposal.\n\nPlease note: bed linen and two towels per person are available as an option (CHF 30/person, payable on site). Let us know your needs when booking.",
      nl: "Perce Neige 21 is een onlangs gerenoveerd appartement van 65 m² aan de voet van de pistes, op slechts 20 m van de gondel Tracouet / Nendaz — geen auto of bus nodig.\n\nHet biedt plaats aan maximaal 6 personen: een tweepersoonsslaapkamer, een opklapbaar tweepersoonsbed in de woonkamer en twee stapelbedden in de ruime gang. De volledig uitgeruste moderne keuken geeft uit op de eethoek en een grote woonkamer. De badkamer heeft een inloopdouche, wastafel en wc; een tweede aparte wc maakt het appartement compleet.\n\nEen privébalkon met tafel en stoelen en een skilocker staan tot uw beschikking.\n\nLet op: beddengoed en twee handdoeken per persoon zijn optioneel verkrijgbaar (CHF 30/persoon, ter plaatse te betalen). Laat ons uw wensen weten bij het boeken.",
    },
    maxGuests: 6,
    bedrooms: 1,
    bathrooms: 2,
    surfaceM2: 65,
    floor: "",
    amenities: ["wifi", "balcony", "skiStorage", "dishwasher", "mountainView"],
    location: { lat: 46.18092, lng: 7.29087, address: "Tracouet, 1997 Haute-Nendaz, Valais" },
  },
  {
    id: "apt-studio-la-petite-marmotte",
    slug: "studio-la-petite-marmotte",
    sortOrder: 3,
    room: "r4",
    title: {
      fr: "Studio La petite marmotte",
      en: "Studio La petite marmotte",
      nl: "Studio La petite marmotte",
    },
    summary: {
      fr: "Studio douillet pour deux au cœur de la station de Haute-Nendaz, à quelques pas des commerces et de la télécabine. Tout est inclus.",
      en: "Cosy studio for two in the heart of Haute-Nendaz, steps from the shops and the gondola. Everything is included.",
      nl: "Gezellige studio voor twee in het hart van Haute-Nendaz, op een steenworp van de winkels en de gondel. Alles is inbegrepen.",
    },
    description: {
      fr: "Nid douillet pour deux au centre de la station de Haute-Nendaz. Plutôt que d'entasser quatre personnes dans un studio, nous avons choisi un logement plus confortable pour deux.\n\nIl dispose d'un lit double escamotable électrique (140 cm), de deux fauteuils haut de gamme, d'une grande cuisine, d'une salle de bain avec baignoire et de nombreux rangements.\n\nPendant vos vacances, pas besoin de voiture : boulangerie et supermarché à 20 m, magasin de sport à 100 m et télécabine à 300 m.\n\nTout est inclus dans le prix : draps, serviettes et taxe de séjour — rien à payer sur place.",
      en: "A cosy nest for two in the centre of the Haute-Nendaz resort. Rather than squeezing four people into a studio, we chose a more comfortable space for two.\n\nIt has an electric fold-away double bed (140 cm), two high-end armchairs, a large kitchen, a bathroom with a bathtub and plenty of storage.\n\nDuring your holiday you won't need a car: a bakery and supermarket are 20 m away, a sports shop 100 m and the gondola 300 m.\n\nEverything is included in the price: bed linen, towels and the tourist tax — nothing to pay on site.",
      nl: "Een gezellig nest voor twee in het centrum van het resort Haute-Nendaz. In plaats van vier personen in een studio te proppen, kozen we voor een comfortabelere ruimte voor twee.\n\nDe studio heeft een elektrisch opklapbaar tweepersoonsbed (140 cm), twee hoogwaardige fauteuils, een grote keuken, een badkamer met ligbad en veel bergruimte.\n\nTijdens uw vakantie heeft u geen auto nodig: bakker en supermarkt op 20 m, sportwinkel op 100 m en de gondel op 300 m.\n\nAlles is inbegrepen in de prijs: beddengoed, handdoeken en toeristenbelasting — niets ter plaatse te betalen.",
    },
    maxGuests: 2,
    bedrooms: 0,
    bathrooms: 1,
    surfaceM2: 20, // ESTIMATE — not stated on the listing; confirm with owner
    floor: "",
    amenities: ["wifi", "dishwasher"],
    location: { lat: 46.18109, lng: 7.29468, address: "Centre station, 1997 Haute-Nendaz, Valais" },
  },
];

function buildPayload(a) {
  const images = cloud[a.room] ?? [];
  if (!images.length) throw new Error(`No Cloudinary images for ${a.slug} (${a.room})`);
  return {
    id: a.id,
    slug: a.slug,
    sortOrder: a.sortOrder,
    title: a.title,
    summary: a.summary,
    description: a.description,
    images,
    maxGuests: a.maxGuests,
    bedrooms: a.bedrooms,
    bathrooms: a.bathrooms,
    surfaceM2: a.surfaceM2,
    floor: a.floor,
    amenities: a.amenities,
    pricePerNight: 0, // placeholder — real prices still owed by owner
    location: a.location,
    practical: { checkIn: "16:00", checkOut: "10:00", rules: RULES },
  };
}

async function main() {
  // 1. Login
  const loginRes = await fetch(`${SITE}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  });
  if (!loginRes.ok) throw new Error(`login failed: ${loginRes.status}`);
  const cookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0];
  if (!cookie.startsWith("inalpes_session=")) throw new Error("no session cookie");
  console.log("✅ logged in");

  // 2. Snapshot current apartments
  const before = await (
    await fetch(`${SITE}/api/admin/apartments`, { headers: { cookie } })
  ).json();
  const demoIds = before.map((a) => a.id);
  console.log(`current apartments: ${demoIds.join(", ")}`);

  // 3. Create/replace the 4 real listings FIRST (so the site is never empty)
  for (const a of APARTMENTS) {
    const payload = buildPayload(a);
    const res = await fetch(`${SITE}/api/admin/apartments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`POST ${a.slug} → ${res.status}: ${JSON.stringify(body)}`);
    console.log(`✅ upserted ${a.slug} (${payload.images.length} photos)`);
  }

  // 4. Delete the demo apartments (only the old demo ids, not our new ones)
  const newIds = new Set(APARTMENTS.map((a) => a.id));
  for (const id of demoIds) {
    if (newIds.has(id)) continue;
    const res = await fetch(`${SITE}/api/admin/apartments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { cookie },
    });
    if (!res.ok) throw new Error(`DELETE ${id} → ${res.status}`);
    console.log(`🗑️  deleted demo ${id}`);
  }

  // 5. Verify published state
  const after = await (await fetch(`${SITE}/api/content?type=apartments`)).json();
  console.log(`\n📦 published apartments.json now has ${after.length}:`);
  after
    .sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0))
    .forEach((a) =>
      console.log(
        `   ${a.slug} — ${a.images.length} imgs — CHF ${a.pricePerNight} — ${a.maxGuests}p`,
      ),
    );
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
