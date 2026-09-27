# Données de démonstration à faire valider — Plantentuin Meise

> ⚠️ Toutes les données actuelles sont des **exemples plausibles**, marquées `is_demo_data = true`
> en base et affichées avec un badge **« Démo »** dans l'app. Elles ne doivent **jamais** être
> présentées comme officielles avant validation **et autorisation écrite** du parc.

Source unique à modifier : `src/features/demo/content/meise.ts` (puis `npm run db:seed:generate`),
ou directement dans l'espace admin une fois le Sprint 2 livré.

## 1. Autorisations (bloquant avant toute publication)

- [ ] Autorisation d'utiliser le **nom** « Plantentuin Meise » / « Meise Botanic Garden ».
- [ ] Autorisation d'utiliser (ou non) le **logo** et l'identité visuelle du jardin (aucun n'est utilisé aujourd'hui).
- [ ] Droits sur les **photos** officielles (les visuels actuels sont des illustrations originales générées).
- [ ] Validation des **textes** éducatifs (fiches, quiz, défis) par l'équipe scientifique / pédagogique.
- [ ] Accord sur la présence d'un lien vers la **billetterie officielle**.

## 2. Informations pratiques

| Donnée | Valeur démo | À confirmer |
|---|---|---|
| Adresse | Nieuwelaan 38, 1860 Meise | ☐ |
| Horaires été / hiver | 09:30–18:00 / 09:30–17:00 | ☐ (dates de bascule, fermetures) |
| Tarifs | 8 € adulte · 7 € senior · 2 € enfant · gratuit < 6 ans | ☐ (catégories exactes) |
| URL billetterie / site | plantentuinmeise.be | ☐ |
| Transports | « Bus depuis Bruxelles-Nord, arrêt Plantentuin » | ☐ lignes et arrêts réels |
| Règles | chiens interdits, rester sur les chemins, pique-nique zones prévues | ☐ règlement officiel |
| Accessibilité | allées principales accessibles, sentiers forestiers en terre | ☐ |

## 3. Services (coordonnées GPS approximatives)

Entrée principale · Parking visiteurs (250 places, gratuit) · Parking PMR (8 places) ·
Parking vélos (60 places) · Toilettes · Toilettes PMR · Café · Banc · Point d'eau ·
Belvédère · Arrêt de bus.

- [ ] Position réelle de chaque service (relevé GPS sur place).
- [ ] Capacités, gratuité, horaires du café.
- [ ] Services manquants (aire de jeux, point info, consignes, poussettes…).

## 4. Parcours pilote « Découverte des arbres remarquables »

- [ ] Tracé réel des 6 segments (actuellement des courbes approximatives, ~1,2 km tracés vs 1,8 km annoncés).
- [ ] Durée (45 min) et distance (1,8 km).
- [ ] Niveau « facile » et publics (familles, enfants, curieux).
- [ ] Accessibilité PMR (« partielle » : butte du point de vue).
- [ ] Consignes de navigation (« tournez à droite après la fontaine »…) — **repères inventés**.

## 5. Spots (12)

| Spot | Données à vérifier |
|---|---|
| Séquoia géant | existence, position, **plantation 1923, 38 m, 7,2 m** (inventés) |
| Chêne remarquable | espèce (Quercus robur ?), 1850, 27 m, 5,1 m |
| Magnolia | cultivar, période de floraison |
| Jardin des roses | existence et emplacement |
| Point de vue | emplacement, vue réelle |
| **Pavillon historique (démo)** | **fictif** — à remplacer par un vrai lieu historique du domaine |
| Ginkgo, Cèdre du Liban, Hêtre pourpre | existence, positions, hauteurs |
| Étang | emplacement |
| Grandes serres | nom officiel, horaires propres |
| Bambouseraie | existence |

Pour chaque spot : nom officiel FR/NL/EN, nom scientifique, textes « À propos »,
« Le saviez-vous ? », « Comment y aller ? », rayon de découverte GPS.

## 6. Quiz et défis

- [ ] 4 quiz (séquoia, chêne, magnolia, ginkgo) : exactitude des questions, réponses et explications.
- [ ] 5 défis : compatibilité avec le règlement (ex. « ramasser » → nous demandons d'**observer puis laisser sur place**).
- [ ] Politique photo : zones où la photo est interdite, consignes sur les personnes et enfants.

## 7. Traductions

- [ ] Relecture NL (langue principale du jardin) — traductions actuelles non professionnelles.
- [ ] Relecture FR / EN.
- [ ] Contenus ES / DE (partiels aujourd'hui : repli automatique sur l'anglais).

## 8. Autres parcs de la vitrine

Central Park, Kew Gardens, Jardin des Plantes, Hyde Park : **seulement nom, ville et type**,
affichés « Bientôt disponible » avec badge Démo. Aucune affiliation ; à retirer ou à valider
avec chaque gestionnaire avant lancement public.
