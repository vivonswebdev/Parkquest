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

## Démarrage rapide (mode démo, aucune clé nécessaire)

```bash
npm install
npm run dev
# → http://localhost:3000/fr
```

Sans Supabase ni Mapbox, l'app fonctionne entièrement :
- contenus lus depuis `src/content/demo` ;
- règles de jeu évaluées côté serveur mais **rien n'est enregistré** (l'UI affiche « Mode démo ») ;
- carte de repli intégrée à la place de Mapbox.

Parcours à tester sur mobile : **Accueil → Commencer la visite → Voir le spot → « J'y suis » → Quiz → Spot suivant**.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` / `build` / `start` | développement / build / serveur de production |
| `npm run check` | typecheck + lint + parité des traductions |
| `npm run test:e2e` | tests Playwright de la boucle de visite (lance `npm start`, faire `npm run build` avant) |
| `npm run db:test` | applique migrations + seed sur un PostgreSQL/PostGIS local et exécute les tests RLS & jeu |
| `npm run db:seed:generate` | régénère `supabase/seed.sql` depuis `src/content/demo` |
| `npm run db:types` | génère les types TypeScript depuis la base locale Supabase |
| `npm run demo:illustrations` / `pwa:icons` | régénère les illustrations SVG / icônes PWA |

## Configuration

Copiez `.env.example` en `.env.local` (jamais commité) :

| Variable | Côté | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | public | URL de l'app (liens magiques, PWA) |
| `NEXT_PUBLIC_SUPABASE_URL` | public | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | clé anonyme (protégée par la RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **serveur uniquement** | contourne la RLS — jamais préfixée `NEXT_PUBLIC_`, importée seulement via `src/lib/supabase/admin.ts` (`server-only`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | public | token `pk.…` restreint à vos domaines ; absent → carte de repli |
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

### Mapbox

Créez un token public, restreignez-le à vos URL, renseignez `NEXT_PUBLIC_MAPBOX_TOKEN`.
Styles utilisés : `dark-v11` (plan) et `satellite-streets-v12` (calque satellite).

### Déploiement Vercel

Importer le dépôt, renseigner les variables d'environnement, déployer. Aucune configuration
spécifique (Node ≥ 20.9).

## Thème sombre / clair

- Bouton soleil/lune dans l'en-tête (mobile et desktop) et sélecteur **Sombre / Clair / Système** dans le Profil.
- Préférence stockée dans le navigateur (`localStorage`), appliquée avant l'affichage (pas de flash).
- Sans choix explicite : app sombre (identité ParkQuest) et pages de lecture (blog, infos pratiques, légal, admin) en clair.
- Les cartes suivent le thème (fond de repli clair/sombre, style Mapbox `light-v11` / `dark-v11`).

## Sécurité et confidentialité (résumé)

- **RLS sur toutes les tables** ; rôles `SUPER_ADMIN`, `PLATFORM_ADMIN`, `PARK_ADMIN`, `EDITOR`,
  `MODERATOR`, `USER` — les équipes d'un parc n'ont aucun droit sur les autres parcs.
- **Points attribués uniquement côté serveur** (fonctions SQL), journal immuable et idempotent.
- **GPS** : permission demandée seulement au moment utile ; découverte jamais automatique ;
  précision ≤ 25 m exigée pour une validation GPS ; **aucune coordonnée brute stockée**
  (seulement distance et précision) ; aucune position visible par d'autres utilisateurs.
- **Pseudonyme par défaut** ; photos et commentaires `PENDING` avant publication ; signalement.
- La bonne réponse des quiz n'est jamais envoyée au navigateur (privilèges de colonnes + test e2e).
- Hors connexion, aucune action n'est présentée comme validée.

## Tests

```bash
npm run check          # types, lint, traductions
npm run db:test        # 30 assertions RLS & règles de jeu (PostgreSQL 15+ avec PostGIS)
npm run build && npm run test:e2e
```

`db:test` utilise `PGHOST`/`PGPORT`/`PGUSER` (défauts `/tmp`, `54329`, `postgres`) et un shim
minimal des rôles Supabase (`supabase/tests/supabase_shim.sql`, à ne jamais appliquer sur un vrai projet).

## Crédits

Nom, logo, illustrations et textes sont des créations originales pour ce prototype.
Aucune affiliation avec les parcs présentés.
