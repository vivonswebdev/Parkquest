import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addFavorite, favoritesOfPark, isFavorite, MAX_FAVORITES, parseFavorites, removeFavorite, toggleFavorite } from "../../src/lib/favorites";
import { boundaryState, convexHull, distanceToRingM, nextLeaveAlert, parkBoundary } from "../../src/lib/map/boundary";
import { pointInRing } from "../../src/lib/map/nature";

const spots = [
  { lat: 50.925, lng: 4.32 },
  { lat: 50.93, lng: 4.321 },
  { lat: 50.931, lng: 4.332 },
  { lat: 50.926, lng: 4.333 },
  { lat: 50.928, lng: 4.326 }, // intérieur
];

describe("Limite approximative du parc", () => {
  it("enveloppe convexe : les points intérieurs sont écartés", () => {
    const hull = convexHull(spots.map((p) => [p.lng, p.lat]));
    assert.equal(hull.length, 4);
  });

  it("zone élargie : contient tous les lieux, avec une marge", () => {
    const ring = parkBoundary(spots)!;
    assert.deepEqual(ring[0], ring[ring.length - 1]);
    for (const p of spots) assert.ok(pointInRing([p.lng, p.lat], ring));
    // Un coin du parc est à ~60 m du bord élargi
    const d = distanceToRingM(spots[0], ring);
    assert.ok(d > 40 && d < 80, `marge ${d}`);
  });

  it("pas de zone avec moins de 3 points distincts", () => {
    assert.equal(parkBoundary([spots[0], spots[0]]), null);
  });

  it("état : dedans, dehors certain, ou inconnu (GPS imprécis, bord de zone)", () => {
    const ring = parkBoundary(spots)!;
    assert.equal(boundaryState({ ...spots[4], accuracy: 8 }, ring), "inside");
    const far = { lat: 50.94, lng: 4.326, accuracy: 8 }; // ~1 km au nord
    assert.equal(boundaryState(far, ring), "outside");
    assert.equal(boundaryState({ ...far, accuracy: 60 }, ring), "unknown");
    assert.equal(boundaryState(far, null), "unknown");
  });

  it("alerte : confirmée après 2 positions dehors, réarmée au retour", () => {
    let s = { outsideCount: 0, alerted: false };
    s = nextLeaveAlert(s, "outside");
    assert.equal(s.alerted, false);
    s = nextLeaveAlert(s, "unknown");
    s = nextLeaveAlert(s, "outside");
    assert.equal(s.alerted, true);
    s = nextLeaveAlert(s, "inside");
    assert.deepEqual(s, { outsideCount: 0, alerted: false });
  });
});

describe("Favoris (sur l'appareil)", () => {
  const spot = { parkSlug: "plantentuin-meise", kind: "spot" as const, refId: "s1", name: "Séquoia géant", location: { lat: 50.9271234567, lng: 4.3254321 } };

  it("ajout, doublon ignoré, arrondi de la position", () => {
    let list = addFavorite([], spot, 1);
    list = addFavorite(list, spot, 2);
    assert.equal(list.length, 1);
    assert.equal(list[0].location.lat, 50.927123);
    assert.ok(isFavorite(list, "plantentuin-meise", "s1"));
  });

  it("bascule et suppression", () => {
    let list = toggleFavorite([], spot, 1);
    assert.equal(list.length, 1);
    list = toggleFavorite(list, spot, 2);
    assert.equal(list.length, 0);
    const point = addFavorite([], { parkSlug: "p", kind: "point", name: "  Mon banc  ", location: { lat: 1, lng: 2 } }, 3);
    assert.equal(point[0].name, "Mon banc");
    assert.equal(removeFavorite(point, point[0].id).length, 0);
  });

  it("par parc, plafond, lecture tolérante", () => {
    let list = addFavorite([], spot, 1);
    list = addFavorite(list, { ...spot, parkSlug: "autre", refId: "x" }, 2);
    assert.equal(favoritesOfPark(list, "autre").length, 1);
    let many = list;
    for (let i = 0; i < MAX_FAVORITES + 5; i++) many = addFavorite(many, { parkSlug: "p", kind: "point", name: `P${i}`, location: { lat: 1, lng: 1 } }, 10 + i);
    assert.equal(many.length, MAX_FAVORITES);
    assert.deepEqual(parseFavorites("pas du json"), []);
    assert.deepEqual(parseFavorites('{"a":1}'), []);
    assert.equal(parseFavorites(JSON.stringify(list)).length, 2);
  });
});
