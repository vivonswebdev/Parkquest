# TYLIA — Cœur du jeu : conception UX et architecture

> **Statut : proposition, à valider.** Aucun écran, aucune table, aucun stockage n'est créé tant que ce
> document n'est pas validé. Il complète `docs/TYLIA_CREATURES.md` (créatures, raretés, énergie, déjà validé)
> et remplace, pour l'ordre de réalisation, les étapes C1 à C4 de ce document par les étapes G1 à G7 (§ 12).

## 0. Vision et vocabulaire

TYLIA est un **univers de jeu global**. Les parcs sont les terrains réels où l'on joue ; ils ne sont pas le jeu.

| Niveau | Définition | Exemple |
|---|---|---|
| **TYLIA** | Univers global : profil, œufs, album, créatures, compagnon, événements | « Ma collection : 3/7 » |
| **Parc** | Terrain réel où le joueur trouve des aventures | Plantentuin Meise |
| **Aventure** | Quête locale jouable dans un parc | « Le Secret du Séquoia » (démonstration) |
| **Étape** | Action d'une aventure : se rendre à un lieu, énigme, quiz, observation… | « L'énigme du géant » |
| **Récompense** | Ce que rapporte une action : énergie de nature, fragments, badges, œufs | +20 énergie |
| **Créature** | Figurine ajoutée à la collection globale | Ramilou (feuille, commun) |

**Place du « Secret du Séquoia »** : c'est une aventure de démonstration à Meise, parmi d'autres à venir. Elle
alimente l'univers global : ses étapes donnent de l'énergie à l'œuf actif et elle offre un œuf spécial de
démonstration. Elle n'est jamais présentée comme « le jeu TYLIA ».

Changements de formulation à prévoir en G7 (PR #10) :
- « Mode Exploration » devient « Aventure » dans l'interface ;
- le trésor devient « Œuf spécial de démonstration, ajouté à ta réserve d'œufs ».

## 1. Navigation

Barre du bas (mobile) et en-tête (desktop), 5 entrées :

| Entrée | Route | Contenu |
|---|---|---|
| **Accueil** | `/[locale]` | Accueil du jeu (§ 2) |
| **Parcs** | `/[locale]/parks` (liste + carte) | Carte des parcs, fiches de parc, aventures de chaque parc |
| **Explorer** (bouton central, mis en avant) | choix du parc → aventure | Raccourci « Explorer un parc » : parc le plus proche si la position est connue, sinon liste |
| **Collection** | `/[locale]/collection` | Album, œufs (réserve et incubation), compagnon |
| **Profil** | `/[locale]/profile` | Profil, badges, préférences (accessibilité, thème, langue), confidentialité |

L'entrée actuelle « Défis » disparaît de la barre : les défis deviennent des étapes d'aventure et les
événements s'affichent sur l'accueil. La carte d'un parc reste accessible depuis sa fiche.

Nouvelles routes :

- `/[locale]/collection` : album (onglets **Créatures** · **Œufs** · **Compagnon**) ;
- `/[locale]/collection/[creatureSlug]` : fiche d'une créature ;
- `/[locale]/eggs/[eggId]/hatch` : écran d'éclosion (plein écran, `ExplorationShell`) ;
- les aventures gardent `/[locale]/parks/[parkSlug]/explore/[questSlug]`. Un renommage d'URL en
  `/adventures/` est possible plus tard, avec redirection.

## 2. Écran d'accueil du jeu

### 2.1 Maquette mobile (ordre vertical)

```
┌──────────────────────────────────────────┐
│ Bonjour Lina                   [avatar]  │  en-tête + compagnon miniature
├──────────────────────────────────────────┤
│  ╭──────────────╮  ŒUF ACTIF             │
│  │   (œuf)      │  Œuf de bienvenue      │  carte « héros »
│  │   ◔ 64 %     │  64 / 100 énergie      │  anneau de progression
│  ╰──────────────╯  ≈ 2 découvertes       │  estimation en actions, jamais en km
│  [ Explorer un parc ]      (bouton 1er)  │
├──────────────────────────────────────────┤
│ MON COMPAGNON   Ramilou  « Les chênes    │  figurine + phrase courte
│                 m'appellent ! » [Changer]│
├──────────────────────────────────────────┤
│ MA COLLECTION  3/7   🍃 💧 🌸 ? ? ? ?    │  7 emplacements par élément
│                             [Voir l'album]│  silhouettes pour les inconnues
├──────────────────────────────────────────┤
│ DERNIÈRES DÉCOUVERTES  →                 │  défilement horizontal
│ [Séquoia géant] [Ramilou] [Badge Forêt]  │  spots, créatures, badges
├──────────────────────────────────────────┤
│ AVENTURES PROCHES                        │
│ ▸ Le Secret du Séquoia · Meise · 6 étapes│  distance si la position est connue
│   ≈ 45 min · Démo                        │
├──────────────────────────────────────────┤
│ CARTE DES PARCS   [mini-carte, repères]  │  → Parcs
├──────────────────────────────────────────┤
│ ÉVÉNEMENTS  (masqué s'il n'y en a pas)   │
└──────────────────────────────────────────┘
      Accueil  Parcs  (EXPLORER)  Collection  Profil
```

Sur desktop : deux colonnes. À gauche, œuf actif, compagnon et collection ; à droite, aventures proches,
carte des parcs et événements.

### 2.2 États de la carte « œuf actif »

| Situation | Affichage | Action principale |
|---|---|---|
| Premier lancement | Œuf de bienvenue offert (après l'écran de sécurité) | « Commencer » |
| Œuf en incubation | Anneau et `n / 100`, estimation « ≈ 2 découvertes » | « Explorer un parc » |
| Œuf prêt | « Prêt à éclore ! Arrête-toi pour l'ouvrir. » | « Faire éclore » |
| Aucun œuf actif, réserve non vide | « Choisis ton prochain œuf » | « Choisir » |
| Aucun œuf | « Ton prochain œuf arrive demain ou en terminant une aventure » | « Explorer un parc » |

### 2.3 Ce que l'accueil ne montre jamais

- Aucun classement ni score de vitesse ou de distance.
- Aucune position d'autres joueurs.
- Aucune série de jours consécutifs à ne pas perdre.
- Aucun compte à rebours ni offre payante.

## 3. Les écrans du MVP

| Écran | Contenu | Remarques |
|---|---|---|
| Accueil jeu | § 2 | Remplace l'accueil actuel ; météo et parc à la une passent sur la fiche du parc |
| Œuf reçu | Illustration, type, provenance (« Aventure : Le Secret du Séquoia »), « Voir les chances », « Mettre en incubation » / « Garder en réserve » | Annonce lecteur d'écran |
| Œufs (Collection → Œufs) | Œuf actif, réserve (3 au plus), historique des éclosions | Changer d'œuf actif conserve l'énergie de chaque œuf |
| Éclosion | Plein écran ; rappel « Arrête-toi pour regarder l'écran » ; bouton explicite ; animation de 4 s au plus (fondu si mouvements réduits) ; puis fiche de la créature | Jamais déclenchée automatiquement ni en marchant |
| Album | 7 emplacements groupés par élément ; silhouettes et indices pour les inconnues ; `3/7` ; doublons « rencontrée ×2 » ; fragments | Liste accessible alternative à la grille |
| Fiche créature | Illustration, nom, élément, rareté (texte + forme d'icône), parc d'origine, histoire (chapitre 1), fait nature, date, méthode d'obtention, rencontres, amitié | Texte + audio facultatif |
| Compagnon | Choix parmi les créatures obtenues ; niveau d'amitié ; chapitres débloqués | Visible dans les aventures, uniquement pour soi |

## 4. États d'un œuf

```
 reçu ──► en réserve ──► actif (incubation) ──► prêt ──► éclosion ──► éclos (historique)
             ▲    │            │
             └────┴──(changer d'œuf actif : l'énergie reste acquise par œuf)
```

| État | Technique | Règles |
|---|---|---|
| En réserve | `held` | 3 œufs au plus en réserve ; l'œuf quotidien suivant attend qu'une place se libère, sans être perdu |
| Actif | `incubating` | 1 seul œuf actif au MVP ; reçoit l'énergie de nature |
| Prêt | `ready` | Énergie ≥ seuil (100 pour un œuf standard) ; l'énergie en trop n'est pas perdue et va à l'œuf suivant |
| Éclosion | `hatching` | Transitoire : tirage (§ 7) puis enregistrement du résultat, une seule fois |
| Éclos | `hatched` | Lié à la créature obtenue (`creature_id`) |

**Simplification par rapport à `TYLIA_CREATURES.md`** : au MVP, l'œuf actif est **global**. L'énergie gagnée
dans n'importe quel parc le fait progresser : c'est ce qui rend TYLIA multi-parcs. Les « nids » et les œufs
liés à un parc (qui n'avancent que dans ce parc) deviennent une variante pour plus tard.

## 5. Cycle de jeu

```
 Accueil ──► Explorer un parc ──► Aventure (étapes) ──► énergie de nature ──► œuf actif
    ▲                                    │                                       │
    │                                    └─► badges, œuf spécial (fin)          ▼ prêt
 Compagnon ◄── choisir ◄── Album (collection globale) ◄── créature ◄── Éclosion (à l'arrêt)
    │
    └─► accompagne la prochaine aventure (réactions près des lieux de son élément)
```

- **Boucle courte (une visite)** : une aventure de 45 min fait éclore environ un œuf standard.
- **Boucle longue (plusieurs semaines)** : compléter les 7 créatures, 19 œufs au plus grâce aux protections ;
  monter l'amitié du compagnon ; visiter d'autres parcs ; événements.

## 6. Récompenses

| Récompense | Rôle | Obtention (MVP) | Usage |
|---|---|---|---|
| **Énergie de nature** | Fait éclore l'œuf actif | Barème validé : spot découvert 20, quiz réussi 10, défi ou observation 15, étape d'aventure 15, aventure terminée 30, distance 1 pour 100 m (plafond 20 par œuf) | Automatique, vers l'œuf actif |
| **Œufs** | Nouvelles créatures | Bienvenue (1 fois, commun garanti), quotidien (1 par jour, sans série), fin d'aventure (œuf spécial de démonstration pour le Séquoia) | Réserve puis incubation |
| **Fragments** | Rendre les doublons utiles | Doublon : commun 5, peu commun 10, rare 20 | Plus tard : cosmétiques du compagnon, « œuf choisi par élément » |
| **Badges** | Jalons | Système existant (premiers pas, parcours terminé…) | Profil |

**Décision à prendre (Q2)** : les **points** actuels (quiz, spots) font double emploi avec l'énergie. Proposition :
garder un seul compteur visible, l'énergie de nature. Les points restent en interne pour les badges existants,
puis sont retirés en douceur.

Chaque action ne compte **qu'une fois** : un spot, un quiz ou une étape déjà comptés ne rapportent rien de plus
si l'on rejoue l'aventure.

## 7. Raretés et règles anti-doublons (rappel des décisions validées)

- MVP : **Commun 60 %, Peu commun 28 %, Rare 12 %**. Une rareté sans créature active n'est jamais tirée.
  Les chances sont affichées (« Voir les chances »).
- **Garantie de nouveauté** : après 2 doublons consécutifs, le 3ᵉ œuf donne une créature encore inconnue.
- **Garantie de rare** : au plus tard au 10ᵉ œuf sans rare.
- Simulation : 12,4 œufs en moyenne pour compléter la collection, 19 au plus.
- Œuf de bienvenue : commun garanti, jamais un doublon.
- **Œuf spécial de démonstration** (Séquoia) : aucun tirage de rareté réel. Il donne une créature non
  encore obtenue, choisie de façon déterministe (élément « feuille » en priorité), et il est marqué
  « démonstration ».
- Tirage au moment de l'éclosion, jamais à la réception. Au MVP, il se fait sur l'appareil, marqué démo ;
  plus tard, côté serveur.

## 8. Compagnon

- Un seul compagnon actif, changeable librement, choisi parmi les créatures obtenues.
- **Accueil** : figurine et une phrase courte liée à la saison, à la météo ou au dernier parc visité.
- **Aventure** : petite figurine près de la position du joueur, visible **uniquement par lui**. Bulle courte
  près d'un lieu de son élément (Rivelle près d'un étang). Toujours en texte, audio facultatif.
- **Amitié** (niveaux 1 à 5) : augmente avec les découvertes et aventures faites ensemble. Elle ne baisse
  jamais, même en cas d'absence. Chaque niveau débloque un chapitre d'histoire.
- Pas de combat, pas de statistiques de force, pas de soins ni de faim à gérer.

## 9. Accessibilité

- Rareté et élément transmis par un **texte et une forme** (feuille, goutte…), jamais par la seule couleur.
- Progression de l'œuf toujours lisible en chiffres (`64 / 100`), annoncée au lecteur d'écran à chaque gain
  (regroupée, pas à chaque mètre).
- Éclosion : animation courte et facultative ; mouvements réduits → fondu simple ; bouton « Passer l'animation ».
- Album : grille **et** liste ; chaque créature a une description textuelle de son apparence.
- Énergie possible **sans marcher loin** : quiz, observations, étapes d'aventures courtes ou PMR, QR codes
  (plus tard). La distance n'est jamais nécessaire pour faire éclore un œuf.
- Cibles tactiles de 44 px au moins, navigation clavier complète sur desktop, préférences d'accessibilité
  (taille du texte, contraste élevé) dans le Profil (module `lib/accessibility`, déjà prévu).

## 10. Sécurité des enfants et bien-être

- **Aucun achat**, aucune monnaie réelle, aucun œuf ou fragment vendu. Aucune offre, aucun échange entre joueurs.
- **Aucune interaction sociale** au MVP : pas de chat, pas de profil public, pas de position partagée.
- **Aucune pression** : pas de série quotidienne, pas de perte en cas d'absence, pas de minuteur, pas
  d'œuf qui expire, notifications désactivées par défaut.
- **Écran à l'arrêt** : éclosion et lecture des récompenses uniquement via un geste explicite, avec le
  rappel « Arrête-toi pour regarder l'écran ». Aucune récompense liée à la vitesse ; aucun objectif hors des
  chemins ; jamais de présence requise la nuit.
- Rappel doux de pause après 45 min d'aventure continue (proposition).
- Futurs comptes de mineurs : consentement parental selon le pays (13 ans en Belgique, 15 ans en France),
  données minimales, pas de photo publique d'enfant.

## 11. Local en démo aujourd'hui, Supabase plus tard

### 11.1 Architecture

```
src/lib/game-core/            (pur, testé, sans navigateur)
  eggs.ts        machine d'états de l'œuf, réserve, seuils
  energy.ts      barème, plafond de distance, dédoublonnage (source, id)
  hatch.ts       tirage de rareté, garanties, œuf spécial déterministe (hasard injecté)
  collection.ts  album, doublons → fragments, progression 3/7
  companion.ts   amitié, chapitres
  catalog.ts     7 créatures (statut demo), types d'œufs, tables de rareté (configuration locale)

src/features/game/            (adaptateurs)
  game-store.ts        interface GameStore : lire l'état, appliquer un événement
  local-game-store.ts  implémentation locale (localStorage) : démo, aujourd'hui
  (supabase-game-store.ts : fonctions serveur + RLS, plus tard)

Événements de jeu (une seule entrée) :
  spot_discovered · quiz_answered · challenge_done · quest_step_done · adventure_done · distance_walked
  → energy.ts → œuf actif ; les aventures (moteur de quête existant) publient ces événements.
```

### 11.2 Répartition

| Élément | Démo aujourd'hui (appareil) | Avec Supabase (plus tard, après validation) |
|---|---|---|
| Œufs, énergie, réserve | `localStorage`, logique pure | Tables `user_eggs`, `egg_energy_events` (unicité par action), fonctions serveur |
| Tirage à l'éclosion | Hasard local, marqué démo | `hatch_egg()` côté serveur, aléatoire sûr, garanties stockées |
| Validation des actions | Moteur de quête local, arrivée GPS ou manuelle | Découverte validée par le serveur (`discover_spot`), QR codes, anti-triche |
| Catalogue des créatures | Fichier local (7, statut `demo`) | Tables `creatures` et traductions, statut `published` |
| Album, compagnon, fragments | `localStorage` | `user_creatures`, `user_collection_state` (RLS : propriétaire seul) |
| Illustrations | **Emblèmes provisoires originaux** (formes vectorielles par élément), étiquetés « illustration provisoire » | Art final par un illustrateur, avec cession de droits |
| Synchronisation entre appareils | Aucune (effacer les données du navigateur efface la progression) | Compte, sauvegarde |
| Événements | Aucun (bloc masqué) | Table `events`, œufs d'événement |

Les images de référence générées (`docs/creatures/reference/`) ne sont **jamais** utilisées dans l'application.

## 12. Plan du MVP (une PR par étape, chacune validée)

| Étape | Contenu | Critères d'acceptation | Tests |
|---|---|---|---|
| **G1 · Accueil jeu** | Nouvel accueil (§ 2) avec l'état de démonstration ; nouvelle navigation (§ 1) ; bouton « Explorer un parc » | Œuf, compagnon (vide), 0/7, aventures proches, carte des parcs ; aucun élément de classement | e2e accueil, navigation |
| **G2 · Œuf actif** | `lib/game-core/eggs` + `local-game-store` ; œuf de bienvenue ; écran « Œuf reçu » ; onglet Œufs | Une seule fois ; réserve de 3 au plus ; changement d'œuf actif | Unitaires machine d'états ; e2e réception |
| **G3 · Énergie de nature** | `energy.ts` ; événements publiés par les aventures et découvertes ; jauge sur l'accueil | Barème validé ; chaque action comptée une seule fois ; distance plafonnée ; rejouer ne rapporte rien de plus | Unitaires barème, plafond, dédoublonnage |
| **G4 · Éclosion démo** | `hatch.ts` ; écran d'éclosion plein écran ; fondu si mouvements réduits | Tirage 60/28/12, garanties, bienvenue commun ; geste explicite ; rappel « arrête-toi » | Unitaires tirage (hasard fixé) + simulation ; e2e éclosion |
| **G5 · Album 7 créatures** | Catalogue démo, emblèmes provisoires, album (grille + liste), fiches, fragments | 3/7, silhouettes, indices, doublons comptés | e2e album, accessibilité (libellés) |
| **G6 · Compagnon** | Choix, accueil, figurine dans les aventures (visible par soi seul), amitié et chapitre 1 | Changer librement ; aucune statistique de combat | Unitaires amitié ; e2e choix |
| **G7 · Lien avec Meise** | « Le Secret du Séquoia » : étapes → énergie ; fin → œuf spécial de démonstration dans la réserve ; formulations « Aventure » | Aventure = source de récompenses, pas le jeu ; tout reste `demo` | e2e de bout en bout : aventure → énergie → éclosion → album |

Ordre conseillé : G1 et G2 d'abord (structure), puis G3 à G4 (boucle), G5 à G6 (collection), G7 (branchement).
L'aventure E3 (PR #10) peut être fusionnée avant G1 : G7 l'adaptera.

## 13. Questions à valider

1. **Navigation** : les 5 entrées proposées (Accueil · Parcs · Explorer · Collection · Profil), avec la
   suppression de « Défis » dans la barre ?
2. **Points** : un seul compteur visible (l'énergie de nature) et retrait progressif des points ?
3. **Œuf actif global** : l'énergie gagnée dans n'importe quel parc fait progresser l'œuf actif (les nids et
   œufs de parc viendront plus tard) ?
4. **Illustrations du MVP** : emblèmes vectoriels provisoires et originaux, en attendant l'art final ?
5. **Œuf spécial du Séquoia** : créature non encore obtenue, choisie de façon déterministe (feuille en
   priorité), sans tirage ?
