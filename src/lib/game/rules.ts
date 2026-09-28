import type { LatLng } from "@/lib/domain/types";
import { GPS_RULES, distanceM } from "@/lib/geo";

/**
 * Règles de jeu PURES (sans I/O), partagées par le service démo et documentées
 * comme référence des fonctions SQL (supabase/migrations/…_game_functions.sql).
 */

export interface DiscoveryInput {
  spotLocation: LatLng;
  radiusM: number;
  pointsValue: number;
  position?: { lat: number; lng: number; accuracyM?: number };
  inVisit: boolean;
}

export type DiscoveryOutcome =
  | { status: "TOO_FAR"; distanceM: number; points: 0 }
  | { status: "DISCOVERED"; method: "GPS_VERIFIED" | "SELF_DECLARED"; distanceM?: number; points: number };

/**
 * - GPS fiable (précision ≤ 25 m) ET distance ≤ rayon → GPS_VERIFIED, points pleins.
 * - GPS fiable mais à plus de 250 m → refus (TOO_FAR).
 * - Sinon (sans GPS, précision insuffisante) → SELF_DECLARED :
 *   demi-points pendant une visite active, 0 point hors visite.
 */
export function evaluateDiscovery(i: DiscoveryInput): DiscoveryOutcome {
  if (i.position) {
    const d = Math.round(distanceM(i.spotLocation, i.position));
    const reliable = i.position.accuracyM !== undefined && i.position.accuracyM <= GPS_RULES.maxAccuracyM;
    if (reliable && d <= i.radiusM) return { status: "DISCOVERED", method: "GPS_VERIFIED", distanceM: d, points: i.pointsValue };
    if (reliable && d > GPS_RULES.rejectDistanceM) return { status: "TOO_FAR", distanceM: d, points: 0 };
    return { status: "DISCOVERED", method: "SELF_DECLARED", distanceM: d, points: i.inVisit ? Math.ceil(i.pointsValue / 2) : 0 };
  }
  return { status: "DISCOVERED", method: "SELF_DECLARED", points: i.inVisit ? Math.ceil(i.pointsValue / 2) : 0 };
}

/** Points de quiz : uniquement si la PREMIÈRE tentative est correcte. */
export function quizPoints(isCorrect: boolean, firstAttempt: boolean, pointsValue: number): number {
  return isCorrect && firstAttempt ? pointsValue : 0;
}

/** Défi photo → en attente de modération ; sinon validé immédiatement. */
export function challengeOutcome(requiresPhoto: boolean, hasPhoto: boolean, pointsValue: number) {
  if (requiresPhoto && !hasPhoto) return { error: "PHOTO_REQUIRED" as const };
  if (requiresPhoto) return { status: "PENDING" as const, points: 0 };
  return { status: "APPROVED" as const, points: pointsValue };
}

/** Points de fin de parcours : seulement si tous les spots du parcours sont découverts. */
export function trailCompletionPoints(spotsFound: number, spotsTotal: number, completionPoints: number) {
  const completed = spotsTotal > 0 && spotsFound >= spotsTotal;
  return { completed, points: completed ? completionPoints : 0 };
}

/**
 * Palier de proximité affiché à l'utilisateur (aucune validation automatique) :
 *  - "precise"   : précision ≤ 10 m et distance ≤ 25 m → « Vous êtes près de … » + [Découvrir]
 *  - "likely"    : précision ≤ 25 m et distance ≤ rayon → « Vous semblez proche » + confirmation
 *  - "imprecise" : précision > 25 m mais le lieu est plausible → confirmation manuelle (déclarative)
 *  - "far"       : trop loin
 * La validation serveur reste : précision ≤ 25 m ET distance ≤ rayon (evaluateDiscovery).
 */
export type ProximityTier = "precise" | "likely" | "imprecise" | "far";

export function proximityTier(distanceToSpotM: number, accuracyM: number, radiusM: number): ProximityTier {
  if (accuracyM <= GPS_RULES.preciseAccuracyM && distanceToSpotM <= GPS_RULES.preciseDistanceM) return "precise";
  if (accuracyM <= GPS_RULES.maxAccuracyM && distanceToSpotM <= radiusM) return "likely";
  if (accuracyM > GPS_RULES.maxAccuracyM && distanceToSpotM <= radiusM + accuracyM) return "imprecise";
  return "far";
}
