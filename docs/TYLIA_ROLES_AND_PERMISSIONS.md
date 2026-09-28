# TYLIA — Rôles et permissions : conception

> **Statut : proposition, à valider.** Aucune migration, table, authentification ni tableau de bord n'est créé
> tant que ce document n'est pas validé. Il part de l'existant (migrations `0200` et `1000`) pour le faire
> évoluer, pas pour le remplacer.
>
> Références : OWASP Authorization Cheat Sheet (moindre privilège, refus par défaut, contrôle côté serveur) ;
> documentation Supabase (Row Level Security, RBAC par « custom claims », sécurité de l'API, contrôle d'accès
> du stockage).

## 0. Principes

1. **Moindre privilège et refus par défaut.** Chaque personne a uniquement ce dont elle a besoin. Une
   permission absente vaut refus.
2. **Double contrôle.** Chaque action est vérifiée côté serveur (action serveur ou fonction SQL) **et** par la
   RLS en base. Masquer un bouton n'est jamais une protection.
3. **Portée explicite par parc.** Un membre d'un parc n'accède qu'aux parcs qui lui sont attribués.
   Le gestionnaire de Meise ne voit ni ne modifie jamais un autre parc.
4. **Séparation des pouvoirs.**
   - Publier, gérer les membres et gérer les rôles sont trois permissions distinctes.
   - Personne ne s'accorde un rôle à soi-même.
   - Les rôles plateforme ne sont attribués que par le super-admin.
5. **Traçabilité.** Toute action sensible est enregistrée dans un journal d'audit en ajout seul.
6. **Données personnelles cloisonnées.** Les parcs ne voient que des statistiques agrégées, jamais le trajet,
   la progression ou l'identité d'un visiteur.

## 1. Ce qui existe déjà (et ce qu'il faut corriger)

Existant : type `app_role` (`SUPER_ADMIN`, `PLATFORM_ADMIN`, `PARK_ADMIN`, `EDITOR`, `MODERATOR`, `USER`) et
table `user_roles` (`park_id` vide = rôle plateforme, renseigné = rôle limité à un parc).
Fonctions `SECURITY DEFINER` : `has_park_role`, `can_admin_park`, `can_edit_park`, `can_moderate_park`,
`is_platform_staff`, `is_super_admin`. RLS active sur toutes les tables ; 41 assertions SQL
(`scripts/db-test.sh`). Le client `service_role` est `server-only` et n'est utilisé nulle part aujourd'hui.

**Écarts relevés dans l'existant**, à corriger lors de la phase dédiée :

| # | Écart | Risque | Correction proposée |
|---|---|---|---|
| E1 | Un `PLATFORM_ADMIN` peut accorder ou retirer le rôle `PLATFORM_ADMIN` (policy `user_roles_write`) | Élévation de privilèges : un admin compromis crée d'autres admins | Seul le super-admin gère les rôles plateforme ; l'admin gère uniquement les rôles de parc |
| E2 | Un `EDITOR` peut passer un contenu en `PUBLISHED` et supprimer un contenu publié (policies `*_write … for all`) | Publication sans validation, suppression de données officielles | L'éditeur ne peut écrire que des brouillons. Publication et suppression uniquement par fonction serveur avec la permission `park.publish_content` |
| E3 | Un `PARK_ADMIN` peut modifier toutes les colonnes de son parc, y compris `status` et `slug` | Dépublication ou changement d'URL sans contrôle | `status`, `slug` et l'attribution de parc réservés à l'admin TYLIA ; le gestionnaire modifie les informations de son parc |
| E4 | La page `/admin` s'affiche à tout utilisateur connecté (les données restent protégées par la RLS) | Fuite de structure, confusion ; aucun contrôle de rôle côté page | Contrôle de rôle côté serveur sur chaque route protégée, réponse « introuvable » sinon |

## 2. Rôles

### 2.1 Deux axes : rôle plateforme et appartenance à un parc

Un seul champ `role` ne suffit pas. On distingue :

1. **le rôle plateforme** : ce que la personne est dans TYLIA ;
2. **l'appartenance à un parc** : son rôle **dans ce parc précis**, plus d'éventuelles permissions
   supplémentaires.

Exemple : Nadia est `USER` sur la plateforme, `park_manager` à Plantentuin Meise, `park_editor` au jardin de
Gand et n'a aucun accès au Parc de Bruxelles.

### 2.2 Rôles plateforme

| Rôle | Nom technique | Attribué par | Portée |
|---|---|---|---|
| Visiteur | (non connecté, `anon`) | — | Contenu public |
| Utilisateur | `USER` | automatique à l'inscription | Ses propres données |
| Contributeur | `CONTRIBUTOR` | admin ou modérateur global | Ses contributions, toujours soumises à modération |
| Collaborateur TYLIA | `COLLABORATOR` | admin | Contenus globaux attribués (quêtes, catalogue de créatures, traductions), en brouillon uniquement |
| Modérateur global | `MODERATOR` sans parc | admin | Files de modération de tous les parcs |
| Admin TYLIA | `PLATFORM_ADMIN` | **super-admin uniquement** | Toute l'application, sauf rôles plateforme et système |
| Super-admin technique | `SUPER_ADMIN` | super-admin (2 personnes au plus, dont un compte de secours) | Rôles plateforme, système, audit, suppressions critiques |

### 2.3 Rôles de parc (appartenance)

| Rôle | Pour qui | Rôle actuel |
|---|---|---|
| `park_owner` | Responsable légal côté parc (signataire de l'accord) | nouveau |
| `park_manager` | Gestionnaire (commune, jardin botanique, association) | `PARK_ADMIN` |
| `park_editor` | Équipe interne : prépare les brouillons | `EDITOR` |
| `park_reviewer` | Relit et modère photos, signalements et propositions du parc | `MODERATOR` avec parc |
| `park_analyst` | Consulte les statistiques agrégées uniquement | nouveau |

Le **collaborateur partenaire** (agence, association qui aide un parc) est un `park_editor` sur les seuls parcs
attribués. Il ne publie pas seul.

## 3. Permissions

### 3.1 Catalogue

**Parc** (toujours vérifiées pour un `park_id` précis) :

| Permission | Effet |
|---|---|
| `park.view_internal` | Voir les brouillons, contenus en revue et informations internes du parc |
| `park.manage_content` | Créer et modifier des brouillons (spots, parcours, quêtes, textes, traductions) |
| `park.publish_content` | Publier, dépublier, archiver ; marquer une donnée « vérifiée par le parc » |
| `park.manage_info` | Horaires, fermetures, règles, contacts, accès PMR, équipements |
| `park.manage_qr_codes` | Créer, désactiver et placer les QR codes |
| `park.review_submissions` | Modérer photos, signalements et propositions du parc |
| `park.view_analytics` | Statistiques agrégées du parc |
| `park.manage_events` | Événements du parc |
| `park.manage_members` | Inviter, modifier et retirer des membres (jamais un rôle supérieur au sien) |

**Plateforme** :

| Permission | Effet |
|---|---|
| `platform.manage_parks` | Créer, archiver un parc, changer son statut ou son slug |
| `platform.manage_park_members` | Attribuer le premier gestionnaire ou propriétaire d'un parc, révoquer |
| `platform.moderate_all` | Modération de tous les parcs, comptes et signalements |
| `platform.manage_global_content` | Catégories, quêtes globales, créatures, événements (brouillon et publication) |
| `platform.manage_game_rules` | Barèmes, probabilités, tables d'œufs |
| `platform.view_global_analytics` | Statistiques globales anonymisées |
| `platform.view_audit` | Lire le journal d'audit |
| `system.manage_platform_roles` | Attribuer `PLATFORM_ADMIN`, `MODERATOR` global, `COLLABORATOR`, `CONTRIBUTOR` |
| `system.data_export_delete` | Exports et suppressions de données (demandes RGPD) |
| `system.diagnostics` | Diagnostics techniques, état des fournisseurs (jamais les valeurs des clés) |

### 3.2 Permissions par défaut des rôles de parc

| Permission | owner | manager | editor | reviewer | analyst |
|---|:-:|:-:|:-:|:-:|:-:|
| `park.view_internal` | ✓ | ✓ | ✓ | ✓ | — |
| `park.manage_content` | ✓ | ✓ | ✓ | — | — |
| `park.publish_content` | ✓ | ✓ | — | — | — |
| `park.manage_info` | ✓ | ✓ | — | — | — |
| `park.manage_qr_codes` | ✓ | ✓ | + | — | — |
| `park.review_submissions` | ✓ | ✓ | — | ✓ | — |
| `park.view_analytics` | ✓ | ✓ | + | + | ✓ |
| `park.manage_events` | ✓ | ✓ | + | — | — |
| `park.manage_members` | ✓ | ✓ | — | — | — |

`+` = peut être accordé individuellement (ex. un éditeur qui gère les QR codes sans pouvoir inviter).
Les permissions ne font qu'**ajouter** des droits à ceux du rôle : il n'y a pas de retrait individuel, ce qui
évite les combinaisons difficiles à relire. Un `park_manager` ne peut ni inviter un `park_owner` ni modifier
ses droits.

### 3.3 Tableau actions × rôles

| Action | Visiteur | User | Contrib. | Collab. | Éditeur parc | Réviseur parc | Gestionnaire parc | Modérateur global | Admin | Super-admin |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Voir le contenu public | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Jouer, parcours, œufs, collection | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Modifier son profil, supprimer son compte | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Proposer une photo, signaler une erreur | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Proposer un spot, un parcours, une traduction | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Brouillons d'un parc | — | — | — | — | son parc | — | son parc | — | ✓ | ✓ |
| Publier / dépublier dans un parc | — | — | — | — | — | — | son parc | — | ✓ | ✓ |
| Marquer « vérifié par le parc » | — | — | — | — | — | — | son parc | — | — ¹ | — ¹ |
| Informations pratiques du parc | — | — | — | — | — | — | son parc | — | ✓ | ✓ |
| QR codes d'un parc | — | — | — | — | selon permission | — | son parc | — | ✓ | ✓ |
| Modérer photos et propositions | — | — | — | — | — | son parc | son parc | tous | ✓ | ✓ |
| Statistiques agrégées d'un parc | — | — | — | — | selon permission | selon permission | son parc | — | ✓ | ✓ |
| Inviter l'équipe d'un parc | — | — | — | — | — | — | son parc ² | — | ✓ | ✓ |
| Créer, archiver un parc ; changer statut ou slug | — | — | — | — | — | — | — | — | ✓ | ✓ |
| Contenu global (quêtes, créatures, règles de jeu) | — | — | — | brouillon | — | — | — | — | ✓ | ✓ |
| Journal d'audit | — | — | — | — | — | — | son parc ³ | — | ✓ | ✓ |
| Rôles plateforme | — | — | — | — | — | — | — | — | — | ✓ |
| Système, diagnostics, exports et suppressions RGPD | — | — | — | — | — | — | — | — | — | ✓ |
| Voir une clé ou un secret | — | — | — | — | — | — | — | — | — | — ⁴ |

¹ « Vérifié par le parc » signifie que **le parc** a confirmé l'information : TYLIA ne peut pas l'affirmer à sa place.
² Uniquement des rôles inférieurs ou égaux au sien, et jamais `park_owner`.
³ Uniquement les entrées de son parc, sans adresse IP ni métadonnées techniques.
⁴ Personne, même le super-admin, ne voit un secret dans l'interface : les clés vivent dans les variables d'environnement du serveur.

## 4. Statut éditorial et statut de vérification : deux axes distincts

| Axe | Valeurs | Qui le change |
|---|---|---|
| **Éditorial** (`content_status`) | `DRAFT` → `IN_REVIEW` → `PUBLISHED` → `ARCHIVED` ; `CHANGES_REQUESTED` possible depuis la revue | éditeur : `DRAFT` ↔ `IN_REVIEW` ; gestionnaire ou admin : publication et archivage |
| **Vérification** (`verification_status`) | `demo` · `proposed` · `park_verified` | `park_verified` : uniquement un membre du parc avec `park.publish_content` |

- Un contenu publié mais non vérifié reste affiché avec la mention « Donnée de démonstration à valider avec
  le parc » (ou « non vérifiée »).
- **Modifier un contenu publié** : l'éditeur ne touche jamais la version publique. Il crée une révision
  (`content_revisions`, modifications proposées), relue puis appliquée par le gestionnaire, et la version
  publique ne change qu'à ce moment-là.
- **Contributions** (photos, spots proposés, corrections) : privées par défaut, statut `PENDING` jusqu'à la
  modération (c'est déjà le cas pour les photos).

## 5. Routes et espaces

Trois espaces seulement, qui s'adaptent aux permissions (pas un tableau de bord par rôle) :

| Route | Pour | Contenu | Contrôle |
|---|---|---|---|
| `/[locale]/account` | tout utilisateur connecté | profil, mes parcours, œufs, créatures, compagnon, album, badges, mes photos et propositions, confidentialité, suppression de compte, accessibilité ; actions de contribution si `CONTRIBUTOR` | session obligatoire |
| `/[locale]/manage` | membres d'au moins un parc | liste des **seuls** parcs attribués | au moins une appartenance active |
| `/[locale]/manage/parks/[parkSlug]` | membres de ce parc | fiche, infos pratiques, carte des spots, validation, parcours et quêtes, QR codes, modération, statistiques agrégées, équipe ; chaque onglet selon permission | appartenance active **à ce parc**, sinon « introuvable » |
| `/[locale]/admin` | `PLATFORM_ADMIN`, `SUPER_ADMIN` (et modérateur global pour l'onglet modération) | parcs, partenaires, files de modération, contenu global, règles de jeu, statistiques globales, audit | rôle plateforme |
| `/[locale]/admin/system` | `SUPER_ADMIN` uniquement | rôles plateforme, diagnostics, exports et suppressions, journal des actions sensibles | super-admin + réauthentification récente (moins de 10 min) |

- **Contrôle côté serveur** : vérification dans chaque page et chaque action serveur, par la même fonction
  SQL que la RLS, pour qu'il n'y ait qu'une seule vérité. `proxy.ts` sert au mieux de premier filtre, jamais
  de seul contrôle.
- Réponse « introuvable » plutôt que « interdit », pour ne pas révéler l'existence d'un parc en préparation.
- La page `/admin` actuelle (aperçu démo) sera scindée entre `/manage/parks/[parkSlug]` et `/admin`.

## 6. Modèle de données (pour la phase dédiée, après validation)

```text
platform_roles          -- remplace user_roles avec park_id vide
- user_id, role (USER|CONTRIBUTOR|COLLABORATOR|MODERATOR|PLATFORM_ADMIN|SUPER_ADMIN)
- granted_by, created_at, expires_at (nullable), revoked_at

park_memberships        -- remplace user_roles avec park_id renseigné
- id, park_id, user_id
- role (park_owner|park_manager|park_editor|park_reviewer|park_analyst)
- extra_permissions text[]   -- ajouts uniquement, valeurs contrôlées
- status (invited|active|suspended|revoked)
- invited_by, accepted_at, created_at, updated_at
- unique (park_id, user_id)

park_invitations
- id, park_id, email_hash, role, extra_permissions
- token_hash (le jeton en clair n'est jamais stocké), expires_at (7 jours), used_at
- invited_by, created_at

content_reviews         -- revue de brouillons, révisions et contributions
- id, entity_type, entity_id, park_id nullable, revision_id nullable
- submitted_by, status (pending|approved|changes_requested|rejected)
- reviewed_by, reviewed_at, review_note

content_revisions       -- modifications proposées sur un contenu publié
- id, entity_type, entity_id, park_id, patch jsonb, created_by, created_at, applied_at

audit_logs              -- ajout seul
- id, actor_user_id, actor_role, action, entity_type, entity_id, park_id nullable
- metadata_safe jsonb (jamais de position, d'e-mail ni de contenu personnel), created_at
```

**Pourquoi ne pas mettre `global_role` dans `profiles` ?** La table `profiles` est modifiable par son
propriétaire (policy `profiles_update_own`). Un rôle stocké dans la même ligne serait exposé à une
auto-élévation au moindre oubli de protection de colonne. Les rôles vivent donc dans des tables à part, où
l'utilisateur n'a aucun droit d'écriture.

**Fonctions d'autorisation (SQL, `SECURITY DEFINER`, `search_path` vide)** :

- `has_platform_role(roles[])`, `is_super_admin()` : conservées.
- `park_permissions(park_id) → text[]` : permissions du rôle + ajouts, uniquement si l'appartenance est active.
- `has_park_permission(park_id, permission) → boolean` : utilisée par **toutes** les policies et actions serveur.
- `can_grant(park_id, role)` : on ne peut accorder qu'un rôle inférieur ou égal au sien, jamais `park_owner`
  (réservé à l'admin).
- Migration de l'existant : `PARK_ADMIN` → `park_manager`, `EDITOR` → `park_editor`, `MODERATOR` avec parc →
  `park_reviewer`. Les anciennes fonctions `can_*_park` deviennent des alias le temps de la transition.

**Performance** : les permissions sont calculées par fonction `STABLE`, appelée sous la forme
`(select auth.uid())` pour être évaluée une seule fois par requête, avec index sur `park_memberships (user_id, park_id)`.
Les « custom claims » dans le jeton (RBAC Supabase) sont une option pour les rôles plateforme uniquement. Pour
les parcs, on préfère la table : un retrait d'accès y est immédiat, alors qu'un jeton reste valable jusqu'à
son expiration.

## 7. Supabase : règles de sécurité

1. **RLS activée sur chaque table exposée**, avec une policy distincte par opération (`select`, `insert`,
   `update`, `delete`), jamais `for all` pour les contenus éditoriaux.
2. **Colonnes sensibles protégées** : `park_id`, `status`, `verification_status`, `approved_by`,
   `reviewed_by`, `created_by`, `role` ne sont jamais modifiables par une requête client. Elles passent par des
   fonctions serveur, ou sont figées par un déclencheur qui refuse leur modification.
3. **Publication, modération, invitations et changements de rôle** : uniquement par fonctions
   `SECURITY DEFINER`, avec contrôle de permission, écriture dans `audit_logs` dans la même transaction et
   exécution retirée à `anon`.
4. **`service_role`** : serveur uniquement (`import "server-only"`, déjà en place), jamais dans une variable
   `NEXT_PUBLIC_*`, réservée aux tâches système explicites et journalisées. Elle contourne la RLS.
5. **Stockage** : photos dans un bucket privé jusqu'à validation (déjà le cas). Policies de stockage alignées
   sur `park.review_submissions`.
6. **Tests autoriser / refuser** pour chaque rôle et chaque table sensible. Ils prolongent les 41 assertions
   actuelles : gestionnaire de Meise sur un autre parc → refusé ; éditeur qui publie → refusé ; éditeur qui
   supprime un contenu publié → refusé ; admin qui crée un admin → refusé ; utilisateur qui s'accorde un rôle
   → refusé ; analyste qui lit une visite individuelle → refusé.
7. **Journal d'audit** : aucune policy `update` ni `delete`, insertion uniquement par fonctions ; lecture selon
   `platform.view_audit` ou, pour son parc, `park.manage_members`.

## 8. Données : trois cloisons

| Type | Exemples | Accès |
|---|---|---|
| **Personnelles** | profil, visites, progression, œufs, créatures, photos en attente | la personne elle-même ; le support admin seulement sur demande de l'utilisateur, avec trace dans l'audit |
| **Agrégées** | parcours commencés et terminés, spots populaires, problèmes signalés | membres avec `view_analytics`, par jour au plus fin, **masquées sous 5 personnes** (sinon on peut reconnaître quelqu'un) |
| **Internes au parc** | brouillons, emplacements des QR codes, contacts, notes de revue | membres actifs du parc |

Jamais : positions ou trajets individuels, liste des visiteurs d'un parc, données de mineurs visibles par un
parc. Les statistiques sont calculées par fonctions qui renvoient uniquement des agrégats.

## 9. Actions sensibles : confirmation renforcée

Nécessitent une réauthentification récente et une confirmation explicite (taper le nom du parc ou du compte),
et sont toujours journalisées :

- suppression ou archivage d'un parc ;
- retrait d'un gestionnaire ou d'un propriétaire ;
- changement de rôle plateforme ;
- suppression de compte par un admin ;
- export ou suppression de données.

Le retrait du dernier `park_owner` ou `park_manager` d'un parc est impossible sans en désigner un autre.

## 10. Risques

| Risque | Mesure |
|---|---|
| Élévation de privilèges (écarts E1 à E3, auto-attribution) | Rôles dans des tables séparées, `can_grant`, super-admin seul pour les rôles plateforme, tests de refus |
| Accès à un autre parc | `has_park_permission(park_id, …)` dans chaque policy ; test systématique « autre parc → refusé » |
| Oubli d'une vérification côté page | Même fonction SQL côté serveur et RLS ; la RLS reste le filet de sécurité |
| Compte admin compromis | Réauthentification, 2FA pour tous les rôles plateforme et gestionnaires, journal d'audit, deux super-admins au plus |
| Invitation détournée | Jeton à usage unique, haché, expirant en 7 jours, lié à l'adresse invitée |
| Réidentification par les statistiques | Agrégats par jour minimum, masquage sous 5 |
| Fuite de la clé `service_role` | Serveur uniquement, jamais journalisée ni affichée, rotation documentée |
| Rôle obsolète (départ d'un employé du parc) | Statut `suspended` et `revoked`, `expires_at` optionnel, revue trimestrielle des membres par le gestionnaire |
| Complexité | Rôles par défaut suffisants dans 90 % des cas ; permissions supplémentaires en ajout seulement |

## 11. Ordre de réalisation (après E3, avant les premiers comptes partenaires)

Chaque étape fait l'objet d'une PR dédiée, validée au préalable, et nécessite Supabase réel (sauf R0).

| Étape | Contenu |
|---|---|
| R0 | Ce document (validation) |
| R1 | Authentification et `profiles` en conditions réelles ; `/account` minimal |
| R2 | Rôles plateforme (`platform_roles`), corrections E1 et E4 |
| R3 | `park_memberships`, `has_park_permission`, migration des rôles existants, corrections E2 et E3 |
| R4 | RLS complète et tests autoriser / refuser pour chaque rôle |
| R5 | Invitation d'un gestionnaire de parc (jetons, e-mail) |
| R6 | `/manage/parks/[parkSlug]` minimal : infos pratiques, brouillons, revue, publication |
| R7 | `audit_logs` et confirmations renforcées |
| R8 | `/admin` minimal, puis `/admin/system` |
