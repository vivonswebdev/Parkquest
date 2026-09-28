/**
 * Progression d'un parcours (fonctions PURES, testées) — partagées par le suivi de visite,
 * la fiche parcours et le futur « Mode Exploration ».
 *
 * États d'une étape :
 * - done    ✓ découverte ;
 * - current ● étape en cours : découverte, le visiteur y est encore (quiz, défi) ;
 * - next    ◉ prochain objectif : l'endroit où aller maintenant ;
 * - future  ○ à venir.
 * En marchant vers l'étape N (pas encore découverte) : N = next.
 * Une fois N découverte : N = current et la prochaine étape non découverte = next.
 */
import { pathLengthM, walkingMinutes } from "@/lib/geo";

export type StepState = "done" | "current" | "next" | "future";

export const STEP_SYMBOL: Record<StepState, string> = { done: "✓", current: "●", next: "◉", future: "○" };

export function trailStepStates(spotIds: string[], discovered: ReadonlySet<string>, targetIndex: number): StepState[] {
  const states: StepState[] = spotIds.map((id) => (discovered.has(id) ? "done" : "future"));
  const target = spotIds[targetIndex];
  if (target === undefined) return states;
  if (!discovered.has(target)) {
    states[targetIndex] = "next";
    return states;
  }
  states[targetIndex] = "current";
  // Prochaine étape non découverte après la cible, sinon la première non découverte.
  let next = spotIds.findIndex((id, i) => i > targetIndex && !discovered.has(id));
  if (next < 0) next = spotIds.findIndex((id) => !discovered.has(id));
  if (next >= 0) states[next] = "next";
  return states;
}

export interface TrailRemaining {
  found: number;
  total: number;
  /** Distance estimée des segments menant aux étapes non découvertes (m) */
  distanceM: number;
  minutes: number;
  /** Points des étapes non découvertes + bonus de fin de parcours */
  points: number;
  /** 0–100 */
  percent: number;
}

export function trailRemaining(
  spots: { id: string; pointsValue: number }[],
  segments: { toSpotId: string; path: [number, number][] }[],
  discovered: ReadonlySet<string>,
  completionPoints: number,
): TrailRemaining {
  const left = spots.filter((s) => !discovered.has(s.id));
  const distanceM = Math.round(
    segments.filter((g) => left.some((s) => s.id === g.toSpotId)).reduce((sum, g) => sum + pathLengthM(g.path), 0),
  );
  const found = spots.length - left.length;
  return {
    found,
    total: spots.length,
    distanceM,
    minutes: distanceM > 0 ? walkingMinutes(distanceM) : 0,
    points: left.reduce((sum, s) => sum + s.pointsValue, 0) + (left.length ? completionPoints : 0),
    percent: spots.length ? Math.round((found / spots.length) * 100) : 0,
  };
}

/** Variante de tracé d'un segment selon l'état de l'étape d'arrivée. */
export function segmentVariant(state: StepState | undefined): "done" | "active" | "trail" {
  if (state === "done" || state === "current") return "done";
  if (state === "next") return "active";
  return "trail";
}
