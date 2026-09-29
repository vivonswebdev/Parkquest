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
  /** Vitesse mesurée par le GPS (m/s), plus fiable que l'écart entre deux positions. */
  speed?: number | null;
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
  /**
   * Déplacement rapide détecté (vitesse soutenue > ~25 km/h) : le suivi de découverte est en
   * pause (distance, arrivées, découvertes) jusqu'au retour à une allure lente. Neutre : on ne
   * sait pas s'il s'agit d'une voiture, d'un bus ou d'un train, et ce n'est jamais un reproche.
   */
  fastTravel: boolean;
  /** Série en cours de relevés rapides (entrée en pause) ou lents (reprise). */
  streak: { kind: "fast" | "slow"; count: number; since: number } | null;
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
  /**
   * Seuil de bruit adapté à la précision : un déplacement n'est compté que s'il dépasse
   * cette fraction de la moins bonne précision des deux relevés (et au moins `minStepM`).
   */
  accuracyStepFactor: 0.6,
} as const;

/**
 * Déplacement rapide (MVP) : une vitesse soutenue au-delà de ce qu'on fait à pied ou à vélo
 * tranquille dans un parc, sur plusieurs relevés et plusieurs secondes, met le suivi de
 * découverte en pause. Un saut isolé reste un simple saut GPS. Voir docs/MOVEMENT_MODES.md.
 */
export const FAST_TRAVEL_RULES = {
  /** ~25 km/h */
  fastMps: 7,
  /** Relevés rapides consécutifs et durée minimale avant la pause. */
  enterFixes: 3,
  enterMs: 15_000,
  /** Reprise : allure lente ou arrêt (< ~11 km/h) soutenus. */
  slowMps: 3,
  exitFixes: 3,
  exitMs: 20_000,
} as const;

export function initialMovement(): MovementState {
  return { last: null, distanceM: 0, speedMps: null, headingDeg: null, fastTravel: false, streak: null };
}

/** Met à jour la série rapide/lente et l'état « déplacement rapide ». */
function trackFastTravel(state: MovementState, v: number, t: number): Pick<MovementState, "fastTravel" | "streak"> {
  const kind: "fast" | "slow" | null = v > FAST_TRAVEL_RULES.fastMps ? "fast" : v < FAST_TRAVEL_RULES.slowMps ? "slow" : null;
  if (!kind) return { fastTravel: state.fastTravel, streak: null };
  const prev = state.streak?.kind === kind ? state.streak : null;
  // `since` = début de la série (horodatage du relevé précédent : le premier intervalle compte).
  const streak = { kind, count: (prev?.count ?? 0) + 1, since: prev?.since ?? (state.last?.t ?? t) };
  const span = t - streak.since;
  if (!state.fastTravel && kind === "fast" && streak.count >= FAST_TRAVEL_RULES.enterFixes && span >= FAST_TRAVEL_RULES.enterMs) return { fastTravel: true, streak };
  if (state.fastTravel && kind === "slow" && streak.count >= FAST_TRAVEL_RULES.exitFixes && span >= FAST_TRAVEL_RULES.exitMs) return { fastTravel: false, streak };
  return { fastTravel: state.fastTravel, streak };
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
  const minStep = Math.max(MOVEMENT_RULES.minStepM, MOVEMENT_RULES.accuracyStepFactor * Math.max(last.accuracy, fix.accuracy));
  if (d < minStep) {
    // Immobile : la vitesse retombe progressivement ; le point de référence est conservé
    // pour que les petits pas finissent par compter. L'arrêt compte aussi pour la reprise.
    const fast = state.fastTravel ? trackFastTravel(state, 0, fix.t) : null;
    if (dt * 1000 < MOVEMENT_RULES.stillAfterMs || state.speedMps === null) return fast ? { ...state, ...fast } : state;
    const speed = ema(state.speedMps, 0);
    return { ...state, ...fast, speedMps: speed < 0.1 ? 0 : speed };
  }
  const v = d / dt;
  const measured = fix.speed != null && fix.speed >= 0 ? fix.speed : null;
  const fast = trackFastTravel(state, measured ?? v, fix.t);
  // Déplacement rapide : suivi en pause (ni distance ni progression), la vitesse reste affichée.
  if (fast.fastTravel) return { ...state, ...fast, last: fix, speedMps: ema(state.speedMps, v), headingDeg: bearingDeg(last, fix) };
  // Saut GPS : on repart de ce point sans compter la distance.
  if (v > MOVEMENT_RULES.maxSpeedMps) return { ...state, ...fast, last: fix };
  return { ...fast, last: fix, distanceM: state.distanceM + d, speedMps: ema(state.speedMps, v), headingDeg: bearingDeg(last, fix) };
}

/** Reprise après une pause : l'intervalle de pause n'est compté ni en distance ni en vitesse. */
export function resumeMovement(state: MovementState): MovementState {
  return { ...state, last: null, speedMps: null, streak: null };
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

/**
 * Modes de déplacement — ARCHITECTURE FUTURE (voir docs/MOVEMENT_MODES.md).
 * Le MVP ne distingue que « lent » (marche, vélo tranquille…), « rapide » (suivi en pause) et
 * « GPS imprécis ». À terme, vélo, équitation et itinéraires autorisés auront leurs propres règles
 * et ne seront jamais traités comme une voiture.
 */
export const TRAVEL_MODES = ["walk", "bike", "horse", "car", "transit", "gps_imprecise"] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

/** Ce que le MVP sait réellement dire aujourd'hui (sans deviner voiture, bus ou train). */
export type MvpTravelClass = "slow" | "fast" | "gps_imprecise";

export function mvpTravelClass(state: MovementState, accuracyM: number | null | undefined): MvpTravelClass {
  if (accuracyM == null || accuracyM > MOVEMENT_RULES.maxAccuracyM) return "gps_imprecise";
  return state.fastTravel ? "fast" : "slow";
}

/** Correspondance MVP → modes futurs possibles (un mode « rapide » peut être voiture ou transport). */
export const MVP_CLASS_CANDIDATES: Record<MvpTravelClass, readonly TravelMode[]> = {
  slow: ["walk", "bike", "horse"],
  fast: ["car", "transit", "bike"],
  gps_imprecise: ["gps_imprecise"],
};
