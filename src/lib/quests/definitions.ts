import type { QuestDef } from "./engine";

/**
 * Définitions des quêtes (données de démonstration, à valider avec le parc).
 * Les objectifs sont des spots accessibles depuis les chemins ; aucune étape n'exige de quitter
 * un chemin, de se déplacer vite ou de venir de nuit.
 */
export const SECRET_DU_SEQUOIA: QuestDef = {
  slug: "le-secret-du-sequoia",
  steps: [
    { id: "s1", spotSlug: "sequoia-geant", activity: "riddle" },
    { id: "s2", spotSlug: "chene-remarquable", activity: "quiz" },
    { id: "s3", spotSlug: "bambouseraie", activity: "observe" },
    { id: "s4", spotSlug: "cedre-du-liban", activity: "audioHint" },
    { id: "s5", spotSlug: "point-de-vue", activity: "photo", optional: true },
    { id: "s6", spotSlug: "sequoia-geant", activity: "reward" },
  ],
  reward: { type: "special_demo_egg", source: "secret-du-sequoia", status: "demo", tradable: false, sellable: false },
};

const DEFINITIONS: Record<string, QuestDef> = { [SECRET_DU_SEQUOIA.slug]: SECRET_DU_SEQUOIA };

export function questDefinition(slug: string): QuestDef | undefined {
  return DEFINITIONS[slug];
}
