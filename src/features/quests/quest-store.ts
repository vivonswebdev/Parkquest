"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_QUEST_STATE, type QuestReward, type QuestState } from "@/lib/quests/engine";

/**
 * Progression des quêtes et récompenses de démonstration, stockées sur l'appareil uniquement
 * (aucune table serveur avant l'étape E7 / C5). Rien n'est envoyé ; aucune position n'est gardée.
 */

const KEY = "parkquest.quests.v1";

export interface EarnedReward extends QuestReward {
  receivedAt: string;
}

interface Store {
  quests: Record<string, QuestState>;
  rewards: EarnedReward[];
}

const EMPTY: Store = { quests: {}, rewards: [] };
const listeners = new Set<() => void>();
let cache: Store | null = null;

function read(): Store {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Store>) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Store) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible : progression en mémoire seulement */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** État d'une quête (état vide côté serveur et avant hydratation). */
export function useQuestState(slug: string): QuestState {
  return useSyncExternalStore(subscribe, () => read().quests[slug] ?? EMPTY_QUEST_STATE, () => EMPTY_QUEST_STATE);
}

export function useEarnedRewards(): EarnedReward[] {
  return useSyncExternalStore(subscribe, () => read().rewards, () => EMPTY.rewards);
}

export function saveQuestState(slug: string, state: QuestState) {
  const s = read();
  write({ ...s, quests: { ...s.quests, [slug]: state } });
}

export function resetQuest(slug: string) {
  const s = read();
  const quests = { ...s.quests };
  delete quests[slug];
  write({ ...s, quests });
}

/** Ajoute une récompense une seule fois par source (rejouer la quête ne la duplique pas). */
export function grantReward(reward: QuestReward) {
  const s = read();
  if (s.rewards.some((r) => r.source === reward.source && r.type === reward.type)) return;
  write({ ...s, rewards: [...s.rewards, { ...reward, receivedAt: new Date().toISOString() }] });
}
