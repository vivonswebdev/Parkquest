import type { LatLng } from "@/lib/domain/types";

const R = 6371008.8; // rayon terrestre moyen (m)
const rad = (d: number) => (d * Math.PI) / 180;

/** Distance orthodromique en mètres. */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cap en degrés (0 = nord). */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Durée de marche estimée (min) à 4,5 km/h, minimum 1. */
export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 75));
}

/** Longueur d'une polyligne [lng, lat]. */
export function pathLengthM(path: [number, number][]): number {
  let d = 0;
  for (let i = 1; i < path.length; i++) {
    d += distanceM({ lng: path[i - 1][0], lat: path[i - 1][1] }, { lng: path[i][0], lat: path[i][1] });
  }
  return d;
}

/** Règles de validation GPS — identiques à la fonction SQL discover_spot. */
export const GPS_RULES = {
  /** Précision « excellente » : découverte proposée dès 25 m du spot. */
  preciseAccuracyM: 10,
  preciseDistanceM: 25,
  /** Au-delà, jamais de validation GPS (confirmation manuelle seulement). */
  maxAccuracyM: 25,
  rejectDistanceM: 250,
  /** Distance à partir de laquelle l'UI propose « Vous semblez proche ». */
  nearHintM: 60,
  /** « Autour de vous » : rayon de recherche et seuil de recalcul (batterie, réseau). */
  nearbyRadiusM: 500,
  significantMoveM: 15,
} as const;
