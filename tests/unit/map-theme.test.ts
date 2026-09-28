import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findBuildingSource, firstSymbolLayerId, MAP_PALETTES, themePaintChanges, type StyleLayerLike } from "../../src/lib/map/theme";

// Extrait représentatif d'un style OpenMapTiles (OpenFreeMap « positron »).
const layers: StyleLayerLike[] = [
  { id: "background", type: "background" },
  { id: "park", type: "fill", source: "openmaptiles", "source-layer": "park" },
  { id: "landcover_wood", type: "fill", source: "openmaptiles", "source-layer": "landcover" },
  { id: "landuse_residential", type: "fill", source: "openmaptiles", "source-layer": "landuse" },
  { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water" },
  { id: "waterway", type: "line", source: "openmaptiles", "source-layer": "waterway" },
  { id: "building", type: "fill", source: "openmaptiles", "source-layer": "building" },
  { id: "highway_path", type: "line", source: "openmaptiles", "source-layer": "transportation" },
  { id: "highway_major", type: "line", source: "openmaptiles", "source-layer": "transportation" },
  { id: "place_label", type: "symbol", source: "openmaptiles", "source-layer": "place" },
  { id: "pq-paths", type: "line", source: "pq-paths" },
];

const value = (theme: "dark" | "light", id: string, prop: string) =>
  themePaintChanges(layers, theme).find((c) => c.layerId === id && c.property === prop)?.value;

describe("Habillage ParkQuest du fond OpenStreetMap", () => {
  it("recolore fond, parcs, bois, eau, chemins et libellés selon le thème", () => {
    const d = MAP_PALETTES.dark;
    assert.equal(value("dark", "background", "background-color"), d.background);
    assert.equal(value("dark", "park", "fill-color"), d.grass);
    assert.equal(value("dark", "landcover_wood", "fill-color"), d.wood);
    assert.equal(value("dark", "water", "fill-color"), d.water);
    assert.equal(value("dark", "waterway", "line-color"), d.water);
    assert.equal(value("dark", "highway_path", "line-color"), d.path);
    assert.equal(value("dark", "highway_major", "line-color"), d.road);
    assert.equal(value("dark", "place_label", "text-color"), d.text);
    assert.equal(value("light", "background", "background-color"), MAP_PALETTES.light.background);
  });

  it("ne touche jamais aux couches ParkQuest", () => {
    assert.equal(themePaintChanges(layers, "dark").some((c) => c.layerId.startsWith("pq-")), false);
  });

  it("repère la source des bâtiments (3D) et la première couche de texte", () => {
    assert.equal(findBuildingSource(layers), "openmaptiles");
    assert.equal(firstSymbolLayerId(layers), "place_label");
    assert.equal(findBuildingSource([{ id: "bg", type: "background" }]), null);
  });
});
