import { expect, test, type Page } from "@playwright/test";

async function openParkMap(page: Page, geo: string) {
  await page.addInitScript((mode) => {
    localStorage.setItem("parkquest.location-consent.v1", "granted");
    localStorage.setItem("parkquest.demo-geo.v1", mode);
  }, geo);
  await page.goto("/fr/parks/plantentuin-meise/map");
}

test("favoris : placer un point, le retrouver après rechargement, le retirer", async ({ page }) => {
  await openParkMap(page, "denied");
  await page.getByRole("button", { name: "Ajouter un point favori" }).click();
  const place = page.getByRole("dialog", { name: "Nouveau point favori" });
  await expect(place).toBeVisible();
  await place.getByRole("button", { name: "Placer ici" }).click();
  const sheet = page.getByRole("dialog", { name: "Mon point 1" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(/restent sur ce téléphone/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Favori : Mon point 1" })).toHaveCount(1);

  // Stocké sur l'appareil : toujours là après rechargement
  await page.reload();
  await expect(page.getByRole("button", { name: "Favori : Mon point 1" })).toHaveCount(1);
  await page.getByRole("button", { name: "Favori : Mon point 1" }).click();
  await page.getByRole("dialog", { name: "Mon point 1" }).getByRole("button", { name: "Retirer des favoris" }).click();
  await expect(page.getByRole("button", { name: "Favori : Mon point 1" })).toHaveCount(0);
});

test("favoris : un spot s'ajoute et se retire depuis sa fiche", async ({ page }) => {
  await openParkMap(page, "denied");
  await page.getByRole("button", { name: "Ouvrir le panneau", exact: true }).first().click();
  await page.getByRole("button", { name: /Voir les \d+ lieux/ }).first().click();
  await page.getByRole("button", { name: "Carte · Séquoia géant" }).click();
  const sheet = page.getByRole("dialog", { name: "Séquoia géant" });
  const star = sheet.getByRole("button", { name: "Ajouter aux favoris" });
  await star.click();
  await expect(sheet.getByRole("button", { name: "Retirer des favoris" })).toHaveAttribute("aria-pressed", "true");
  await sheet.getByRole("button", { name: "Retirer des favoris" }).click();
  await expect(sheet.getByRole("button", { name: "Ajouter aux favoris" })).toHaveAttribute("aria-pressed", "false");
});

test("hors de la zone de visite : alerte douce, jamais « hors du parc », retour à l'entrée", async ({ page }) => {
  await openParkMap(page, "outside");
  const alert = page.getByRole("alert").filter({ hasText: "Tu t'éloignes de la zone de visite" });
  await expect(alert).toBeVisible();
  // Limite non officielle : consignes du parc prioritaires, aucune formulation « quitté le parc »
  await expect(alert.getByText(/non officielle/)).toBeVisible();
  await expect(page.getByText(/quitté le parc|t'éloignes du parc/)).toHaveCount(0);
  await alert.getByRole("button", { name: "Retour à l'entrée" }).click();
  await expect(alert).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Arrêter le guidage" })).toBeVisible();
});

test("dans le parc : aucune alerte de sortie", async ({ page }) => {
  await openParkMap(page, "entrance");
  await expect(page.getByText("GPS précis").first()).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Tu t'éloignes de la zone de visite" })).toHaveCount(0);
});

test("indicateur GPS : se réduit tout seul, se rouvre au toucher", async ({ page }) => {
  await openParkMap(page, "entrance");
  const chip = page.getByRole("status").filter({ hasText: "GPS précis" }).getByRole("button");
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  await expect(chip).toHaveAttribute("aria-expanded", "false", { timeout: 8000 });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-expanded", "true");
});
