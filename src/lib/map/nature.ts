/**
 * Nature décorative de la carte : arbres (2D illustrés / 3D en relief) et plans d'eau.
 * Fonctions PURES et déterministes (même parc → mêmes arbres), testées.
 *
 * ⚠️ Décor : la position de chaque arbre n'est pas une donnée officielle. Sur le fond
 * OpenStreetMap, les arbres ne sont semés que dans les zones vertes réelles (bois, parcs).
 */
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type { LatLng } from "@/lib/domain/types";

export type LngLat = [number, number];
export type Ring = LngLat[];

export interface Tree {
  lng: number;
  lat: number;
  /** Rayon de la couronne (m) */
  radiusM: number;
  /** Hauteur totale (m) */
  heightM: number;
  kind: "broadleaf" | "conifer";
  /** Nuance de vert 0..2 */
  shade: 0 | 1 | 2;
}

/** Bosquet : zone boisée dense (le reste du parc devient pelouses et clairières). */
export interface Grove {
  center: LatLng;
  radiusM: number;
}

/** Bosquets déterministes répartis dans l'emprise (aspect parc paysager). */
export function makeGroves(bounds: [LatLng, LatLng], seed = "groves", count = 14): Grove[] {
  const [sw, ne] = bounds;
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    center: { lat: sw.lat + rand() * (ne.lat - sw.lat), lng: sw.lng + rand() * (ne.lng - sw.lng) },
    radiusM: 55 + rand() * 95,
  }));
}

export interface ScatterOptions {
  /** Emprise du parc [sud-ouest, nord-est] */
  bounds: [LatLng, LatLng];
  /** Zones où semer (anneaux lng/lat). Vide → toute l'emprise. */
  areas?: Ring[];
  /** Zones interdites (eau, bâtiments…) */
  excludeAreas?: Ring[];
  /** Chemins à garder dégagés */
  paths?: LngLat[][];
  pathClearanceM?: number;
  /** Points à garder dégagés (spots, services) */
  points?: LatLng[];
  pointClearanceM?: number;
  /**
   * Bosquets : forte densité à l'intérieur, arbres isolés ailleurs.
   * Ignoré si `areas` (zones vertes réelles) est fourni.
   */
  groves?: Grove[];
  /** Espacement moyen entre arbres (m) */
  spacingM?: number;
  maxTrees?: number;
  seed?: string;
}

const M_PER_DEG_LAT = 111_320;

/** Générateur pseudo-aléatoire déterministe (mulberry32 sur un hash FNV). */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Point dans un polygone (anneau fermé ou non), règle pair-impair. */
export function pointInRing(p: LngLat, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Distance (m) d'un point à un segment, en projection locale. */
function distToSegmentM(p: LngLat, a: LngLat, b: LngLat, kx: number): number {
  const px = p[0] * kx * M_PER_DEG_LAT;
  const py = p[1] * M_PER_DEG_LAT;
  const ax = a[0] * kx * M_PER_DEG_LAT;
  const ay = a[1] * M_PER_DEG_LAT;
  const bx = b[0] * kx * M_PER_DEG_LAT;
  const by = b[1] * M_PER_DEG_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Sème des arbres sur une grille perturbée (aspect naturel, sans alignement),
 * en évitant chemins, spots, services et zones exclues.
 */
export function scatterTrees(o: ScatterOptions): Tree[] {
  const [sw, ne] = o.bounds;
  const spacing = o.spacingM ?? 18;
  const pathClear = o.pathClearanceM ?? 7;
  const pointClear = o.pointClearanceM ?? 16;
  const max = o.maxTrees ?? 2500;
  const rand = seededRandom(o.seed ?? `${sw.lat},${sw.lng}`);
  const kx = Math.cos((((sw.lat + ne.lat) / 2) * Math.PI) / 180);
  const stepLat = spacing / M_PER_DEG_LAT;
  const stepLng = spacing / (M_PER_DEG_LAT * kx);
  const areas = o.areas?.length ? o.areas : null;
  const trees: Tree[] = [];

  for (let lat = sw.lat + stepLat / 2; lat < ne.lat; lat += stepLat) {
    for (let lng = sw.lng + stepLng / 2; lng < ne.lng; lng += stepLng) {
      if (trees.length >= max) return trees;
      const p: LngLat = [lng + (rand() - 0.5) * stepLng * 0.9, lat + (rand() - 0.5) * stepLat * 0.9];
      const r = rand();
      if (areas) {
        // Zones vertes réelles : ~22 % de clairières.
        if (r < 0.22 || !areas.some((a) => pointInRing(p, a))) continue;
      } else if (o.groves?.length) {
        // Parc paysager : dense dans les bosquets (lisière progressive), rare sur les pelouses.
        const inGrove = o.groves.reduce((best, g) => {
          const d = Math.hypot((g.center.lng - p[0]) * kx, g.center.lat - p[1]) * M_PER_DEG_LAT;
          return Math.max(best, 1 - d / g.radiusM);
        }, 0);
        const density = inGrove > 0 ? 0.55 + 0.4 * Math.min(1, inGrove * 2.5) : 0.07;
        if (r > density) continue;
      } else if (r < 0.22) continue;
      if (o.excludeAreas?.some((a) => pointInRing(p, a))) continue;
      if (o.points?.some((q) => Math.hypot((q.lng - p[0]) * kx, q.lat - p[1]) * M_PER_DEG_LAT < pointClear)) continue;
      if (o.paths?.some((path) => path.some((a, i) => i > 0 && distToSegmentM(p, path[i - 1], a, kx) < pathClear))) continue;
      const conifer = rand() < 0.28;
      const size = 0.7 + rand() * 0.6;
      trees.push({
        lng: p[0],
        lat: p[1],
        radiusM: (conifer ? 3.2 : 4.8) * size,
        heightM: (conifer ? 15 : 11) * size,
        kind: conifer ? "conifer" : "broadleaf",
        shade: Math.floor(rand() * 3) as 0 | 1 | 2,
      });
    }
  }
  return trees;
}

/** Polygone régulier (octogone par défaut) autour d'un point, rayon en mètres. */
export function circleRing(center: LngLat, radiusM: number, sides = 8, wobble?: () => number): Ring {
  const kx = Math.cos((center[1] * Math.PI) / 180);
  const ring: Ring = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const r = radiusM * (wobble ? 0.8 + wobble() * 0.4 : 1);
    ring.push([center[0] + (Math.cos(a) * r) / (M_PER_DEG_LAT * kx), center[1] + (Math.sin(a) * r) / M_PER_DEG_LAT]);
  }
  ring.push(ring[0]);
  return ring;
}

/** Plan d'eau organique (étang) autour d'un point. */
export function pondRing(center: LatLng, radiusM: number, seed = "pond"): Ring {
  return circleRing([center.lng, center.lat], radiusM, 22, seededRandom(seed));
}

export interface TreePalette {
  canopy: [string, string, string];
  conifer: [string, string, string];
  trunk: string;
}

/**
 * Arbres 3D pour une couche fill-extrusion : tronc + couronne arrondie en 2 étages (feuillu),
 * trois étages décroissants (conifère). Chaque polygone porte base, hauteur et couleur.
 */
export function treeExtrusions(trees: Tree[], palette: TreePalette): FeatureCollection<Polygon> {
  const features: Feature<Polygon>[] = [];
  const add = (c: LngLat, r: number, base: number, height: number, color: string, sides = 8) =>
    features.push({ type: "Feature", properties: { base, height, color }, geometry: { type: "Polygon", coordinates: [circleRing(c, r, sides)] } });
  for (const t of trees) {
    const c: LngLat = [t.lng, t.lat];
    const trunkH = t.heightM * (t.kind === "conifer" ? 0.18 : 0.32);
    add(c, Math.max(0.45, t.radiusM * 0.12), 0, trunkH, palette.trunk, 6);
    if (t.kind === "broadleaf") {
      // Couronne arrondie : large base, sommet resserré.
      const split = trunkH + (t.heightM - trunkH) * 0.68;
      add(c, t.radiusM, trunkH, split, palette.canopy[t.shade], 12);
      add(c, t.radiusM * 0.66, split, t.heightM, palette.canopy[t.shade], 12);
    } else {
      const tiers = 3;
      const span = t.heightM - trunkH;
      for (let i = 0; i < tiers; i++) {
        add(c, t.radiusM * (1 - i * 0.3), trunkH + (span * i) / tiers, trunkH + (span * (i + 1)) / tiers, palette.conifer[t.shade], 8);
      }
    }
  }
  return { type: "FeatureCollection", features };
}

/** Points des arbres (ombres au sol, vue 2D). */
export function treePoints(trees: Tree[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: trees.map((t) => ({ type: "Feature", properties: { r: t.radiusM, kind: t.kind, shade: t.shade }, geometry: { type: "Point", coordinates: [t.lng, t.lat] } })),
  };
}

export const TREE_PALETTES: Record<"dark" | "light", TreePalette> = {
  dark: { canopy: ["#1f5a3a", "#256b45", "#2f7d4f"], conifer: ["#174a33", "#1b563b", "#205f41"], trunk: "#4a3a2c" },
  light: { canopy: ["#5f9e4f", "#72b05c", "#4f8f45"], conifer: ["#3f7d45", "#4a8a4d", "#35703d"], trunk: "#7a5a3f" },
};
