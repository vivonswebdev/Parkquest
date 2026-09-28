import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commonsSearchUrl, isFreeLicense, parseCommonsResponse, stripHtml } from "../../src/lib/photos/wikimedia";

// Réponse représentative de l'API Commons (formatversion=2), données fictives.
const fixture = {
  query: {
    pages: [
      {
        title: "File:Libre.jpg",
        index: 2,
        imageinfo: [{ width: 4000, height: 3000, mime: "image/jpeg", thumburl: "https://upload.example/thumb/1600px-Libre.jpg", thumbwidth: 1600, thumbheight: 1200, url: "https://upload.example/Libre.jpg", descriptionurl: "https://commons.example/wiki/File:Libre.jpg", extmetadata: { LicenseShortName: { value: "CC BY-SA 4.0" }, Artist: { value: '<a href="//x">Jeanne&nbsp;Dupont</a>' } } }],
      },
      {
        title: "File:NonCommercial.jpg",
        index: 1,
        imageinfo: [{ width: 4000, height: 3000, mime: "image/jpeg", url: "https://upload.example/nc.jpg", descriptionurl: "https://commons.example/wiki/File:NonCommercial.jpg", extmetadata: { LicenseShortName: { value: "CC BY-NC 2.0" } } }],
      },
      {
        title: "File:Petite.jpg",
        index: 3,
        imageinfo: [{ width: 640, height: 480, mime: "image/jpeg", url: "https://upload.example/p.jpg", descriptionurl: "https://commons.example/wiki/File:Petite.jpg", extmetadata: { LicenseShortName: { value: "CC0" } } }],
      },
      {
        title: "File:Domaine.png",
        index: 4,
        imageinfo: [{ width: 2000, height: 1500, mime: "image/png", url: "https://upload.example/d.png", descriptionurl: "https://commons.example/wiki/File:Domaine.png", extmetadata: { LicenseShortName: { value: "Public domain" } } }],
      },
    ],
  },
};

describe("Photos libres Wikimedia Commons", () => {
  it("licences : libres acceptées, NC/ND et inconnues refusées", () => {
    for (const ok of ["CC0", "Public domain", "CC BY 4.0", "CC BY-SA 3.0", "cc by-sa 2.5"]) assert.equal(isFreeLicense(ok), true, ok);
    for (const ko of ["CC BY-NC 2.0", "CC BY-ND 4.0", "CC BY-NC-SA 4.0", "GFDL", "All rights reserved", undefined]) assert.equal(isFreeLicense(ko), false, String(ko));
  });

  it("crédit auteur sans HTML", () => {
    assert.equal(stripHtml('<a href="//x">Jeanne&nbsp;Dupont</a> &amp; <b>Co</b>'), "Jeanne Dupont & Co");
  });

  it("garde les images libres et assez grandes, dans l'ordre de pertinence", () => {
    const c = parseCommonsResponse(fixture);
    assert.deepEqual(c.map((x) => x.title), ["Libre.jpg", "Domaine.png"]);
    assert.deepEqual(c[0], {
      title: "Libre.jpg",
      pageUrl: "https://commons.example/wiki/File:Libre.jpg",
      imageUrl: "https://upload.example/thumb/1600px-Libre.jpg",
      width: 1600,
      height: 1200,
      license: "CC BY-SA 4.0",
      author: "Jeanne Dupont",
    });
    assert.deepEqual(parseCommonsResponse({}), []);
  });

  it("recherche par nom scientifique (forme et « sp. » retirées)", () => {
    const u = new URL(commonsSearchUrl("Fagus sylvatica f. purpurea"));
    assert.equal(u.searchParams.get("gsrsearch"), '"Fagus sylvatica" filetype:bitmap');
    assert.equal(new URL(commonsSearchUrl("Phyllostachys sp.")).searchParams.get("gsrsearch"), '"Phyllostachys" filetype:bitmap');
    assert.equal(u.searchParams.get("gsrnamespace"), "6");
  });
});
