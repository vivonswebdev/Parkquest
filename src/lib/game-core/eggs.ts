import type { Element } from "./elements";

/**
 * Cœur du jeu TYLIA — œufs (logique PURE, testée). Voir docs/TYLIA_GAME_CORE.md.
 * Un seul œuf actif global (il progresse dans n'importe quel parc) et une réserve de 3 œufs au plus.
 * Aucune série, aucun minuteur, aucun œuf qui expire.
 */

export type EggKind = "welcome" | "daily" | "standard" | "special_demo";

export interface Egg {
  id: string;
  kind: EggKind;
  /** Élément qui donne son nom et sa couleur à l'œuf (« Œuf de la forêt »). */
  theme: Element;
  /** Énergie de nature accumulée. */
  energy: number;
  /** Seuil d'éclosion (100 pour un œuf standard). */
  required: number;
}

export interface GameState {
  activeEgg: Egg | null;
  reserve: Egg[];
  /** Créatures obtenues (identifiants), collection globale. */
  collection: string[];
  companion: string | null;
  /** Premier lancement : l'œuf de bienvenue n'a pas encore été reçu. */
  firstLaunch: boolean;
}

export const RESERVE_MAX = 3;
export const COLLECTION_SIZE = 7;
export const STANDARD_EGG_ENERGY = 100;

/**
 * Barème validé (configuration de démonstration, ajustable). La distance compte peu et est plafonnée ;
 * la vitesse ne rapporte jamais rien.
 */
export const ENERGY_RULES = {
  spotDiscovered: 20,
  quizCorrect: 10,
  observation: 15,
  questStep: 15,
  adventureDone: 30,
  per100m: 1,
  distanceCapPerEgg: 20,
} as const;

/** Estimation en découvertes (jamais en kilomètres) : « Encore environ 2 découvertes ». */
export function discoveriesLeft(egg: Pick<Egg, "energy" | "required">): number {
  const remaining = Math.max(0, egg.required - egg.energy);
  return Math.ceil(remaining / ENERGY_RULES.spotDiscovered);
}

export type EggCard =
  | { status: "first" }
  | { status: "active"; egg: Egg; percent: number; discoveries: number }
  | { status: "ready"; egg: Egg }
  | { status: "choose"; reserveCount: number }
  | { status: "none" };

/** État de la carte « œuf actif » de l'accueil. */
export function eggCard(state: GameState): EggCard {
  if (state.firstLaunch) return { status: "first" };
  const egg = state.activeEgg;
  if (egg) {
    if (egg.energy >= egg.required) return { status: "ready", egg };
    return { status: "active", egg, percent: Math.floor((egg.energy / egg.required) * 100), discoveries: discoveriesLeft(egg) };
  }
  if (state.reserve.length > 0) return { status: "choose", reserveCount: state.reserve.length };
  return { status: "none" };
}
