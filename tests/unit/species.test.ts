import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeSpeciesPhotos, normalizeLicense, parseGbifMatch, parseGbifOccurrences, parseINatObservations, parseINatTaxon, queryableName } from "../../src/lib/species/parse";

const meise = { lat: 50.9276, lng: 4.3268 };

// Réponses représentatives des API publiques (valeurs fictives).
const inatObs = {
  total_results: 3,
  results: [
    { id: 11, uri: "https://www.inaturalist.org/observations/11", location: "50.93,4.33", place_guess: "Meise, BE", observed_on: "2025-05-02", user: { login: "anna_b", name: "Anna B." }, photos: [{ id: 101, url: "https://inaturalist-open-data.s3.amazonaws.com/photos/101/square.jpg", license_code: "cc-by" }] },
    { id: 12, uri: "https://www.inaturalist.org/observations/12", location: "37.5,-118.7", user: { login: "sierra" }, photos: [{ id: 102, url: "https://x/photos/102/square.jpeg", license_code: "cc-by-nc" }] },
    { id: 13, location: "36.4,-118.8", user: { login: "joe" }, photos: [{ id: 103, url: "https://x/photos/103/square.jpg", license_code: "cc0" }, { id: 104, url: "https://x/photos/104/square.jpg", license_code: "cc0" }] },
  ],
};

describe("Données d'espèces (iNaturalist, GBIF)", () => {
  it("licences libres uniquement (NC/ND/droits réservés exclues)", () => {
    assert.equal(normalizeLicense("cc-by"), "CC BY");
    assert.equal(normalizeLicense("cc-by-sa"), "CC BY-SA");
    assert.equal(normalizeLicense("cc0"), "CC0");
    assert.equal(normalizeLicense("http://creativecommons.org/licenses/by/4.0/"), "CC BY 4.0");
    assert.equal(normalizeLicense("http://creativecommons.org/publicdomain/zero/1.0/legalcode"), "CC0");
    for (const ko of ["cc-by-nc", "cc-by-nd", "cc-by-nc-sa", "http://creativecommons.org/licenses/by-nc/4.0/", null, "", "all rights reserved"]) {
      assert.equal(normalizeLicense(ko), null, String(ko));
    }
  });

  it("iNaturalist : photos libres, une par observation, tailles medium/large, distance au parc", () => {
    const p = parseINatObservations(inatObs, meise);
    assert.deepEqual(p.map((x) => x.id), ["inat-101", "inat-103"]);
    assert.equal(p[0].thumbUrl, "https://inaturalist-open-data.s3.amazonaws.com/photos/101/medium.jpg");
    assert.equal(p[0].url, "https://inaturalist-open-data.s3.amazonaws.com/photos/101/large.jpg");
    assert.equal(p[0].author, "Anna B.");
    assert.equal(p[0].license, "CC BY");
    assert.ok(p[0].distanceM! < 1000);
    assert.ok(p[1].distanceM! > 5_000_000);
    assert.equal(p[1].sourceUrl, "https://www.inaturalist.org/observations/13");
  });

  it("iNaturalist : fiche espèce (nom commun localisé, statut UICN)", () => {
    const t = parseINatTaxon(
      { results: [{ id: 1, name: "Other" }, { id: 48956, name: "Sequoiadendron giganteum", preferred_common_name: "Séquoia géant", observations_count: 12000, wikipedia_url: "https://fr.wikipedia.org/wiki/Sequoiadendron_giganteum", conservation_status: { status: "en" } }] },
      "Sequoiadendron giganteum",
    );
    assert.deepEqual(t, { commonName: "Séquoia géant", wikipediaUrl: "https://fr.wikipedia.org/wiki/Sequoiadendron_giganteum", observationsCount: 12000, iucn: "EN", inaturalistUrl: "https://www.inaturalist.org/taxa/48956" });
    assert.equal(parseINatTaxon({ results: [] }, "x"), null);
  });

  it("GBIF : correspondance fiable et occurrences avec photo libre", () => {
    assert.deepEqual(parseGbifMatch({ usageKey: 2684940, family: "Cupressaceae", matchType: "EXACT", confidence: 99 }), { usageKey: 2684940, family: "Cupressaceae" });
    assert.equal(parseGbifMatch({ usageKey: 1, matchType: "FUZZY", confidence: 40 }), null);
    const occ = parseGbifOccurrences(
      { results: [
        { key: 9, decimalLatitude: 50.9, decimalLongitude: 4.3, locality: "Meise", country: "Belgium", eventDate: "2024-06-01T10:00", media: [{ type: "StillImage", identifier: "https://img/9.jpg", license: "http://creativecommons.org/licenses/by-sa/4.0/", creator: "Jan" }] },
        { key: 8, media: [{ type: "StillImage", identifier: "https://img/8.jpg", license: "http://creativecommons.org/licenses/by-nc/4.0/" }] },
      ] },
      meise,
    );
    assert.equal(occ.length, 1);
    assert.equal(occ[0].license, "CC BY-SA 4.0");
    assert.equal(occ[0].place, "Meise, Belgium");
    assert.equal(occ[0].observedOn, "2024-06-01");
  });

  it("fusion : photos proches du parc d'abord, sans doublon", () => {
    const a = parseINatObservations(inatObs, meise);
    const merged = mergeSpeciesPhotos([a, a], 12);
    assert.equal(merged.length, 2);
    assert.equal(merged[0].id, "inat-101");
  });

  it("nom interrogeable", () => {
    assert.equal(queryableName("Fagus sylvatica f. purpurea"), "Fagus sylvatica");
    assert.equal(queryableName("Phyllostachys sp."), "Phyllostachys");
    assert.equal(queryableName("Magnolia × soulangeana"), "Magnolia × soulangeana");
  });
});
