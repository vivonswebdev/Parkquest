import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ELEMENTS } from "../../src/lib/game-core/elements";
import { COLLECTION_SIZE, discoveriesLeft, eggCard, type GameState } from "../../src/lib/game-core/eggs";

const base: GameState = { activeEgg: null, reserve: [], collection: [], companion: null, firstLaunch: false };
const egg = (energy: number) => ({ id: "e", kind: "standard" as const, theme: "forest" as const, energy, required: 100 });

describe("Cœur du jeu : œufs", () => {
  it("7 éléments de départ, collection de 7", () => {
    assert.equal(ELEMENTS.length, 7);
    assert.equal(COLLECTION_SIZE, 7);
  });
  it("estimation en découvertes, jamais en distance", () => {
    assert.equal(discoveriesLeft(egg(64)), 2);
    assert.equal(discoveriesLeft(egg(99)), 1);
    assert.equal(discoveriesLeft(egg(100)), 0);
    assert.equal(discoveriesLeft(egg(0)), 5);
  });
  it("états de la carte d'accueil", () => {
    assert.deepEqual(eggCard({ ...base, firstLaunch: true }), { status: "first" });
    assert.deepEqual(eggCard({ ...base, activeEgg: egg(64) }), { status: "active", egg: egg(64), percent: 64, discoveries: 2 });
    assert.equal(eggCard({ ...base, activeEgg: egg(120) }).status, "ready");
    assert.deepEqual(eggCard({ ...base, reserve: [egg(0), egg(10)] }), { status: "choose", reserveCount: 2 });
    assert.deepEqual(eggCard(base), { status: "none" });
  });
});
