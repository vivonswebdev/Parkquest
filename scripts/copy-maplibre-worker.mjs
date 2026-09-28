// Copie le worker MapLibre GL (et son module partagé) dans public/vendor/maplibre/.
// Nécessaire car le worker est chargé par URL : les bundlers ne le suivent pas.
// Exécuté automatiquement après `npm install` (postinstall).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "maplibre-gl", "dist");
const out = join(root, "public", "vendor", "maplibre");
if (!existsSync(src)) {
  console.warn("maplibre-gl absent : copie du worker ignorée.");
  process.exit(0);
}
mkdirSync(out, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(join(src, f), join(out, f));
console.log("Worker MapLibre copié dans public/vendor/maplibre/");
