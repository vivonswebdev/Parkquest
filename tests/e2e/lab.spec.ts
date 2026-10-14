import { expect, test } from "@playwright/test";

/* Prototype de design isolé (/fr/lab) : parcours complet sur GSM, sans compte ni position. */

test("laboratoire : parcours bienvenue → tutoriel → œuf → aventure → éclosion → compagnon → accueil", async ({ page, context }) => {
  // Aucune permission de position ne doit être demandée
  await context.grantPermissions([]);
  await page.addInitScript(() => {
    (window as unknown as { __geo: number }).__geo = 0;
    navigator.geolocation.getCurrentPosition = () => void ((window as unknown as { __geo: number }).__geo += 1);
    navigator.geolocation.watchPosition = () => ((window as unknown as { __geo: number }).__geo += 1);
  });

  await page.goto("/fr/lab/welcome");
  await expect(page.getByRole("heading", { name: "Ton prochain secret commence ici." })).toBeVisible();
  await page.getByRole("link", { name: "Commencer" }).click();

  for (let step = 1; step <= 4; step++) {
    await expect(page).toHaveURL(new RegExp(`/fr/lab/onboarding/${step}$`));
    await expect(page.getByRole("img", { name: `Étape ${step} sur 5` })).toBeVisible();
    await expect(page.getByRole("link", { name: "Passer" })).toBeVisible();
    await page.getByRole("link", { name: "Suivant" }).click();
  }
  await expect(page.getByRole("heading", { name: "Grandis avec ton gardien." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Passer" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Retour" })).toBeVisible();
  await page.getByRole("link", { name: "Choisir mon œuf" }).click();

  await page.getByLabel("Comment veux-tu qu'on t'appelle ?").fill("Lina");
  await page.getByText("Aventurier en famille").click();
  await page.getByText("Œuf de la forêt").click();
  await expect(page.getByText("Aucun compte réel n'est créé. Aucune position n'est demandée.")).toBeVisible();
  await page.getByRole("button", { name: "Choisir ma première aventure" }).click();

  await page.getByText("Choisir un parc manuellement").click();
  await page.getByRole("link", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "Le Secret du Séquoia" })).toBeVisible();
  await page.getByRole("link", { name: "Commencer la démonstration" }).click();

  await page.getByRole("button", { name: "Observer" }).click();
  await expect(page.getByRole("heading", { name: "Tu as trouvé ton premier indice." })).toBeVisible();
  await expect(page.getByText("1 découverte sur 1")).toBeVisible();
  await page.getByRole("link", { name: "Voir mon œuf" }).click();

  await expect(page.getByRole("heading", { name: "Un secret sommeille ici." })).toBeVisible();
  await page.getByRole("button", { name: "Lui confier ma découverte" }).click();
  await page.getByRole("button", { name: "Ouvrir l'œuf" }).click();
  await page.getByRole("button", { name: "Passer l'animation" }).click();
  await expect(page.getByRole("heading", { name: "Mossy, jeune gardien" })).toBeVisible();
  await page.getByRole("link", { name: "Rencontrer mon gardien" }).click();

  await expect(page.getByText("Prochaine évolution")).toBeVisible();
  await expect(page.getByText("Terminer 2 aventures")).toBeVisible();
  for (let i = 0; i < 8; i++) await page.getByRole("button", { name: "Terminer une étape" }).click();
  await expect(page.getByRole("heading", { name: "Mossy, explorateur des sous-bois" })).toBeVisible();

  await page.goto("/fr/lab/home");
  await expect(page.getByRole("heading", { name: "Bonjour, Lina !" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorer un parc" })).toBeVisible();

  expect(await page.evaluate(() => (window as unknown as { __geo: number }).__geo)).toBe(0);
  // Seul l'état de démonstration préfixé est stocké
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes("lab")))).toEqual(["pq-lab:state"]);
});

test("laboratoire : « Passer » mène au choix de l'œuf ; collection, fiche et carte jour/nuit", async ({ page }) => {
  await page.goto("/fr/lab/onboarding/2");
  await page.getByRole("link", { name: "Passer" }).click();
  await expect(page).toHaveURL(/\/fr\/lab\/choose-egg$/);

  await page.goto("/fr/lab/collection");
  await expect(page.getByText(/sur 7 découvert/)).toBeVisible();
  await page.getByRole("button", { name: "Rares" }).click();
  await expect(page.getByText("Légendaire")).toBeVisible();

  // Planche de validation de Mossy : réactions et éclosion rejouable
  await page.goto("/fr/lab/mossy");
  await expect(page.getByRole("img", { name: "Mossy, jeune gardien, au repos" })).toBeVisible();
  await page.getByRole("button", { name: "Joie" }).click();
  await page.getByRole("button", { name: "Lancer l'éclosion" }).click();
  await expect(page.getByRole("button", { name: "Rejouer l'éclosion" })).toBeVisible({ timeout: 10_000 });

  await page.goto("/fr/lab/creature/selenis");
  await expect(page.getByRole("heading", { name: "Sélénis" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Rejouer l'éclosion" })).toBeVisible();

  await page.goto("/fr/lab/map?theme=night");
  await expect(page.getByRole("radio", { name: "Nuit" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Position non partagée")).toBeVisible();
  await page.getByRole("radio", { name: "Jour" }).click();
  await expect(page).toHaveURL(/theme=day/);
  await page.getByRole("button", { name: "Lina", exact: true }).click();
  await page.getByRole("button", { name: "Envoyer un message" }).click();
  await page.getByRole("button", { name: "Je suis près du séquoia." }).click();
  await page.getByRole("button", { name: "Envoyer (démonstration)" }).click();
  await expect(page.getByText("Non envoyé · démonstration locale")).toBeVisible();
});

test("laboratoire : jamais relié à l'application officielle", async ({ page }) => {
  for (const path of ["/fr", "/fr/parks"]) {
    await page.goto(path);
    expect(await page.locator('a[href*="/lab"]').count()).toBe(0);
  }
  // Français uniquement : les autres langues affichent la page introuvable
  await page.goto("/nl/lab/welcome");
  await expect(page.getByRole("heading", { name: "Ton prochain secret commence ici." })).toHaveCount(0);
});

test("laboratoire : l'œuf choisi donne le bon compagnon partout (rivière → Perline, crépuscule → Lumo)", async ({ page }) => {
  for (const [egg, name, young] of [
    ["Œuf de la rivière", "Perline", "Perline, jeune gardienne"],
    ["Œuf du crépuscule", "Lumo", "Lumo, jeune gardien"],
  ]) {
    await page.goto("/fr/lab/choose-egg");
    await page.getByText(egg, { exact: true }).click();
    await page.getByRole("button", { name: "Choisir ma première aventure" }).click();
    await page.goto("/fr/lab/hatch");
    await expect(page.getByRole("img", { name: new RegExp(egg) })).toBeVisible();
    await page.getByRole("button", { name: "Simuler une découverte (démo)" }).click();
    await page.getByRole("button", { name: "Ouvrir l'œuf" }).click();
    await page.getByRole("button", { name: "Passer l'animation" }).click();
    await expect(page.getByRole("heading", { name: young })).toBeVisible();
    await page.goto("/fr/lab/companion");
    await expect(page.getByRole("heading", { name: young })).toBeVisible();
    await page.goto("/fr/lab/home");
    await expect(page.getByText(young).first()).toBeVisible();
    await page.goto(`/fr/lab/${name.toLowerCase()}`);
    await expect(page.getByRole("img", { name: `${young}, au repos` })).toBeVisible();
  }
});
