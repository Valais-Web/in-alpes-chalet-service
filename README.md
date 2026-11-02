# In-Alpes Chalet Services

**Site : [in-alpes.ch](https://in-alpes.ch)**

Site de location de vacances et de gérance de résidences secondaires pour
**In-Alpes Chalet Services Sàrl**, à Haute-Nendaz (Valais, Suisse), au cœur des
4 Vallées.

## In-Alpes

Fondée en 2020, In-Alpes s'adresse à deux publics :

- **Les vacanciers**, qui louent l'un des appartements gérés par l'entreprise :
  accueil en personne, logements propres avec lits faits, conseils sur place.
  Note moyenne de 4,95/5 sur Airbnb.
- **Les propriétaires**, qui confient leur résidence secondaire à un seul
  interlocuteur : location, ménage, blanchisserie, suivi de chantier, clés et
  colis, jardinage, déneigement.

## Ce que fait la plateforme

**Côté public** (français, anglais, néerlandais)

- Présentation de l'entreprise et des services de gérance
- Fiches logements : galerie, équipements, carte, calendrier de disponibilité
- Demande de réservation en ligne : une demande, jamais une confirmation
  automatique. Les dates sont pré-réservées 48 h en attendant la réponse.
- Formulaire de contact, avis voyageurs, offre −10 % dès 7 nuits

**Côté admin** (réservé au propriétaire)

- Gestion des logements en trois langues, photos hébergées sur Cloudinary, import
  d'une annonce Airbnb existante
- Calendrier des disponibilités, éditable par plages
- Suivi des demandes : confirmer, refuser, archiver
- Synchronisation bidirectionnelle avec les calendriers Airbnb (iCal), avec alerte
  en cas de double réservation

Les emails transactionnels (propriétaire et voyageur) partent via Resend.

## Architecture

| Couche          | Outil                                            |
| --------------- | ------------------------------------------------ |
| Front           | Vite, React, TypeScript, TanStack Start, Tailwind |
| Hébergement     | Netlify (site, Functions, Blobs, tâches planifiées) |
| Base de données | Neon (Postgres, région UE/Francfort)             |
| Images          | Cloudinary                                       |
| Emails          | Resend                                           |

## Développement

Prérequis : Node 22, npm.

```sh
npm install
cp .env.example .env   # toutes les variables sont optionnelles en local
npm run dev            # l'adresse locale s'affiche dans le terminal
```

Sans variables d'environnement, chaque service bascule sur un mode de secours
local (base en mémoire, emails affichés dans la console). Pour travailler contre
les vraies Netlify Functions, lancer `netlify dev` avec `VITE_API_MODE=live`.

| Commande        | Rôle                     |
| --------------- | ------------------------ |
| `npm run dev`   | serveur de développement |
| `npm run build` | build de production      |
| `npm test`      | tests (Vitest)           |
| `npm run lint`  | ESLint                   |

Repères dans le code :

- `src/`: le site et l'admin (`src/routes`, `src/admin`, `src/data` pour l'accès
  aux données, `src/i18n` pour les traductions)
- `netlify/functions`, `netlify/lib`: le backend (détails dans
  [netlify/README.md](netlify/README.md))
- `db/`: schéma Postgres et migrations
- `shared/`: types communs au client et au serveur
- `CLAUDE.md`: brief, règles de design et décisions du projet

## Déploiement

Chaque push sur `main` déclenche un déploiement Netlify. La configuration se fait
par variables d'environnement Netlify ; la liste est dans
[.env.example](.env.example).
