# CLAUDE.md — In-Alpes Chalet Services

Fichier de contexte pour Claude Code. Lis-le en entier avant toute action sur ce dépôt.

---

## 1. Résumé du projet

Site de **location de vacances** et de **services de gérance** pour **In-Alpes Chalet Services Sàrl**, à **Haute-Nendaz (Valais, Suisse)**. Trois appartements. Deux audiences distinctes à adresser :

- **Locataires** : réservent un logement.
- **Propriétaires** : confient la gestion de leur résidence secondaire.

Le site présente l'entreprise, vend les locations en ligne (demande de réservation, pas confirmation instantanée), et fournit un espace admin au propriétaire pour gérer logements, disponibilités et demandes. Trilingue FR / EN / NL.

---

## 2. Pile technique (verrouillée)

- **Frontend** : Vite + React + TypeScript + Tailwind. Build statique.
- **Hébergement** : Netlify (site statique + Netlify Functions en TypeScript + Netlify Blobs + Scheduled Functions si besoin).
- **Base de données** : Neon (Postgres serverless, scale-to-zero, réveil automatique). **Région EU (Francfort)** pour les données des voyageurs (nLPD/RGPD).
- **Auth admin** : mot de passe partagé unique + session signée (cookie HttpOnly HMAC), vérifiée côté serveur. Pas de service tiers : le site n'a qu'un seul admin (Bart), 1-2 au plus à terme, ce qui ne justifie pas Neon Auth. Décision du propriétaire (2026-07), remplace le choix initial Neon Auth. `ADMIN_PASSWORD` + `SESSION_SECRET`.
- **Images** : Cloudinary (upload, optimisation, WebP, CDN). Neon ne stocke que les URLs.
- **Emails** : Resend (transactionnel). Domaine in-alpes.ch à vérifier (SPF/DKIM) avant lancement.
- **Domaine** : in-alpes.ch (actuellement chez Infomaniak, DNS à repointer vers Netlify).

### Interdits absolus

- **Pas de Supabase**, sous aucune forme (base, auth, stockage, edge functions). Décision prise après analyse ; ne pas revenir dessus.
- **Pas de backend Ruby/Rails.** Le propriétaire du projet code habituellement en Rails, mais ce projet est full JS/TS. Ne pas introduire de serveur Rails, ni aucun serveur long-running à maintenir.
- **Pas de cron keep-alive** pour maintenir une base éveillée. Neon se réveille seul.
- **Pas d'images en base** (ni `bytea`, ni commit dans git). Elles vont sur Cloudinary.

---

## 3. Principe d'architecture (non négociable)

**Le site public ne requête jamais Neon.** Il lit des JSON publiés depuis Netlify Blobs. Neon est la source de vérité, écrite uniquement par les Netlify Functions et l'admin.

Raison : le propriétaire refuse toute maintenance manuelle. Neon dort après 5 min d'inactivité et se réveille seul en ~0,5s, sans restauration manuelle. En gardant Neon hors du chemin critique public, un endormissement ou une panne ne casse ni la navigation ni le calendrier : le public continue sur le dernier JSON. Seule une nouvelle soumission échouerait temporairement, ce qui est récupérable et acceptable.

---

## 4. Modèle de données (Neon)

```
apartments(
  id, slug, sort_order,
  name_fr, name_en, name_nl,
  short_desc_fr, short_desc_en, short_desc_nl,
  long_desc_fr, long_desc_en, long_desc_nl,
  guests, bedrooms, bathrooms, size_m2, floor,
  amenities jsonb,
  rules_fr, rules_en, rules_nl,
  check_in, check_out,
  cover_image_url, gallery_image_urls jsonb,   -- URLs Cloudinary
  created_at, updated_at
)

availability(
  id, apartment_id, date,
  status,          -- available | unavailable | pending | blocked
  expires_at       -- non nul uniquement pour 'pending' (pré-réservation)
)

booking_requests(
  id, apartment_id,
  guest_name, email, phone,
  arrival, departure, guests, message,
  status,          -- nouvelle | en_cours | repondu | archive
  created_at
)

-- Pas de table de comptes : un mot de passe partagé unique (ADMIN_PASSWORD),
-- session via cookie signé HMAC (SESSION_SECRET). Voir netlify/lib/auth.ts.
```

---

## 5. Flux de données

- **Admin édite un logement** → écrit Neon → régénère `apartments.json` vers Netlify Blobs. Pas de rebuild du site.
- **Admin édite les disponibilités** → écrit Neon → régénère `availability.json` vers Blobs.
- **Soumission d'une demande (public)** → Netlify Function `submit-booking` : valide (Zod), insère la demande (`status = nouvelle`), pose une pré-réservation (`status = pending`, `expires_at = now + 48h`), régénère `availability.json`, envoie deux emails via Resend (propriétaire + demandeur), retourne le succès.
- **Lecture publique** → le site lit `apartments.json` et `availability.json` depuis Blobs. Jamais Neon.

### Expiration des pré-réservations (48h)

`expires_at` est inclus dans `availability.json`. Le client traite comme **libre** toute pré-réservation dont `expires_at` est dépassé. Calcul à la lecture, côté client. **Aucun cron, aucune tâche manuelle.** Raison : empêcher qu'un bot ou un plaisantin gèle le calendrier avec des demandes fantômes jamais confirmées.

Une pré-réservation ne devient `blocked`/`unavailable` que lorsque le propriétaire **confirme** la demande dans l'admin.

---

## 6. Espace admin (propriétaire unique)

Derrière le login mot de passe (cookie de session signé). **Vérifier la session côté serveur sur chaque écriture et chaque upload**, jamais seulement masquer côté client.

- **Tableau de bord** : aperçu logements + demandes récentes.
- **Logements** : CRUD, champs bilingues FR/EN/NL, upload d'images (Cloudinary), réordonnancement de la galerie. Sauvegarde → régénère `apartments.json`.
- **Disponibilités** : calendrier éditable, sélection de plages (libre / occupé / pré-réservé / bloqué). Écrit Neon → régénère `availability.json`.
- **Demandes** : liste filtrable par statut (nouvelle / en cours / répondu / archivé), actions Confirmer (passe la plage en `unavailable`) / Décliner (libère la plage) / Archiver.

---

## 7. Contenu du brief client (réponses de Bart Goes)

Coordonnées : In-Alpes Chalet Services Sàrl, Haute-Nendaz (Valais). Tél. 077 511 59 09. Email info@in-alpes.ch. Domaine in-alpes.ch.

**Présentation** : entreprise de location de vacances et d'entretien des résidences de tourisme à Haute-Nendaz.

**Histoire** : fondée début 2020. Deux côtés. Côté locataires : contact personnel, assistance rapide sur place. Côté propriétaires : être la solution unique (location, blanchisserie, entretien, jardinage, déneigement).

**Services — locataires** : arrivée flexible et en personne ; logements vraiment propres avec lits préparés ; information locale sur événements et activités.

**Services — propriétaires** : location de logement ; nettoyage et entretien ; blanchisserie des draps et serviettes ; suivi de chantier ; service clé / réception des colis.

**Différenciation — locataires** : logements de qualité ; flexibilité arrivées/départs ; pas de frais cachés. **Propriétaires** : flexibilité et rapidité de l'assortiment de services ; contact unique et facile.

**Offre** : à partir de 7 nuits, -10% sur la location.

**Tarification** : au forfait. Prix publics affichés.

**Processus de réservation** : 1. prise de contact avec demande ; 2. réponse initiale avec détails et offre ; 3. paiement ; 4. confirmation ; 5. préparation du logement ; 6. séjour ; 7. contrôle et nettoyage.

**Public** : particuliers. **Client idéal** : couples ou familles pour Nendaz (locataires) ; propriétaire de résidence secondaire cherchant à se simplifier la vie.

**Concurrents** : Altipik (altipik.ch), Espace Vacances (espace-vacances.ch).

**Preuve sociale** : 596 avis Airbnb, moyenne 4,95/5. Source des avis : Airbnb. Aucune certification/label.

**Logo** : existant. **Couleurs** : noir, blanc, verts.

**Style** : moderne et épuré, grands espaces blancs, polices simples, couleurs neutres avec touches de couleur.

**Aime** : le design de mediatheque.ch, mais **pas le rouge**. **N'aime pas** : les sites avec vidéo embarquée, ou qu'il faut scroller 30 fois.

**But du site** : présenter l'entreprise et ses services ; vendre en ligne.

**Pages demandées** : Accueil, Services, Produits, Contact. (Ajouter : page par logement via template, et l'espace admin.)

**Textes** : pas prêts, besoin d'aide à la rédaction. **Images** : fournies par le client.

**Langues** : Français, Anglais, Flamand (NL).

**Fonctionnalités indispensables** : formulaire de contact ; calendrier de réservation en ligne.

**SEO — mots-clés** : vacances, Haute-Nendaz, 4 Vallées.

**Maintenance** : le client gère lui-même, mises à jour occasionnelles. Aucune maintenance déléguée.

---

## 8. Architecture de l'information (pages)

- **Accueil** : hero + preuve sociale (4,95/5 sur 596 avis Airbnb) + double entrée (Louer un logement / Confier la gestion de mon bien) ; aperçu logements (cartes) ; aperçu services ; avis ; bandeau offre -10% dès 7 nuits ; présentation courte de l'entreprise ; bloc contact. Court, pas de scroll interminable.
- **Produits** : les logements (cartes), avec prix publics et accès à la réservation.
- **Page logement (template)** : galerie, titre, résumé, faits clés (voyageurs, chambres, salles de bain, m², étage), équipements, description longue, calendrier de disponibilité, formulaire de demande, infos pratiques (check-in/out, règles), emplacement carte.
- **Services** : services aux propriétaires.
- **Contact** : formulaire + coordonnées + adresse.
- **Admin** : voir section 6.

---

## 9. Design

Le branding suit le **design system In-Alpes** (importé depuis Claude Design, `SKILL.md` / `readme.md` du projet). Appliqué dans `src/styles.css` (tokens) et les composants.

- **Palette** : noir, blanc, vert en accent (jamais un aplat dominant). **Aucun rouge sur le site public.** Encre `#141414`, fond `#FFFFFF`, fond secondaire `#F5F5F4`, vert sapin `#2F6B4F` (accent primaire — boutons, liens, chips), vert alpin `#4CA47B` (CTA vif/hover), sapin pressé `#275A43`, gris `#6B6B6B`, bordures `#E4E4E2`, teintes vertes douces `#E7F1EC` / `#F2F8F5` (chips d'icônes, badges). Étoiles de notation en encre `#141414`. **Exception (décision propriétaire, 2026-07)** : les badges de statut de l'**admin** sont colorés — vert (acceptée), **rouge** (refusée), ambre (en attente), gris (archivée). Voir `src/admin/StatusBadge.tsx`.
- **Typographie** : deux familles max. **Jost** (géométrique) pour les titres/display et l'eyebrow ALL-CAPS (tracking large, `-0.02em` sur les grands titres) ; **Hanken Grotesk** pour le corps (lisible FR/EN/NL). Wordmark en Jost majuscules espacées.
- **Style** : moderne, épuré, beaucoup d'espaces blancs (rythme ~96px desktop / 56px mobile). **Direction angulaire (mediatheque.ch) : coins carrés — `--radius-*` tous à 0** (cartes, boutons, badges, inputs). La structure repose sur la bordure 1px `#E4E4E2` plutôt que sur l'ombre ; ombres discrètes (`--shadow-soft` au repos, `--shadow-lift` au survol/lift `translateY(-3px)`). Photographie mise en avant, ambiance alpine boutique.
- **Boutons** : carrés. Primaire = fill vert sapin (hover sapin-700) ; `bright` = vert alpin (CTA réservation) ; secondaire = contour encre ; tertiaire = lien texte vert ; on-dark = blanc. Pas de scale/bounce.
- **Icônes** : Lucide, trait fin (~1.8), pas d'emoji ni de glyphes unicode.
- **Interdits** : pas de vidéo embarquée, pas de page interminable, pas de rouge, pas de coins arrondis (sauf contrôles de formulaire circulaires natifs). Mobile-first.
- Le logo In-Alpes (badge alpin noir/blanc) est dans `src/assets/logo-ink.png` (sur clair) et `logo-white.png` (sur foncé).

---

## 10. i18n

- Langues : **FR (défaut), EN, NL**. Sélecteur visible.
- Toutes les chaînes d'interface et de contenu passent par le système i18n. Le contenu des logements est stocké en trois langues dans Neon (champs `_fr` / `_en` / `_nl`).
- Prévoir l'expansion de texte dans les mises en page.

---

## 11. Bloqueurs de lancement

1. ✅ Domaine in-alpes.ch vérifié dans Resend (SPF/DKIM) — fait. Envoi depuis `info@in-alpes.ch`.
2. ✅ Neon en région EU (Francfort) — fait.
3. Auth admin : définir un `ADMIN_PASSWORD` fort + `SESSION_SECRET` aléatoire dans l'env de prod ; **ne jamais** poser `ALLOW_DEV_OPEN_AUTH`. Session vérifiée côté serveur sur écritures/uploads (déjà implémenté).
4. ✅ Tier gratuit Cloudinary confirmé pour les 3 logements — fait.
5. Repointer le DNS de in-alpes.ch d'Infomaniak vers Netlify, SSL Let's Encrypt.

---

## 12. Variables d'environnement (attendues)

```
NEON_DATABASE_URL
ADMIN_PASSWORD          # mot de passe admin partagé (≥12 caractères exigé en prod)
SESSION_SECRET          # signe le cookie de session (≥24 caractères exigé en prod)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY
OWNER_NOTIFICATION_EMAIL # info@in-alpes.ch (info@in-alpes.ch reçoit toujours une copie)
NETLIFY_BLOBS_*          # selon config
PREBOOKING_TTL_HOURS     # durée d'un hold public, défaut 48
RETENTION_MONTHS         # anonymisation du PII après le départ, défaut 12
```

Aucun secret côté client. Uniquement les clés publiques nécessaires (ex. cloud name Cloudinary, clé de widget upload signé côté serveur).

---

## 13. Règles de travail dans ce dépôt

- **TypeScript partout**, y compris les Netlify Functions. Pas de Ruby/Rails.
- **Couche d'accès aux données isolée** (`src/data/`) : les composants ne connaissent jamais l'origine (JSON Blobs en lecture, functions en écriture). Un seul point à modifier si la source change.
- **Système métrique** partout (m², CHF, dates ISO).
- **Contenu en français d'abord**, puis EN et NL.
- **Valider les entrées** (Zod) dans toute function qui écrit.
- **Demander avant d'ajouter une dépendance** ou un service tiers non listé ici.
- Le formulaire de réservation crée une **demande**, jamais une confirmation. Toujours l'indiquer clairement à l'utilisateur.

---

## 14. Décisions ouvertes (à trancher avec le client)

- Le contenu rédactionnel FR/EN/NL n'existe pas encore ; prévoir des placeholders et un plan de rédaction.
- L'adresse postale exacte du client est à confirmer (saisie douteuse dans le brief).
- Confirmer qui, en pratique, ajoute un nouvel appartement (le propriétaire, via l'admin) et à quelle fréquence, pour calibrer l'effort mis dans le CRUD d'ajout.

---

## 15. Sécurité & intégrité (implémenté, 2026-07)

Durci suite à une revue de sécurité, testé avec **vitest** (`npm test`). Détail dans `netlify/lib/` et `db/`.

- **Anti-double-réservation en base** : contrainte d'exclusion `availability_no_overlap` (btree_gist) interdit tout chevauchement de plages `booked`/`blocked` d'un même logement, même sous concurrence. Les `prebooked` (soft holds) ne bloquent pas et peuvent se chevaucher (§5). Un séjour occupe les nuits **`[arrivée, départ-1]`** (le jour du départ reste libre → rotation le même jour permise). Helpers dans `netlify/lib/dates.ts`.
- **Réservation transactionnelle** : `submit-booking` vérifie la dispo côté serveur (chevauchement `booked`/`blocked`, capacité vs `maxGuests`) puis insère demande + hold en une transaction (`sql.transaction`) ; renvoie 409/400. La confirmation admin passe la plage en `booked` de façon atomique et refuse un chevauchement. Transitions de statut validées serveur (accepté⇔confirm, refusé⇔decline).
- **Public ne requête jamais Neon** (§3, désormais appliqué) : `content.ts` sans fallback Neon (sert une liste vide si Blob absent) ; `putJson` remonte l'échec en prod (fallback mémoire = dev uniquement).
- **Auth** : cold-start exige des secrets forts en prod sinon échec ; session liée au mot de passe (rotation ⇒ invalidation) ; vérification d'`Origin` sur les mutations ; `Cache-Control: no-store` sur login/admin.
- **Anti-bot** : honeypot (champ `company`) sur formulaires publics + throttling best-effort par IP (Netlify Blobs) sur login/contact/réservation. Pas de service tiers.
- **En-têtes** : CSP + HSTS + nosniff + Referrer/Permissions-Policy dans `netlify.toml`.
- **Suppression logement = RESTRICT** : impossible de supprimer un logement lié à des demandes (l'admin archive à la place).
- **Rétention nLPD/RGPD** : Scheduled Function quotidienne (`retention.ts`) anonymise le PII des réservations `RETENTION_MONTHS` (défaut 12) après le départ et purge les holds expirés (l'expiration côté public reste paresseuse, §5).
- **Validation** (`netlify/lib/validation.ts`) : dates calendaires réelles, pas d'arrivée passée, bornes lat/lng, images = URLs Cloudinary HTTPS ; contraintes CHECK miroir en base.
- **Types partagés** : `shared/domain.ts` importé par le client et le serveur (fin de la duplication).

Migrations DB appliquées : `db/add-booking-integrity.mjs`, `db/add-domain-constraints.mjs`, `db/set-booking-restrict.mjs`.
Gestionnaire de paquets : **npm** (bun retiré). Cartes Google Maps par logement dans `src/content/maps.ts`.
