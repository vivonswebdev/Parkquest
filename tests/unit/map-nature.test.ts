import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { distanceM } from "../../src/lib/geo";
import { makeGroves, pointInRing, pondRing, scatterTrees, TREE_PALETTES, treeExtrusions, type LngLat } from "../../src/lib/map/nature";

const bounds: [{ lat: number; lng: number }, { lat: number; lng: number }] = [
  { lat: 50.9238, lng: 4.3176 },
  { lat: 50.9318, lng: 4.3352 },
];
const pond = { center: { lat: 50.92665, lng: 4.32825 }, radiusM: 55 };
const path: LngLat[] = [
  [4.3205, 50.925],
  [4.325, 50.929],
  [4.332, 50.93],
];
const spot = { lat: 50.92845, lng: 4.32505 };

describe("Nature de la carte (arbres, eau)", () => {
  const trees = scatterTrees({
    bounds,
    groves: makeGroves(bounds),
    excludeAreas: [pondRing(pond.center, pond.radiusM + 6)],
    paths: [path],
    points: [spot],
    spacingM: 16,
  });

  it("déterministe : même parc → mêmes arbres", () => {
    const again = scatterTrees({ bounds, groves: makeGroves(bounds), excludeAreas: [pondRing(pond.center, pond.radiusM + 6)], paths: [path], points: [spot], spacingM: 16 });
    assert.deepEqual(again, trees);
    assert.ok(trees.length > 300, `assez d'arbres (${trees.length})`);
  });

  it("aucun arbre dans l'étang, sur le spot ou sur le chemin", () => {
    const ring = pondRing(pond.center, pond.radiusM);
    for (const t of trees) {
      assert.equal(pointInRing([t.lng, t.lat], ring), false);
      assert.ok(distanceM(spot, t) >= 16);
    }
    // Aucun arbre à moins de 7 m d'un sommet du chemin
    for (const [lng, lat] of path) assert.ok(trees.every((t) => distanceM({ lat, lng }, t) >= 7));
  });

  it("bosquets plus denses que les pelouses", () => {
    const [g] = makeGroves(bounds);
    const inside = trees.filter((t) => distanceM(g.center, t) < g.radiusM * 0.4).length;
    const areaInside = Math.PI * (g.radiusM * 0.4) ** 2;
    const total = (distanceM(bounds[0], { lat: bounds[0].lat, lng: bounds[1].lng }) * distanceM(bounds[0], { lat: bounds[1].lat, lng: bounds[0].lng }));
    assert.ok(inside / areaInside > trees.length / total, "densité du bosquet > densité moyenne");
  });

  it("zones vertes réelles : uniquement à l'intérieur", () => {
    const area = pondRing({ lat: 50.928, lng: 4.326 }, 120, "zone");
    const inArea = scatterTrees({ bounds, areas: [area], spacingM: 16 });
    assert.ok(inArea.length > 20);
    assert.ok(inArea.every((t) => pointInRing([t.lng, t.lat], area)));
  });

  it("3D : tronc + couronne arrondie (feuillu), tronc + 3 étages (conifère)", () => {
    const fc = treeExtrusions(
      [
        { lng: 4.32, lat: 50.93, radiusM: 5, heightM: 12, kind: "broadleaf", shade: 0 },
        { lng: 4.321, lat: 50.93, radiusM: 3, heightM: 15, kind: "conifer", shade: 1 },
      ],
      TREE_PALETTES.light,
    );
    assert.equal(fc.features.length, 7);
    const [trunk, crown, top] = fc.features;
    assert.equal(trunk.properties?.color, TREE_PALETTES.light.trunk);
    assert.equal(crown.properties?.base, trunk.properties?.height);
    assert.equal(top.properties?.base, crown.properties?.height);
    assert.equal(top.properties?.height, 12);
  });
});
