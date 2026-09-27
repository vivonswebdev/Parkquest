import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unlockedBadgeKeys } from "../../src/features/demo/demo-badges";
import { demoBaselineProgress, demoData, demoGeo } from "../../src/features/demo/demo-data";
import { distanceM } from "../../src/lib/geo";
import { pickTranslation } from "../../src/lib/i18n-content";
import { recommendTrail } from "../../src/lib/plan";

describe("Données de démonstration", () => {
  it("contient le parc pilote, le parcours de 6 spots, services, quiz, défis, badges", () => {
    const meise = demoData.parks.find((p) => p.slug === "plantentuin-meise");
    assert.ok(meise?.isDemoData, "Meise doit être marqué comme donnée de démo");
    const trail = demoData.trails.find((t) => t.slug === "arbres-remarquables");
    assert.equal(trail?.spotIds.length, 6);
    assert.ok(demoData.facilities.length >= 10);
    assert.ok(demoData.quizzes.length >= 3);
    assert.ok(demoData.challenges.length >= 3);
    assert.ok(demoData.badges.length >= 6);
    assert.ok(meise?.practicalInfo?.openingHours.length);
  });

  it("chaque quiz a exactement une bonne réponse", () => {
    for (const q of demoData.quizzes) assert.equal(q.answers.filter((a) => a.isCorrect).length, 1, q.id);
  });

  it("les spots sont dans l'emprise du parc et traduits en FR/NL/EN", () => {
    const meise = demoData.parks[0];
    for (const s of demoData.spots) {
      assert.ok(s.location.lat >= meise.bounds[0].lat && s.location.lat <= meise.bounds[1].lat, s.slug);
      for (const l of ["fr", "nl", "en"]) assert.ok(s.translations[l]?.name, `${s.slug} ${l}`);
    }
  });

  it("aucun secret ni clé dans les données de démo", () => {
    const text = JSON.stringify(demoData);
    assert.doesNotMatch(text, /(sk_|pk\.ey|service_role|eyJhbGci)/);
  });

  it("l'entrée simulée est à quelques centaines de mètres du premier spot", () => {
    const first = demoData.spots[0];
    const d = distanceM(demoGeo.entrance, first.location);
    assert.ok(d > 50 && d < 400, `${d} m`);
  });
});

describe("Progression simulée", () => {
  it("l'historique fictif débloque « Premier pas » et pas « Explorateur »", () => {
    const keys = unlockedBadgeKeys(demoBaselineProgress, demoData.badges);
    assert.ok(keys.includes("premier-pas"));
    assert.ok(!keys.includes("explorateur"));
  });

  it("10 spots découverts débloquent « Explorateur »", () => {
    const p = { ...demoBaselineProgress, discovered: demoData.spots.slice(0, 10).map((s) => s.id) };
    assert.ok(unlockedBadgeKeys(p, demoData.badges).includes("explorateur"));
  });
});

describe("Traductions et planification", () => {
  it("repli langue demandée → anglais → langue du parc", () => {
    assert.equal(pickTranslation({ fr: "a", en: "b" }, "es")?.locale, "en");
    assert.equal(pickTranslation({ nl: "c" }, "es", "nl")?.value, "c");
  });

  it("recommande le parcours adapté à une famille avec 1 heure", () => {
    const trails = demoData.trails.map((t) => ({ ...t, name: t.slug, contentLocale: "fr", spotCount: t.spotIds.length }));
    const r = recommendTrail(trails, { minutes: 60, audience: "FAMILY", interests: ["TREES"] });
    assert.equal(r?.trail.slug, "arbres-remarquables");
    assert.ok(r?.fitsTime && r.audienceMatch);
  });
});
