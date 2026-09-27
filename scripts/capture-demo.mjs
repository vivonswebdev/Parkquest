// Captures d'écran iPhone de la démo ParkQuest (thèmes sombre et clair).
//
//   npm run demo:capture                       (vérifie lint + types + tests, puis capture)
//   node scripts/capture-demo.mjs [url] [dossier]
//
// - Si aucun serveur ne répond à l'URL (défaut http://localhost:3000), le script
//   lance lui-même `next dev` en MODE DÉMO sur le port 3100, puis l'arrête.
// - Captures enregistrées dans demo-shots/<date-heure>/ (dossier ignoré par Git),
//   au format iPhone plein écran 390 × 844 (@2x), en WebP.
// - Prérequis une seule fois : npx playwright install chromium
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, devices } from "playwright";
import sharp from "sharp";

const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
let [base = "http://localhost:3000", out = resolve("demo-shots", stamp)] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

async function reachable(url) {
  try {
    const r = await fetch(`${url}/fr`, { redirect: "manual" });
    return r.status < 500;
  } catch {
    return false;
  }
}

let server = null;
if (!(await reachable(base))) {
  base = "http://localhost:3100";
  console.log(`Aucun serveur trouvé : lancement de la démo sur ${base} …`);
  server = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev", "-p", "3100"], {
    env: { ...process.env, NEXT_PUBLIC_DEMO_MODE: "true" },
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  for (let i = 0; i < 90 && !(await reachable(base)); i++) await new Promise((r) => setTimeout(r, 1000));
  if (!(await reachable(base))) {
    server.kill();
    throw new Error("Le serveur de démo ne répond pas.");
  }
}

const browser = await chromium.launch();

async function run(theme) {
  // Plein écran iPhone (app installée, sans barre Safari) : 390 × 844 points.
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "fr-FR" });
  await ctx.addInitScript((t) => {
    try {
      if (!sessionStorage.getItem("pq-capture-init")) {
        localStorage.clear();
        localStorage.setItem("parkquest.theme", t);
        localStorage.setItem("parkquest.demo-geo.v1", "near");
        sessionStorage.setItem("pq-capture-init", "1");
      }
    } catch {}
  }, theme);
  const page = await ctx.newPage();
  const shot = async (name) => {
    await page.waitForTimeout(650);
    const buf = await page.screenshot();
    await sharp(buf).webp({ quality: 80 }).toFile(`${out}/${theme}-${name}.webp`);
    console.log(`  ${theme}-${name}`);
  };
  const setGeo = (m) => page.evaluate((mode) => localStorage.setItem("parkquest.demo-geo.v1", mode), m);
  const go = (path) => page.goto(`${base}${path}`, { waitUntil: "networkidle" });

  await go("/fr");
  await shot("01-accueil");
  await page.mouse.wheel(0, 1150);
  await shot("02-accueil-parcours");

  await go("/fr/parks/plantentuin-meise/map");
  await shot("03-carte");
  await page.getByRole("button", { name: /Séquoia géant/ }).last().click();
  await shot("04-carte-spot");

  await go("/fr/parks/plantentuin-meise/trails/arbres-remarquables");
  await shot("05-parcours");

  // Suivi de parcours avec position simulée « près du spot »
  await go("/fr/parks/plantentuin-meise/trails/arbres-remarquables/visit");
  await shot("06-visite");
  await page.getByRole("button", { name: "Voir le spot" }).first().click();
  await page.getByRole("button", { name: "Activer ma position" }).last().click();
  await page.getByText("Vous semblez proche de ce lieu").waitFor();
  await shot("07-gps-proche");
  await page.getByRole("button", { name: "Découvrir ce spot" }).click();
  await page.getByText("Découverte validée par GPS").waitFor();
  await shot("08-decouvert-gps");
  await page.getByText("Amérique du Nord").click();
  await page.getByRole("button", { name: "Valider" }).click();
  await page.getByText("Bonne réponse !").scrollIntoViewIfNeeded();
  await shot("09-quiz");
  await page.getByText("Prends une photo de la feuille").scrollIntoViewIfNeeded();
  await shot("10-defi");

  // Parcours complet : les 5 spots suivants, puis fin de visite (badge « Boucle bouclée »)
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: /Spot suivant/ }).click();
    await page.getByRole("button", { name: "Voir le spot" }).first().click();
    await page.getByRole("button", { name: "Découvrir ce spot" }).click();
    // Au dernier spot, l'écran passe directement à « Parcours terminé ! ».
    await page.getByText(/Découvert !|Parcours terminé/).first().waitFor();
  }
  await page.getByRole("button", { name: "Terminer la visite" }).click();
  await page.getByText("Badge débloqué").waitFor({ timeout: 5000 }).catch(() => {});
  await shot("11-parcours-termine");

  // États GPS
  await setGeo("denied");
  await go("/fr/parks/plantentuin-meise/map");
  await page.getByRole("button", { name: "Ma position" }).click();
  await page.getByText("Position refusée").waitFor();
  await shot("12-gps-refuse");
  await setGeo("low-accuracy");
  await go("/fr/parks/plantentuin-meise/spots/cedre-du-liban");
  await page.getByText("Activer ma position").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Activer ma position" }).click();
  await page.getByText(/Signal GPS imprécis/).first().waitFor();
  await page.getByText(/Signal GPS imprécis/).first().scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, -120);
  await shot("13-gps-imprecis");
  await setGeo("near");

  await go("/fr/parks/plantentuin-meise/spots/sequoia-geant");
  await shot("14-fiche-arbre");
  await go("/fr/challenges");
  await shot("15-progression");
  await go("/fr/profile");
  await shot("16-profil");
  await go("/fr/parks/plantentuin-meise/practical-info");
  await shot("17-infos-pratiques");
  await go("/fr");
  await page.getByTestId("demo-panel-button").click();
  await shot("18-panneau-demo");
  await ctx.close();
}

try {
  for (const theme of ["dark", "light"]) {
    console.log(`Thème ${theme} :`);
    await run(theme);
  }
  console.log(`\nCaptures enregistrées dans : ${out}`);
} finally {
  await browser.close();
  server?.kill();
}
