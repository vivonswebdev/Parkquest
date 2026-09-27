import type { TrailAudience, TrailSummary, TrailTheme } from "@/lib/domain/types";

export interface PlanInput {
  minutes: number;
  audience: TrailAudience;
  interests: TrailTheme[];
}

export interface PlanRecommendation {
  trail: TrailSummary;
  fitsTime: boolean;
  audienceMatch: boolean;
  themeMatches: TrailTheme[];
}

/**
 * Recommandation MVP : on classe les parcours EXISTANTS par score simple
 * (temps, public, thèmes, PMR). Pas de génération d'itinéraire dynamique.
 */
export function recommendTrail(trails: TrailSummary[], input: PlanInput): PlanRecommendation | null {
  const scored = trails.map((trail) => {
    const fitsTime = trail.durationMin <= input.minutes;
    const audienceMatch = trail.audiences.includes(input.audience) || (input.audience === "SOLO" && trail.audiences.includes("CURIOUS"));
    const themeMatches = input.interests.filter((i) => trail.themes.includes(i) || (i === "PMR" && (trail.isPmrAccessible || trail.pmrPartial)));
    let score = 0;
    score += fitsTime ? 3 : -Math.min(3, (trail.durationMin - input.minutes) / 30);
    score += audienceMatch ? 2 : 0;
    score += themeMatches.length * 1.5;
    if (input.interests.includes("PMR") && !trail.isPmrAccessible) score -= trail.pmrPartial ? 1 : 4;
    return { trail, fitsTime, audienceMatch, themeMatches, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  return best ? { trail: best.trail, fitsTime: best.fitsTime, audienceMatch: best.audienceMatch, themeMatches: best.themeMatches } : null;
}
