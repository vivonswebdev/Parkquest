import type { LatLng } from "@/lib/domain/types";
import { pointInRing, type LngLat, type Ring } from "./nature";

/**
 * Limite approximative d'un parc, calculée à partir de NOS données (spots, services, parcours) :
 * enveloppe convexe élargie d'une marge. Aucune donnée OpenStreetMap n'est extraite ni stockée.
 * Elle sert à dessiner la zone de visite et à prévenir quand on s'en éloigne (éviter de se perdre).
 */

const M_PER_DEG_LAT = 111_320;

/** Enveloppe convexe (algorithme de la chaîne monotone), anneau [lng, lat] sans point de fermeture. */
export function convexHull(points: LngLat[]): Ring {
  const pts = [...new Map(points.map((p) => [`${p[0]},${p[1]}`, p])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o: LngLat, a: LngLat, b: LngLat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: LngLat[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: LngLat[] = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * Élargit un anneau convexe d'au moins `marginM` mètres partout : 12 points sur un cercle
 * autour de chaque sommet, puis nouvelle enveloppe (coins arrondis).
 */
export function expandRing(ring: Ring, marginM: number): Ring {
  if (!ring.length) return ring;
  const lat0 = ring[0][1];
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const r = marginM / Math.cos(Math.PI / 12); // le polygone à 12 côtés englobe le cercle
  const pts: LngLat[] = ring.flatMap(([x, y]) =>
    Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return [x + (Math.cos(a) * r) / (kx * M_PER_DEG_LAT), y + (Math.sin(a) * r) / M_PER_DEG_LAT] as LngLat;
    }),
  );
  return convexHull(pts);
}

/** Zone de visite approximative d'un parc (anneau fermé), à partir de ses lieux et parcours. */
export function parkBoundary(points: LatLng[], paths: LngLat[][] = [], marginM = 60): Ring | null {
  const all: LngLat[] = [...points.map((p) => [p.lng, p.lat] as LngLat), ...paths.flat()];
  const hull = convexHull(all);
  if (hull.length < 3) return null;
  const ring = expandRing(hull, marginM);
  return [...ring, ring[0]];
}

/** Distance (m) d'un point au bord d'un anneau (projection locale). */
export function distanceToRingM(p: LatLng, ring: Ring): number {
  const kx = Math.cos((p.lat * Math.PI) / 180);
  const px = p.lng * kx * M_PER_DEG_LAT;
  const py = p.lat * M_PER_DEG_LAT;
  let best = Infinity;
  for (let i = 0; i < ring.length - 1; i++) {
    const ax = ring[i][0] * kx * M_PER_DEG_LAT;
    const ay = ring[i][1] * M_PER_DEG_LAT;
    const dx = ring[i + 1][0] * kx * M_PER_DEG_LAT - ax;
    const dy = ring[i + 1][1] * M_PER_DEG_LAT - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  }
  return best;
}

export type BoundaryState = "inside" | "outside" | "unknown";

export const BOUNDARY_RULES = {
  /** Au-delà de cette précision, on ne conclut rien (évite les fausses alertes). */
  maxAccuracyM: 35,
  /** Tolérance hors de la zone avant d'alerter (en plus de la précision du GPS). */
  toleranceM: 25,
  /** Positions consécutives hors zone avant l'alerte (hystérésis). */
  confirmFixes: 2,
} as const;

/** Où se trouve une position par rapport à la zone : ne conclut « dehors » que si c'est certain. */
export function boundaryState(p: LatLng & { accuracy: number }, ring: Ring | null): BoundaryState {
  if (!ring || p.accuracy > BOUNDARY_RULES.maxAccuracyM) return "unknown";
  if (pointInRing([p.lng, p.lat], ring)) return "inside";
  return distanceToRingM(p, ring) > BOUNDARY_RULES.toleranceM + p.accuracy ? "outside" : "unknown";
}

/** Alerte de sortie : hystérésis sur N positions « dehors », réarmée au retour dans la zone. */
export interface LeaveAlertState {
  outsideCount: number;
  alerted: boolean;
}

export function nextLeaveAlert(s: LeaveAlertState, state: BoundaryState, confirmFixes: number = BOUNDARY_RULES.confirmFixes): LeaveAlertState {
  if (state === "inside") return { outsideCount: 0, alerted: false };
  if (state === "unknown") return s;
  const outsideCount = s.outsideCount + 1;
  return { outsideCount, alerted: s.alerted || outsideCount >= confirmFixes };
}
