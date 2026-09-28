/**
 * Habillage ParkQuest d'un style OpenStreetMap (schéma OpenMapTiles) : les couches du
 * fond sont recolorées selon le thème, sans télécharger un autre style.
 * Fonction pure : prend la liste des couches, renvoie les propriétés à appliquer.
 */

export type MapTheme = "dark" | "light";

export interface MapPalette {
  background: string;
  grass: string;
  wood: string;
  water: string;
  road: string;
  path: string;
  building: string;
  building3d: string;
  text: string;
  textHalo: string;
  boundary: string;
  sky: string;
  horizon: string;
}

export const MAP_PALETTES: Record<MapTheme, MapPalette> = {
  dark: {
    background: "#0a1a14",
    grass: "#0f2c21",
    wood: "#113526",
    water: "#0b2d38",
    road: "#1d3a30",
    path: "#2b4d40",
    building: "#15302a",
    building3d: "#1d4034",
    text: "#a9c1b7",
    textHalo: "#07130e",
    boundary: "#35584a",
    sky: "#08251c",
    horizon: "#12402f",
  },
  light: {
    background: "#f2efe4",
    grass: "#dfe9d3",
    wood: "#cfe1c2",
    water: "#b9dbe5",
    road: "#ffffff",
    path: "#e8dfc9",
    building: "#e6e0d2",
    building3d: "#ddd5c4",
    text: "#3e5247",
    textHalo: "#f7f4ec",
    boundary: "#b7c4b3",
    sky: "#cfe6ef",
    horizon: "#f7f4ec",
  },
};

export interface StyleLayerLike {
  id: string;
  type: string;
  "source-layer"?: string;
  source?: string;
  filter?: unknown;
}

export interface PaintChange {
  layerId: string;
  property: string;
  value: string;
}

const GRASS = /grass|park|meadow|garden|farmland|scrub|pitch|cemetery|playground|golf/;
const WOOD = /wood|forest|tree/;

/** Couleur de remplissage d'une couche selon sa source et son identifiant. */
function fillColor(layer: StyleLayerLike, p: MapPalette): string | null {
  const sl = layer["source-layer"] ?? "";
  const id = layer.id.toLowerCase();
  if (sl === "water" || id.includes("water")) return p.water;
  if (sl === "building") return p.building;
  if (sl === "park") return p.grass;
  if (sl === "landcover" || sl === "landuse") {
    if (WOOD.test(id)) return p.wood;
    if (GRASS.test(id)) return p.grass;
    return p.background;
  }
  return null;
}

/** Calcule les changements de peinture pour habiller le fond au thème ParkQuest. */
export function themePaintChanges(layers: StyleLayerLike[], theme: MapTheme): PaintChange[] {
  const p = MAP_PALETTES[theme];
  const out: PaintChange[] = [];
  const set = (layerId: string, property: string, value: string) => out.push({ layerId, property, value });
  for (const l of layers) {
    if (l.id.startsWith("pq-")) continue; // couches ParkQuest (parcours, 3D) gérées à part
    const sl = l["source-layer"] ?? "";
    switch (l.type) {
      case "background":
        set(l.id, "background-color", p.background);
        break;
      case "fill": {
        const c = fillColor(l, p);
        if (c) set(l.id, "fill-color", c);
        if (c && sl === "building") set(l.id, "fill-outline-color", p.building);
        break;
      }
      case "line":
        if (sl === "transportation") set(l.id, "line-color", /path|track|foot|cycle|pedestrian|minor|service/.test(l.id) ? p.path : p.road);
        else if (sl === "waterway" || l.id.includes("water")) set(l.id, "line-color", p.water);
        else if (sl === "boundary") set(l.id, "line-color", p.boundary);
        break;
      case "symbol":
        set(l.id, "text-color", p.text);
        set(l.id, "text-halo-color", p.textHalo);
        break;
    }
  }
  return out;
}

/** Première couche utilisant la source-layer « building » (pour les bâtiments 3D). */
export function findBuildingSource(layers: StyleLayerLike[]): string | null {
  return layers.find((l) => l["source-layer"] === "building" && l.source)?.source ?? null;
}

/** Première couche de texte : les couches ParkQuest sont insérées dessous. */
export function firstSymbolLayerId(layers: StyleLayerLike[]): string | undefined {
  return layers.find((l) => l.type === "symbol")?.id;
}
