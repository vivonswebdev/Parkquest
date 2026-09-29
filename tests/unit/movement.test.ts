import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addFix, MVP_CLASS_CANDIDATES, mvpTravelClass, cardinal, etaMinutes, initialMovement, resumeMovement, speedKmh, type Fix } from "../../src/lib/movement";

// ~1,1 m par 0,00001° de latitude
const at = (dLatM: number, t: number, accuracy = 5): Fix => ({ lat: 50.93 + dLatM / 111_195, lng: 4.33, accuracy, t: t * 1000 });
const run = (fixes: Fix[]) => fixes.reduce(addFix, initialMovement());

describe("Tableau de déplacement", () => {
  it("cumule la distance et lisse la vitesse (marche vers le nord)", () => {
    const s = run([at(0, 0), at(10, 8), at(20, 16), at(30, 24)]);
    assert.ok(Math.abs(s.distanceM - 30) < 0.5);
    assert.ok(s.speedMps !== null && Math.abs(s.speedMps - 1.25) < 0.05);
    assert.equal(cardinal(s.headingDeg ?? -1), "N");
  });

  it("ignore les relevés imprécis", () => {
    const s = run([at(0, 0), at(50, 10, 45), at(10, 20)]);
    assert.ok(Math.abs(s.distanceM - 10) < 0.5);
  });

  it("ignore le bruit GPS à l'arrêt et fait retomber la vitesse", () => {
    let s = run([at(0, 0), at(10, 8)]);
    for (let i = 1; i <= 12; i++) s = addFix(s, at(10 + (i % 2), 8 + i * 6));
    assert.ok(Math.abs(s.distanceM - 10) < 0.5);
    assert.equal(s.speedMps, 0);
  });

  it("un saut GPS n'est pas compté comme distance parcourue", () => {
    const s = run([at(0, 0), at(300, 5), at(310, 13)]);
    assert.ok(Math.abs(s.distanceM - 10) < 0.5);
  });

  it("reprise après pause : l'intervalle n'est pas compté", () => {
    const paused = resumeMovement(run([at(0, 0), at(10, 8)]));
    const s = [at(200, 600), at(210, 608)].reduce(addFix, paused);
    assert.ok(Math.abs(s.distanceM - 20) < 0.5);
  });

  it("temps restant : allure de marche à l'arrêt, au moins 1 min", () => {
    assert.equal(etaMinutes(450, null), 6);
    assert.equal(etaMinutes(450, 0.1), 6);
    assert.equal(etaMinutes(450, 1.5), 5);
    assert.equal(etaMinutes(10, null), 1);
  });

  it("points cardinaux et km/h", () => {
    assert.deepEqual([0, 44, 90, 180, 225, 350].map(cardinal), ["N", "NE", "E", "S", "SW", "N"]);
    assert.equal(speedKmh(1.25), 4.5);
  });
});

describe("Précision de la distance et déplacement rapide", () => {
  it("GPS moins précis : les petits écarts (bruit) ne comptent pas", () => {
    // Précision 20 m : des écarts de 8 m sont du bruit, pas des pas.
    let s = run([at(0, 0, 20)]);
    for (let i = 1; i <= 10; i++) s = addFix(s, at(i % 2 ? 8 : 0, i * 5, 20));
    assert.equal(s.distanceM, 0);
  });

  it("marche réelle avec GPS moyen : la distance finit par compter", () => {
    let s = run([at(0, 0, 20)]);
    for (let i = 1; i <= 10; i++) s = addFix(s, at(i * 6, i * 5, 20));
    assert.ok(s.distanceM >= 48 && s.distanceM <= 61, `distance ${s.distanceM}`);
  });

  it("vitesse soutenue > 25 km/h → suivi en pause, distance non comptée", () => {
    let s = run([at(0, 0)]);
    for (let i = 1; i <= 10; i++) s = addFix(s, at(i * 28, i * 2)); // 14 m/s ≈ 50 km/h
    assert.equal(s.fastTravel, true);
    assert.equal(s.distanceM, 0);
  });

  it("un saut GPS isolé ne met pas le suivi en pause", () => {
    const s = run([at(0, 0), at(300, 5), at(310, 13), at(320, 21)]);
    assert.equal(s.fastTravel, false);
  });

  it("allure lente (ou arrêt) soutenue → reprise du suivi", () => {
    let s = run([at(0, 0)]);
    for (let i = 1; i <= 10; i++) s = addFix(s, at(i * 28, i * 2));
    assert.equal(s.fastTravel, true);
    const base = 280;
    for (let i = 1; i <= 6; i++) s = addFix(s, at(base + i * 6, 20 + i * 5));
    assert.equal(s.fastTravel, false);
    // La distance à pied recompte après la sortie
    s = addFix(s, at(base + 42, 55));
    assert.ok(s.distanceM > 0);
  });

  it("vélo tranquille (~15 km/h) : suivi non interrompu", () => {
    let s = run([at(0, 0)]);
    for (let i = 1; i <= 15; i++) s = addFix(s, at(i * 8.3, i * 2));
    assert.equal(s.fastTravel, false);
    assert.ok(s.distanceM > 100);
  });
});

describe("Modes de déplacement (architecture future)", () => {
  it("MVP : lent, rapide ou GPS imprécis ; vélo et équitation jamais rangés avec la voiture seule", () => {
    const slow = run([at(0, 0), at(10, 8)]);
    assert.equal(mvpTravelClass(slow, 6), "slow");
    assert.equal(mvpTravelClass(slow, 60), "gps_imprecise");
    let fast = run([at(0, 0)]);
    for (let i = 1; i <= 10; i++) fast = addFix(fast, at(i * 28, i * 2));
    assert.equal(mvpTravelClass(fast, 6), "fast");
    assert.ok(MVP_CLASS_CANDIDATES.slow.includes("horse") && MVP_CLASS_CANDIDATES.slow.includes("bike"));
  });
});
