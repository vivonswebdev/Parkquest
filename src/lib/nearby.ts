import type { LatLng } from "@/lib/domain/types";
import { GPS_RULES, distanceM, walkingMinutes } from "@/lib/geo";

/**
 * « Autour de vous » : classement par distance (fonction pure, testée).
 * En mode démo le calcul se fait sur les spots déjà chargés ; en production,
 * le même contrat est servi par la fonction PostGIS nearby_spots (rayon + index GIST).
 */
export interface NearbyItem {
  id: string;
  kind: "spot" | "facility";
  location: LatLng;
}

export interface Ranked<T> {
  item: T;
  distanceM: number;
  minutes: number;
}

export function rankNearby<T extends NearbyItem>(items: T[], origin: LatLng, radiusM: number = GPS_RULES.nearbyRadiusM, limit = 20): Ranked<T>[] {
  const ranked = items
    .map((item) => {
      const d = Math.round(distanceM(origin, item.location));
      return { item, distanceM: d, minutes: walkingMinutes(d) };
    })
    .sort((a, b) => a.distanceM - b.distanceM);
  const inRadius = ranked.filter((r) => r.distanceM <= radiusM);
  // Personne dans le rayon (ex. hors du parc) : on montre quand même les plus proches.
  return (inRadius.length ? inRadius : ranked).slice(0, limit);
}

/** Vrai si l'utilisateur s'est assez déplacé pour justifier un recalcul. */
export function movedSignificantly(prev: LatLng | null, next: LatLng, thresholdM: number = GPS_RULES.significantMoveM): boolean {
  return !prev || distanceM(prev, next) >= thresholdM;
}

/**
 * Arrondit une position sur une grille d'environ `stepM` mètres : sert de clé de
 * recalcul (« Autour de vous » ne bouge qu'après un déplacement significatif).
 */
export function quantize(p: LatLng, stepM: number = GPS_RULES.significantMoveM): LatLng {
  const latStep = stepM / 111_320;
  // Latitude de référence arrondie : la grille des longitudes ne varie pas avec de petits mouvements.
  const refLat = Math.round(p.lat * 10) / 10;
  const lngStep = stepM / (111_320 * Math.cos((refLat * Math.PI) / 180));
  return { lat: Math.round(p.lat / latStep) * latStep, lng: Math.round(p.lng / lngStep) * lngStep };
}
