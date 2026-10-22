# TYLIA (ex-ParkQuest) — Architecture cible : PWA maintenant, application native plus tard

> **Statut : document d'architecture.** Décrit la cible et l'ordre de réalisation. Seuls les éléments
> marqués ✅ existent dans le code. Chaque module ⏳ fera l'objet d'une PR dédiée, validée au préalable.

## 1. Principe : un seul cœur, des « adaptateurs » par plateforme

```
┌──────────────────────────── UI (React / Next.js) ─────────────────────────────┐
│ Exploration (plein écran) · Carte de consultation · Fiches · Tableau de bord   │
└───────────────────────────────▲───────────────────────────────────────────────┘
                                │ hooks (useMovement, useQuest, useAudioGuide…)
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ Domaine PUR, testé, sans navigateur : src/lib/*                                │
│ progression de parcours ✅ · règles GPS ✅ · « autour de vous » ✅ · météo ✅     │
│ déplacement ✅ · quêtes ⏳ · QR ⏳ · lieux du parc ⏳ · guidage audio (textes) ⏳  │
└───────────────────────────────▲───────────────────────────────────────────────┘
                                │ interfaces (LocationSource, SpeechOutput, QrScanner, WakeLock)
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ Adaptateurs plateforme                                                          │
│ Web/PWA (maintenant) : Geolocation API, Web Speech, caméra, Wake Lock, SW       │
│ Natif (plus tard)    : Capacitor (même code web) → GPS arrière-plan, podomètre, │
│                        boussole, baromètre, HealthKit/Google Fit, notifications │
└───────────────────────────────────────────────────────────────────────────────┘
```

Règle : **aucune logique métier dans un composant ni dans un adaptateur**. Passer au natif revient à
fournir de nouveaux adaptateurs (recommandé : **Capacitor**, qui réutilise l'app web, plutôt qu'une
réécriture React Native).

## 2. Ce que permet la PWA aujourd'hui, et ce qui exigera le natif

| Besoin | PWA (web, iPhone Safari / Android Chrome) | Natif (plus tard) |
|---|---|---|
| Position, précision | ✅ `watchPosition` (haute précision seulement pendant la visite) | idem + meilleure stabilité |
| Vitesse, cap | ✅ `coords.speed` / `coords.heading` (souvent `null` à l'arrêt ou selon l'appareil) → calcul de secours à partir des positions | boussole (magnétomètre) fiable |
| Altitude / dénivelé | ⚠️ `coords.altitude` souvent absent ou imprécis sur le web | baromètre |
| Suivi écran éteint / arrière-plan | ❌ | ✅ |
| Garder l'écran allumé | ✅ Wake Lock (Safari 16.4+), **désactivé par défaut** (batterie) | ✅ |
| Plein écran | ✅ pseudo-plein-écran CSS (`ExplorationShell`) ; ✅ plein écran réel une fois installée sur l'écran d'accueil ; ❌ API Fullscreen sur iPhone | ✅ |
| Scanner un QR | ✅ **appareil photo natif** d'iPhone/Android → ouvre l'URL `/qr/[code]` ; scanner intégré optionnel (bibliothèque JS, `BarcodeDetector` absent de Safari) | ✅ |
| Guidage vocal | ✅ `speechSynthesis` (déclenché après un geste de l'utilisateur sur iOS) | ✅ + audio en arrière-plan |
| Notifications | ⚠️ Web Push seulement pour une PWA installée (iOS 16.4+) | ✅ |
| Hors ligne | ✅ service worker (pages, parc téléchargé) | ✅ + stockage plus large |
| Podomètre, santé | ❌ | ✅ |

## 3. Modules prévus

| Module | Rôle | Contenu pur (testé) | Adaptateur / UI |
|---|---|---|---|
| `lib/game/trail-progress` ✅ | états ✓ ● ◉ ○, restant | ✅ | `TrailProgress` ✅ |
| `components/exploration/exploration-shell` ✅ | pseudo-plein-écran, emplacements, blocage du défilement | — | ✅ (E1) |
| `lib/movement` ✅ | tableau de bord : distance parcourue, vitesse actuelle/moyenne (lissée), cap, temps restant, dénivelé si disponible ; filtre des positions imprécises (> 30 m) | calculs à partir d'une suite de positions | `useMovement` sur `useGeolocation` ✅ |
| `lib/quests` ⏳ (catalogue ✅) | moteur de quête : étapes (aller au spot, lire, quiz, observer, photo, récompense, indice), conditions, récompenses | machine d'états | route `/[locale]/parks/[parkSlug]/explore/[questSlug]` |
| `lib/qr` ⏳ | format des codes (court, non devinable, sans donnée personnelle), résolution → spot / étape / lieu, `discoveredVia: "gps" \| "qr" \| "manual"` | validation, parsing | route `/qr/[code]`, saisie manuelle du code en secours |
| `lib/places` ⏳ | inventaire de tous les lieux du parc (mobilier, services, nature, culture, accès), catégories/tags, statut `demo \| validated \| parkVerified`, source | filtres, couches, chargement par emprise visible | couches carte par catégorie, « montre-moi les toilettes / accès PMR » |
| `lib/audio-guide` ⏳ | consignes pas à pas (« tournez à gauche dans 10 m », « vous êtes arrivé »), file d'attente, priorité, annulation | génération des phrases à partir de la géométrie | adaptateur `speechSynthesis`, transcription écrite toujours affichée |
| `lib/accessibility` ⏳ | préférences : contraste élevé, taille du texte (S/M/L/XL), animations réduites, guidage audio, interface simplifiée, langue | valeurs par défaut et règles | stockage local + `prefers-reduced-motion` / `prefers-contrast` |

## 4. Modèles de données futurs (Supabase, non créés)

- `park_features` : lieux du parc (géométrie point / ligne / polygone, catégorie, tags, accessibilité
  PMR/poussette/malvoyant/malentendant, description traduite, statut, **source** et **licence** —
  voir `docs/OSM_ODBL_DATA_STRATEGY.md`). Distinct de `spots` (contenus de jeu).
- `qr_codes` : `code` unique indexé, cible (`spot_id` / `quest_step_id` / `park_feature_id`), actif,
  emplacement physique ; `spot_discoveries.discovered_via`.
- `quests`, `quest_steps`, `reward_items`, `user_quest_progress`, `user_collection` : voir la proposition
  du Mode Exploration (points attribués côté serveur, une seule fois ; objectifs uniquement sur chemins
  autorisés et hors zones interdites).
- Tableau de bord de déplacement : **calculé sur l'appareil**, seuls des totaux (distance, durée) sont
  envoyés au serveur — jamais la trace GPS.

## 5. Accessibilité (cible : WCAG 2.2 niveau AA)

- Les communes et gestionnaires publics sont soumis à la **directive européenne 2016/2102**
  (accessibilité des sites et applications du secteur public) ; l'**European Accessibility Act**
  s'applique depuis juin 2025 à certains services. Viser WCAG 2.2 AA facilite la vente aux communes.
- Déjà en place : libellés accessibles des marqueurs et de la progression, états non dépendants de la couleur,
  navigation clavier des boutons, `prefers-reduced-motion` respecté par le système d'animations.
- À faire : préférences d'accessibilité (§ 3), contraste élevé, audit VoiceOver/TalkBack sur les écrans
  de visite, transcriptions de tout contenu audio.

## 6. Mode Exploration : avancement

| Étape | Contenu | État |
|---|---|---|
| E1 | Extraction de l'enveloppe plein écran (`ExplorationShell` + emplacements), blocage du défilement ; rendu identique au pixel près | ✅ |
| E2 | Route `explore/[questSlug]`, écran de sécurité avant le jeu, contrôles 2D/3D (MapLibre seulement), recentrer, nord en haut, pause, quitter ; tableau de déplacement léger (distance, temps restant, direction, vitesse lissée, calcul local, aucune récompense liée à la vitesse) | ✅ |
| E3 | Moteur de quête pur + quête démo « Le secret du Séquoia » (6 étapes, trésor final) | ⏳ |
| E4 | Récompenses et collection (démo) | ⏳ |
| E5 | Panneau latéral desktop | ⏳ |
| E6 | Tests e2e et captures | ⏳ |
| E7 | Migration des tables (avec Supabase réel) | ⏳ |

## 7. Changement de nom : ParkQuest → TYLIA

- **Avant tout changement public** : vérifier la disponibilité de la marque (EUIPO, Office Benelux BOIP,
  INPI), des noms de domaine et des noms sur l'App Store / Google Play. Non vérifié à ce stade.
- **Méthode** : un seul fichier de marque (`src/config/brand.ts` : nom, baseline, couleurs, logo) utilisé
  par les métadonnées, le manifeste PWA, l'en-tête et les e-mails ; le dépôt et les identifiants
  techniques peuvent rester `parkquest`.
- **Fichiers concernés** : métadonnées du layout, `src/app/manifest.ts`, en-têtes (`desktop-header`,
  en-tête mobile de l'accueil), logo (`components/brand/logo`), traductions (`common.appName`), README.
