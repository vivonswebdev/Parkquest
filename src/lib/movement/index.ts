import type { LatLng } from "@/lib/domain/types";
import { bearingDeg, distanceM } from "@/lib/geo";

/**
 * Tableau de bord de déplacement — logique PURE, calculée sur l'appareil uniquement.
 * Aucune donnée n'est envoyée au serveur ; aucune récompense, aucun classement ni bonus
 * ne dépend de la vitesse (sécurité). La vitesse est affichée à titre indicatif.
 *
 * Fonctionne avec n'importe quelle source de positions (Geolocation API aujourd'hui,
 * GPS natif plus tard) : il suffit de fournir des relevés horodatés.
 */

export interface Fix extends LatLng {
  /** Précision horizontale (m). */
  accuracy: number;
  /** Horodatage (ms). */
  t: number;
}

export interface MovementState {
  /** Dernier relevé retenu (point de référence pour la distance). */
  last: Fix | null;
  /** Distance parcourue (m). */
  distanceM: number;
  /** Vitesse lissée (m/s), `null` tant qu'elle n'est pas connue. */
  speedMps: number | null;
  /** Cap de déplacement (degrés, 0 = nord), `null` tant qu'on n'a pas bougé. */
  headingDeg: number | null;
}

export const MOVEMENT_RULES = {
  /** Relevés moins précis ignorés. */
  maxAccuracyM: 30,
  /** En dessous, on considère que l'on n'a pas bougé (bruit GPS). */
  minStepM: 4,
  /** Au-delà (~25 km/h), le relevé est un saut GPS : ignoré pour la distance. */
  maxSpeedMps: 7,
  /** Poids du nouveau relevé dans la moyenne lissée. */
  smoothing: 0.35,
  /** Sans déplacement pendant cette durée, la vitesse redescend vers 0. */
  stillAfterMs: 5000,
  /** Allure de marche utilisée pour le temps restant quand on est à l'arrêt (4,5 km/h). */
  walkingMps: 1.25,
} as const;

export function initialMovement(): MovementState {
  return { last: null, distanceM: 0, speedMps: null, headingDeg: null };
}

const ema = (prev: number | null, next: number) => (prev === null ? next : prev + MOVEMENT_RULES.smoothing * (next - prev));

/** Intègre un nouveau relevé. */
export function addFix(state: MovementState, fix: Fix): MovementState {
  if (fix.accuracy > MOVEMENT_RULES.maxAccuracyM) return state;
  const last = state.last;
  if (!last) return { ...state, last: fix };
  const dt = (fix.t - last.t) / 1000;
  if (dt <= 0) return state;
  const d = distanceM(last, fix);
  if (d < MOVEMENT_RULES.minStepM) {
    // Immobile : la vitesse retombe progressivement ; le point de référence est conservé
    // pour que les petits pas finissent par compter.
    if (dt * 1000 < MOVEMENT_RULES.stillAfterMs || state.speedMps === null) return state;
    const speed = ema(state.speedMps, 0);
    return { ...state, speedMps: speed < 0.1 ? 0 : speed };
  }
  const v = d / dt;
  // Saut GPS : on repart de ce point sans compter la distance.
  if (v > MOVEMENT_RULES.maxSpeedMps) return { ...state, last: fix };
  return { last: fix, distanceM: state.distanceM + d, speedMps: ema(state.speedMps, v), headingDeg: bearingDeg(last, fix) };
}

/** Reprise après une pause : l'intervalle de pause n'est compté ni en distance ni en vitesse. */
export function resumeMovement(state: MovementState): MovementState {
  return { ...state, last: null, speedMps: null };
}

/** Temps restant estimé (min, au moins 1) ; allure de marche si l'on est à l'arrêt ou trop lent. */
export function etaMinutes(remainingM: number, speedMps: number | null): number {
  const pace = speedMps !== null && speedMps >= 0.5 ? speedMps : MOVEMENT_RULES.walkingMps;
  return Math.max(1, Math.round(remainingM / pace / 60));
}

export const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type Cardinal = (typeof CARDINALS)[number];

/** Point cardinal (8 directions) d'un cap en degrés. */
export function cardinal(deg: number): Cardinal {
  return CARDINALS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Vitesse en km/h arrondie au dixième (affichage indicatif). */
export function speedKmh(speedMps: number): number {
  return Math.round(speedMps * 36) / 10;
}
