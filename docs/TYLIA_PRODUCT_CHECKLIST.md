# TYLIA — Contrôle de conformité : demandé / livré

> État au 28/09/2026. « main » = fusionné (production Vercel) ; « PR #n » = en aperçu, **non fusionné**.
> Statuts : **Livré** · **Partiellement livré** · **Préparé** (conception, types ou champs prêts, sans
> fonctionnalité visible) · **Non commencé**.
>
> **Limite commune à tous les tests automatiques** : ils tournent dans Chromium avec un format iPhone émulé,
> dans un environnement sans accès réseau (fond de carte OpenStreetMap, tuiles 3D et API d'espèces
> injoignables). Aucun test n'a été fait sur un vrai iPhone ni dans Safari/WebKit : ces vérifications restent
> manuelles, sur les aperçus Vercel (voir `docs/VERCEL_RELEASES.md`).

## Réponse claire sur le plein écran

- **Pseudo plein écran CSS (iPhone et partout)** : **livré** dans `main` (PR #6). L'écran de visite et le
  Mode Exploration recouvrent toute la zone visible, gèrent les zones sûres, bloquent le défilement de la page
  et la rétablissent à la sortie.
- **Bouton plein écran natif (API Fullscreen du navigateur)** : **n'existe pas**. Aucun bouton ne permet
  aujourd'hui de passer le navigateur en vrai plein écran, sur desktop ou ailleurs.
- **Plein écran global : partiellement livré.**
- **Proposition, petite PR séparée « Plein écran natif (desktop) »** (à valider, non commencée) :
  - bouton « Plein écran » / « Quitter le plein écran » dans les contrôles de l'écran d'exploration ;
  - affiché **seulement si** `document.fullscreenEnabled` et `requestFullscreen` existent. Il est donc
    absent sur iPhone, où l'API n'existe pas pour une page web, et le pseudo plein écran CSS reste inchangé ;
  - `document.documentElement.requestFullscreen()` / `document.exitFullscreen()` ; état synchronisé sur
    `fullscreenchange` (sortie par Échap comprise) ; libellé accessible et `aria-pressed` ; sortie automatique
    en quittant l'écran ;
  - tests e2e : bouton présent quand l'API existe, absent quand elle est retirée, retour à l'état normal ;
  - branche basée sur #10 (ou sur `main` une fois #8 et #10 fusionnées), environ 60 lignes.

## Tableau de conformité

| # | Fonctionnalité | Statut | PR / fichiers | Tests disponibles | Limitation connue | Prochaine action |
|---|---|---|---|---|---|---|
| 1 | Carte interactive MapLibre + repli sans WebGL | **Livré** (main) | PR #4 : `components/map/park-map.tsx`, `maplibre-map.tsx`, `fallback-map.tsx`, `lib/map/theme.ts` | e2e carte (« Autour de vous », guidage, filtres, GPS refusé) ; unitaires `map-theme` | Tests en carte simplifiée uniquement (pas de réseau) ; rendu OpenStreetMap et 3D jamais vérifiés automatiquement ; satellite inactif sans jeton Mapbox (non configuré, volontairement) | Contrôle manuel sur la production : fond OSM, 3D, repli |
| 2 | Vrai Mode Exploration immersif | **Partiellement livré** | E1 main (#6) ; E2 PR #8 ; E3 PR #10 | e2e : sécurité, pause, sortie, quête complète, quête inconnue | #8 et #10 non fusionnées ; non validé sur téléphone ; pas de plein écran natif ; pas de Wake Lock (écran qui reste allumé) | Votre validation visuelle de #8 puis #10 ; PR « plein écran natif » |
| 3 | Pseudo plein écran CSS iPhone | **Livré** (main) | PR #6 : `components/exploration/exploration-shell.tsx`, `globals.css` (`html.pq-immersive`) | e2e « défilement bloqué, restauré à la sortie » ; comparaison de captures avant/après | Vérifié en émulation Chromium, pas dans Safari iOS réel | Test manuel iPhone (Safari et PWA installée) |
| 4 | Bouton plein écran natif desktop (si l'API existe) | **Non commencé** | — | — | Voir ci-dessus | PR séparée proposée, à valider |
| 5 | Safari iPhone : zones sûres, blocage du défilement, retour à la page normale | **Partiellement livré** | `viewportFit: "cover"` (layout), `env(safe-area-inset-*)` dans l'enveloppe, `overscroll-behavior: none`, classe retirée au démontage | e2e retour à la page normale (Chromium) | Barre d'adresse Safari, rebond élastique et encoche non vérifiés sur appareil réel ; `overscroll-behavior` demande iOS 16 ou plus | Check-list manuelle iPhone (dans `VERCEL_RELEASES.md`) |
| 6 | Bouton 2D/3D seulement avec MapLibre | **Livré** (carte : main) · **Partiel** (Exploration : PR #8) | `park-map-explorer.tsx` ; `exploration-runner.tsx` (`engine === "maplibre"`) | Indirect : en carte simplifiée, le bouton est absent (captures) ; pas d'assertion dédiée | Jamais testé avec MapLibre actif (pas de réseau) | Ajouter une assertion « absent en repli » ; vérification manuelle en 3D |
| 7 | GPS : précision, pause, recentrage, orientation, reprise | **Livré** (visite : main) · **Partiel** (Exploration : #8/#10) | `hooks/use-geolocation.ts`, `gps-status.tsx`, `location-consent-sheet.tsx` ; #8 : `lib/movement`, `use-movement.ts`, « Nord en haut » | e2e : GPS refusé, imprécis, approximatif, simulé ; unitaires déplacement (7) | « Orientation » = carte nord en haut + direction de l'objectif ; la boussole du téléphone n'est pas utilisée ; pas de suivi écran éteint (limite du web) | Test GPS réel sur téléphone ; boussole plus tard (natif) |
| 8 | Parcours : marqueurs, ligne, progression, panneau du prochain spot | **Livré** (main) | PR #5 : `lib/game/trail-progress.ts`, `trail-progress.tsx`, marqueurs d'étape, tracés | unitaires progression (7) ; e2e boucle de visite, GPS simulé, badge | Tracés des parcours = courbes de démonstration (pas les vrais chemins) | Chemins réels : phase OSM, après votre validation spécifique |
| 9 | Accessibilité : lecteur d'écran, mouvements réduits, clavier, contraste, taille du texte, PMR | **Partiellement livré** | Libellés et annonces (`aria-live`), états non dépendants de la couleur, animations désactivées en mouvements réduits (+ carte : #8), boutons au clavier ; PMR : indication par parcours, arrivée manuelle et étape facultative (#10) ; audio avec transcription (#10) | Assertions par rôles et libellés dans tous les e2e (vérifient indirectement l'accessibilité) | Pas d'audit VoiceOver/TalkBack ; contraste non mesuré ; **pas de réglage de taille de texte ni de contraste élevé** ; pas de préférences d'accessibilité | Module `lib/accessibility` (tailles S à XL, contraste élevé, audio) + audit WCAG 2.2 AA |
| 10 | Hors ligne / PWA réel | **Partiellement livré** | `app/manifest.ts`, icônes, `public/sw.js`, page `/offline`, `NetworkStatus` | Aucun test automatique hors ligne | Disponible : installation, page hors ligne, pages déjà visitées et ressources statiques en cache, erreur claire pour les actions hors ligne. **Manque** : fond de carte hors ligne (tuiles non mises en cache), « Télécharger ce parc » (seulement préparé : nom de cache), file d'attente des actions hors ligne, notifications | Test manuel mode avion ; lot « parc hors ligne » à planifier |
| 11 | QR codes | **Préparé** | #10 : `discoveredVia: "qr"` dans le moteur de quête ; `docs/TYLIA_ARCHITECTURE.md` (route `/qr/[code]`, table `qr_codes`) | Unitaire : arrivée par QR acceptée par le moteur | Aucune route, aucun code, aucun scan | Lot dédié : route `/qr/[code]` + saisie manuelle du code (après E3) |
| 12 | Photos, modération, enfants, vie privée | **Partiellement livré** | PR #4 : `spot-photos.tsx`, migration `20260928001500_spot_photos.sql` (fonctions, RLS), réencodage client (EXIF et GPS retirés), consentement CC BY-SA, statut en attente | e2e photo (proposition, consentement, attente, validation) ; 41 assertions SQL | Modération réelle inexistante (démo : validation simulée, en aperçu seulement) ; pas de parcours « compte mineur » (champs `is_minor` / `parental_consent_at` seulement) ; politique RGPD non rédigée ; pas de règle sur les visages | Politique RGPD, comptes mineurs, règles photo (visages, enfants) avant tout compte réel |
| 13 | Rôles : utilisateur, contributeur, collaborateur, éditeur, gestionnaire, modérateur, admin, super-admin | **Préparé** | Existant : type `app_role` + `user_roles` (migrations 0200/1000) ; conception validée : PR #11 `docs/TYLIA_ROLES_AND_PERMISSIONS.md` | 41 assertions SQL sur l'existant | Contributeur, collaborateur, analyste et invitations non créés ; **failles E1 à E4 ouvertes** (sans risque tant que Supabase réel n'est pas connecté) | R1 à R8 **en pause** jusqu'à votre feu vert |
| 14 | Multi-parcs, gestionnaire limité à son parc, RLS Supabase | **Partiellement livré** | Schéma multi-parcs, `has_park_role`, policies RLS par parc ; liste des parcs (Meise + parcs à venir) | 41 assertions SQL (base de test locale) | Supabase réel non connecté ; E2/E3 (éditeur qui publie, gestionnaire qui change le slug) à corriger ; un seul parc avec du contenu | Corrections E1 à E4 dans R2/R3, après validation |
| 15 | Quêtes, œufs, créatures, album, compagnon | **Partiellement livré** (quête) · **Préparé** (créatures) · **Non commencé** (album, compagnon) | #10 : moteur de quête + « Le secret du Séquoia » + œuf spécial de démonstration ; #9 : `docs/TYLIA_CREATURES.md` | Unitaires moteur (6) ; e2e quête complète | #10 non fusionnée ; pas de tirage, d'incubation, d'album ni de compagnon (conforme au périmètre validé) | C1 : logique pure des créatures et des œufs, locale, après validation de #10 |
| 16 | Nom et marque TYLIA | **Partiellement livré** | PR #7 : `src/config/brand.ts`, logo SVG, icônes, nom dans 5 langues (non fusionnée) | e2e 11/11 sur la branche ; captures clair/sombre | **Vérification juridique non commencée** : EUIPO, BOIP, INPI, `tylia.com/.app/.be/.eu`, App Store, Google Play, réseaux sociaux | Recherche d'antériorité (juriste ou conseil en marques) ; puis fusion de #7 |

## Textes publics

- Plus aucun texte « mode test », « mode démo », « mock », « debug », « prototype » ou « Supabase » dans
  l'interface publique : un test e2e le vérifie sur 8 pages en 3 langues.
- Contenus non confirmés : « Donnée de démonstration à valider avec le parc. »
- Aperçus Vercel uniquement : bannière « Aperçu de développement — données de démonstration. » (jamais en production).
- Outils de démonstration (position simulée, remise à zéro, modération simulée) : aperçus et local uniquement.
