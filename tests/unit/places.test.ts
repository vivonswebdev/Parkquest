import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PARK_MEDIA, PARK_PLACES, PARK_PROFILES, placesRepo } from "../../src/lib/places/data";
import { effectiveStatus, isDisplayableMedia, needsParkValidation, placePhoto } from "../../src/lib/places/rules";
import type { ParkMedia } from "../../src/lib/places/types";

const src = { label: "x", url: "https://example.org" };

describe("Parcs multiples : statuts et médias", () => {
  it("park_verified / published exigent une source et une validation nommée", () => {
    assert.equal(effectiveStatus({ status: "park_verified" }), "demo");
    assert.equal(effectiveStatus({ status: "published", source: src }), "demo");
    assert.equal(effectiveStatus({ status: "park_verified", source: src, verifiedBy: "Équipe du parc" }), "park_verified");
    assert.equal(effectiveStatus({ status: "proposed" }), "proposed");
    assert.equal(needsParkValidation({ status: "demo" }), true);
    assert.equal(needsParkValidation({ status: "park_verified", source: src, verifiedBy: "Parc" }), false);
  });

  it("une image n'est publiée que vérifiée, sous licence libre, créditée", () => {
    const base: ParkMedia = { id: "m", parkSlug: "p", kind: "place_photo", sourceUrl: "https://commons.wikimedia.org/wiki/File:a.jpg", usageStatus: "approved", url: "https://upload.wikimedia.org/a.jpg", license: "CC BY-SA 4.0", author: "Auteur" };
    assert.equal(isDisplayableMedia(base), true);
    assert.equal(isDisplayableMedia({ ...base, usageStatus: "to_verify" }), false);
    assert.equal(isDisplayableMedia({ ...base, license: "CC BY-NC 4.0" }), false);
    assert.equal(isDisplayableMedia({ ...base, license: undefined }), false);
    assert.equal(isDisplayableMedia({ ...base, author: undefined, attribution: undefined }), false);
    assert.equal(isDisplayableMedia({ ...base, url: undefined }), false);
  });

  it("photo du lieu ≠ photo d'espèce", () => {
    const species: ParkMedia = { id: "s", parkSlug: "p", placeSlug: "a", kind: "species_photo", sourceUrl: "x", url: "u", usageStatus: "approved", license: "CC0", author: "A" };
    assert.equal(placePhoto([species], { parkSlug: "p", slug: "a" }), undefined);
    assert.equal(placePhoto([{ ...species, kind: "place_photo" }], { parkSlug: "p", slug: "a" })?.id, "s");
  });

  it("données locales : 3 parcs belges, rien de présenté comme vérifié, photos candidates non publiées", () => {
    assert.deepEqual(PARK_PROFILES.map((p) => p.parkSlug).sort(), ["dendermonde-vallee-escaut", "domaine-solvay-la-hulpe", "plantentuin-meise"]);
    for (const x of [...PARK_PROFILES.flatMap((p) => p.features), ...PARK_PLACES]) assert.ok(needsParkValidation(x));
    assert.ok(PARK_MEDIA.length > 0 && PARK_MEDIA.every((m) => !isDisplayableMedia(m)));
    assert.equal(placesRepo.listPlaces("dendermonde-vallee-escaut").length, 0);
  });
});
