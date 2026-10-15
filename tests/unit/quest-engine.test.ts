import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SECRET_DU_SEQUOIA as Q } from "../../src/lib/quests/definitions";
import {
  arrive,
  completeStep,
  currentStepIndex,
  EMPTY_QUEST_STATE,
  earnedReward,
  questProgress,
  skipStep,
  stepPhase,
  type QuestResult,
  type QuestState,
} from "../../src/lib/quests/engine";

const ok = (r: QuestResult): QuestState => {
  assert.ok(r.ok, r.ok ? "" : r.error);
  return r.state;
};
const doStep = (s: QuestState, id: string) => ok(completeStep(Q, ok(arrive(Q, s, id, "manual")), id));

describe("Moteur de quête", () => {
  it("démarre sur l'étape 1, phase « arriver »", () => {
    assert.equal(currentStepIndex(Q, EMPTY_QUEST_STATE), 0);
    assert.equal(stepPhase(Q, EMPTY_QUEST_STATE, 0), "arrive");
    assert.equal(stepPhase(Q, EMPTY_QUEST_STATE, 1), "locked");
  });

  it("il faut arriver avant de réaliser l'activité", () => {
    assert.deepEqual(completeStep(Q, EMPTY_QUEST_STATE, "s1"), { ok: false, error: "NOT_ARRIVED" });
    const s = ok(arrive(Q, EMPTY_QUEST_STATE, "s1", "gps"));
    assert.equal(s.arrived.s1, "gps");
    assert.equal(stepPhase(Q, s, 0), "activity");
  });

  it("les étapes se font dans l'ordre", () => {
    assert.deepEqual(arrive(Q, EMPTY_QUEST_STATE, "s3", "manual"), { ok: false, error: "NOT_CURRENT" });
    assert.deepEqual(arrive(Q, EMPTY_QUEST_STATE, "zz", "manual"), { ok: false, error: "UNKNOWN_STEP" });
  });

  it("seule une étape facultative peut être passée, sans s'y rendre", () => {
    let s = ["s1", "s2", "s3", "s4"].reduce(doStep, EMPTY_QUEST_STATE);
    assert.deepEqual(skipStep(Q, EMPTY_QUEST_STATE, "s1"), { ok: false, error: "NOT_OPTIONAL" });
    s = ok(skipStep(Q, s, "s5"));
    assert.equal(stepPhase(Q, s, 4), "skipped");
    assert.equal(currentStepIndex(Q, s), 5);
  });

  it("récompense uniquement à la fin ; photo facultative non requise", () => {
    let s = ["s1", "s2", "s3", "s4"].reduce(doStep, EMPTY_QUEST_STATE);
    s = ok(skipStep(Q, s, "s5"));
    assert.equal(earnedReward(Q, s), null);
    s = doStep(s, "s6");
    const reward = earnedReward(Q, s);
    assert.deepEqual(reward, { type: "special_demo_egg", source: "secret-du-sequoia", status: "demo", tradable: false, sellable: false });
    assert.deepEqual(questProgress(Q, s), { settled: 6, total: 6, percent: 100, complete: true });
    assert.deepEqual(arrive(Q, s, "s6", "manual"), { ok: false, error: "FINISHED" });
  });

  it("arrivées par GPS, QR code ou confirmation manuelle", () => {
    const s = ok(arrive(Q, EMPTY_QUEST_STATE, "s1", "qr"));
    assert.equal(s.arrived.s1, "qr");
    // Arriver deux fois ne change rien
    assert.equal(ok(arrive(Q, s, "s1", "manual")).arrived.s1, "qr");
  });
});
