// Captures d'écran iPhone de la démo ParkQuest (thèmes sombre et clair).
//
//   npm run demo:capture                       (vérifie lint + types + tests, puis capture)
//   node scripts/capture-demo.mjs [url] [dossier]
//
// - Si aucun serveur ne répond à l'URL (défaut http://localhost:3000), le script
//   lance lui-même `next dev` en MODE DÉMO sur le port 3100, puis l'arrête.
// - Captures enregistrées dans demo-shots/<date-heure>/ (dossier ignoré par Git),
//   au format iPhone plein écran 390 × 844 (@2x), en WebP (22 écrans par thème).
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

  // Carte : pré-autorisation de la position, puis « Autour de vous » depuis l'entrée
  await setGeo("entrance");
  await go("/fr/parks/plantentuin-meise/map");
  await page.getByText("Activez votre position").waitFor();
  await shot("03-consentement-position");
  await page.getByRole("dialog").getByRole("button", { name: "Activer ma position" }).click();
  await page.getByRole("heading", { name: "Autour de vous" }).waitFor();
  await shot("04-carte-autour-de-vous");
  await page.getByRole("button", { name: /Voir les \d+ lieux/ }).first().click();
  await shot("04b-autour-de-vous-liste");
  await page.getByRole("button", { name: "Carte · Séquoia géant" }).click();
  await shot("05-carte-spot");
  await go("/fr/parks/plantentuin-meise/map?to=sequoia-geant");
  await page.getByRole("button", { name: "Arrêter le guidage" }).waitFor();
  await shot("06-guidage");

  // Fiche du parc : météo pendant la visite (simulée en démo)
  await go("/fr/parks/plantentuin-meise");
  await page.getByRole("list", { name: "Météo pendant votre visite" }).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 160);
  await shot("07-meteo-visite");

  await go("/fr/parks/plantentuin-meise/trails/arbres-remarquables");
  await shot("08-parcours");

  // Suivi de parcours : position simulée à ~2 m du spot, précision 6 m
  await setGeo("near");
  await go("/fr/parks/plantentuin-meise/trails/arbres-remarquables/visit");
  await shot("09-visite");
  await page.getByRole("button", { name: "Voir la fiche" }).first().click();
  await page.getByText("Vous êtes près de : Séquoia géant").waitFor();
  await shot("10-gps-pres");
  await page.getByRole("button", { name: "Découvrir ce spot" }).click();
  await page.getByText("Découverte validée par GPS").waitFor();
  await shot("11-decouvert-gps");
  await page.getByText("Amérique du Nord").click();
  await page.getByRole("button", { name: "Valider" }).click();
  await page.getByText("Bonne réponse !").scrollIntoViewIfNeeded();
  await shot("12-quiz");
  await page.getByText("Prends une photo de la feuille").scrollIntoViewIfNeeded();
  await shot("13-defi");

  // Parcours complet : les 5 spots suivants, puis fin de visite (badge « Boucle bouclée »)
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: /Spot suivant/ }).click();
    await page.getByRole("button", { name: "Voir la fiche" }).first().click();
    await page.getByRole("button", { name: "Découvrir ce spot" }).click();
    // Au dernier spot, l'écran passe directement à « Parcours terminé ! ».
    await page.getByText(/Découvert !|Parcours terminé/).first().waitFor();
  }
  await page.getByRole("button", { name: "Terminer la visite" }).click();
  await page.getByText("Badge débloqué").waitFor({ timeout: 5000 }).catch(() => {});
  await shot("14-parcours-termine");

  // États GPS
  await setGeo("denied");
  await go("/fr/parks/plantentuin-meise/map");
  await page.getByText("Position refusée").first().waitFor();
  await shot("15-gps-refuse");
  const discoverOn = async (slug, geoMode, text, name) => {
    await setGeo(geoMode);
    await go(`/fr/parks/plantentuin-meise/spots/${slug}`);
    await page.getByRole("button", { name: "Activer ma position" }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Activer ma position" }).click();
    await page.getByText(text).first().waitFor();
    await page.getByText(text).first().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, -120);
    await shot(name);
  };
  await discoverOn("cedre-du-liban", "approximate", "Vous semblez proche de ce lieu", "16-gps-approximatif");
  await discoverOn("bambouseraie", "low-accuracy", /Signal GPS imprécis/, "17-gps-imprecis");
  await setGeo("near");

  await go("/fr/parks/plantentuin-meise/spots/sequoia-geant");
  await shot("18-fiche-arbre");
  await go("/fr/challenges");
  await shot("19-progression");
  await go("/fr/profile");
  await shot("20-profil");
  await go("/fr/parks/plantentuin-meise/practical-info");
  await shot("21-infos-pratiques");
  await go("/fr");
  await page.getByTestId("demo-panel-button").click();
  await shot("22-panneau-demo");
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
