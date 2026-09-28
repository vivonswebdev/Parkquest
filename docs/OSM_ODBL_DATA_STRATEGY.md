# ParkQuest — OpenStreetMap, licence ODbL et séparation des données

> **Statut : documentation.** Aucune extraction, aucun import et aucun stockage de données OpenStreetMap
> dans la base avant validation spécifique du porteur du projet (Phase C).
> Ce document résume les obligations ; il ne remplace pas un avis juridique.
> Références : licence ODbL 1.0 (opendatacommons.org/licenses/odbl/1-0/),
> page « Copyright » d'OSM (openstreetmap.org/copyright) et lignes directrices de l'OSM Foundation
> (osmfoundation.org/wiki/Licence, « Community Guidelines »).

## 1. Ce que nous utilisons déjà (Phase actuelle)

- **Fond de carte OpenFreeMap** : des tuiles construites à partir d'OSM, affichées dans le navigateur.
  C'est une « **œuvre produite** » (Produced Work) : **seule l'attribution est obligatoire**.
  Le crédit « © OpenStreetMap » est fourni par le style et reste toujours visible sur la carte.
- Aucune donnée OSM n'est copiée, modifiée ni stockée par ParkQuest aujourd'hui.

## 2. Obligations ODbL

| Situation | Exemple ParkQuest | Obligation |
|---|---|---|
| **Afficher** une carte issue d'OSM (œuvre produite) | fond OpenFreeMap, capture d'écran de la carte | Attribution visible « © Contributeurs OpenStreetMap » + lien vers openstreetmap.org/copyright |
| **Usage interne** de données extraites (non publiées) | tester un calcul de parcours sur un poste | Aucune obligation de partage |
| **Base de données dérivée** utilisée publiquement | chemins OSM extraits, nettoyés, enrichis, puis affichés dans l'app ; tracé de parcours calculé sur ces chemins | Attribution **et** mise à disposition de la base dérivée (ou des données OSM + de la méthode permettant de la recréer) **sous ODbL** |
| **Base collective** (données indépendantes juxtaposées) | nos spots, textes, quiz, photos affichés *par-dessus* les chemins OSM | Nos données restent sous notre licence, **à condition de rester séparées** (pas fusionnées dans les objets OSM) |
| **Extrait non substantiel** | quelques objets ponctuels (selon les lignes directrices OSMF) | Pas de partage à l'identique, attribution recommandée |

**Quand la base dérivée doit-elle être redistribuée sous ODbL ?** Dès que nous **utilisons publiquement**
une base qui **modifie ou adapte** des données OSM : l'afficher dans l'app publique, la fournir via une API ou
la publier sous forme d'œuvre produite (carte, capture). Nous devons alors proposer, gratuitement :

- soit la base dérivée elle-même (fichier GeoJSON des données d'origine OSM, avec leurs modifications),
- soit les données OSM d'origine + le script qui produit la base dérivée (ex. `scripts/extract-osm.mjs`).

Pour un parc, les chemins représentent souvent plus de 100 objets : **on considère d'emblée que le
partage à l'identique s'applique** à la couche OSM et aux tracés calculés dessus.

## 3. Où le crédit OpenStreetMap doit apparaître

1. **Sur chaque carte** (MapLibre et carte simplifiée si elle affiche des données OSM) : contrôle de crédits
   toujours visible, lien vers openstreetmap.org/copyright. *(Déjà en place pour le fond de carte.)*
2. **Page « Crédits et licences »** de l'app : sources, licences, lien de téléchargement de la couche ODbL.
3. **Fichiers diffusés** : en-tête / métadonnées de chaque GeoJSON OSM (`license: "ODbL-1.0"`,
   `attribution: "© OpenStreetMap contributors"`, date d'extraction).
4. **Captures, vidéos, supports marketing** montrant la carte : mention « © OpenStreetMap contributors ».
5. **README** du dépôt et documentation pour les parcs partenaires.

## 4. Stratégie de séparation des données

Chaque objet géographique porte `source`, `license`, `status` et, pour OSM, `osm_type` + `osm_id` + date.

| Domaine | Contenu | Stockage | Licence / diffusion |
|---|---|---|---|
| **ParkQuest (propriétaire)** | spots créés par nous, textes, quiz, défis, points, badges ; relevés GPS **faits par nous** | tables `spots`, `trails`, … (`source = 'parkquest'`) | licence ParkQuest ; jamais « accrochés » aux géométries OSM (positions indépendantes) |
| **OpenStreetMap (attribué)** | contour du parc, chemins, bâtiments, services extraits d'OSM ; tracés calculés sur ces chemins | table / fichiers séparés `osm_features` (`source = 'osm'`) | **ODbL** : attribution + couche téléchargeable publiquement |
| **Parc (sous autorisation)** | positions et données officielles des spécimens, parcours officiels, textes validés | tables séparées (`source = 'park'`), liées par identifiant | selon l'accord écrit ; **jamais fusionnées dans la couche OSM** (sinon elles deviendraient ODbL) |
| **Démonstration** | données actuelles de Meise | `is_demo_data = true` (`source = 'demo'`) | jamais exportées ni présentées comme réelles |

Règles :

- **Ne jamais mélanger** des données du parc ou propriétaires dans des objets OSM (même fichier, même
  géométrie) : les garder en couches distinctes, affichées ensemble (base collective).
- **Ne jamais importer dans OSM** des données dont nous n'avons pas les droits (plan officiel, relevés du parc)
  sans accord explicite ; contribuer à OSM est possible mais optionnel.
- Un **tracé de parcours calculé sur les chemins OSM** est une donnée dérivée ODbL (couche OSM) ; un tracé
  **relevé par nous** sur place est propriétaire (couche ParkQuest).
- La couche OSM est reconstruite par un script reproductible et versionnée (date d'extraction), ce qui
  facilite sa mise à disposition.

## 5. Check-list avant tout import (Phase C)

- [ ] Validation écrite du porteur du projet pour l'extraction et le stockage.
- [ ] Script d'extraction reproductible (zone, filtres, date) et relu.
- [ ] Table / fichiers séparés `osm_features` avec `license`, `attribution`, `osm_id`, date.
- [ ] Crédits sur les cartes et page « Crédits et licences ».
- [ ] Lien public de téléchargement de la couche ODbL (GeoJSON) + mention de licence.
- [ ] Vérification qu'aucune donnée du parc ou propriétaire n'est fusionnée dans la couche OSM.
- [ ] Contrôle humain des chemins (zones fermées au public, accès privé, bords d'étang) avant usage dans un parcours.
