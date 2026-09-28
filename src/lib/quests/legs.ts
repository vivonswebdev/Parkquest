import type { LatLng } from "@/lib/domain/types";

/**
 * Tracé indicatif entre deux objectifs (courbe douce, données de démonstration).
 * Remplacé plus tard par les chemins réels du parc (validés, cf. docs/OSM_ODBL_DATA_STRATEGY.md).
 */
export function curvedLeg(a: LatLng, b: LatLng, bend = 0.2): [number, number][] {
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const ctrl = { lat: mid.lat - (b.lng - a.lng) * bend * 0.6, lng: mid.lng + (b.lat - a.lat) * bend * 1.6 };
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const lat = (1 - t) ** 2 * a.lat + 2 * (1 - t) * t * ctrl.lat + t ** 2 * b.lat;
    const lng = (1 - t) ** 2 * a.lng + 2 * (1 - t) * t * ctrl.lng + t ** 2 * b.lng;
    pts.push([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  }
  return pts;
}

/** Tronçons successifs : départ → étape 1 → … → dernière étape. */
export function questLegs(start: LatLng, stops: LatLng[]): [number, number][][] {
  return stops.map((p, i) => curvedLeg(i === 0 ? start : stops[i - 1], p, i % 2 === 0 ? 0.22 : -0.18));
}
