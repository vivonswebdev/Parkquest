# ParkQuest — Architecture, décisions et plan

Ce document répond au « prompt maître » (§22) : architecture, arborescence, dépendances,
migrations, rôles/RLS, comptes nécessaires, décisions, plans des Sprints 0 et 1.

---

## 1. Résumé de l'architecture (20 points)

1. **Next.js 16 (App Router) + TypeScript strict**, Server Components par défaut ; Client Components uniquement pour la carte, le GPS, les formulaires, les quiz/défis et les panneaux interactifs.
2. **Routes localisées** `/{fr|nl|en|es|de}/…` via **next-intl 4** (`src/proxy.ts`, convention Next 16 qui remplace `middleware.ts`).
3. **Deux sources de données derrière une même interface** `ContentRepository` : **démo** (fichiers TS locaux) et **Supabase** (RLS appliquée). Bascule automatique selon les variables d'environnement.
4. **Source unique des données de démo** (`src/features/demo/demo-data.ts`) → le script `generate-seed.ts` produit `supabase/seed.sql` avec les **mêmes UUID** : l'app démo et la base affichent exactement les mêmes contenus.
5. **Supabase** : PostgreSQL 15+ / **PostGIS** (`geography(Point|LineString|Polygon, 4326)`), Auth (lien magique), Storage (2 buckets), RLS partout.
6. **Traductions de contenu en tables dédiées** (`*_translations`, jamais de `name_fr`), repli **langue demandée → anglais → langue principale du parc**, en SQL (`nearby_spots`) comme en TS (`pickTranslation`).
7. **Multi-parcs dès le départ** : tout contenu métier porte `park_id` ; rôles `PARK_ADMIN / EDITOR / MODERATOR` scopés par parc.
8. **Logique de jeu côté serveur uniquement** : fonctions SQL `SECURITY DEFINER` (`discover_spot`, `submit_quiz_answer`, `complete_challenge`, `complete_visit`…). Aucune écriture directe possible sur points, découvertes, tentatives.
9. **Points = journal immuable** `point_transactions` avec index unique d'idempotence (une source ne rapporte qu'une fois). Jamais de `total_points` modifiable.
10. **Badges** évalués automatiquement côté serveur après chaque gain (critères : spots, quiz, photos, distance, parcours, défis).
11. **Validation GPS jamais automatique** : proximité + précision ≤ 25 m + rayon du spot, puis geste explicite « Découvrir ce spot », validation serveur. Mode **sans GPS** (déclaratif) toujours disponible.
12. **Confidentialité** : aucune coordonnée brute stockée (seulement distance + précision), aucune position visible par un tiers, pseudonyme généré par défaut, profil public minimal via une vue dédiée.
13. **La bonne réponse d'un quiz ne quitte jamais le serveur** (privilèges de colonnes sur `quiz_answers.is_correct` + test e2e).
14. **Server Actions validées par Zod** pour toutes les mutations ; la clé `service_role` n'est importable que côté serveur (`server-only`).
15. **Carte** : MapLibre GL JS (chargé dynamiquement) sur fond OpenStreetMap (OpenFreeMap, sans clé) habillé au thème, vue 3D (bâtiments, relief Terrain Tiles, ciel), satellite Mapbox optionnel ; **carte de repli intégrée** (même API `MapHandle`) si WebGL absent ou fond injoignable.
16. **Design system** Tailwind v4 + tokens CSS (thème sombre premium par défaut, **thème clair** pour blog / infos pratiques / admin), composants façon shadcn/ui, icônes lucide-react.
17. **PWA** : manifest, icônes, service worker (réseau d'abord pour les pages, cache pour les statiques, page hors ligne) ; les actions serveur ne sont **jamais** mises en cache ni rejouées.
18. **Mode démo honnête** : sans base, les règles de jeu s'exécutent côté serveur mais rien n'est enregistré ; l'UI affiche « Mode démo » et un badge « Démo » sur chaque contenu non validé.
19. **Tests** : 30 assertions SQL (RLS + règles de jeu) sur un vrai PostgreSQL/PostGIS, e2e Playwright de la boucle de visite, contrôle de parité des 5 fichiers de traduction, lint + typecheck.
20. **Compatible Vercel** : aucun état serveur local, pages statiques quand c'est possible, dynamiques dès qu'une session Supabase est lue.

---

## 2. Arborescence

```
parkquest/
├── docs/                      ARCHITECTURE.md · DEMO_DATA_VALIDATION.md
├── messages/                  fr.json (référence) · nl · en · es · de
├── public/
│   ├── brand/mark.svg         logo original
│   ├── demo/                  illustrations SVG originales (spots, parcs, parcours)
│   ├── icons/                 icônes PWA (générées)
│   └── sw.js                  service worker
├── scripts/                   generate-seed · generate-illustrations · generate-icons
│                              check-i18n · db-test.sh · screenshot.mjs
├── supabase/
│   ├── config.toml
│   ├── migrations/            0100 → 1300 (voir §4)
│   ├── seed.sql               GÉNÉRÉ depuis src/features/demo/demo-data.ts
│   └── tests/                 supabase_shim.sql · rls_and_game_test.sql
├── tests/e2e/                 visit-loop.spec.ts (Playwright)
└── src/
    ├── proxy.ts               next-intl + rafraîchissement de session Supabase
    ├── i18n/                  routing · navigation · request
    ├── app/
    │   ├── layout.tsx · not-found.tsx · manifest.ts · icon.png
    │   ├── api/auth/callback/route.ts
    │   └── [locale]/
    │       ├── page.tsx                       Accueil
    │       ├── parks/page.tsx                 Explorer les parcs du monde
    │       ├── parks/[parkSlug]/page.tsx      Page parc
    │       │   ├── map/                       Carte immersive
    │       │   ├── spots/[spotSlug]/          Fiche spot (découverte, quiz, défi)
    │       │   ├── trails/[trailSlug]/        Page parcours
    │       │   │   └── visit/                 Mode « suivre le parcours »
    │       │   ├── practical-info/            Infos pratiques (thème clair)
    │       │   └── plan/                      Planifier ma visite
    │       ├── challenges/ · profile/ · blog/ · blog/[slug]/ · community/
    │       ├── admin/ · auth/sign-in/ · legal/[doc]/ · offline/
    │       └── loading · error · not-found · [...rest]
    ├── components/
    │   ├── ui/        button · card · pill · progress · skeleton
    │   ├── layout/    bottom-nav · desktop-header · locale-switcher · network-status · footer
    │   ├── map/       park-map (switch) · maplibre-map · fallback-map · park-map-explorer
    │   ├── visit/     visit-runner
    │   ├── game/      discover-spot-card · quiz-card · challenge-card · progress-dashboard · …
    │   ├── park/ · parks/ · plan/ · content/ · shared/ · auth/ · brand/ · pwa/
    ├── ../features/demo/  demo-data.ts (SOURCE UNIQUE) · content/{ids,meise,platform}
    ├── hooks/         use-geolocation
    ├── lib/
    │   ├── domain/types.ts        types métier (records + types résolus)
    │   ├── data/                  repository · demo-repository · supabase-repository · loaders
    │   ├── game/                  demo-engine (serveur) · demo-progress (client)
    │   ├── supabase/              env · server · client · admin (server-only) · proxy
    │   └── geo · format · plan · i18n-content · validation · constants · utils
    └── server/        game-actions · auth-actions · progress   (Server Actions / lecture sécurisée)
```

---

## 3. Dépendances npm

**Runtime** : `next` 16 · `react` 19 · `next-intl` 4 · `@supabase/supabase-js` · `@supabase/ssr` ·
`maplibre-gl` 6 · `react-hook-form` · `zod` 4 · `@hookform/resolvers` · `lucide-react` ·
`class-variance-authority` · `clsx` · `tailwind-merge` · `@radix-ui/react-slot` · `server-only`.

**Dev** : `typescript` · `tailwindcss` 4 · `@tailwindcss/postcss` · `tw-animate-css` · `eslint` +
`eslint-config-next` · `supabase` (CLI) · `tsx` · `@playwright/test` · `@types/geojson`.

---

## 4. Migrations Supabase

| Fichier | Contenu |
|---|---|
| `0100_extensions_and_types` | postgis, pgcrypto, enums (rôles, statuts, types…), domaines `locale_code`/`slug`, trigger `updated_at` |
| `0200_profiles_and_roles` | `profiles`, `user_roles`, fonctions d'autorisation, création auto du profil (pseudonyme) |
| `0300_parks` | `parks` (+ emprise), `park_translations`, `park_practical_info` |
| `0400_spots` | `spot_categories(+translations)`, `spots` (geography Point, rayon de découverte), `spot_translations`, relations |
| `0500_trails` | `trails`, `trail_translations`, `trail_spots`, `trail_segments` (geography LineString), traductions des consignes |
| `0600_facilities` | `facilities`, `facility_translations` |
| `0700_quizzes_and_challenges` | quiz, réponses (une seule correcte), traductions, tentatives ; défis, traductions, validations |
| `0800_visits_and_gamification` | `visits`, `visit_spots` (sans coordonnées), `point_transactions` (idempotent), badges |
| `0900_community_and_articles` | `media`, `comments`, `comment_reports`, `user_favorites`, articles |
| `1000_rls_policies` | RLS sur **toutes** les tables + privilèges de colonnes |
| `1100_game_functions` | `nearby_spots`, `start_visit`, `update_visit`, `complete_visit`, `discover_spot`, `submit_quiz_answer`, `complete_challenge`, `review_challenge_completion`, `moderate_media`, `admin_adjust_points`, `get_my_stats`, `park_collection_progress`, `get_quiz_answer_key` |
| `1200_storage` | buckets `park-media` (public) et `user-photos` (privé, dossier = user id) |
| `1300_api_read_helpers` | colonnes générées lat/lng/GeoJSON pour l'API |

---

## 5. Rôles et stratégie RLS

| Rôle | Portée | Droits |
|---|---|---|
| `SUPER_ADMIN` | plateforme | tout, y compris nommer des SUPER_ADMIN |
| `PLATFORM_ADMIN` | plateforme | tous les parcs et rôles sauf SUPER_ADMIN |
| `PARK_ADMIN` | **un parc** | tout sur son parc ; nomme EDITOR / MODERATOR de son parc ; ajuste des points (tracé) |
| `EDITOR` | **un parc** | contenus de son parc (spots, parcours, quiz, défis, services, articles) |
| `MODERATOR` | **un parc** | photos, commentaires, signalements, validation des défis photo |
| `USER` | soi-même | profil, visites, découvertes, favoris, contenus propres |

Principes :
- Lecture publique = `PUBLISHED` **dans un parc** `PUBLISHED`. `DRAFT`/`ARCHIVED` = équipe du parc.
- Fonctions `has_park_role / can_edit_park / can_moderate_park / can_admin_park` (`SECURITY DEFINER`, `search_path=''`) pour éviter la récursion RLS.
- Traductions : politique « le parent est lisible/éditable » (sous-requête soumise à la RLS du parent).
- `visits`, `visit_spots`, `point_transactions`, `user_badges`, `quiz_attempts`, `challenge_completions` : **lecture propriétaire, aucune écriture client** (privilèges révoqués) — uniquement via les fonctions de jeu.
- Photo et commentaire utilisateur : insertion **forcée à `PENDING`**, visibles publiquement seulement une fois `APPROVED`.
- Vérifié par `supabase/tests/rls_and_game_test.sql` (ex. : un éditeur de Meise ne peut pas modifier Central Park ; un utilisateur ne peut pas se donner de points ni se promouvoir).

---

## 6. Comptes et clés nécessaires

| Service | Pour quoi | Clés / actions |
|---|---|---|
| **GitHub** | dépôt du code | créer un dépôt (ex. `parkquest`) et donner l'accès à Claude, ou indiquer lequel utiliser |
| **Supabase** | base, auth, stockage | créer un projet (région UE, ex. Francfort) → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement) ; activer l'auth e-mail (lien magique) et configurer l'URL de redirection `…/api/auth/callback` |
| **Mapbox** (optionnel) | vue satellite | compte gratuit → token public `pk.…` restreint aux domaines de l'app → `NEXT_PUBLIC_MAPBOX_TOKEN` |
| **OpenFreeMap** | fond OpenStreetMap | aucun compte ; pour du trafic important, envisager un fournisseur payant ou l'auto-hébergement (`NEXT_PUBLIC_MAP_STYLE_URL`) |
| **Vercel** | hébergement | importer le dépôt, renseigner les variables d'environnement, `NEXT_PUBLIC_APP_URL` = domaine final |
| PostHog (optionnel) | analytics | plus tard |

---

## 7. Décisions prises sans vous bloquer

1. **Next.js 16** (dernière version) : `proxy.ts` au lieu de `middleware.ts`, params asynchrones.
2. **Mode démo sans aucune clé** : le prototype tourne immédiatement ; Supabase et Mapbox s'activent par variables d'environnement.
3. **Langue par défaut `fr`**, préfixe de langue toujours présent dans l'URL. Langue principale de Meise = `nl`.
4. **Slugs non traduits** (`sequoia-geant`) : URLs stables entre langues, conformes aux exemples du brief.
5. **Découverte sans GPS** (déclarative) : ajoutée à la collection ; **demi-points** uniquement pendant une visite active, **0 point** hors visite. Validation GPS : précision ≤ 25 m **et** distance ≤ rayon du spot (35 m par défaut) → points pleins. GPS fiable à > 250 m → refus.
6. **Quiz** : points seulement si la **première** tentative est correcte (anti-devinette) ; la bonne réponse est révélée après réponse (pédagogique).
7. **Défi photo** : photo privée `PENDING`, points à la validation par un modérateur (+ 5 points « photo approuvée »).
8. **Niveau** = 1 niveau / 50 points (règle simple, ajustable).
9. **Illustrations SVG originales** générées par script (aucune photo sous droits, aucun élément copié des références).
10. **Carte de repli maison** plutôt qu'OpenStreetMap : aucune dépendance réseau ni clé, fonctionne partout.
11. **Favoris** stockés localement au MVP (table `user_favorites` prête pour le Sprint 3).
12. **Pages légales** : textes provisoires FR à faire valider juridiquement.
13. **Mode sombre / clair** : préférence Sombre / Clair / Système en `localStorage` + script inline avant rendu (pages statiques conservées, pas de cookie). Sans choix : app sombre + pages de lecture claires ; tout choix explicite s'applique partout.
14. **Distance parcourue** : calculée sur l'appareil (points GPS jamais envoyés), envoyée comme simple total borné.

---

## 8. Sprint 0 — Fondations ✅

- [x] Next.js 16, TypeScript strict, Tailwind v4, composants façon shadcn/ui, lucide-react
- [x] next-intl (5 langues, routes localisées, clés typées, contrôle de parité)
- [x] Design system sombre premium + thème clair, typographies Plus Jakarta Sans / Inter
- [x] Structure du projet, interface de données démo/Supabase
- [x] Supabase : 13 migrations, PostGIS, RLS, rôles, fonctions de jeu, storage
- [x] Seed généré (FR/NL/EN complet, ES/DE partiel)
- [x] Auth par lien magique (prête, active dès configuration)
- [x] Tests SQL (30 assertions), README, `.env.example`

## 9. Sprint 1 — Prototype visuel navigable ✅

- [x] Accueil mobile (hero, carte immersive du parc, collection, parcours, défis, mission famille, autres parcs)
- [x] Carte immersive (filtres, calques, orientation, ma position, fiche en bas d'écran, services, PMR)
- [x] Mode « suivre le parcours » (progression, prochain spot, consigne, découverte, quiz, défi, pause, quitter, écran de fin)
- [x] Fiche spot (photo immersive, faits, à propos, le saviez-vous, comment y aller, quiz, défi, photos, commentaires)
- [x] Défis & progression, Profil, Infos pratiques, Explorer les parcs du monde (recherche, filtres, carte mondiale à regroupement), Planifier ma visite, Blog, Communauté, Admin (aperçu)
- [x] Navigation basse mobile + en-tête desktop responsive
- [x] États : chargement, vide, erreur, 404, hors ligne, GPS refusé/indisponible/imprécis
- [x] PWA (manifest, icônes, service worker, page hors ligne)
- [x] E2E Playwright de la boucle de visite

## 10. Géolocalisation interactive & météo ✅

- `src/lib/game/rules.ts` → `proximityTier` : précis (≤ 10 m et ≤ 25 m), probable (≤ 25 m de précision),
  imprécis (> 25 m, jamais de validation GPS), loin. Le serveur (`discover_spot`) reste seul juge.
- `src/hooks/use-geolocation.ts` : `watchPosition` uniquement quand la carte / la visite est active,
  lissage, arrêt en arrière-plan (`visibilitychange`), simulation en mode démo.
- `src/lib/location-consent.ts` + `components/geo/location-consent-sheet.tsx` : pré-autorisation
  expliquée avant la demande du navigateur (choix mémorisé sur l'appareil).
- `src/lib/nearby.ts` + `components/geo/nearby-list.tsx` : « Autour de vous » (filtres, carte, fiche,
  guidage), recalcul après ~15 m ; en production `ContentRepository.listNearbySpots` → RPC PostGIS
  `nearby_spots` / `nearby_facilities` (migration `20260927001400`).
- `components/geo/guide-panel.tsx` : guidage flèche + distance + minutes (`/map?to=<spot>`).
- `src/lib/weather/` : Open-Meteo côté serveur (cache 30 min, 4 s max, jamais bloquant) ou prévision
  simulée en démo ; `WeatherCard` sur l'accueil, le parc et le parcours.
- Social / partage de position : documenté seulement → `docs/FUTURE_SOCIAL_AND_LOCATION_SHARING.md`.

## 11. Initialisation du thème (compromis Next 16) — TODO technique

**TODO : résoudre l'initialisation du thème Next 16 sans avertissement React ni flash visuel.**

| Solution | Thème appliqué | Flash clair/sombre | Avertissement React (dev) |
|---|---|---|---|
| `<script dangerouslySetInnerHTML>` dans `<head>` (**actuelle**) | ≈ 540 ms, avant le 1er affichage (560 ms) | non | seulement si React re-crée la balise côté client (ex. rendu refait après une erreur d'hydratation, souvent causée par une extension du navigateur) |
| `next/script` `beforeInteractive` (en ligne ou `src`) | ≈ 920–1150 ms, **après** le 1er affichage (≈ 600 ms) | **oui** (≈ 0,3–0,6 s, mesuré avec CPU ÷4) | non |

- Mesures : Playwright, préférence « clair », `PerformanceObserver` (first-paint) + `MutationObserver` sur `data-theme`.
- L'avertissement n'apparaît sur **aucune** des 16 pages testées (mobile et desktop) : il n'est émis que si React
  crée la balise `<script>` côté client (`react-dom`, `completeWork` → `case "script"`), jamais à l'hydratation normale.
- Décision : garder la solution actuelle (aucun flash). Avertissement de développement uniquement, sans effet en production.
- Pistes : thème aussi en cookie lu par le serveur (mais pages rendues dynamiques), ou `<script>` de type « data block »
  exécuté autrement ; à réévaluer à chaque mise à jour de Next/React.

## Prochaines étapes (Sprint 2 → 4)

- **Sprint 2** : admin CRUD (spots, parcours avec éditeur de tracé sur carte, quiz, défis, services, traductions), import des données validées de Meise.
- **Sprint 3** : brancher Supabase en production (auth, visites, progression réelle, favoris synchronisés), types générés (`npm run db:types`).
- **Sprint 4** : modération (file photos/commentaires), « Télécharger ce parc » (cache par parc), tests RLS en CI, audit accessibilité, optimisation mobile.
