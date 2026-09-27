/** Vérifie que les 5 fichiers de messages ont exactement les mêmes clés que fr.json. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const LOCALES = ["fr", "nl", "en", "es", "de"];
const load = (l: string) => JSON.parse(readFileSync(resolve(__dirname, `../messages/${l}.json`), "utf8"));
const keys = (o: Record<string, unknown>, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));

const ref = new Set(keys(load("fr")));
let ok = true;
for (const l of LOCALES.slice(1)) {
  const ks = new Set(keys(load(l)));
  const missing = [...ref].filter((k) => !ks.has(k));
  const extra = [...ks].filter((k) => !ref.has(k));
  if (missing.length || extra.length) {
    ok = false;
    console.error(`✗ ${l}: ${missing.length} manquante(s) ${missing.join(", ")} | ${extra.length} en trop ${extra.join(", ")}`);
  } else console.log(`✓ ${l}: ${ks.size} clés`);
}
process.exit(ok ? 0 : 1);
