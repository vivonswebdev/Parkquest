import { expect, test } from "@playwright/test";

/**
 * Boucle de visite complète en MODE DÉMO (sans Supabase ni GPS) :
 * démarrer → voir le spot → découvrir (sans GPS) → quiz → défi → collection.
 */
test("boucle de visite : découverte, quiz, défi", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: /Commencer la visite/ }).first().click();
  await expect(page).toHaveURL(/\/visit$/);
  await expect(page.getByText("Séquoia géant").first()).toBeVisible();
  await expect(page.getByText(/Continuez|Depuis l'entrée/).first()).toBeVisible();

  // Ouvrir la fiche du prochain spot dans le panneau
  await page.getByRole("button", { name: "Voir le spot" }).first().click();

  // Découverte sans GPS : geste explicite, validation serveur (mode démo)
  await page.getByRole("button", { name: "J'y suis" }).click();
  await expect(page.getByText("Découvert !")).toBeVisible();
  await expect(page.getByText(/sans validation GPS/)).toBeVisible();
  await expect(page.getByText("Mode démo", { exact: false }).first()).toBeVisible();

  // Quiz : bonne réponse au premier essai → +10
  await page.getByText("Amérique du Nord").click();
  await page.getByRole("button", { name: "Valider" }).click();
  await expect(page.getByText("Bonne réponse !")).toBeVisible();
  await expect(page.getByText("+10 points").first()).toBeVisible();

  // Progression 1 / 6
  await expect(page.getByText("1 / 6 spots").first()).toBeVisible();

  // Défi photo : bouton désactivé tant qu'aucune photo
  await expect(page.getByRole("button", { name: "J'ai relevé le défi" })).toBeDisabled();

  // Spot suivant
  await page.getByRole("button", { name: /Spot suivant/ }).click();
  await expect(page.getByText("Chêne remarquable").first()).toBeVisible();
});

test("la bonne réponse du quiz n'est jamais envoyée au client", async ({ page }) => {
  const res = await page.goto("/fr/parks/plantentuin-meise/spots/sequoia-geant");
  const html = (await res?.text()) ?? "";
  expect(html).not.toContain("isCorrect");
  expect(html).not.toContain("is_correct");
});

test("les routes localisées existent dans les 5 langues", async ({ page }) => {
  for (const l of ["fr", "nl", "en", "es", "de"]) {
    const r = await page.goto(`/${l}/parks/plantentuin-meise`);
    expect(r?.status()).toBe(200);
  }
});

test("GPS refusé : l'app reste utilisable", async ({ page, context }) => {
  await context.clearPermissions();
  await page.goto("/fr/parks/plantentuin-meise/map");
  await page.getByRole("button", { name: "Ma position" }).click();
  await expect(page.getByText(/Position refusée|Position indisponible/)).toBeVisible();
  // Liste des spots (les marqueurs peuvent se chevaucher selon le zoom)
  await page.getByRole("button", { name: /Séquoia géant/ }).last().click();
  await expect(page.getByRole("link", { name: "Voir le spot" })).toBeVisible();
});
