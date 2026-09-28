import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitWithin, validatePhotoFile } from "../../src/lib/photos/prepare";

describe("Photos proposées par les visiteurs", () => {
  it("accepte JPEG, PNG, WebP, HEIC ; refuse le reste", () => {
    assert.equal(validatePhotoFile({ type: "image/jpeg", size: 2_000_000 }), null);
    assert.equal(validatePhotoFile({ type: "image/HEIC", size: 2_000_000 }), null);
    assert.equal(validatePhotoFile({ type: "image/gif", size: 2_000_000 }), "TYPE");
    assert.equal(validatePhotoFile({ type: "video/mp4", size: 2_000_000 }), "TYPE");
  });
  it("refuse un fichier vide ou trop lourd", () => {
    assert.equal(validatePhotoFile({ type: "image/jpeg", size: 0 }), "EMPTY");
    assert.equal(validatePhotoFile({ type: "image/jpeg", size: 30 * 1024 * 1024 }), "TOO_LARGE");
  });
  it("redimensionne côté long ≤ 1600 px sans déformer ni agrandir", () => {
    assert.deepEqual(fitWithin(4032, 3024, 1600), { width: 1600, height: 1200 });
    assert.deepEqual(fitWithin(3024, 4032, 1600), { width: 1200, height: 1600 });
    assert.deepEqual(fitWithin(1000, 800, 1600), { width: 1000, height: 800 });
  });
});
