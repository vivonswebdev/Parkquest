# ParkQuest — Sorties de groupe au parc (proposition, face à Meet5)

> **Statut : proposition, documentation uniquement.** Aucun code, aucune table créée.
> À valider avant toute implémentation (après validation complète du MVP).

## 1. Le concurrent

**Meet5** (Munich) propose de rencontrer de nouvelles personnes lors de **petites rencontres de
groupe dans la vraie vie** (cafés, balades, sorties culturelles). L'app vise surtout les **40 ans et
plus** et repose sur un modèle freemium avec abonnement.
*Ces éléments sont indicatifs (non revérifiés ici) : à confirmer par une étude de marché. On ne
reprend ni son nom, ni son identité, ni ses écrans.*

## 2. Notre angle : l'activité d'abord, le lieu sûr, le parc partenaire

| | Rencontre « classique » | **Sortie ParkQuest** |
|---|---|---|
| Activité | à inventer (café, verre…) | **toute prête** : un parcours, des spots, un quiz, un défi collectif |
| Brise-glace | conversation libre, parfois gênante | le jeu : « qui trouve le séquoia ? », quiz à plusieurs |
| Lieu | variable | **parc public, en journée, point de rendez-vous officiel** (entrée, café) |
| Contenu | aucun | fiches des arbres, histoire, météo de la visite, accessibilité PMR |
| Offre officielle | non | **balades guidées par le parc** (partenariat, billetterie) |
| Après | nouvelle rencontre à organiser | badge de groupe, carte-souvenir partagée, « refaire une balade ensemble » |

## 3. Publics

1. **50 ans et plus, retraités** : cœur de marché des rencontres de groupe, forte affinité nature et marche.
2. **Nouveaux arrivants** dans une ville (expatriés, étudiants, déménagement).
3. **Parents** : sorties familles organisées par des adultes. **Les enfants ne sont jamais inscrits
   ni visibles.**
4. **Marcheurs, passionnés de nature**, groupes d'une même langue (FR / NL / EN / ES / DE).

## 4. Fonctionnalités (pilote V2)

- **Créer une sortie** : parc, parcours, date et heure (journée), 3 à 8 places, rythme,
  langue, public (ouvert, entre femmes, familles, 50+), accessibilité.
- **Trouver une sortie** : par parc, date, langue, rythme ; liste d'attente si complet.
- **Rejoindre** : confirmation, rappel la veille avec la **météo prévue** (proposition de report si pluie).
- **Discussion de groupe limitée à la sortie** : ouverte 48 h avant, fermée 24 h après, messages texte
  uniquement, modérés. **Aucun message privé entre inconnus.**
- **Au point de rendez-vous** : carte du point de rendez-vous et bouton « Je suis arrivé·e ».
  Ce statut est visible du groupe pendant 30 minutes, **sans aucune position partagée**.
- **Pendant la balade** : parcours partagé, défi collectif, quiz « en équipe ».
- **Après** : badge de groupe, carte-souvenir à partager (optionnelle), « refaire une sortie
  ensemble », demande d'ami **réciproque** (voir `FUTURE_SOCIAL_AND_LOCATION_SHARING.md`).
- **Balades officielles** : créées par le parc (guide, horaire, jauge, prix éventuel).

## 5. Sécurité — non négociable

- **18 ans minimum** pour les sorties entre inconnus.
- Téléphone vérifié obligatoire. Vérification d'identité (prestataire spécialisé) **obligatoire pour organiser**.
- Profil minimal : prénom, photo optionnelle, tranche d'âge (jamais la date de naissance), langues,
  centres d'intérêt nature. **Aucune localisation de domicile.**
- Pas de découverte de profils « autour de moi », pas de position en direct, pas d'ajout automatique.
- Signalement et blocage en un geste ; un bloqué ne voit plus vos sorties. Modération humaine
  des signalements (obligations DSA).
- Sorties uniquement en journée, dans l'enceinte du parc, point de rendez-vous officiel.
- Conseils de sécurité avant la première sortie ; option « sorties entre femmes ».
- Organisateurs signalés : suspension, puis revue.

## 6. Données (esquisse, non créées)

| Table | Rôle |
|---|---|
| `outings` | park_id, trail_id, organizer_id, starts_at, capacity, pace, language, audience, meeting_facility_id, status, is_official |
| `outing_participants` | outing_id, user_id, status (`JOINED` / `WAITLIST` / `CANCELLED` / `ATTENDED`), arrived_at |
| `outing_messages` | outing_id, author_id, body, created_at, moderation_status ; lecture limitée aux participants et à la fenêtre ouverte |
| `user_blocks` | blocker_id, blocked_id |
| `reports` | reporter_id, target (utilisateur, message, sortie), reason, status |
| `identity_verifications` | user_id, provider, status, verified_at ; aucun document stocké chez nous |

RLS : une sortie publiée est lisible par les utilisateurs vérifiés, sans la liste nominative des
participants avant inscription. Les messages ne sont lisibles que par les participants. Inscription et
annulation passent par des fonctions serveur (jauge, âge, blocages).

## 7. Modèle économique

- **Gratuit** : rejoindre des sorties (quota mensuel), parcours, jeu.
- **ParkQuest+** : sorties illimitées, sorties récurrentes, filtres avancés, badges exclusifs.
- **Parcs** : balades officielles, billetterie, statistiques de fréquentation (agrégées, anonymes).
- **Partenaires locaux** : café du parc (offre « après balade »), sans publicité intrusive.

## 8. Feuille de route proposée

| Étape | Contenu |
|---|---|
| MVP (en cours) | visite, jeu, carte 3D, météo — **inchangé** |
| V1.5 | partage du résultat de visite, amis (lien d'invitation) |
| **V2 pilote** | sorties de groupe à Meise + 1 parc bruxellois, 2 balades officielles par semaine, vérification téléphone et identité des organisateurs |
| V2.5 | ParkQuest+, sorties récurrentes, autres parcs |

**Indicateurs du pilote :**
- taux de remplissage des sorties ;
- taux de présence ;
- taux de « nouvelle sortie » dans les 30 jours ;
- signalements pour 100 sorties (objectif proche de 0) ;
- note de sécurité ressentie.

## 9. Décisions à prendre

1. Public prioritaire : **50+ (comme Meet5)**, ou tous les adultes avec des filtres de public ?
2. Pilote : quels parcs, et avec quel partenaire pour les balades officielles ?
3. Priorité : terminer le MVP (refonte écran par écran), ou avancer le pilote « sorties » ?
