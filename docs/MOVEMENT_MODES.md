# Modes de déplacement : MVP et architecture future

Code : `src/lib/movement/index.ts`. Tests : `tests/unit/movement.test.ts`.
Tout est calculé **sur le téléphone** et rien n'est envoyé au serveur.

## Principe

Le suivi de découverte (distance, arrivées d'étape, découvertes de spots) est réservé à une
exploration à allure douce. Pendant un déplacement rapide, il est **mis en pause**. Ce n'est pas
une sanction.

Message affiché, toujours neutre :

> « Le suivi de découverte est en pause pendant un déplacement rapide. »

Le message ne parle **jamais** de triche et ne suppose **jamais** le moyen de transport.

## MVP (actuel)

| Classe MVP | Règle | Effet |
|---|---|---|
| `slow` | Allure < ~25 km/h | Suivi normal. Couvre la marche, le vélo tranquille (~15 km/h) et la course. |
| `fast` | Vitesse soutenue > 25 km/h, sur au moins 3 relevés et 15 s | Suivi en pause : ni distance, ni arrivée, ni découverte. |
| `gps_imprecise` | Précision > 30 m | Positions ignorées pour la distance. Arrivée confirmable à la main. |

Détails de détection :

- **Saut GPS isolé :** un seul relevé très rapide n'est jamais un déplacement rapide.
- **Reprise :** allure lente (< ~11 km/h) ou arrêt pendant au moins 20 s.
- **Vitesse mesurée :** la vitesse Doppler du GPS est utilisée quand le téléphone la fournit.
  Elle est plus fiable que l'écart entre deux positions.
- **Bruit GPS :** un écart n'est compté que s'il dépasse 0,6 × la précision (au moins 4 m).

## Limite connue du MVP

Le MVP ne sait **pas** distinguer une voiture, un bus, un train, un vélo rapide ou un cheval au galop.

- Toute vitesse soutenue au-delà de 25 km/h met le suivi en pause, **quel que soit le moyen** de
  déplacement, y compris un vélo rapide sur une voie verte autorisée.
- Le vélo tranquille et l'équitation au pas ou au trot restent en `slow`.

Ce choix est prudent. Il sera affiné par les modes ci-dessous.

## Architecture future

Type `TravelMode` : `walk`, `bike`, `horse`, `car`, `transit` (train ou bus), `gps_imprecise`.
La table `MVP_CLASS_CANDIDATES` indique les modes possibles derrière chaque classe du MVP.

Principes à respecter :

1. **Le vélo et l'équitation ne sont jamais traités comme une voiture.** Ils auront leurs propres
   seuils et leurs propres parcours.
2. **Itinéraires autorisés :** sur une Route Vivante vélo ou un parcours équestre validé par le
   gestionnaire, la vitesse attendue de ce mode est acceptée **sur ce tracé uniquement**.
3. **Choix explicite :** le visiteur pourra indiquer son mode (« je suis à vélo », « à cheval »).
   La détection automatique ne sert qu'à le suggérer, jamais à l'imposer.
4. **Sécurité :**
   - aucune récompense liée à la vitesse ;
   - aucune interaction avec l'écran en mouvement à vélo ou à cheval : les spots se révèlent
     à l'arrêt ;
   - aucune incitation à quitter les chemins.
5. **Côté serveur (avec les comptes) :** contrôle de plausibilité entre deux découvertes (distance
   et temps). Il se fera dans une PR dédiée, après validation.
