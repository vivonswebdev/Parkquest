import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { segmentVariant, STEP_SYMBOL, trailRemaining, trailStepStates } from "../../src/lib/game/trail-progress";

const ids = ["a", "b", "c", "d", "e", "f"];
const sym = (s: string[]) => s.map((x) => STEP_SYMBOL[x as keyof typeof STEP_SYMBOL]).join(" ");

describe("Progression du parcours", () => {
  it("en route vers l'étape 3 : ✓ ✓ ◉ ○ ○ ○", () => {
    assert.equal(sym(trailStepStates(ids, new Set(["a", "b"]), 2)), "✓ ✓ ◉ ○ ○ ○");
  });
  it("étape 3 découverte : ✓ ✓ ● ◉ ○ ○", () => {
    assert.equal(sym(trailStepStates(ids, new Set(["a", "b", "c"]), 2)), "✓ ✓ ● ◉ ○ ○");
  });
  it("étape sautée puis revenue : la prochaine non découverte reprend depuis le début", () => {
    assert.equal(sym(trailStepStates(ids, new Set(["b", "c", "d", "e", "f"]), 5)), "◉ ✓ ✓ ✓ ✓ ●");
  });
  it("tout découvert : dernière étape en cours, aucune suivante", () => {
    assert.equal(sym(trailStepStates(ids, new Set(ids), 5)), "✓ ✓ ✓ ✓ ✓ ●");
  });
  it("départ : ◉ ○ ○ ○ ○ ○", () => {
    assert.equal(sym(trailStepStates(ids, new Set(), 0)), "◉ ○ ○ ○ ○ ○");
  });

  it("restant : distance, durée, points, pourcentage", () => {
    const spots = ids.map((id) => ({ id, pointsValue: 10 }));
    // Segments de ~111 m (0,001° de latitude)
    const segments = ids.map((id, i) => ({ toSpotId: id, path: [[4.3, 50.9 + i * 0.001], [4.3, 50.901 + i * 0.001]] as [number, number][] }));
    const r = trailRemaining(spots, segments, new Set(["a", "b"]), 20);
    assert.equal(r.found, 2);
    assert.equal(r.total, 6);
    assert.ok(r.distanceM > 430 && r.distanceM < 460, String(r.distanceM));
    assert.equal(r.minutes, Math.round(r.distanceM / 75));
    assert.equal(r.points, 4 * 10 + 20);
    assert.equal(r.percent, 33);
    const done = trailRemaining(spots, segments, new Set(ids), 20);
    assert.deepEqual([done.distanceM, done.minutes, done.points, done.percent], [0, 0, 0, 100]);
  });

  it("tracé : terminé, actif (vers le prochain objectif), futur", () => {
    assert.equal(segmentVariant("done"), "done");
    assert.equal(segmentVariant("current"), "done");
    assert.equal(segmentVariant("next"), "active");
    assert.equal(segmentVariant("future"), "trail");
  });
});
