# TYLIA — Versions Vercel

> État au 28/09/2026, relevé **en lecture seule** : déploiements GitHub créés par Vercel, commentaires de l'app
> Vercel et historique git. Aucune configuration Vercel n'a été modifiée et aucun déploiement manuel n'a été fait.

## Configuration constatée

| Environnement | Source | Constat |
|---|---|---|
| **Production** | branche `main` | Les déploiements « Production » correspondent exactement aux commits de fusion de `main` (`73e73da` #4, `fa92c5e` #5, `97728e2` #6). ✅ |
| **Preview** | chaque branche de PR | Chaque push sur une branche de PR crée un déploiement « Preview » et un alias stable par branche. ✅ |

- Production = `main`, previews = branches de PR : **conforme à la cible, rien à modifier.**
- L'API Vercel n'est pas accessible depuis cette session (403 sur l'espace `vivonswebdevs-projects`). Les
  réglages (domaines, variables d'environnement, protection des aperçus) n'ont donc pas pu être lus
  directement. À vérifier dans Vercel → Project → Settings → Git (« Production Branch » = `main`).
- Toutes les versions tournent en **données de démonstration** (aucune clé Supabase ni Mapbox configurée).

## Ce qui s'affiche selon l'environnement

| Élément | Production (`main`) | Preview (PR) | Local |
|---|---|---|---|
| Bannière « Aperçu de développement — données de démonstration. » | jamais | ✓ (avec branche et commit) | non (sauf `PARKQUEST_PREVIEW_BANNER=1`) |
| Outils de démonstration (position simulée, modération simulée, remise à zéro) | jamais | ✓ | ✓ (tests e2e) |
| Mention « Donnée de démonstration à valider avec le parc. » sur les contenus non confirmés | ✓ | ✓ | ✓ |
| Textes « mode test », « mock », « debug », « prototype », « Supabase » | jamais | jamais | jamais |

Détection : variable système `VERCEL_ENV`, lue côté serveur (`src/lib/config/deploy-env.ts`). En production,
la bannière et le panneau ne sont pas présents dans le HTML du tout.

> Ces règles d'affichage arrivent avec la PR « Statut produit et versions ». Les versions listées ci-dessous
> ne les contiennent pas encore : elles affichent encore l'ancien panneau « DÉMO » et certains textes
> « mode démo ».

## Tableau des versions

| Version | PR / branche | Commit | Statut | URL Vercel | Fonctionnalités principales | À tester |
|---|---|---|---|---|---|---|
| **Production** | `main` | `97728e2` | Production | https://parkquest-zeta.vercel.app (déploiement : https://parkquest-j1pn0y1h6-vivonswebdevs-projects.vercel.app) | #4 carte MapLibre, 3D, photos, espèces · #5 parcours numéroté et progression · #6 enveloppe plein écran | Carte, visite, progression |
| **TYLIA** | #7 · `feature/brand-tylia` | `d096a9f` | Preview (ne pas fusionner avant la vérification de la marque) | https://parkquest-git-feature-brand-tylia-vivonswebdevs-projects.vercel.app | Nom TYLIA, logo « I » en feuille, icônes PWA | Clair, sombre, icônes |
| **Exploration E2** | #8 · `feature/exploration-e2` | `16596e0` | Preview | https://parkquest-git-feature-exploration-e2-vivonswebdevs-projects.vercel.app | Écran de sécurité, carte plein écran, 2D/3D, recentrer, nord, pause, quitter, tableau de déplacement | 2D/3D, GPS réel |
| **Exploration E3** | #10 · `feature/exploration-e3` (basée sur #8) | `75fd817` | Preview | https://parkquest-git-feature-exploration-e3-vivonswebdevs-projects.vercel.app | Quête « Le secret du Séquoia », activités, trésor (œuf de démonstration) | Quête complète sur mobile |
| Créatures (document) | #9 · `feature/creatures-design` | `948da44` | Brouillon | https://parkquest-git-feature-creatures-design-vivonswebdevs-projects.vercel.app | Documentation seulement (application identique à `main`) | — |
| Rôles (document) | #11 · `feature/roles-permissions-design` | `db1f79e` | Brouillon | https://parkquest-git-feature-roles-permi-a1887f-vivonswebdevs-projects.vercel.app | Documentation seulement | — |
| Statut produit et versions | #12 · `feature/release-hygiene` | `1178f36` | Preview | https://parkquest-git-feature-release-hygiene-vivonswebdevs-projects.vercel.app | Textes publics nettoyés, bannière d'aperçu, outils de démo masqués en production, ce document | Bannière visible en aperçu ; aucun texte technique |

Accès rapides :

- **Quête E3** : `…-feature-exploration-e3-…vercel.app/fr/parks/plantentuin-meise/explore/le-secret-du-sequoia`
- **Exploration E2** : `…-feature-exploration-e2-…vercel.app/fr/parks/plantentuin-meise/explore/le-secret-du-sequoia`

## Éléments encore en démonstration (toutes versions)

- Contenus de Plantentuin Meise (spots, parcours, textes, quiz, positions) : **à valider avec le parc**.
- Tracés des parcours et des quêtes : courbes indicatives, pas les chemins réels.
- Progression, points, badges, quêtes et récompenses : enregistrés sur l'appareil uniquement.
- Météo : simulée. Photos proposées : restent sur l'appareil, non publiées.
- Autres parcs : fiches « bientôt disponibles », sans contenu.
- Comptes : connexion non ouverte (pas de Supabase réel).

## Check-list de test manuel

### Mobile (iPhone Safari, puis Android Chrome)

- [ ] Accueil, parc, parcours : lisibles en thème **clair** et **sombre** ; aucun texte « test / démo technique ».
- [ ] Carte : fond OpenStreetMap chargé ; **3D** (inclinaison, arbres) ; recentrer ; repli propre si 3D indisponible.
- [ ] GPS : **accepter**, **refuser** (l'app reste utilisable), signal **imprécis** (pas de validation automatique).
- [ ] Visite d'un parcours : marqueurs ✓ ● ◉ ○, ligne, « Étape N sur 6 », panneau du prochain spot.
- [ ] Plein écran : pas de défilement de la page derrière la carte, rien sous l'encoche ni sous la barre d'accueil ; retour normal après « Quitter ».
- [ ] PWA : « Sur l'écran d'accueil » → ouverture en plein écran, icône correcte.
- [ ] Mode avion : page hors ligne propre, pages déjà vues accessibles.
- [ ] Exploration (E2/E3) : écran de sécurité (bouton désactivé tant que la case n'est pas cochée), Pause très visible, Quitter avec confirmation, reprise de la quête après rechargement.
- [ ] E3 : énigme → quiz → observation → **audio + texte** → photo **facultative** (passer) → trésor ; boutons toujours atteignables.
- [ ] Lecteur d'écran (VoiceOver/TalkBack) : boutons annoncés, étapes annoncées.
- [ ] Réglage « Réduire les animations » : pas d'animation de vol de carte ni de flottement de l'œuf.

### Desktop (Chrome, Firefox, Safari)

- [ ] En-tête desktop, navigation, thèmes.
- [ ] Carte : 2D/3D, zoom molette, clavier (Tab, Entrée, Échap dans les boîtes de dialogue).
- [ ] Visite et Exploration en plein écran CSS : rien ne dépasse de l'en-tête ; quitter rétablit la page.
- [ ] Preview uniquement : bannière « Aperçu de développement — données de démonstration. » en haut, avec branche et commit.
- [ ] Production : **aucune** bannière, **aucun** panneau d'outils de démonstration.

## Règles

- Aucune fusion, aucune modification de la configuration Vercel et aucun déploiement manuel en production
  sans accord explicite.
- Ce document est mis à jour à chaque nouvelle PR ou fusion.
