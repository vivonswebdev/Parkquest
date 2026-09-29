# Parcs, lieux et photos : données, statuts et licences

Ce document décrit la couche « multi-parcs » : les fiches de parcs, les lieux, les photos, et les
règles qui empêchent de présenter une donnée non vérifiée comme officielle.

Code : `src/lib/places/` (types, règles, données locales). Tests : `tests/unit/places.test.ts`,
`tests/e2e/multi-parks.spec.ts`.

## 1. Modèle

| Type | Rôle |
|---|---|
| `ParkProfile` | Fiche générique d'un parc : région, particularités (`features`), sources, statut, « contenu en préparation ». |
| `ParkPlace` | Lieu d'un parc : nom multilingue, nom scientifique (si vérifié), catégorie, coordonnées (facultatives, `approximate`), accessibilité, statut, source, validation. |
| `ParkMedia` | Photo ou illustration : `sourceUrl`, `originalUrl`, auteur, licence, attribution, `fetchedAt`, `usageStatus`, `verifiedBy`, type (`place_photo` / `species_photo` / `illustration`). |
| `ParkFeature` | Particularité d'un parc (château, étangs, serres…), avec statut et source. |

Les catégories sont **souples** (`PLACE_CATEGORIES` : tree, ancient_tree, plant, flower, greenhouse, lake,
pond, river, castle, historic_building, ruin, cafe, restaurant, viewpoint, garden, forest, playground,
picnic_area, toilet, accessible_toilet, entrance, parking, bike_parking, photo_spot, history, challenge,
museum, walk). Pas de colonnes rigides du type `has_lake`.

Les données sont locales et passent par l'interface `placesRepo` (`getProfile`, `listPlaces`,
`listMedia`, `listProfiles`). Elle pourra être branchée plus tard sur des tables `parks`,
`park_places`, `park_media`, `park_features` **sans changer les écrans**. Aucune table n'est créée
dans cette étape.

## 2. Statuts

`demo` → `proposed` → `park_verified` → `published`

- `effectiveStatus()` rétrograde en `proposed` tout élément marqué `park_verified` ou `published`
  **sans source ET sans `verifiedBy`**. Un statut « vérifié » ne peut donc pas s'afficher par erreur.
- Tant que rien n'est validé par un parc, les fiches affichent :
  « Donnée de démonstration à valider avec le parc. »

## 3. Photos

Règles (`isDisplayableMedia`, `placePhoto`) :

- une photo n'est affichée que si `usageStatus = "approved"`, que sa licence est libre (CC0, domaine
  public, CC BY, CC BY-SA), qu'elle a un auteur et une URL ;
- une photo d'**espèce** n'est jamais utilisée comme photo **du lieu** (« Photo de l'espèce » ≠
  « Photo du lieu dans le parc ») ;
- sans photo publiable, le visuel est une illustration originale marquée
  « Illustration de démonstration — photo officielle à confirmer avec le parc. »

**État actuel : aucune photo réelle publiée.** 7 fichiers Wikimedia Commons de Meise sont listés
comme candidats (`to_verify`). Leur licence n'a pas pu être vérifiée : l'environnement de
développement n'a pas accès à `commons.wikimedia.org`.

Vérification : `npm run media:verify`, avec un accès réseau à Commons. Le script écrit
`src/lib/places/media-license-check.json` (licence, auteur, attribution, URL originale, date).
Il **n'approuve rien** : une personne confirme ensuite que la photo montre bien le lieu, puis passe
`usageStatus` à `approved` avec `verifiedBy`.

Les photos et textes officiels des parcs ne sont pas copiés sans autorisation écrite.

## 4. Crédits

La page `/[locale]/credits` (« Crédits et licences », lien dans le pied de page) liste :

- la carte (OpenFreeMap / © OpenStreetMap contributors, ODbL) ;
- les sources d'espèces ;
- les photos publiées, et celles en attente (« À vérifier ») ;
- les illustrations ;
- les sources de chaque parc.

## 5. Parcs

| Parc | Statut | Contenu | À valider avec le parc |
|---|---|---|---|
| Plantentuin Meise | `demo` | Spots et aventure de démonstration existants ; particularités jardin, arbres, serres, étangs ; château de Bouchout (`proposed`). | Tous les spots, textes, positions. Les chiffres (92 ha, ~20 000 espèces) ne sont **pas** affichés tant qu'une source officielle n'est pas référencée. |
| Dendermonde — Vallée de l'Escaut | `proposed`, contenu en préparation | Fiche générale : rivière, promenades, points de vue, patrimoine. **Aucun lieu précis**, aucun château inventé. | Périmètre exact, lieux, parcours. |
| Domaine régional Solvay — Château de La Hulpe | `proposed` | Particularités et 7 lieux proposés **sans coordonnées** : château, étangs, bois, rhododendrons, pelouses, Fondation Folon (si incluse), parking. | Tout : lieux, positions, accès PMR, superficie (227 ha à confirmer), horaires, règles. |

Horaires, accès et règles ne sont **pas** recopiés : la fiche renvoie aux sources officielles, dont
aucune n'est encore datée (« non vérifiée à ce jour »).

Les positions des parcs sur la carte générale sont approximatives (centre du site), à usage de
démonstration.

## 6. Hors périmètre

- Pas de Supabase, de tables ni de migrations.
- Pas d'import OSM : ODbL, validation spécifique requise.
- Pas d'API payante, pas de Pl@ntNet, pas de reconnaissance d'image, pas de service photo commercial.
- Pas de clé privée côté client.
