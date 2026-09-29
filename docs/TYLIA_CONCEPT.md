# 🌿 TYLIA — Concept global (document de base)

> **Statut : base produit consolidée.** Ce document sert de référence pour le cahier des charges et
> pour les outils de conception ou de développement. Il ne crée ni écran, ni table, ni service.
>
> Il s'articule avec :
> - `docs/TYLIA_GAME_CORE.md` : œufs, énergie, navigation, étapes G1–G7 ;
> - `docs/TYLIA_CREATURES.md` : créatures et raretés ;
> - `docs/TYLIA_ROLES_AND_PERMISSIONS.md` : rôles ;
> - `docs/PARKS_DATA_AND_MEDIA.md` : parcs, lieux, photos.
>
> En cas de contradiction, le document spécialisé validé l'emporte, et celui-ci doit être corrigé.
>
> Tant que la marque n'est pas validée (PR #7), l'application publique s'appelle toujours **ParkQuest**.

**Explore le monde réel. Découvre ses histoires. Fais grandir ton monde TYLIA.**

TYLIA transforme les parcs, jardins, forêts, châteaux, lacs, rivières et itinéraires réels en un
monde vivant à explorer. On ne joue pas seulement sur une carte : on sort, on marche, on observe, on
apprend, on réalise des aventures. Les découvertes deviennent des œufs, des créatures, un compagnon,
des souvenirs et une collection.

**En une phrase :** tu explores la nature réelle, tu accomplis des aventures et tu fais éclore des
créatures originales liées aux lieux que tu découvres.

**Mission :** rendre tous les espaces verts accessibles à tout le monde. Cela veut dire :
- **savoir** qu'un lieu existe et ce qu'il offre ;
- **s'y retrouver** sans se perdre : limites du parc, repères, retour à l'entrée ;
- **y accéder** quelles que soient ses capacités : informations PMR vérifiées, parcours adaptés, texte, audio et contraste ;
- **y venir sans barrière d'argent** : le jeu reste gratuit pour progresser.

---

## 1. La grande boucle

```
Ouvrir TYLIA → voir son œuf actif → choisir un parc, une promenade ou une aventure
→ explorer réellement le lieu → découvrir des spots → observer, écouter, répondre, résoudre
→ gagner de l'énergie de nature → faire éclore l'œuf → découvrir une créature
→ l'ajouter à sa collection → choisir éventuellement un compagnon
→ découvrir de nouveaux lieux → faire grandir son monde TYLIA
```

**La progression vient de la découverte : ni de la vitesse, ni du paiement.**

## 2. Les 3 niveaux

| Niveau | Ce que c'est | Contenu |
|---|---|---|
| 🌍 **Le Monde** | Le terrain réel | Parcs, jardins, forêts, châteaux, lacs, rivières, sentiers, voies vertes, itinéraires vélo |
| 🧭 **L'Aventure** | L'expérience vécue sur place | Observer, marcher, écouter, photographier, répondre à un quiz, résoudre une énigme, découvrir une histoire |
| 🥚 **TYLIA** | Le monde personnel construit au-dessus | Œufs, créatures, collection, compagnon, souvenirs, badges, découvertes |

Le parc est le terrain réel. L'aventure est l'expérience. TYLIA est le monde personnel.

## 3. Les œufs : le lien entre le réel et le jeu

- Un seul **œuf actif** (réserve de 3 œufs au maximum, voir GAME_CORE).
- Les découvertes produisent de l'**énergie de nature**, seul compteur de progression.

| Action | Progression |
|---|---|
| Découvrir un spot | + énergie |
| Réussir un quiz | + énergie |
| Faire une observation | + énergie |
| Terminer une aventure | + énergie |
| Promenade ou randonnée | progression modérée |

- La distance ne devient **jamais** le moyen principal de gagner.
- Œuf plein : « 🥚 Ton œuf est prêt à éclore ! ». TYLIA demande de **s'arrêter** avant l'éclosion.
- **MVP :** pas de loot box, pas de paiement, pas de tirage frustrant. L'éclosion est **déterministe**
  et contrôlée.

## 4. Les créatures

Sept familles naturelles :

| Élément | Univers |
|---|---|
| 🌿 Feuille | arbres, graines, jardins |
| 💧 Eau | étangs, rivières, lacs |
| 🌸 Fleur | jardins, fleurs, pollinisateurs |
| 🌬️ Air | vent, oiseaux, cimes |
| 🍄 Forêt | mousse, champignons, racines |
| 🌙 Lunaire | ciel, légendes, calme |
| ☀️ Solaire | lumière, clairières, chaleur |

- Le MVP commence avec **7 créatures**. L'univers pourra s'étendre ensuite, jusqu'à 117 créatures ou davantage.
- Chaque créature a :
  - un nom, un élément, une histoire et un habitat ;
  - une rareté et des lieux favoris ;
  - une illustration officielle et une fiche d'album ;
  - des souvenirs liés aux aventures.
- Les créatures sont originales. On ne reprend ni noms, ni visuels, ni mécaniques d'autres jeux.
- Aucune image générée par IA n'apparaît dans l'application publique.

## 5. Le compagnon

Une créature obtenue peut devenir le compagnon. **Il ne combat pas** : il accompagne. Il peut :

- apparaître sur l'accueil ;
- réagir à certains lieux et aux saisons ;
- débloquer de petites histoires ;
- accumuler des souvenirs ;
- évoluer visuellement ;
- découvrir des éléments avec le joueur.

**L'amitié ne diminue jamais.** Pas de faim, pas de soins obligatoires, pas de punition, pas de perte
de progression, pas de connexion quotidienne obligatoire.

## 6. Les aventures

Chaque parc peut raconter sa propre histoire. L'aventure est **locale**, mais sa récompense rejoint
l'univers **global** du joueur.

Exemple (démonstration) : **🌳 Le Secret du Séquoia — Meise**

1. Trouver le Séquoia géant.
2. Observer son écorce.
3. Découvrir un chêne remarquable.
4. Résoudre une énigme.
5. Explorer la bambouseraie.
6. Écouter l'histoire du Cèdre du Liban.
7. Recevoir un œuf spécial.

Les contenus d'aventure restent des « données de démonstration à valider avec le parc » tant
qu'un parc ne les a pas confirmés.

## 7. Notifications intelligentes

**Règle : TYLIA est utile sans devenir envahissant.** Les notifications sont contextuelles, rares,
et chaque type peut être désactivé séparément.

| Type | Déclencheur | Message (exemple) |
|---|---|---|
| 📍 Arrivée devant un spot | Aventure en cours et entrée dans la zone du spot | *vibration courte* — « 🌳 Tu es arrivé ! Le Séquoia géant est juste devant toi. Arrête-toi pour découvrir son histoire. » |
| 🌿 Lieu TYLIA à proximité | Localisation autorisée, parc TYLIA proche | « Une découverte t'attend peut-être près de toi. » [Découvrir] |
| 🥚 Œuf presque prêt | Il reste peu d'énergie à gagner | « Ton œuf approche de l'éclosion ! Plus que 15 énergie de nature. » |
| ✨ Œuf prêt | Objectif atteint | « Ton œuf est prêt à éclore. Une nouvelle créature t'attend. » [Éclore] — éclosion à l'arrêt |
| 🧭 Nouvelle aventure | Publication d'une aventure | « La Route des arbres anciens · 35 min · Famille » [Explorer] |
| 🌳 Retour dans un parc | Retour dans un parc déjà visité | « Content de te revoir ! Une nouvelle découverte pourrait t'attendre à Meise. » |
| 🎉 Événement | Début d'une saison | « 🍂 La Saison des Lanternes commence ! » |

### 7.1 La vibration, signature de TYLIA

```
Utilisateur en aventure → le GPS détecte l'entrée dans la zone → vibration courte
→ l'utilisateur s'arrête → TYLIA révèle le spot
```

La vibration est un signal discret : on n'a pas à regarder son téléphone en marchant, et le monde
réel semble réagir à l'exploration.

**Interdits :**
- toute vibration répétitive ;
- toute vibration qui pousse à courir ;
- toute récompense liée à la vitesse ;
- toute incitation à regarder l'écran en mouvement ;
- toute notification qui pousse à quitter un chemin sécurisé.

### 7.2 Garde-fous

- **Fréquence :**
  - « lieu à proximité » : au plus une fois par parc et par jour, jamais en continu ;
  - notifications hors aventure : au plus 1 par jour au total ;
  - aucune pendant les heures calmes (réglables, par défaut 21 h – 8 h).
- **Contexte :** aucune notification de proximité quand le parc est fermé. Aucune ne demande d'être sur place la nuit.
- **Consentement :**
  - notifications et localisation demandées séparément, au moment utile, jamais au premier lancement ;
  - un écran explique d'abord pourquoi ;
  - refuser n'empêche pas de jouer.
- **Réglages :** un interrupteur par type et un interrupteur « vibration ». Tout est coupé si le système est en mode silencieux ou si l'utilisateur a demandé moins de mouvements.
- **Enfants :** pour les comptes familiaux, les notifications hors aventure sont coupées par défaut.

### 7.3 Faisabilité technique (application web installable, état actuel)

| Besoin | Possible aujourd'hui | Remarque |
|---|---|---|
| Vibration à l'arrivée pendant une aventure ouverte | Oui sur Android (API Vibration) | Non supportée par Safari iOS : on remplace par un signal visuel et sonore doux, facultatif |
| Détection d'arrivée | Oui, application ouverte | Déjà en place dans le Mode Exploration (géolocalisation au premier plan) |
| Détection en arrière-plan (géorepérage) | **Non** en web | Nécessite une application native. Pas de suivi continu, conformément au § 10 |
| Notifications push (œuf, aventure, événement) | Oui (Web Push) ; sur iOS seulement si l'app est ajoutée à l'écran d'accueil | Demande un serveur d'envoi et un abonnement : étape ultérieure, avec validation |
| « Retour dans un parc », « lieu à proximité » | Seulement application ouverte en web | En natif plus tard, avec les garde-fous § 7.2 |

**Ordre conseillé :**
1. Notifications **dans l'application** (bandeaux, vibration Android pendant l'aventure).
2. Web Push pour l'œuf et les nouvelles aventures.
3. Proximité en arrière-plan, uniquement si une application native voit le jour.

## 8. Marche, vélo et randonnée — Routes Vivantes

| Format | Pour qui, quoi |
|---|---|
| Promenade | Petite découverte familiale |
| Randonnée | Forêt, rivière, château, panorama |
| Vélo | Voies vertes et connexions entre lieux |
| Équitation (plus tard) | Parcours équestres autorisés dans les parcs et forêts |

**Routes Vivantes** (priorité à long terme) : plusieurs lieux réels deviennent une seule grande
aventure. Exemples :
- 🌳 Route des arbres anciens
- 🏰 Route des châteaux
- 💧 Route des lacs
- 🌊 Route de l'Escaut
- 🌿 Route des jardins
- 🌸 Route des fleurs
- 🚲 Route vélo nature

Règles :
- pas de chrono, pas de classement de vitesse ;
- à vélo, **aucune interaction** avec l'écran pendant le déplacement : notification à l'arrêt seulement ;
- les itinéraires s'appuient sur des chemins autorisés et vérifiés.

**Parcours équestres (plus tard) :**
- uniquement sur les pistes cavalières officiellement autorisées, à valider avec le gestionnaire du parc ou de la forêt ;
- signalisation propre et règles de cohabitation avec les piétons et les cyclistes ;
- aucune interaction avec l'écran en selle : révélation des spots à l'arrêt seulement.

## 9. Saisons

TYLIA doit sembler vivant. Les événements restent **optionnels** et sans perte pour qui ne participe pas.

| Saison | Événement | Univers |
|---|---|---|
| 🌱 Printemps | Œufs de Bourgeon | Fleurs, jeunes pousses, jardins |
| ☀️ Été | Festival des Clairières | Lacs, pollinisateurs, soleil |
| 🍂 Automne | Saison des Lanternes | Champignons, arbres anciens, châteaux, légendes (en journée) |
| ❄️ Hiver | Gardiens du Givre | Oiseaux d'hiver, arbres nus, histoires calmes |

## 10. Famille et sécurité

**TYLIA se joue dehors, mais le monde réel reste prioritaire.** Rappel permanent : « Arrête-toi
avant de regarder ton écran. »

- **À favoriser :**
  - l'observation, l'apprentissage, la promenade et la curiosité ;
  - le patrimoine et la nature ;
  - l'activité douce, en famille.
- **À ne jamais encourager :**
  - courir ;
  - rester connecté en permanence ;
  - jouer seul la nuit ;
  - quitter les chemins ;
  - acheter pour progresser.
- **Géolocalisation :**
  - demandée avec consentement ;
  - utilisée seulement quand c'est nécessaire ;
  - jamais publique ;
  - arrêtable à tout moment ;
  - aucun suivi continu.

## 11. Communauté (plus tard)

Les utilisateurs pourront proposer :
- des photos ;
- des arbres remarquables ;
- des corrections ;
- des bancs, toilettes, fontaines ;
- des informations d'accessibilité ;
- des itinéraires ;
- des signalements.

Circuit :

```
Utilisateur → proposition → modération → validation → publication
```

**Rien n'apparaît automatiquement sur la carte publique.** Pas de chat ni de partage de position à
ce stade (voir `docs/FUTURE_SOCIAL_AND_LOCATION_SHARING.md`).

## 12. MVP idéal

| # | Brique | Contenu | État |
|---|---|---|---|
| 1 | 🌳 Parc | Carte, fiche, spots | Démo en place (Meise) + fiches multi-parcs (PR #16) |
| 2 | 🧭 Aventure | Une aventure complète dans un premier parc | « Le Secret du Séquoia » (PR #10) |
| 3 | 🥚 Œuf | Énergie de nature | Accueil du jeu, lecture locale (G1, PR #15) |
| 4 | ✨ Éclosion | Récompense déterministe | À faire (étapes G) |
| 5 | 🐾 Collection | 7 créatures | Page minimale (G1). Créatures à dessiner |
| 6 | ❤️ Compagnon | Choix d'une créature | À faire |
| 7 | 🔔 Notifications | Proximité d'un spot, œuf presque prêt / prêt, nouvelle aventure, retour dans un parc | À faire, dans l'ordre du § 7.3 |
| 8 | 🔐 Sécurité | GPS limité, position privée, expérience accessible | En place (consentement, arrêt, pas de position publique) |

Hors MVP :
- achats, monnaies, échanges, classements ;
- chat, communauté ouverte ;
- reconnaissance d'image, Pl@ntNet ;
- API payantes.

## 13. Identité

TYLIA n'est pas « capture quelque chose sur une carte », mais :
**« Va dehors, observe, apprends, découvre une histoire et fais grandir ton propre monde. »**

> 🌿 **Tu ne collectionnes pas seulement des créatures.
> Tu collectionnes les histoires des lieux que tu as réellement explorés.**
