# ParkQuest — Social, partage de position et idées futures

> **Statut : documentation uniquement.** Rien de ce fichier n'est implémenté dans le MVP.
> Aucune table, route ou écran décrit ici ne doit être créé avant validation complète du MVP.

## 1. Principes non négociables

- ParkQuest **n'affiche jamais la position des autres visiteurs**.
- Jamais : partage de position précise à tous les visiteurs ; partage public du nom, de la photo
  ou de la position ; ajout automatique de personnes proches ; découverte des profils autour de soi.
- Le partage de position est **opt-in, limité dans le temps, limité à un groupe choisi**, révocable à tout moment.
- **Mineurs** (profil < 16 ans ou compte famille) : aucun partage public, partage uniquement au sein
  d'un groupe familial créé par un adulte responsable.
- La position partagée n'est **jamais conservée** : seule la dernière position approximative d'une
  session active existe, puis elle est supprimée à la fin de la session.

## 2. Tables futures (esquisse, non créées)

| Table | Rôle | Points clés |
|---|---|---|
| `friendships` | relation entre deux comptes | `requester_id`, `addressee_id`, `status` (`PENDING`/`ACCEPTED`/`BLOCKED`), unicité sur la paire ; ajout uniquement par pseudonyme ou lien d'invitation, jamais par proximité |
| `visit_groups` | groupe d'une sortie (famille, amis, classe) | `owner_id`, `park_id`, `name`, `expires_at` (max 24 h), `is_family` |
| `visit_group_members` | membres d'un groupe | `group_id`, `user_id`, `role` (`OWNER`/`MEMBER`/`GUARDIAN`), `joined_at` ; invitation acceptée explicitement |
| `location_sharing_settings` | préférences par utilisateur | `default_precision` (`APPROXIMATE` ~50 m / `PRECISE`), `allow_friends` (défaut `false`), forcé à `false` pour les mineurs hors groupe familial |
| `location_sharing_sessions` | une période de partage | `user_id`, `group_id`, `started_at`, `ends_at` (défaut 2 h, max 8 h), `precision`, `revoked_at` |
| `location_presence` | dernière position d'une session active | `session_id` (PK), `position` geography, `accuracy_m`, `updated_at` ; **une seule ligne par session**, écrasée, supprimée à la fin (tâche `pg_cron` + suppression à `revoked_at`) |

## 3. Règles serveur

- Écriture de `location_presence` uniquement via une fonction `SECURITY DEFINER` qui vérifie :
  session active, non révoquée, non expirée, utilisateur membre du groupe, fréquence ≤ 1 écriture / 15 s.
- Lecture : uniquement les membres du même groupe, uniquement pour les sessions actives ;
  position **arrondie côté serveur** selon `precision` (jamais la valeur brute en mode approximatif).
- RLS : aucune politique `select` publique ; aucun index ou vue permettant de lister « qui est autour ».
- Journal d'audit (création / révocation de sessions) sans coordonnées.
- Suppression de compte : cascade sur toutes ces tables.

## 4. Feuille de route

| Version | Contenu |
|---|---|
| **V1** (après MVP) | Partager **son résultat** de visite (image générée : parcours, spots, km, badges) via la feuille de partage du téléphone. Aucun ami dans l'app. |
| **V1.5** | Recherche d'adresse / point de départ avec Nominatim (voir §6). |
| **V2** | Amis (invitation par lien ou pseudonyme), groupes de visite, partage de position **dans un groupe**, limité dans le temps. Notifications différées entre amis (voir §5). |
| **V3** | Communauté (stories, parcours communautaires, clubs, classements) — déjà décrite comme V2/V3, à valider séparément. |

## 5. Notifications (idées, avec consentement)

Toutes les notifications sont **désactivées par défaut** et réglables une par une.

- V1 : « Partagez votre résultat » à la fin d'une visite (locale, sans serveur de push).
- V1 : rappels utiles non intrusifs (pluie annoncée pendant une visite planifiée, parc bientôt fermé).
- V2 : « Votre amie a visité ce parc » — **différée** (au plus tôt en fin de journée), jamais en temps réel,
  jamais avec position ; l'ami concerné doit avoir activé « partager mes visites avec mes amis ».
- V2 : « Vous avez dépassé X km ce mois-ci » / « Vous avez dépassé les km de votre ami » — uniquement
  entre amis ayant accepté la comparaison ; aucun classement public.
- Techniquement : Web Push (PWA, iOS 16.4+ une fois l'app installée), file d'envoi côté serveur.

## 6. Services externes envisagés

| Service | Usage | Conditions |
|---|---|---|
| **Open-Meteo** (déjà intégré, désactivable) | météo pendant la visite | gratuit **non commercial**, attribution CC BY 4.0 affichée ; une version commerciale de ParkQuest exige l'abonnement API payant (ou un fournisseur alternatif). Réponses mises en cache 30 min côté serveur. |
| **Nominatim** (OpenStreetMap) | géocodage d'un point de départ ou d'une adresse (V1.5) | politique d'usage : 1 requête/s max, `User-Agent` identifiant l'app, cache obligatoire, pas d'autocomplétion à chaque frappe, attribution ODbL. Pour du volume : instance auto-hébergée ou fournisseur commercial. Jamais d'envoi de la position GPS de l'utilisateur. |
| **PokéAPI** | **inspiration uniquement** | aucune donnée, nom, image ou personnage Pokémon n'est utilisé (droits Nintendo / The Pokémon Company). |

## 7. Idée : chasse aux créatures du parc (original, V2)

- Créatures **inventées** pour ParkQuest, liées à la nature réelle du parc (ex. un esprit de séquoia,
  un gardien de l'étang), dessinées en interne, avec rareté et fiche « naturaliste ».
- Apparition liée aux **spots** (jamais à des positions aléatoires hors chemins), capture = découverte
  du spot + mini-défi (quiz, observation, photo modérée).
- Mêmes règles que les spots : validation serveur, pas de points hors visite, pas d'incitation à
  quitter les chemins ou à entrer dans des zones interdites, pas d'achat.
- À valider avec les parcs (respect des lieux, zones sensibles exclues).
