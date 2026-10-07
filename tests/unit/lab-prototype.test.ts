import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CREATURES, RARITY } from "../../src/features/lab/creatures";
import { applyAction, collected, INITIAL_STATE, nextEvolution, parseState, sanitizeName, stageOf, type LabState } from "../../src/features/lab/state";

const hatched: LabState = { ...INITIAL_STATE, discoveries: 1, hatched: true };
const repeat = (s: LabState, a: Parameters<typeof applyAction>[1], n: number) => Array.from({ length: n }).reduce<LabState>((acc) => applyAction(acc, a), s);

describe("laboratoire de design : compagnon évolutif", () => {
  it("évolue seulement avec des actions d'exploration, dans l'ordre annoncé", () => {
    assert.equal(stageOf(INITIAL_STATE), "egg");
    assert.equal(stageOf(hatched), "young");
    const twoAdventures = repeat(hatched, "step", 8);
    assert.equal(twoAdventures.adventures, 2);
    assert.equal(stageOf(twoAdventures), "explorer");
    const fourParks = repeat(hatched, "step", 16);
    assert.equal(stageOf(fourParks), "guardian");
    assert.equal(stageOf(applyAction(fourParks, "dusk")), "lunar");
    assert.equal(nextEvolution(applyAction(fourParks, "dusk")), null);
  });

  it("affiche une condition chiffrée pour la prochaine évolution", () => {
    assert.deepEqual(nextEvolution({ ...hatched, adventures: 1 }), { label: "Terminer 2 aventures", current: 1, target: 2, unit: "aventure" });
  });

  it("collection : chaque gardien a une condition écrite et une rareté nommée", () => {
    assert.equal(CREATURES.length, 7);
    for (const c of CREATURES) {
      assert.ok(c.unlock.length > 5);
      assert.ok(RARITY[c.rarity].label);
    }
    assert.deepEqual([...collected(hatched)], ["mossy"]);
    assert.ok(collected(applyAction(hatched, "dusk")).has("lumo"));
  });

  it("relit l'état local prudemment", () => {
    assert.deepEqual(parseState("{oups"), INITIAL_STATE);
    const s = parseState(JSON.stringify({ name: " <Lina> ", egg: "volcan", discoveries: -3, steps: 1e9 }));
    assert.equal(s.name, "Lina");
    assert.equal(s.egg, "forest");
    assert.equal(s.discoveries, 0);
    assert.equal(s.steps, 99);
    assert.equal(sanitizeName("a".repeat(40)).length, 24);
  });
});
