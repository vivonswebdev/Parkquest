import type { BadgeCriteria } from "@/lib/domain/types";
import type { DemoProgress } from "./demo-data";

/** Valeur d'un critère de badge pour une progression démo (fonction pure, testée). */
export function demoCriteriaValue(p: DemoProgress, criteria: BadgeCriteria): number {
  switch (criteria) {
    case "SPOTS_DISCOVERED":
      return p.discovered.length;
    case "QUIZZES_PASSED":
      return Object.values(p.quizAttempts).filter(Boolean).length;
    case "PHOTOS_APPROVED":
      return p.photosApproved;
    case "DISTANCE_M":
      return p.distanceM;
    case "TRAILS_COMPLETED":
      return p.trailsCompleted;
    case "CHALLENGES_COMPLETED":
      return Object.values(p.challenges).filter((s) => s === "APPROVED").length;
  }
}

/** Clés des badges atteints (mêmes règles que la fonction SQL _evaluate_badges). */
export function unlockedBadgeKeys(p: DemoProgress, badges: readonly { key: string; criteria: BadgeCriteria; threshold: number }[]): string[] {
  return badges.filter((b) => demoCriteriaValue(p, b.criteria) >= b.threshold).map((b) => b.key);
}
