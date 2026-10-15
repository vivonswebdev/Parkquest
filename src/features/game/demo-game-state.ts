"use client";

import { useSyncExternalStore } from "react";
import type { GameState } from "@/lib/game-core/eggs";

/**
 * État du jeu en DÉMONSTRATION, sur l'appareil uniquement (aucun serveur, aucun compte).
 * G1 : lecture seule, avec un état de départ de démonstration. Les gains d'énergie, la réserve et
 * l'éclosion arrivent en G2 à G4 (même clé de stockage).
 */
const KEY = "parkquest.game.v1";

export const DEMO_GAME_STATE: GameState = {
  activeEgg: { id: "demo-forest-egg", kind: "standard", theme: "forest", energy: 64, required: 100 },
  reserve: [],
  collection: [],
  companion: null,
  firstLaunch: false,
};

let cache: GameState | null = null;
function read(): GameState {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...DEMO_GAME_STATE, ...(JSON.parse(raw) as Partial<GameState>) } : DEMO_GAME_STATE;
  } catch {
    cache = DEMO_GAME_STATE;
  }
  return cache;
}

const noop = () => () => {};

export function useGameState(): GameState {
  return useSyncExternalStore(noop, read, () => DEMO_GAME_STATE);
}
