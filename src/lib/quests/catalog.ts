/**
 * Catalogue des quêtes du Mode Exploration.
 * E2 : une quête de démonstration qui s'appuie sur un parcours existant (objectifs = spots du
 * parcours, uniquement sur les chemins autorisés). Le moteur de quête (étapes, énigmes,
 * récompenses) arrive en E3 dans `src/lib/quests/`.
 */

/** Statut de validation d'un contenu : jamais présenté comme officiel tant qu'il n'est pas vérifié. */
export type ContentStatus = "demo" | "validated" | "parkVerified";

/** Clés de traduction des quêtes (messages/*.json → explore.quests.<clé>). */
export type QuestKey = "secretSequoia";

export interface QuestSummary {
  slug: string;
  parkSlug: string;
  /** Parcours support (chemins et objectifs). */
  trailSlug: string;
  /** Clé de traduction (explore.quests.<key>.*). */
  key: QuestKey;
  status: ContentStatus;
}

export const QUESTS: readonly QuestSummary[] = [
  { slug: "le-secret-du-sequoia", parkSlug: "plantentuin-meise", trailSlug: "arbres-remarquables", key: "secretSequoia", status: "demo" },
];

export function findQuest(parkSlug: string, questSlug: string): QuestSummary | undefined {
  return QUESTS.find((q) => q.parkSlug === parkSlug && q.slug === questSlug);
}

export function questsForTrail(parkSlug: string, trailSlug: string): QuestSummary[] {
  return QUESTS.filter((q) => q.parkSlug === parkSlug && q.trailSlug === trailSlug);
}
