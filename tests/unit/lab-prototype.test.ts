import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CREATURES, RARITY } from "../../src/features/lab/creatures";
import { applyAction, collected, companionOf, INITIAL_STATE, nextEvolution, parseState, sanitizeName, stageOf, type LabState } from "../../src/features/lab/state";

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
    assert.deepEqual([...collected(hatched)], ["leaf"]);
    assert.ok(collected(applyAction(hatched, "dusk")).has("lunar"));
    // Mêmes conditions qu'avant, réattribuées aux sept familles
    assert.ok(collected({ ...hatched, steps: 3 }).has("flower"));
    assert.ok(collected({ ...hatched, parks: 2 }).has("air"));
    assert.ok(collected({ ...hatched, adventures: 2 }).has("forest"));
    assert.ok(collected({ ...hatched, adventures: 4, parks: 4 }).has("solar"));
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

describe("laboratoire de design : sept familles", () => {
  it("identifiants techniques indépendants des noms affichés", () => {
    assert.deepEqual(
      CREATURES.map((c) => c.id),
      ["leaf", "water", "flower", "air", "forest", "lunar", "solar"],
    );
    assert.deepEqual(
      CREATURES.map((c) => c.name),
      ["Mossy", "Perline", "Floréa", "Zéphyr", "Mycélio", "Lumo", "Soléa"],
    );
  });

  it("chaque œuf de départ révèle le bon compagnon (Feuille et Forêt restent distinctes)", () => {
    assert.equal(companionOf({ egg: "forest" }), "leaf");
    assert.equal(companionOf({ egg: "river" }), "water");
    assert.equal(companionOf({ egg: "dusk" }), "lunar");
  });
});
