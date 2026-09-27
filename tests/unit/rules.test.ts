import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { challengeOutcome, evaluateDiscovery, quizPoints, trailCompletionPoints } from "../../src/lib/game/rules";

const spot = { lat: 50.92845, lng: 4.32505 };

describe("Découverte d'un spot (règles GPS)", () => {
  it("GPS précis et proche → validation GPS, points pleins", () => {
    const r = evaluateDiscovery({ spotLocation: spot, radiusM: 35, pointsValue: 10, inVisit: true, position: { lat: 50.92851, lng: 4.32509, accuracyM: 6 } });
    assert.equal(r.status, "DISCOVERED");
    assert.equal(r.status === "DISCOVERED" && r.method, "GPS_VERIFIED");
    assert.equal(r.points, 10);
  });

  it("précision insuffisante (60 m) → pas de validation GPS, demi-points en visite", () => {
    const r = evaluateDiscovery({ spotLocation: spot, radiusM: 35, pointsValue: 10, inVisit: true, position: { lat: 50.92851, lng: 4.32509, accuracyM: 60 } });
    assert.equal(r.status === "DISCOVERED" && r.method, "SELF_DECLARED");
    assert.equal(r.points, 5);
  });

  it("sans GPS, hors visite → collection mais 0 point", () => {
    const r = evaluateDiscovery({ spotLocation: spot, radiusM: 35, pointsValue: 10, inVisit: false });
    assert.equal(r.status === "DISCOVERED" && r.method, "SELF_DECLARED");
    assert.equal(r.points, 0);
  });

  it("GPS fiable mais à plus de 250 m → refus", () => {
    const r = evaluateDiscovery({ spotLocation: spot, radiusM: 35, pointsValue: 10, inVisit: true, position: { lat: 50.94, lng: 4.34, accuracyM: 5 } });
    assert.equal(r.status, "TOO_FAR");
    assert.equal(r.points, 0);
  });
});

describe("Quiz, défis, parcours", () => {
  it("points de quiz seulement au premier essai correct", () => {
    assert.equal(quizPoints(true, true, 10), 10);
    assert.equal(quizPoints(true, false, 10), 0);
    assert.equal(quizPoints(false, true, 10), 0);
  });

  it("défi photo : photo obligatoire puis modération", () => {
    assert.deepEqual(challengeOutcome(true, false, 20), { error: "PHOTO_REQUIRED" });
    assert.deepEqual(challengeOutcome(true, true, 20), { status: "PENDING", points: 0 });
    assert.deepEqual(challengeOutcome(false, false, 20), { status: "APPROVED", points: 20 });
  });

  it("parcours terminé seulement si tous les spots sont découverts", () => {
    assert.deepEqual(trailCompletionPoints(6, 6, 20), { completed: true, points: 20 });
    assert.deepEqual(trailCompletionPoints(5, 6, 20), { completed: false, points: 0 });
  });
});
