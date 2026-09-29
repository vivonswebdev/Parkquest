import { expect, test, type Page } from "@playwright/test";

/** Position refusée : la carte générale n'a aucune raison de choisir un parc à la place du visiteur. */
async function openGeneralMap(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("parkquest.location-consent.v1", "granted");
    localStorage.setItem("parkquest.demo-geo.v1", "denied");
  });
  await page.goto("/fr/map");
  await expect(page.getByText("Carte des parcs").first()).toBeVisible();
  await page.getByRole("button", { name: "Ouvrir le panneau", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Choisissez un parc" })).toBeVisible();
}

/** Liste des parcs du panneau (les repères de la carte portent aussi le nom du parc). */
const parkList = (page: Page) => page.locator("section[aria-labelledby=parks-title]");

const MEISE = "Plantentuin Meise";
const DENDERMONDE = "Dendermonde — Vallée de l'Escaut";
const LA_HULPE = "Domaine régional Solvay — Château de La Hulpe";

test("carte générale : les 3 parcs, aucun sélectionné par défaut", async ({ page }) => {
  await openGeneralMap(page);
  await expect(page.getByText("3 parcs").first()).toBeVisible();
  for (const name of [MEISE, DENDERMONDE, LA_HULPE]) {
    await expect(parkList(page).getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
    await expect(page.getByRole("dialog", { name })).toHaveCount(0);
  }
});

test("carte générale : sélection de Meise → parc, lieux, aventure", async ({ page }) => {
  await openGeneralMap(page);
  await parkList(page).getByRole("button", { name: new RegExp(`^${MEISE}`) }).click();
  const card = page.getByRole("dialog", { name: MEISE });
  await expect(card.getByRole("link", { name: "Voir le parc" })).toHaveAttribute("href", /\/parks\/plantentuin-meise$/);
  await expect(card.getByRole("link", { name: "Voir les lieux" })).toHaveAttribute("href", /\/parks\/plantentuin-meise\/map$/);
  await expect(card.getByRole("link", { name: "Démarrer une aventure" })).toBeVisible();
});

test("carte générale : sélection de Dendermonde → contenu en préparation, pas d'aventure", async ({ page }) => {
  await openGeneralMap(page);
  await parkList(page).getByRole("button", { name: new RegExp(`^${DENDERMONDE}`) }).click();
  const card = page.getByRole("dialog", { name: DENDERMONDE });
  await expect(card.getByText("Contenu en préparation")).toBeVisible();
  await expect(card.getByRole("link", { name: "Démarrer une aventure" })).toHaveCount(0);
  await card.getByRole("link", { name: "Voir le parc" }).click();
  await expect(page).toHaveURL(/\/parks\/dendermonde-vallee-escaut$/);
  await expect(page.getByText(/Contenu en préparation : lieux, coordonnées/)).toBeVisible();
  await expect(page.getByText("Donnée de démonstration à valider avec le parc.").first()).toBeVisible();
  await expect(page.getByText("Illustration de démonstration — photo officielle à confirmer avec le parc.").first()).toBeVisible();
});

test("carte générale : sélection de La Hulpe → fiche générique, lieux proposés", async ({ page }) => {
  await openGeneralMap(page);
  await parkList(page).getByRole("button", { name: new RegExp(`^${LA_HULPE}`) }).click();
  const card = page.getByRole("dialog", { name: LA_HULPE });
  await expect(card.getByRole("link", { name: "Démarrer une aventure" })).toHaveCount(0);
  await card.getByRole("link", { name: "Voir les lieux" }).click();
  await expect(page).toHaveURL(/\/parks\/domaine-solvay-la-hulpe#places$/);
  // Particularités adaptées au parc
  const features = page.locator("section[aria-labelledby=features-title]");
  await expect(features.getByText("Château")).toBeVisible();
  await expect(features.getByText("Étangs")).toBeVisible();
  // Lieux proposés, jamais présentés comme vérifiés ; contenu toujours « en préparation »
  const places = page.locator("#places");
  await expect(places.getByText(/Contenu en préparation : lieux, coordonnées/)).toBeVisible();
  await expect(places.getByText("Château de La Hulpe")).toBeVisible();
  await expect(places.getByText("Proposé").first()).toBeVisible();
  await expect(places.getByText("Vérifié par le parc")).toHaveCount(0);
  await expect(places.getByText("Publié")).toHaveCount(0);
  // Sources officielles listées
  await expect(page.getByRole("link", { name: /Château de La Hulpe — site officiel/ })).toBeVisible();
});

test("fiche Meise : statut démonstration et sections génériques", async ({ page }) => {
  await page.goto("/fr/parks/plantentuin-meise");
  await expect(page.getByRole("heading", { name: "Particularités du parc" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Horaires et accès" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect(page.getByText("Démonstration").first()).toBeVisible();
});

test("crédits et licences : photos en attente « À vérifier », aucune publiée", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: "Crédits et licences" }).first().click();
  await expect(page).toHaveURL(/\/fr\/credits$/);
  await expect(page.getByRole("heading", { name: "Crédits et licences" })).toBeVisible();
  await expect(page.getByText("Aucune photo de lieu publiée pour l'instant.")).toBeVisible();
  await expect(page.getByText(/photos en attente de vérification/)).toBeVisible();
  await expect(page.getByText("À vérifier").first()).toBeVisible();
  await expect(page.getByText("© OpenStreetMap contributors")).toBeVisible();
});
