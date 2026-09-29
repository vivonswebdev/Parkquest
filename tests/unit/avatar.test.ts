import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_AVATAR_DATA_URL, parseAvatar, squareCrop } from "../../src/lib/avatar";

describe("Avatar du profil (sur l'appareil)", () => {
  it("recadrage carré centré", () => {
    assert.deepEqual(squareCrop(4000, 3000), { sx: 500, sy: 0, side: 3000 });
    assert.deepEqual(squareCrop(1080, 1920), { sx: 0, sy: 420, side: 1080 });
  });

  it("lecture : emblème connu, photo JPEG raisonnable", () => {
    assert.deepEqual(parseAvatar('{"kind":"preset","preset":"moon"}'), { kind: "preset", preset: "moon" });
    const photo = { kind: "photo", dataUrl: "data:image/jpeg;base64,AAAA" };
    assert.deepEqual(parseAvatar(JSON.stringify(photo)), photo);
  });

  it("lecture tolérante : inconnu, corrompu, autre format ou trop lourd → aucun avatar", () => {
    assert.equal(parseAvatar(null), null);
    assert.equal(parseAvatar("pas du json"), null);
    assert.equal(parseAvatar('{"kind":"preset","preset":"dragon"}'), null);
    assert.equal(parseAvatar('{"kind":"photo","dataUrl":"https://exemple.org/a.jpg"}'), null);
    assert.equal(parseAvatar(JSON.stringify({ kind: "photo", dataUrl: "data:image/jpeg;base64," + "A".repeat(MAX_AVATAR_DATA_URL) })), null);
  });
});

describe("Avatar par défaut", () => {
  it("emblème Feuille (après suppression de la photo ou sans choix)", async () => {
    const { DEFAULT_AVATAR } = await import("../../src/lib/avatar");
    assert.deepEqual(DEFAULT_AVATAR, { kind: "preset", preset: "leaf" });
  });
});
