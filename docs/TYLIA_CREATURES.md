# TYLIA — Créatures, œufs et collection : architecture et design fonctionnel

> **Statut : approche générale validée le 28/09/2026** (décisions ci-dessous). Aucune table, migration ni
> écran de collection n'est créé avant les étapes C1 à C5 ; la quête E3 ne livre qu'un œuf spécial de démonstration.

## Décisions validées (28/09/2026)

- **Noms de travail validés provisoirement** : Ramilou (feuille, commun), Rivelle (eau, commun), Pétalie (fleur,
  commun), Zéphyl (air, peu commun), Humbo (forêt, peu commun), Lunastria (lune, rare), Soliane (soleil, rare).
  **Non validés juridiquement** : marques, domaines, stores et réseaux sociaux à vérifier avant publication.
- **Illustrations** : les images générées restent des références créatives internes, jamais publiées ni
  présentées comme art final. Art public : illustrateur ou artiste 3D avec cession écrite de droits.
- **Probabilités de lancement** : Commun 60 %, Peu commun 28 %, Rare 12 % ; garantie de nouveauté après
  2 doublons consécutifs ; rare garantie au plus tard au 10ᵉ œuf ; jamais de tirage sur une rareté vide ;
  probabilités configurables côté serveur.
- **Énergie de nature** : barème du § 3.2 conservé en **configuration de démonstration** ajustable,
  seuil initial 100 ; doublons → graines/fragments plus tard (hors E3).
- **Ordre** : E3 (quête + œuf spécial de démonstration) → C1 → C2 → C3 → C4 → C5 (Supabase plus tard).
- **Récompense E3** : `special_demo_egg`, source `secret-du-sequoia`, statut `demo`, non échangeable,
  non vendable, aucune probabilité appliquée.
- Aucun service externe payant (Pl@ntNet, Mapbox, services de vision) ; identification des plantes plus tard
  en simulation locale, sans appel réseau ni stockage permanent de photos.
> Les illustrations de `docs/creatures/reference/` sont une **référence artistique provisoire**
> (direction générale), non destinées à la publication.

## 0. Principes

1. **Original de bout en bout** : noms, silhouettes, histoires, mécaniques et identité visuelle propres à TYLIA.
   Pas de combat, pas de « capture », pas de vocabulaire ni de codes visuels d'une licence existante.
2. **La nature d'abord** : on fait éclore un œuf en **découvrant et en apprenant** (spots, quiz, observations,
   QR codes), pas en accumulant des kilomètres. La marche est un moyen, jamais un score.
3. **Sécurité** : aucune récompense liée à la vitesse ; objectifs uniquement sur les chemins autorisés, jamais
   la nuit dans un parc fermé ; enfants accompagnés ; aucune position partagée publiquement.
4. **Équité et bien-être** : collection de base complétable par tous, sans achat, sans série quotidienne
   obligatoire, sans pénalité d'absence ; probabilités publiques.
5. **Serveur maître** : tirage, progression et attribution décidés côté serveur. Le client affiche, il ne décide
   jamais. En mode démo, la même logique pure tourne sur l'appareil, clairement marquée « démo ».

## 1. Les 7 créatures de départ

### 1.1 Structure d'une créature

| Champ | Rôle |
|---|---|
| `slug`, `name` (traduit) | identifiant stable, nom affiché dans les 5 langues |
| `element` | feuille · eau · fleur · air · forêt · lune · soleil |
| `rarity` | commun · peu commun · rare · très rare · mythique |
| `habitat` | milieux associés (arbres, étangs, jardins, prairies, sous-bois, ciel nocturne, clairières) : sert à relier une créature à un parc **sans exclusivité géographique** |
| `nature_fact` | information naturaliste réelle liée à l'élément (ex. rôle des glands pour la forêt), vérifiée |
| `story` | histoire courte, 3 chapitres débloqués avec le compagnon |
| `hint` | indice affiché dans l'album tant qu'elle est inconnue |
| `illustration` | image finale (crédit et cession de droits obligatoires), silhouette pour « inconnue » |
| `status` | `demo` · `proposed` · `parkVerified` · `published` |

### 1.2 Proposition (ordre de création conseillé)

Les noms de travail ont été relus : plusieurs posent problème. Je propose une alternative pour chacun ;
**aucun nom n'est vérifié juridiquement** (voir § 8.2).

| # | Élément | Rareté | Nom de travail | Problème relevé | Alternative proposée | Direction |
|---|---|---|---|---|---|---|
| 1 | Feuille | commun | Lorelei → **Ramilou ✅** | **Nom d'un personnage d'une licence de créatures à collectionner** + légende et lieu célèbres du Rhin | **Ramilou** (ramille + « loup » affectueux) | graine-gland avec pousse et collerette de feuilles |
| 2 | Eau | commun | Aquilo → **Rivelle ✅** | Dieu romain du vent du nord (contresens) ; très générique | **Rivelle** | goutte translucide, feuille sur la tête, galets et nénuphars |
| 3 | Fleur | commun | Florine → **Pétalie ✅** | Prénom courant, nombreuses marques, peu protégeable | **Pétalie** | bulbe coiffé de pétales multicolores |
| 4 | Air | peu commun | Aviola → **Zéphyl ✅** | Proche de noms commerciaux existants (à vérifier) | **Zéphyl** | graine ailée à plumes, spirale de vent |
| 5 | Forêt | peu commun | Boletus → **Humbo ✅** | **Nom scientifique d'un genre de champignons** (à éviter selon votre règle) | **Humbo** (humus) | chapeau de champignon, mousse, bois |
| 6 | Lune | rare | **Lunastria ✅** | Assez distinctif | Lunastria (à vérifier) ou **Nocélune** | pelage étoilé, croissants, fleurs de nuit |
| 7 | Soleil | rare | Solara → **Soliane ✅** | Très répandu comme marque (énergie, cosmétique, hôtellerie) | **Soliane** | corolle de tournesol lumineuse |

Règles de nommage : 2 à 3 syllabes, prononçable en FR/NL/EN/ES/DE, sans nom d'espèce réelle, sans
prénom très courant, sans ressemblance avec une créature ou marque connue. Le nom est traduit si besoin
(champ par langue), le `slug` ne change jamais.

### 1.3 Direction artistique

Figurines douces façon « argile / résine peinte », socle naturel (souche, galet, mousse, eau), palette issue
de l'élément, grands yeux bienveillants, **aucune arme ni posture agressive**. Chaque silhouette doit rester
reconnaissable en ombre seule (utile pour l'album « inconnue » et l'accessibilité). Les rendus de référence
sont cohérents entre eux ; pour la version finale, voir § 8.2 (droits sur les images générées par IA).

## 2. Probabilités

### 2.1 Tables (configurables côté serveur)

Au MVP, seules 3 raretés contiennent des créatures. Un tirage ne peut **jamais** tomber sur une rareté vide :
les poids des raretés vides sont ignorés et la table est renormalisée automatiquement.

| Rareté | Œuf standard (cible, 117 créatures) | **Œuf standard MVP (7 créatures)** | Chance par créature au MVP |
|---|---:|---:|---:|
| Commun | 55 % | **60 %** | 20 % (×3) |
| Peu commun | 27 % | **28 %** | 14 % (×2) |
| Rare | 13 % | **12 %** | 6 % (×2) |
| Très rare | 4 % | — (inactif) | — |
| Mythique | 1 % | — (inactif) | — |

| Rareté | Œuf d'événement | Œuf de parc | Œuf quotidien |
|---|---:|---:|---:|
| Commun | 35 % | 50 % | = standard |
| Peu commun | 35 % | 30 % | = standard |
| Rare | 20 % | 15 % | = standard |
| Très rare | 9 % | 4 % | = standard |
| Mythique | 1 % | 1 % | = standard |

- **Œuf de parc** : pool = créatures du parc (famille dominante + éventuelle exclusive) **+ 30 % de pool général**,
  pour que le parc donne une couleur sans enfermer le joueur.
- **Œuf d'événement** : pool = créatures et variantes de l'événement ; les variantes sont **cosmétiques**
  (même créature, autre apparence), jamais un avantage.
- **Transparence** : les probabilités de chaque type d'œuf sont affichées dans l'app (« Voir les chances »).

### 2.2 Protection contre la frustration (validée par simulation)

1. **Garantie de nouveauté** : après **2 doublons consécutifs**, le 3ᵉ œuf donne une créature encore inconnue
   (tant qu'il en reste dans le pool de l'œuf).
2. **Garantie de rare** : au moins une créature rare dans les **10 premiers œufs** (puis tous les 10 œufs
   sans rare).
3. **Doublons utiles** : un doublon donne des **graines de nature** (voir § 4).

Simulation (200 000 joueurs, 7 créatures, table MVP) :

| | Œufs pour compléter la collection (moyenne) | Médiane | 90 % des joueurs | Pire cas |
|---|---:|---:|---:|---:|
| Sans protection | 27,4 | 23 | 49 | 147 |
| **Avec protections** | **12,4** | **13** | **14** | **19** |

Première créature rare obtenue en moyenne au 5,8ᵉ œuf. Avec 1 œuf quotidien + 1 œuf par parcours terminé,
la collection de départ se complète en **2 à 3 semaines** de pratique normale, jamais plus de 19 œufs.

## 3. Règle d'éclosion

### 3.1 Parcours de l'œuf

1. **Réception** : premier lancement (œuf de bienvenue, garanti commun), œuf quotidien, fin de parcours ou de
   quête, événement.
2. **Inventaire** : 3 œufs maximum en attente (pas d'accumulation anxiogène ; l'œuf quotidien suivant attend
   simplement qu'une place se libère, **sans être perdu**).
3. **Dépôt** : l'utilisateur choisit un parc sur la carte et dépose l'œuf dans un **nid** du parc. Les nids sont
   des zones prédéfinies et autorisées (entrée, accueil, aire de repos), jamais un point libre. Le dépôt peut se
   faire à distance ; seule la progression exige d'être dans le parc. On ne stocke que `park_id` et `nest_id`,
   jamais une position.
4. **Incubation** : 1 œuf en incubation par parc (MVP : 1 au total). Il progresse avec l'**énergie de nature**
   gagnée par des actions **validées par le serveur** dans ce parc.
5. **Éclosion** : quand le seuil est atteint, l'utilisateur la déclenche lui-même (geste explicite, jamais en
   marchant : « Arrête-toi pour consulter l'écran »). Le serveur tire la créature **à ce moment-là**.
6. **Présentation** : courte animation (≤ 4 s, désactivée si mouvements réduits), fiche, ajout à l'album, choix
   de compagnon proposé.

### 3.2 Énergie de nature (seuil : 100 pour un œuf standard)

| Action validée (dans le parc de l'œuf) | Énergie | Validation |
|---|---:|---|
| Spot découvert (GPS validé, QR code ou code manuel) | 20 | serveur (`discover_spot`), une fois par spot |
| Quiz réussi | 10 | serveur, une fois par quiz |
| Défi ou observation terminé | 15 | serveur |
| Étape de quête terminée | 15 | serveur |
| Parcours terminé | 30 | serveur |
| Distance parcourue | 1 / 100 m, **plafonné à 20** par œuf | cumul local, plafonné, allure de marche plausible |

- Un parcours complet (6 spots) fait éclore un œuf standard ; un **parcours court ou PMR** y arrive aussi grâce
  aux quiz, observations et QR codes : la distance n'est jamais nécessaire.
- **Rester immobile ou simuler un déplacement ne rapporte presque rien** : la distance est plafonnée et
  toutes les autres sources exigent une action unique validée côté serveur.
- Aucune énergie liée à la vitesse ; une allure non plausible (> 7 km/h) n'ajoute simplement pas de distance.

### 3.3 Messages de sécurité

Affichés au dépôt, pendant l'incubation et avant l'éclosion (texte et audio) :
« Arrête-toi pour consulter l'écran. » · « Reste sur les chemins autorisés. » ·
« Les enfants doivent être accompagnés d'un adulte. » · « Respecte les autres visiteurs et le parc. »

## 4. Doublons et monnaie douce

- Doublon → **graines de nature** (commun 5, peu commun 10, rare 20).
- Graines → **améliorations cosmétiques** du compagnon (accessoire saisonnier, socle), déblocage anticipé d'un
  chapitre d'histoire, ou **« œuf choisi par élément »** (60 graines : œuf dont le pool est limité à un élément
  au choix). Jamais d'achat en argent réel.
- Le compteur « rencontrée N fois » reste visible dans l'album (un doublon n'est pas une perte).

## 5. Compagnon

- Un compagnon actif à la fois, changeable librement.
- Sur la carte : petite figurine à côté de la position de l'utilisateur, **visible uniquement par lui**.
- Réactions : bulle courte près d'un spot lié à son élément (« Rivelle adore les étangs : regarde les
  nénuphars ») ; toujours du texte, audio optionnel.
- Progression douce, sans statistiques de combat : amitié (niveaux 1 → 5) gagnée avec les spots découverts,
  quiz réussis et parcs visités **ensemble** ; chaque niveau débloque un chapitre d'histoire ou un cosmétique.
  Pas de perte d'amitié en cas d'absence.

## 6. Modèle de données

### 6.1 Couche pure (maintenant, PWA)

`src/lib/collection/` : aucune dépendance au navigateur, testé comme `trail-progress` et `movement`.

- `rollRarity(weights, rng)` : renormalise les raretés vides.
- `pickCreature(pool, owned, pity, rng)` : applique les garanties.
- `eggEnergy(actions, rules)` : applique le plafond de distance.
- `hatchReady(egg)` et `duplicateReward(rarity)`.
- `rng` est injecté : aléatoire sûr côté serveur, graine fixe dans les tests.

Mode démo : dépôt local `features/demo/demo-collection.ts` (même interface que le futur dépôt Supabase),
comme `demo-progress`.

### 6.2 Tables Supabase (plus tard, après validation et connexion réelle)

Reprise de votre proposition, avec ajouts (en gras) :

```text
creatures            id, slug, element, rarity, habitat[], illustration_url, silhouette_url,
                     status, **art_credit**, **art_license**, created_at
creature_translations creature_id, locale, name, description, nature_fact, story_chapters jsonb, hint
creature_variants    id, creature_id, variant_type, event_id, **cosmetic_only = true**
egg_types            id, kind (welcome|daily|standard|park|event|seasonal|botanical|community|legendary),
                     rarity_weights jsonb, energy_required, active_from, active_until
park_creature_pools  park_id, creature_id, availability (dominant|exclusive|general), weight_modifier,
                     active_from, active_until
**park_nests**       id, park_id, park_feature_id, name, status  -- zones de dépôt autorisées
events               id, name, description, starts_at, ends_at, egg_type_id, status
user_eggs            id, user_id, egg_type_id, park_id, **nest_id**, received_at, deposited_at,
                     energy, status (held|incubating|ready|hatched), hatched_at,
                     **creature_id (rempli à l'éclosion)**
**egg_energy_events** user_egg_id, source (spot|quiz|challenge|quest_step|trail|distance), source_id,
                     amount, created_at, unique (user_egg_id, source, source_id)  -- une fois par action
user_creatures       id, user_id, creature_id, first_egg_id, origin_park_id, obtained_via,
                     obtained_at, times_met, friendship, is_companion
**user_collection_state** user_id, duplicates_in_a_row, eggs_since_rare, seeds, last_daily_egg_on
```

- **RLS** : chaque utilisateur ne lit que ses œufs, créatures et état ; les catalogues sont en lecture publique
  (statut `published`, ou `demo` en mode démo).
- **Fonctions `security definer`** : `grant_daily_egg`, `deposit_egg(egg, nest)`, `hatch_egg(egg)`.
  - Tirage `hatch_egg` : aléatoire serveur (`gen_random_bytes`), garanties appliquées, résultat écrit une fois.
  - Énergie : ajoutée par des déclencheurs sur `spot_discoveries`, `quiz_attempts`, etc., jamais par le client.
- **Aucune position stockée** pour les œufs.

## 7. Écrans

| Écran | Contenu clé | Accessibilité |
|---|---|---|
| Œuf reçu | œuf, type, provenance, « Voir les chances », Déposer / Plus tard | annonce lecteur d'écran, animation optionnelle |
| Choisir un parc et un nid | carte des parcs, nids du parc, rappel sécurité | liste alternative à la carte |
| Incubation | jauge d'énergie (texte + %), actions qui rapportent, parcours conseillé | jauge lisible sans couleur |
| Éclosion | bouton explicite, animation ≤ 4 s, fiche | mouvements réduits → fondu simple |
| Album | grille par élément, silhouettes et indices pour les inconnues, progression globale, par parc, œufs en cours, graines | navigation clavier, libellés complets |
| Fiche créature | illustration, élément, rareté, parc d'origine, histoire, fait nature, date, méthode, rencontres, amitié, variantes, crédits | texte + audio |
| Compagnon | choix, niveau d'amitié, chapitres débloqués | — |
| Œufs spéciaux et événements | calendrier, règles, chances, dates | — |

## 8. Risques

### 8.1 Sécurité
- Œuf « nocturne » ou créature lunaire **jamais liés à une présence de nuit dans un parc** : les parcs ferment
  au crépuscule. Lune : calendrier (jours de pleine lune, en journée) ou événements organisés par le parc.
- Soleil / météo : un bonus éventuel, jamais une exclusivité (équité, accessibilité).
- Nids uniquement dans des zones validées par le parc (pas de bord d'étang, pas de zone fermée).
- Éclosion déclenchée à l'arrêt, jamais pendant la marche.

### 8.2 Juridique
- **Ressemblance avec des jeux existants** : collectionner des créatures et faire éclore des œufs en marchant
  existe déjà dans des jeux de géolocalisation connus. Les mécaniques de jeu ne sont en principe pas protégées
  par le droit d'auteur, mais certains éditeurs détiennent des **brevets sur des mécanismes de jeux géolocalisés**.
  Notre différenciation : éclosion par la **découverte validée** (spots, quiz, observations) et non par les
  kilomètres ; nids de parc ; aucun combat ni « capture » ; ancrage botanique et patrimonial.
  → **Avis d'un conseil en propriété intellectuelle recommandé avant le lancement public.**
- **Noms** : recherche d'antériorité EUIPO, BOIP, INPI, stores et fiches de personnages des grandes licences,
  pour chaque nom retenu (non fait : environnement sans accès réseau).
- **Illustrations générées par IA** : en Europe comme aux États-Unis, une image produite sans apport créatif
  humain suffisant est difficilement protégeable. TYLIA ne pourrait pas empêcher leur copie. Il faut aussi
  vérifier les conditions d'utilisation de l'outil de génération.
  → Pour la version finale : **illustrateur ou sculpteur 3D avec cession de droits écrite** (usage commercial,
  produits dérivés, figurines).
- **Récompenses aléatoires et mineurs** : pas d'achat, donc pas de « loot box » payante. Le jeu d'argent est
  interdit pour les mineurs en Belgique, et la Commission des jeux de hasard considère les loot boxes payantes
  comme tels depuis 2018. **Ne jamais vendre d'œufs ni de graines**, même plus tard, sans nouvel avis juridique.
  Principes européens (réseau CPC) sur les monnaies virtuelles : transparence, pas de pression sur les enfants.
- **Données** : pas de position stockée pour les œufs ; comptes de mineurs soumis au consentement parental
  (13 ans en Belgique, 15 ans en France) ; aucune fonctionnalité sociale dans ce MVP.

### 8.3 Technique
- **Triche GPS** : le plafond de distance et la validation serveur des actions rendent la triche peu rentable.
  La détection avancée viendra plus tard.
- **Hors ligne** : les actions sont mises en file et validées au retour du réseau ; l'éclosion exige le serveur.
- **Poids des illustrations** : WebP/AVIF, silhouettes en SVG, préchargement de l'album par parc.
- **Mode démo** : tirage local explicitement marqué démo, jamais présenté comme réel.

### 8.4 Accessibilité
- Progression possible sans marcher loin : parcours courts, PMR, quiz audio, QR codes.
- Animations avec alternative « mouvements réduits » ; jauges lisibles sans couleur ; textes et audio ensemble.
- Aucune urgence : pas de minuteur d'éclosion, pas d'œuf perdu, pas de série à maintenir.

## 9. MVP et hors MVP

**MVP (après validation)**

- 7 créatures, 3 raretés actives, 1 parc de démonstration.
- Œufs : bienvenue, quotidien, standard, et un œuf spécial de démonstration (le trésor final de la quête
  « Le secret du Séquoia », E3).
- Nids prédéfinis à Meise, en données démo.
- Énergie de nature et incubation liées au parcours et à la quête.
- Éclosion, album, fiche créature, compagnon sur la carte (visible uniquement par l'utilisateur).
- Histoires courtes (chapitre 1) ; graines limitées aux cosmétiques simples.
- Tout est en statut `demo`, avec la mention « Donnée de démonstration à valider avec le parc ».

**Hors MVP**

- 110 autres créatures, raretés « très rare » et « mythique », variantes.
- Œufs de parc, d'événement, saisonniers, communautaires et légendaires.
- Événements et compétitions entre parcs, rotation annuelle.
- Chapitres 2 et 3, cosmétiques avancés, « œuf choisi par élément ».
- Notifications push.
- Tables Supabase réelles (après connexion de Supabase).
- Figurines physiques.

## 10. Ordre de réalisation proposé (une PR par étape)

| Étape | Contenu | Dépend de |
|---|---|---|
| C0 | Ce document (validation) | — |
| C1 | `lib/collection` pur + tests (tirage, garanties, énergie) + catalogue démo des 7 créatures | C0 |
| C2 | Album et fiche créature (démo, illustrations provisoires) | C1 |
| C3 | Œufs : réception, dépôt dans un nid, incubation branchée sur les actions de visite et de quête | C1, E3 |
| C4 | Éclosion + compagnon sur la carte | C3 |
| C5 | Migrations Supabase + fonctions serveur + RLS + tests SQL | Supabase réel validé |
