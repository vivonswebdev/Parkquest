// Capture les écrans de la démo iPhone (thèmes sombre et clair) en suivant la boucle de visite.
// Usage : node scripts/capture-demo.mjs <baseUrl> <dossierSortie>
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import sharp from "sharp";

const [base = "http://localhost:3200", out = "demo-shots"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();

async function run(theme) {
  // Plein écran iPhone (app installée, sans barre Safari) : 390 × 844 points.
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "fr-FR" });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("parkquest.theme", t);
    } catch {}
  }, theme);
  const page = await ctx.newPage();
  const shot = async (name) => {
    await page.waitForTimeout(700);
    const buf = await page.screenshot();
    await sharp(buf).webp({ quality: 78 }).toFile(`${out}/${theme}-${name}.webp`);
    console.log(theme, name);
  };

  await page.goto(`${base}/fr`, { waitUntil: "networkidle" });
  await shot("01-accueil");
  await page.mouse.wheel(0, 1150);
  await shot("02-accueil-parcours");

  await page.goto(`${base}/fr/parks/plantentuin-meise/trails/arbres-remarquables/visit`, { waitUntil: "networkidle" });
  await shot("03-visite");
  await page.getByRole("button", { name: "Voir le spot" }).first().click();
  await shot("04-visite-spot");
  await page.getByRole("button", { name: "J'y suis" }).click();
  await page.getByText("Découvert !").waitFor();
  await shot("05-decouvert");
  await page.getByText("Amérique du Nord").click();
  await page.getByRole("button", { name: "Valider" }).click();
  await page.getByText("Bonne réponse !").waitFor();
  await page.getByText("Bonne réponse !").scrollIntoViewIfNeeded();
  await shot("06-quiz");
  await page.getByRole("button", { name: /Spot suivant/ }).click();
  await page.getByRole("button", { name: "Voir le spot" }).first().click();
  await page.getByRole("button", { name: /Voir le spot/ }).first().click();
  await shot("07-spot-suivant");

  await page.goto(`${base}/fr/parks/plantentuin-meise/map`, { waitUntil: "networkidle" });
  await shot("08-carte");
  await page.getByRole("button", { name: /Séquoia géant/ }).last().click();
  await shot("09-carte-spot");

  await page.goto(`${base}/fr/parks/plantentuin-meise/spots/sequoia-geant`, { waitUntil: "networkidle" });
  await shot("10-fiche");
  await page.mouse.wheel(0, 1500);
  await shot("11-fiche-quiz");

  await page.goto(`${base}/fr/challenges`, { waitUntil: "networkidle" });
  await shot("12-defis");
  await page.goto(`${base}/fr/profile`, { waitUntil: "networkidle" });
  await shot("13-profil");
  await page.goto(`${base}/fr/parks`, { waitUntil: "networkidle" });
  await shot("14-parcs");
  await page.goto(`${base}/fr/parks/plantentuin-meise/plan`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Voir ma recommandation" }).click();
  await page.getByText("Notre recommandation").scrollIntoViewIfNeeded();
  await shot("15-planifier");
  await page.goto(`${base}/fr/parks/plantentuin-meise/practical-info`, { waitUntil: "networkidle" });
  await shot("16-infos");
  await ctx.close();
}

await run("dark");
await run("light");
await browser.close();
