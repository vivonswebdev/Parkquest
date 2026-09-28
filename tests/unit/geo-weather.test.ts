import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { proximityTier } from "../../src/lib/game/rules";
import { distanceM } from "../../src/lib/geo";
import { movedSignificantly, quantize, rankNearby } from "../../src/lib/nearby";
import { demoForecast, localHourKey, parseOpenMeteo, summarizeVisit, weatherKind, type Forecast } from "../../src/lib/weather/weather";

describe("Paliers de proximité (découverte jamais automatique)", () => {
  it("précision ≤ 10 m et ≤ 25 m → « Vous êtes près de »", () => {
    assert.equal(proximityTier(12, 6, 35), "precise");
  });
  it("précision 10–25 m dans le rayon → « Vous semblez proche », confirmation", () => {
    assert.equal(proximityTier(20, 18, 35), "likely");
    assert.equal(proximityTier(30, 8, 35), "likely"); // précis mais > 25 m
  });
  it("précision > 25 m → jamais de validation GPS, confirmation manuelle", () => {
    assert.equal(proximityTier(10, 60, 35), "imprecise");
  });
  it("loin du spot → far", () => {
    assert.equal(proximityTier(300, 5, 35), "far");
    assert.equal(proximityTier(200, 60, 35), "far");
  });
});

describe("« Autour de vous »", () => {
  const origin = { lat: 50.92845, lng: 4.32505 };
  const items = [
    { id: "loin", kind: "spot" as const, location: { lat: 50.935, lng: 4.33 } },
    { id: "pres", kind: "spot" as const, location: { lat: 50.9285, lng: 4.3251 } },
    { id: "moyen", kind: "facility" as const, location: { lat: 50.9295, lng: 4.3262 } },
  ];

  it("trie par distance et filtre au rayon", () => {
    const r = rankNearby(items, origin, 500);
    assert.deepEqual(r.map((x) => x.item.id), ["pres", "moyen"]);
    assert.ok(r[0].minutes >= 1);
  });
  it("hors rayon : montre quand même les plus proches", () => {
    const r = rankNearby(items, { lat: 51.2, lng: 4.4 }, 500, 2);
    assert.equal(r.length, 2);
  });
  it("recalcul seulement après un déplacement significatif (~15 m)", () => {
    assert.equal(movedSignificantly(null, origin), true);
    assert.equal(movedSignificantly(origin, { lat: origin.lat + 0.00003, lng: origin.lng }), false); // ~3 m
    assert.equal(movedSignificantly(origin, { lat: origin.lat + 0.0003, lng: origin.lng }), true); // ~33 m
  });
  it("quantize : grille ~15 m, stable pour de petits mouvements", () => {
    const q = quantize(origin);
    assert.ok(distanceM(q, origin) < 15);
    assert.deepEqual(quantize({ lat: q.lat + 0.00001, lng: q.lng }), q);
  });
});

describe("Météo pendant la visite", () => {
  const fixture = {
    hourly: {
      time: ["2026-09-27T13:00", "2026-09-27T14:00", "2026-09-27T15:00", "2026-09-27T16:00"],
      temperature_2m: [18.2, 19, 17.5, 16],
      precipitation_probability: [10, 20, 70, 80],
      weather_code: [1, 2, 61, 63],
      wind_speed_10m: [12, 14, 22, 55],
      uv_index: [4, 3, 1, 0],
    },
  };

  it("codes WMO → catégories", () => {
    assert.equal(weatherKind(0), "clear");
    assert.equal(weatherKind(63), "rain");
    assert.equal(weatherKind(81), "showers");
    assert.equal(weatherKind(95), "storm");
  });
  it("parseOpenMeteo lit la réponse horaire et rejette le reste", () => {
    const f = parseOpenMeteo(fixture);
    assert.equal(f?.source, "open-meteo");
    assert.equal(f?.hours.length, 4);
    assert.deepEqual(f?.hours[2], { time: "2026-09-27T15:00", tempC: 17.5, precipProb: 70, code: 61, windKmh: 22, uv: 1 });
    assert.equal(parseOpenMeteo({ error: true }), null);
    assert.equal(parseOpenMeteo(null), null);
  });
  it("summarizeVisit : pluie annoncée, vent fort → conseils", () => {
    const s = summarizeVisit(parseOpenMeteo(fixture) as Forecast, "2026-09-27T14:00", 120);
    assert.ok(s);
    assert.equal(s.now.time, "2026-09-27T14:00");
    assert.equal(s.rainAt, "15:00");
    assert.equal(s.maxWindKmh, 55);
    assert.deepEqual(s.advice, ["rain", "wind"]);
  });
  it("summarizeVisit : beau temps → « nice » ; heure hors prévision → null", () => {
    const calm: Forecast = { source: "demo", hours: [{ time: "2026-06-01T10:00", tempC: 20, precipProb: 0, code: 0, windKmh: 8, uv: 3 }] };
    assert.deepEqual(summarizeVisit(calm, "2026-06-01T10:00")?.advice, ["nice"]);
    assert.equal(summarizeVisit(calm, "2026-06-02T10:00"), null);
  });
  it("demoForecast : 48 h déterministes, marquées comme démo", () => {
    const a = demoForecast("2026-09-27");
    assert.equal(a.source, "demo");
    assert.equal(a.hours.length, 48);
    assert.equal(a.hours[24].time, "2026-09-28T00:00");
    assert.deepEqual(a, demoForecast("2026-09-27"));
  });
  it("localHourKey : heure locale du parc", () => {
    assert.equal(localHourKey(new Date("2026-09-27T12:30:00Z"), "Europe/Brussels"), "2026-09-27T14:00");
  });
});
