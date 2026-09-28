# ParkQuest — Sources de photos et de données botaniques

Code : `src/lib/species/` (analyse pure, testée : `tests/unit/species.test.ts`) et `src/lib/photos/wikimedia.ts`.
Affichage : fiche spot → bandeau « Photos de l'espèce », « Fiche espèce », photo d'en-tête (si le parc n'a pas
choisi de couverture).

## Principes

- **Licences** : uniquement celles qui permettent un usage commercial et la modification — **CC0, CC BY, CC BY-SA**.
  Les photos « NC » (non commercial), « ND » (pas de modification) et « tous droits réservés » sont exclues
  (beaucoup de photos iNaturalist sont en CC BY-NC : elles ne sont jamais affichées).
- **Crédit** toujours visible : auteur, licence, source avec lien vers l'observation / le fichier.
- **Honnêteté** : ce sont des photos de l'**espèce**, pas du spécimen du parc (mention sous le bandeau).
- **Vie privée** : seuls le nom scientifique et la position du **parc** sont envoyés, jamais celle du visiteur.
- **Robustesse** : cache serveur 7 jours, 4 s maximum par appel, coupe-circuit de 10 min par hôte injoignable ;
  sans réponse, la fiche s'affiche normalement sans ces données. `SPECIES_DATA=off` coupe tous les appels.
- **Photos de la communauté** (prises sur place, vérifiées par le parc) : toujours prioritaires pour la couverture.

## État par source

| Source | Clé | Utilisation dans ParkQuest | État |
|---|---|---|---|
| **iNaturalist** (`api.inaturalist.org`) | non | Photos d'observations réelles, **d'abord à moins de 50 km du parc**, puis monde ; nom commun dans la langue de l'app ; statut UICN ; nombre d'observations ; lien Wikipédia | ✅ branché |
| **GBIF** (`api.gbif.org`) | non | Famille botanique (correspondance ≥ 80 %) ; photos d'occurrences en complément ; lien GBIF | ✅ branché |
| **Wikimedia Commons** | non | Photos en dernier recours (licences libres uniquement) | ✅ branché |
| **Pl@ntNet** (`my.plantnet.org`) | **oui** | Recommandé pour **identifier l'espèce d'une photo envoyée par un visiteur** (aide à la modération, futur mode « Qu'est-ce que c'est ? »). Envoie l'image à un service tiers : consentement explicite requis. | ⏳ à décider (clé + quota) |
| **Trefle** (`trefle.io`) | **oui** | Caractéristiques de croissance, répartition. Recouvre en partie iNaturalist/GBIF ; maintenance du service à vérifier avant d'en dépendre. | ⏳ optionnel |
| **Unsplash** | **oui** | Belles photos libres pour **bannières de parcs, articles, écrans marketing** — **pas** pour les fiches d'espèces (espèce non garantie). Règles : lien direct (hotlink), crédit du photographe et d'Unsplash, déclenchement du suivi de téléchargement. | ⏳ optionnel |
| **Pexels** | **oui** | Idem Unsplash (crédit recommandé). | ⏳ optionnel |
| **Pixabay** | **oui** | Idem ; interdit le lien direct permanent : images à mettre en cache sur notre stockage. | ⏳ optionnel |

## Limites d'usage (à respecter en production)

- iNaturalist : ~1 requête/s, ~10 000/jour, `User-Agent` identifiant l'app (fait). Le cache 7 jours limite les appels
  à quelques dizaines par jour pour un parc.
- GBIF : usage raisonnable, sans clé pour la lecture.
- Wikimedia : `User-Agent` obligatoire (fait), cache.

## Pistes suivantes

1. Import validé : l'équipe du parc choisit, dans l'admin, les meilleures photos d'espèce → copie en base
   (`media`, source `WIKIMEDIA`/`INATURALIST`) avec crédit, puis couverture possible.
2. Pl@ntNet pour vérifier qu'une photo envoyée correspond bien à l'espèce du spot (score de confiance).
3. Observations récentes près du parc (« vu cette semaine à Meise ») à partir d'iNaturalist.
