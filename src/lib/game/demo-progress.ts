"use client";

import { useSyncExternalStore } from "react";

/**
 * Progression LOCALE du mode démo (sans base de données).
 * Stockée dans le navigateur uniquement, affichée avec la mention « Mode démo ».
 * En mode Supabase, la progression vient exclusivement du serveur.
 */
export interface DemoProgress {
  discovered: string[];
  quizAttempts: Record<string, boolean>; // quizId -> correct au 1er essai
  challenges: Record<string, "APPROVED" | "PENDING">;
  points: number;
  distanceM: number;
  visits: number;
}

const KEY = "parkquest.demo-progress.v1";
const EMPTY: DemoProgress = { discovered: [], quizAttempts: {}, challenges: {}, points: 0, distanceM: 0, visits: 0 };
const listeners = new Set<() => void>();
let cache: DemoProgress | null = null;

function read(): DemoProgress {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as DemoProgress) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export function updateDemoProgress(fn: (p: DemoProgress) => DemoProgress) {
  cache = fn(read());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* stockage indisponible : progression en mémoire seulement */
  }
  listeners.forEach((l) => l());
}

export function resetDemoProgress() {
  updateDemoProgress(() => EMPTY);
}

export function useDemoProgress(): DemoProgress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}
