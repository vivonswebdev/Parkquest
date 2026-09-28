# ParkQuest

**Explorez. Apprenez. Jouez.** — le compagnon de visite des parcs, jardins botaniques et arboretums.

Prototype SaaS multi-parcs : carte immersive, parcours guidés, découvertes validées par GPS,
quiz, défis photo, points, badges et collection. Parc pilote : **Plantentuin Meise** (Belgique).

> ⚠️ **Données de démonstration.** Tous les contenus actuels (Meise et autres parcs) sont des
> exemples **non validés** par les parcs. Ils sont marqués « Démo » dans l'interface et
> `is_demo_data = true` en base. **Ils doivent être vérifiés et autorisés par chaque parc avant
> toute publication officielle.** Liste détaillée : [`docs/DEMO_DATA_VALIDATION.md`](docs/DEMO_DATA_VALIDATION.md).

Architecture, décisions et plan : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Lancer la démo locale

Le **mode démo** est la source de test pour le design, l'UX et le parcours visiteur.
Il ne dépend ni de Supabase, ni de Mapbox, ni de Vercel, ni d'aucune clé (le fond de carte
OpenStreetMap se charge sans clé ; hors ligne, la carte simplifiée prend le relais).

### 1. Installation (une seule fois)

```bash
git clone https://github.com/vivonswebdev/parkquest.git
cd parkquest
git checkout feature/parkquest-dark-visitor-experience   # branche de travail (main n'est pas modifiée)
npm install
cp .env.example .env.local        # Windows (PowerShell) : Copy-Item .env.example .env.local
npm run dev
```

Ouvrir **http://localhost:3000** (redirige vers `/fr`).

### 2. Activer le mode démo

- `.env.local` contient déjà `NEXT_PUBLIC_DEMO_MODE=true` (copié depuis `.env.example`) → `npm run dev` suffit.
- Sans fichier `.env.local`, lancer directement :

  ```bash
  npm run dev:demo      # force NEXT_PUBLIC_DEMO_MODE=true
  ```

- Sans Supabase configuré, le mode démo s'active de toute façon (l'app ne casse jamais si les clés sont vides).
- Après un changement de `.env.local`, **redémarrer** `npm run dev` (les variables `NEXT_PUBLIC_*` sont lues au démarrage).

En mode démo :

| Élément | Comportement |
|---|---|
| Données | exclusivement `src/features/demo/demo-data.ts` (parc Meise, parcours, spots, services, quiz, défis, badges, profil fictif « Lina », statistiques, collection, infos pratiques) |
| Carte | vraie carte OpenStreetMap (MapLibre GL, vue 3D, sans clé ; Internet requis) ; hors ligne → carte simplifiée intégrée |
| Position | **simulée** — onglet **DÉMO** à gauche de l'écran : près du spot (GPS précis), entrée du parc, précision insuffisante (± 60 m), GPS refusé, GPS indisponible, ou vrai GPS |
| Points, progression, badges | simulés sur l'appareil (localStorage), avec les **mêmes règles** que le serveur ; notification « Badge débloqué » |
| Défi photo | la photo reste sur l'appareil ; bouton « Valider mes photos (modérateur simulé) » dans le panneau DÉMO |
| Réinitialiser | panneau DÉMO → « Réinitialiser la démo » (revient à l'historique fictif de départ) |

### 3. Pages à tester

| Écran | URL |
|---|---|
| Accueil | http://localhost:3000/fr |
| Parc | http://localhost:3000/fr/parks/plantentuin-meise |
| Carte immersive | http://localhost:3000/fr/parks/plantentuin-meise/map |
| Parcours | http://localhost:3000/fr/parks/plantentuin-meise/trails/arbres-remarquables |
| Suivi de parcours | http://localhost:3000/fr/parks/plantentuin-meise/trails/arbres-remarquables/visit |
| Fiche arbre (quiz + défi) | http://localhost:3000/fr/parks/plantentuin-meise/spots/sequoia-geant |
| Défis, badges, collection | http://localhost:3000/fr/challenges |
| Profil | http://localhost:3000/fr/profile |
| Infos pratiques | http://localhost:3000/fr/parks/plantentuin-meise/practical-info |
| Planifier · Parcs du monde · Blog | `/fr/parks/plantentuin-meise/plan` · `/fr/parks` · `/fr/blog` |

Toutes les pages existent aussi en `/nl`, `/en`, `/es`, `/de`.

Scénario conseillé : **Accueil → Commencer la visite → « Activez votre position » → Voir le spot → Découvrir ce spot (+10) → Quiz (+10) → Spot suivant → … → Terminer la visite (+20, badge « Boucle bouclée ») → Défis → Profil**.

Géolocalisation simulée (panneau **DÉMO** à gauche de l'écran) :

| Mode | Ce qu'on voit |
|---|---|
| Près du spot (± 6 m) | « Vous êtes près de : … » → **Découvrir ce spot** (validation GPS) |
| Approximatif (± 18 m) | « Vous semblez proche de ce lieu » → confirmation demandée |
| Précision insuffisante (± 60 m) | « Signal GPS imprécis » → **Je confirme, j'y suis** (sans validation GPS) |
| Entrée du parc | « Autour de vous » depuis l'entrée, guidage flèche + distance + minutes |
| Refusé / indisponible | l'app reste utilisable, point de départ au choix (entrée, parking, arrêt, café) |
| Réel | le vrai GPS du téléphone (nécessite HTTPS, voir iPhone ci-dessous) |

La météo pendant la visite (accueil, parc, parcours) est **simulée** en mode démo et affichée comme telle ;
`WEATHER_LIVE=true` appelle réellement [Open-Meteo](https://open-meteo.com) (sans clé).

### 4. Vérifications et captures

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript strict
npm run test          # traductions (5 langues) + tests unitaires (règles GPS, paliers de proximité,
                      # « Autour de vous », météo, points, badges, données démo)
npm run verify        # les trois à la suite

npx playwright install chromium   # une seule fois, pour les captures
npm run demo:capture              # verify, puis captures iPhone (sombre + clair)
```

`demo:capture` utilise le serveur déjà lancé sur http://localhost:3000, ou démarre lui-même
une démo temporaire (port 3100) s'il n'en trouve pas. Les captures (format iPhone 390 × 844 @2x, WebP)
sont enregistrées dans **`demo-shots/<date>_<heure>/`** (dossier ignoré par Git) : `dark-*.webp` et `light-*.webp`.
Chaque exécution crée un nouveau dossier, ce qui permet de **comparer deux versions**.

Comparer la version actuelle et la version améliorée :

```bash
git checkout main && npm run dev            # capture « avant » (port 3000)
git checkout feature/parkquest-dark-visitor-experience && npm run dev   # capture « après »
```

### 5. Tester sur iPhone avant Vercel

**Solution A — réseau local (recommandée, aucune installation)**

```bash
npm run dev:lan
```

Le script affiche l'adresse à ouvrir sur l'iPhone, par exemple `http://192.168.1.23:3000/fr`,
lance la démo accessible sur le réseau local et autorise automatiquement ces adresses (`allowedDevOrigins`).
Conditions : iPhone et PC sur le **même Wi-Fi** ; autoriser Node.js dans le pare-feu si Windows/macOS le demande.
Adresse IP manuelle : Windows `ipconfig` (Adresse IPv4) · macOS `ipconfig getifaddr en0` · Linux `hostname -I`.

> Sur iPhone, Safari n'autorise le **vrai GPS** qu'en HTTPS. En réseau local (HTTP), utiliser la
> **position simulée** du panneau DÉMO — c'est prévu pour ça. Pour tester le vrai GPS, passer par la solution B.

**Solution B — tunnel HTTPS temporaire (documentation seulement, rien n'est configuré)**

Un tunnel donne une URL HTTPS publique et temporaire vers votre PC. À n'utiliser que pendant le test,
puis fermer (Ctrl+C). Toute personne ayant l'URL peut ouvrir la démo pendant ce temps.

- *Cloudflare Tunnel* (sans compte, URL `*.trycloudflare.com`) :
  1. installer `cloudflared` (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) ;
  2. dans `.env.local` : `PQ_ALLOWED_DEV_ORIGINS=*.trycloudflare.com` puis `npm run dev:demo` ;
  3. dans un second terminal : `cloudflared tunnel --url http://localhost:3000` ;
  4. ouvrir sur l'iPhone l'URL `https://….trycloudflare.com/fr` affichée.
- *ngrok* (compte gratuit requis) :
  1. installer ngrok et `ngrok config add-authtoken <votre-token>` ;
  2. `.env.local` : `PQ_ALLOWED_DEV_ORIGINS=*.ngrok-free.app` puis `npm run dev:demo` ;
  3. `ngrok http 3000`, puis ouvrir l'URL `https://….ngrok-free.app/fr`.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | développement (lit `.env.local`) |
| `npm run dev:demo` | développement en mode démo forcé |
| `npm run dev:lan` | mode démo accessible depuis un téléphone du même Wi-Fi |
| `npm run lint` / `typecheck` / `test` / `verify` | contrôles qualité (verify = les trois) |
| `npm run demo:capture` | verify + captures iPhone sombre/clair dans `demo-shots/` |
| `npm run build` / `start` | build et serveur de production |
| `npm run test:e2e` | tests Playwright de la boucle de visite (`npm run build` avant) |
| `npm run db:test` | migrations + seed sur un PostgreSQL/PostGIS local + tests RLS & jeu |
| `npm run db:seed:generate` | régénère `supabase/seed.sql` depuis `src/features/demo/demo-data.ts` |
| `npm run db:types` | génère les types TypeScript depuis la base locale Supabase |
| `npm run demo:illustrations` / `pwa:icons` | régénère les illustrations SVG / icônes PWA |

## Architecture : du mode démo à Supabase

Les écrans ne connaissent **que des interfaces** ; le mode choisit l'implémentation :

| Couche | Interface | Démo | Production |
|---|---|---|---|
| Contenus (parcs, spots, parcours…) | `ContentRepository` (`src/lib/data/repository.ts`) | `demo-repository.ts` | `supabase-repository.ts` |
| Jeu (découverte, quiz, défis, visites) | `GameService` (`src/lib/game/game-service.ts`) | `demo-game-service.ts` | `supabase-game-service.ts` (fonctions SQL) |
| Règles (GPS, points) | `src/lib/game/rules.ts` (pures, testées) | ✔ | miroir des fonctions SQL |
| Position | `useGeolocation()` | simulée (`src/features/demo/demo-geo.ts`) | `navigator.geolocation` |
| Carte | `ParkMap` | MapLibre + OpenStreetMap (repli : carte intégrée) | idem, satellite Mapbox si token |
| Interrupteur | `src/lib/config/app-mode.ts` → `isDemoMode` | `NEXT_PUBLIC_DEMO_MODE=true` | `false` + clés Supabase |

## Configuration

Copiez `.env.example` en `.env.local` (jamais commité) :

| Variable | Côté | Description |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | public | `true` = mode démo (données locales, GPS/points simulés, aucune clé) |
| `NEXT_PUBLIC_APP_URL` | public | URL de l'app (liens magiques, PWA) |
| `NEXT_PUBLIC_SUPABASE_URL` | public | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | clé anonyme (protégée par la RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **serveur uniquement** | contourne la RLS — jamais préfixée `NEXT_PUBLIC_`, importée seulement via `src/lib/supabase/admin.ts` (`server-only`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | public | optionnel, vue satellite ; token `pk.…` restreint à vos domaines |
| `NEXT_PUBLIC_MAP_STYLE_URL` · `NEXT_PUBLIC_MAP_ENGINE` | public | autre fond OpenMapTiles · `fallback` pour forcer la carte simplifiée |
| `NEXT_PUBLIC_POSTHOG_*` | public | optionnel, non utilisé au MVP |

### Supabase

```bash
# Local (Docker requis)
npx supabase start
npx supabase db reset          # applique supabase/migrations + supabase/seed.sql

# Projet hébergé
npx supabase link --project-ref <ref>
npx supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql   # données de démo (optionnel)
```

Puis dans le tableau de bord Supabase :
1. **Auth → Providers → Email** : activer le lien magique.
2. **Auth → URL configuration** : ajouter `https://<votre-domaine>/api/auth/callback`.
3. Donner un rôle d'administration (SQL, en tant que propriétaire) :
   ```sql
   insert into public.user_roles (user_id, role) values ('<uuid>', 'SUPER_ADMIN');
   insert into public.user_roles (user_id, role, park_id)
   values ('<uuid>', 'PARK_ADMIN', '00000001-0000-4000-8000-000000000001'); -- Meise
   ```

### Cartes (MapLibre GL + OpenStreetMap, 3D)

- **Moteur** : [MapLibre GL JS](https://maplibre.org) (open source, sans clé). Le worker est copié
  dans `public/vendor/maplibre/` par `npm install` (script `postinstall`).
- **Fond** : OpenStreetMap vectoriel via [OpenFreeMap](https://openfreemap.org) (gratuit, sans clé),
  habillé aux couleurs ParkQuest en sombre et en clair (`src/lib/map/theme.ts`).
  Autre fournisseur compatible OpenMapTiles : `NEXT_PUBLIC_MAP_STYLE_URL`.
- **Vue 3D** (bouton « 3D ») : carte inclinée, bâtiments en relief (données OSM), relief du terrain
  ([Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), AWS Open Data) et ciel.
- **Satellite** (optionnel) : bouton « Calques » visible si `NEXT_PUBLIC_MAPBOX_TOKEN` (token public
  `pk.…` restreint à vos domaines) ou `NEXT_PUBLIC_SATELLITE_TILES_URL` est renseigné.
- **Repli automatique** sur la carte simplifiée intégrée si WebGL est absent ou si le fond ne charge
  pas (hors ligne, réseau filtré) ; `NEXT_PUBLIC_MAP_ENGINE=fallback` la force.
- Les crédits (© OpenStreetMap, obligatoires) restent toujours visibles sur la carte.

### Déploiement Vercel

Importer le dépôt, renseigner les variables d'environnement, déployer. Aucune configuration
spécifique (Node ≥ 20.9).

## Thème sombre / clair

- Bouton soleil/lune dans l'en-tête (mobile et desktop) et sélecteur **Sombre / Clair / Système** dans le Profil.
- Préférence stockée dans le navigateur (`localStorage`), appliquée avant l'affichage (pas de flash).
- Thème clair « papier crème » (fond `#f7f4ec`, titres serif Fraunces, ombres douces).
- Sans choix explicite : app sombre (identité ParkQuest) et pages de lecture (blog, infos pratiques, légal, admin) en clair.
- Les cartes suivent le thème (fond OpenStreetMap recoloré, carte simplifiée claire/sombre).

## Sécurité et confidentialité (résumé)

- **RLS sur toutes les tables** ; rôles `SUPER_ADMIN`, `PLATFORM_ADMIN`, `PARK_ADMIN`, `EDITOR`,
  `MODERATOR`, `USER` — les équipes d'un parc n'ont aucun droit sur les autres parcs.
- **Points attribués uniquement côté serveur** (fonctions SQL), journal immuable et idempotent.
- **GPS** : écran d'explication « Activez votre position » AVANT la demande du navigateur ;
  suivi (`watchPosition`) uniquement pendant la carte ou une visite, coupé en arrière-plan ;
  découverte jamais automatique (précision ≤ 10 m : « Vous êtes près de » ; 10–25 m : confirmation ;
  > 25 m : jamais de validation GPS) ; **aucune coordonnée brute stockée** (seulement distance et
  précision) ; aucune position visible par d'autres utilisateurs. Le partage entre amis est
  seulement documenté : [docs/FUTURE_SOCIAL_AND_LOCATION_SHARING.md](docs/FUTURE_SOCIAL_AND_LOCATION_SHARING.md).
- **Pseudonyme par défaut** ; photos et commentaires `PENDING` avant publication ; signalement.
- La bonne réponse des quiz n'est jamais envoyée au navigateur (privilèges de colonnes + test e2e).
- Hors connexion, aucune action n'est présentée comme validée.

## Tests

```bash
npm run check          # types, lint, traductions
npm run db:test        # 33 assertions RLS, règles de jeu et « Autour de vous » (PostgreSQL 15+ avec PostGIS)
npm run build && npm run test:e2e
```

`db:test` utilise `PGHOST`/`PGPORT`/`PGUSER` (défauts `/tmp`, `54329`, `postgres`) et un shim
minimal des rôles Supabase (`supabase/tests/supabase_shim.sql`, à ne jamais appliquer sur un vrai projet).

## Crédits

Nom, logo, illustrations et textes sont des créations originales pour ce prototype.
Aucune affiliation avec les parcs présentés.
