import { expect, test, type Page } from "@playwright/test";

const CONSENT = "parkquest.location-consent.v1";

/** Consentement de localisation déjà donné (évite l'écran « Activez votre position »). */
async function grantConsent(page: Page, geo?: string) {
  await page.addInitScript(
    ([key, mode]) => {
      localStorage.setItem(key, "granted");
      if (mode) localStorage.setItem("parkquest.demo-geo.v1", mode);
    },
    [CONSENT, geo ?? ""] as const,
  );
}

/**
 * Boucle de visite complète en MODE DÉMO (sans Supabase ni GPS) :
 * démarrer → voir le spot → découvrir (sans GPS) → quiz → défi → collection.
 */
test("boucle de visite : découverte, quiz, défi", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: /Commencer la visite/ }).first().click();
  await expect(page).toHaveURL(/\/visit$/);
  // Écran de pré-autorisation : on continue sans position
  await expect(page.getByText("Activez votre position")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Pas maintenant" }).last().click();
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

test("GPS refusé : l'app reste utilisable", async ({ page }) => {
  // Mode démo : état GPS simulé « refusé »
  await grantConsent(page, "denied");
  await page.goto("/fr/parks/plantentuin-meise/map");
  await expect(page.getByText(/Position refusée|Position indisponible/).first()).toBeVisible();
  // « Autour de vous » reste disponible depuis un point de départ du parc
  await expect(page.getByRole("heading", { name: "Autour de vous" })).toBeVisible();
  await page.getByRole("button", { name: "Carte · Séquoia géant" }).click();
  await expect(page.getByRole("link", { name: "Voir le spot" })).toBeVisible();
});

test("mode sombre / clair : bascule et persistance", async ({ page }) => {
  await page.goto("/fr");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Changer de thème" }).first().click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  // Sélecteur complet dans le profil
  await page.goto("/fr/profile");
  await page.getByRole("radio", { name: "Système" }).click();
  await expect(html).toHaveAttribute("data-theme-pref", "system");
  await page.getByRole("radio", { name: "Sombre" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("mode démo : découverte validée par GPS simulé, points et badge", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("init")) {
      localStorage.clear();
      localStorage.setItem("parkquest.demo-geo.v1", "near");
      sessionStorage.setItem("init", "1");
    }
  });
  await page.goto("/fr/parks/plantentuin-meise/trails/arbres-remarquables/visit");
  // Pré-autorisation puis suivi GPS actif (simulé à ~2 m, précision 6 m)
  await page.getByRole("dialog").getByRole("button", { name: "Activer ma position" }).click();
  await page.getByRole("button", { name: "Voir le spot" }).first().click();
  await expect(page.getByText("Vous êtes près de : Séquoia géant")).toBeVisible();
  await page.getByRole("button", { name: "Découvrir ce spot" }).click();
  await expect(page.getByText("Découverte validée par GPS")).toBeVisible();
  await expect(page.getByText("+10 points").first()).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: /Spot suivant/ }).click();
    await page.getByRole("button", { name: "Voir le spot" }).first().click();
    await page.getByRole("button", { name: "Découvrir ce spot" }).click();
    await expect(page.getByText(/Découvert !|Parcours terminé/).first()).toBeVisible();
  }
  await page.getByRole("button", { name: "Terminer la visite" }).click();
  await expect(page.getByText("Badge débloqué")).toBeVisible();
  await expect(page.getByText("Boucle bouclée")).toBeVisible();
});


test("mode démo : précision insuffisante → pas de validation GPS", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("parkquest.demo-geo.v1", "low-accuracy"));
  await page.goto("/fr/parks/plantentuin-meise/spots/bambouseraie");
  await page.getByRole("button", { name: "Activer ma position" }).click();
  await expect(page.getByText(/Signal GPS imprécis/).first()).toBeVisible();
  await page.getByRole("button", { name: "Je confirme, j'y suis" }).click();
  await expect(page.getByText("Découverte enregistrée (sans validation GPS)")).toBeVisible();
});

test("GPS approximatif (± 18 m) : « Vous semblez proche », confirmation demandée", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("parkquest.demo-geo.v1", "approximate"));
  await page.goto("/fr/parks/plantentuin-meise/spots/cedre-du-liban");
  await page.getByRole("button", { name: "Activer ma position" }).click();
  await expect(page.getByText("Vous semblez proche de ce lieu")).toBeVisible();
  await expect(page.getByRole("button", { name: "Découvrir ce spot" })).toBeVisible();
});

test("carte : pré-autorisation, « Autour de vous » et guidage", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("parkquest.demo-geo.v1", "entrance"));
  await page.goto("/fr/parks/plantentuin-meise/map");
  await expect(page.getByText("Activez votre position")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Activer ma position" }).click();
  await expect(page.getByRole("heading", { name: "Autour de vous" })).toBeVisible();
  // Filtre « Services » : uniquement les services du parc
  await page.getByRole("button", { name: "Services", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Carte · Séquoia géant/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Tout", exact: true }).click();
  await page.getByRole("button", { name: "Me guider · Séquoia géant" }).click();
  await expect(page.getByText(/Vers Séquoia géant|Séquoia géant/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Arrêter le guidage" })).toBeVisible();
});

test("météo : prévisions pendant la visite (simulées en démo)", async ({ page }) => {
  await page.goto("/fr/parks/plantentuin-meise");
  await expect(page.getByRole("list", { name: "Météo pendant votre visite" })).toBeVisible();
  // En démo, la météo est clairement marquée comme simulée (jamais présentée comme réelle)
  await expect(page.getByText("Météo simulée (mode démo)").first()).toBeVisible();
});
