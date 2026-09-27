"use client";

import { useSyncExternalStore } from "react";
import { demoBaselineProgress, demoData, type DemoProgress } from "./demo-data";
import { unlockedBadgeKeys } from "./demo-badges";

/**
 * Progression SIMULÉE du mode démo, stockée uniquement dans le navigateur.
 * Part d'un historique fictif (demoBaselineProgress) ; les badges sont
 * recalculés à chaque gain et les nouveaux déclenchent une notification.
 * En mode Supabase, la progression vient exclusivement du serveur.
 */

export type { DemoProgress };

const KEY = "parkquest.demo-progress.v2";
const listeners = new Set<() => void>();
const badgeListeners = new Set<(keys: string[]) => void>();
let cache: DemoProgress | null = null;

function read(): DemoProgress {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...demoBaselineProgress, ...(JSON.parse(raw) as Partial<DemoProgress>) } : demoBaselineProgress;
  } catch {
    cache = demoBaselineProgress;
  }
  return cache;
}

function write(next: DemoProgress) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible : progression en mémoire seulement */
  }
  listeners.forEach((l) => l());
}

/** Applique un gain puis évalue les badges ; retourne les nouveaux badges débloqués. */
export function updateDemoProgress(fn: (p: DemoProgress) => DemoProgress): string[] {
  const next = fn(read());
  const unlocked = unlockedBadgeKeys(next, demoData.badges);
  const fresh = unlocked.filter((k) => !next.badges.includes(k));
  write(fresh.length ? { ...next, badges: [...next.badges, ...fresh] } : next);
  if (fresh.length) badgeListeners.forEach((l) => l(fresh));
  return fresh;
}

/** Remet la démo à zéro (historique fictif de départ). */
export function resetDemoProgress() {
  write(demoBaselineProgress);
}

/** Simulation modérateur : valide les défis photo en attente (+ points défi et photo). */
export function approvePendingDemoPhotos(): number {
  const p = read();
  const pending = Object.entries(p.challenges).filter(([, s]) => s === "PENDING");
  if (!pending.length) return 0;
  const points = pending.reduce((sum, [id]) => sum + (demoData.challenges.find((c) => c.id === id)?.pointsValue ?? 0) + 5, 0);
  updateDemoProgress((q) => ({
    ...q,
    challenges: { ...q.challenges, ...Object.fromEntries(pending.map(([id]) => [id, "APPROVED" as const])) },
    photosApproved: q.photosApproved + pending.length,
    points: q.points + points,
  }));
  return pending.length;
}

export function onDemoBadgesUnlocked(cb: (keys: string[]) => void) {
  badgeListeners.add(cb);
  return () => {
    badgeListeners.delete(cb);
  };
}

export function useDemoProgress(): DemoProgress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => demoBaselineProgress,
  );
}
