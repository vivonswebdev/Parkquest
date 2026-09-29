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
  await page.goto("/fr/parks/plantentuin-meise/trails/arbres-remarquables");
  await page.getByRole("link", { name: /Commencer la visite/ }).first().click();
  await expect(page).toHaveURL(/\/visit$/);
  // Écran de pré-autorisation : on continue sans position
  await expect(page.getByText("Activez votre position")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Pas maintenant" }).last().click();
  await expect(page.getByText("Séquoia géant").first()).toBeVisible();
  await expect(page.getByText(/Continuez|Depuis l'entrée/).first()).toBeVisible();

  // Ouvrir la fiche du prochain spot dans le panneau
  await page.getByRole("button", { name: "Voir la fiche" }).first().click();

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
  await expect(page.getByText("GPS refusé").first()).toBeVisible();
  // « Autour de vous » reste disponible depuis un point de départ du parc (panneau réduit par défaut sur téléphone)
  await page.getByRole("button", { name: "Ouvrir le panneau", exact: true }).first().click();
  await expect(page.getByText(/Position refusée|Position indisponible/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Autour de vous" })).toBeVisible();
  await page.getByRole("button", { name: /Voir les \d+ lieux/ }).first().click();
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
  await page.getByRole("button", { name: "Voir la fiche" }).first().click();
  await expect(page.getByText("Vous êtes près de : Séquoia géant")).toBeVisible();
  await page.getByRole("button", { name: "Découvrir ce spot" }).click();
  await expect(page.getByText("Découverte validée par GPS")).toBeVisible();
  await expect(page.getByText("+10 points").first()).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: /Spot suivant/ }).click();
    await page.getByRole("button", { name: "Voir la fiche" }).first().click();
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
  await page.getByRole("button", { name: "Ouvrir le panneau", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Autour de vous" })).toBeVisible();
  // Filtre « Services » : uniquement les services du parc
  await page.getByRole("button", { name: "Services", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Carte · Séquoia géant/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Tout", exact: true }).click();
  // Liste repliée par défaut (la carte reste visible) : on la déplie
  await expect(page.getByRole("button", { name: /^Me guider · / })).toHaveCount(2);
  await page.getByRole("button", { name: /Voir les \d+ lieux/ }).first().click();
  await expect(page.getByRole("button", { name: "Réduire la liste" }).first()).toBeVisible();
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

test("photo d'un spot : proposition, consentement, attente, validation (démo)", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  const jpeg = await sharp({ create: { width: 1200, height: 900, channels: 3, background: "#2f7d4f" } }).jpeg().toBuffer();
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("init")) {
      localStorage.clear();
      sessionStorage.setItem("init", "1");
    }
  });
  await page.goto("/fr/parks/plantentuin-meise/spots/sequoia-geant");
  await page.getByRole("button", { name: "Ajouter une photo" }).first().click();
  await expect(page.getByText("La position GPS et les informations de l'appareil sont retirées automatiquement.")).toBeVisible();
  await page.getByLabel("Prendre ou choisir une photo").setInputFiles({ name: "sequoia.jpg", mimeType: "image/jpeg", buffer: jpeg });
  const send = page.getByRole("button", { name: "Envoyer la photo" });
  await expect(send).toBeDisabled();
  await page.getByText("J'accepte de publier cette photo sous licence CC BY-SA 4.0").click();
  await send.click();
  await expect(page.getByText("Merci !")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Fermer" }).last().click();
  await expect(page.getByText("En attente de vérification").first()).toBeVisible();
  // Modération simulée depuis le panneau DÉMO
  await page.getByTestId("demo-panel-button").click();
  await page.getByRole("button", { name: /Valider mes photos/ }).click();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByRole("button", { name: "Voir la photo 1" })).toBeVisible();
  await expect(page.getByText("En attente de vérification")).toHaveCount(0);
});

test("visite plein écran : défilement de la page bloqué, restauré à la sortie", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("parkquest.location-consent.v1", "declined"));
  await page.goto("/fr/parks/plantentuin-meise/trails/arbres-remarquables/visit");
  await expect(page.locator("html")).toHaveClass(/pq-immersive/);
  await page.getByRole("button", { name: "Quitter" }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Quitter" }).click();
  await expect(page).toHaveURL(/\/trails\/arbres-remarquables$/);
  await expect(page.locator("html")).not.toHaveClass(/pq-immersive/);
});

test("Mode Exploration : écran de sécurité, aventure, pause et sortie", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("parkquest.location-consent.v1", "granted");
    localStorage.setItem("parkquest.demo-geo.v1", "approximate");
  });
  // Point d'entrée depuis la fiche du parcours
  await page.goto("/fr/parks/plantentuin-meise/trails/arbres-remarquables");
  await page.getByRole("link", { name: "Commencer l'aventure" }).click();
  await expect(page).toHaveURL(/\/explore\/le-secret-du-sequoia$/);
  await expect(page.locator("html")).toHaveClass(/pq-immersive/);

  // Sécurité : consignes validées, bouton désactivé tant que la case n'est pas cochée
  const safety = page.getByRole("dialog", { name: "Avant de commencer" });
  await expect(safety.getByText("Arrête-toi avant de regarder ton écran.")).toBeVisible();
  await expect(safety.getByText(/ne remplace pas les consignes et règles du parc/)).toBeVisible();
  const start = safety.getByRole("button", { name: "Commencer l'aventure" });
  await expect(start).toBeDisabled();
  await safety.getByLabel("J'ai compris ces consignes").check();
  await start.click();

  // Aventure : étape 1, objectif, tableau de déplacement, mention démo
  await expect(page.getByRole("heading", { name: "L'énigme du géant" })).toBeVisible();
  await expect(page.getByText("Rendez-vous : Séquoia géant")).toBeVisible();
  await expect(page.getByText("Parcouru")).toBeVisible();
  await expect(page.getByText("Donnée de démonstration à valider avec le parc.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nord en haut" })).toBeVisible();

  // Pause bien visible, puis reprise
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText(/Le suivi de ta position est arrêté/)).toBeVisible();
  await expect(page.locator("[aria-live=polite]", { hasText: "Aventure en pause" })).toHaveCount(1);
  await page.getByRole("button", { name: "Reprendre" }).click();

  // Sortie avec confirmation → retour à la fiche du parcours
  await page.getByRole("button", { name: "Quitter" }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Quitter" }).click();
  await expect(page).toHaveURL(/\/trails\/arbres-remarquables$/);
  await expect(page.locator("html")).not.toHaveClass(/pq-immersive/);
});

test("Mode Exploration : quête inconnue → page introuvable", async ({ page }) => {
  await page.goto("/fr/parks/plantentuin-meise/explore/quete-inexistante");
  await expect(page.getByText(/introuvable|n'existe pas/i).first()).toBeVisible();
});

test("Mode Exploration : « Le secret du Séquoia » de bout en bout, œuf de démonstration", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("init")) {
      localStorage.clear();
      localStorage.setItem("parkquest.location-consent.v1", "declined");
      sessionStorage.setItem("init", "1");
    }
  });
  await page.goto("/fr/parks/plantentuin-meise/explore/le-secret-du-sequoia");
  const beginAdventure = async () => {
    await page.getByLabel("J'ai compris ces consignes").check();
    await page.getByRole("button", { name: "Commencer l'aventure" }).click();
  };
  await beginAdventure();

  // Sans GPS : l'arrivée se confirme manuellement (jamais de validation automatique)
  const arriveManually = async (spot: string) => {
    await expect(page.getByText(`Rendez-vous : ${spot}`)).toBeVisible();
    await page.getByRole("button", { name: "J'y suis" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Je confirme" }).click();
    await expect(page.getByText(`Tu es à : ${spot}`)).toBeVisible();
  };

  // 1. Énigme
  await arriveManually("Séquoia géant");
  await expect(page.getByText(/Ses fruits portent un petit chapeau/)).toBeVisible();
  await expect(page.getByText("Le savais-tu ?")).toBeVisible();
  await page.getByRole("button", { name: "J'ai lu l'énigme" }).click();

  // 2. Quiz (réponse vérifiée côté serveur) : « Continuer » seulement après avoir répondu
  await arriveManually("Chêne remarquable");
  const next = page.getByRole("button", { name: "Continuer", exact: true });
  await expect(next).toBeDisabled();
  await page.getByText("Des glands").click();
  await page.getByRole("button", { name: "Valider" }).click();
  await expect(page.getByText("Bonne réponse !")).toBeVisible();
  await next.click();

  // 3. Observation
  await arriveManually("Bambouseraie");
  await page.getByRole("button", { name: "J'ai observé" }).click();

  // 4. Indice audio : le texte est toujours affiché (transcription)
  await arriveManually("Cèdre du Liban");
  await expect(page.getByText(/Je viens des montagnes du Liban/)).toBeVisible();
  await page.getByRole("button", { name: "J'ai compris l'indice" }).click();

  // 5. Photo facultative : passée sans s'y rendre
  await expect(page.getByText("Facultatif")).toBeVisible();
  await page.getByRole("button", { name: "Passer cette étape" }).click();

  // 6. Retour au Séquoia : trésor
  await arriveManually("Séquoia géant");
  await page.getByRole("button", { name: "Révéler le secret" }).click();
  await expect(page.getByRole("heading", { name: "Œuf du Séquoia" })).toBeVisible();
  await expect(page.getByText(/non échangeable · non vendable · aucun tirage/)).toBeVisible();

  // Progression et récompense conservées sur l'appareil
  await page.reload();
  await beginAdventure();
  await expect(page.getByRole("heading", { name: "Œuf du Séquoia" })).toBeVisible();
  await page.getByRole("button", { name: "Rejouer" }).click();
  await expect(page.getByRole("heading", { name: "L'énigme du géant" })).toBeVisible();
});

test("carte générale : aucun parc sélectionné d'office, choix explicite d'un parc", async ({ page }) => {
  await grantConsent(page, "denied");
  // Bouton « Explorer » de la navigation → carte générale des parcs
  await page.goto("/fr");
  await page.getByRole("navigation").getByRole("link", { name: "Explorer" }).first().click();
  await expect(page).toHaveURL(/\/fr\/map$/);
  await expect(page.getByText("Carte des parcs").first()).toBeVisible();
  // Meise n'est ni sélectionnée ni présentée : pas de titre de parc, pas de « Autour de vous »
  await expect(page.getByRole("heading", { name: "Autour de vous" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Plantentuin Meise" })).toHaveCount(0);
  // Position refusée : repli annoncé sur la zone de démonstration
  await page.getByRole("button", { name: "Ouvrir le panneau", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Choisissez un parc" })).toBeVisible();
  await expect(page.getByText(/zone de démonstration/)).toBeVisible();
  // Sélection explicite dans la liste → fiche du parc et accès à sa carte
  await page.getByRole("button", { name: /^Plantentuin Meise Meise/ }).click();
  const card = page.getByRole("dialog", { name: "Plantentuin Meise" });
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: "Carte du parc" }).click();
  await expect(page).toHaveURL(/\/parks\/plantentuin-meise\/map$/);
});

test("carte : plein écran (pseudo plein écran CSS ou API native) et panneau réductible", async ({ page }) => {
  await grantConsent(page, "denied");
  await page.goto("/fr/parks/plantentuin-meise/map");
  const html = page.locator("html");
  // Plein écran : défilement bloqué, navigation recouverte, bouton « Quitter »
  await page.getByRole("button", { name: "Ouvrir la carte en plein écran" }).click();
  await expect(html).toHaveClass(/pq-immersive/);
  await expect(page.getByRole("button", { name: "Quitter le plein écran" })).toBeVisible();
  // Panneau : réduit → ouvert → réduit → masqué → rappelé
  await page.getByRole("button", { name: "Ouvrir le panneau", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Autour de vous" })).toBeVisible();
  await page.getByRole("button", { name: "Réduire le panneau" }).click();
  await expect(page.getByRole("heading", { name: "Autour de vous" })).toHaveCount(0);
  await page.getByRole("button", { name: "Masquer le panneau" }).click();
  await expect(page.getByRole("button", { name: "Ouvrir le panneau", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /Autour de vous · \d+ lieux/ }).click();
  await expect(page.getByRole("button", { name: "Ouvrir le panneau", exact: true }).first()).toBeVisible();
  // Sortie du plein écran : page normale
  await page.getByRole("button", { name: "Quitter le plein écran" }).click();
  await expect(html).not.toHaveClass(/pq-immersive/);
  await expect(page.getByRole("button", { name: "Ouvrir la carte en plein écran" })).toBeVisible();
});

test("G1 : accueil du jeu, œuf actif, collection, Explorer et aventure de Meise", async ({ page }) => {
  await grantConsent(page, "denied");
  await page.goto("/fr");
  await expect(page.getByRole("heading", { name: "Bonjour, explorateur" })).toBeVisible();
  // Œuf actif (démonstration) : énergie de nature, estimation en découvertes
  await expect(page.getByRole("heading", { name: "Œuf de la forêt" })).toBeVisible();
  await expect(page.getByText("64 / 100 énergie de nature")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Énergie de nature" })).toHaveAttribute("aria-valuenow", "64");
  await expect(page.getByText("Encore environ 2 découvertes")).toBeVisible();
  // Compagnon vide, collection 0 / 7 avec les 7 éléments
  await expect(page.getByText("Aucun compagnon pour le moment")).toBeVisible();
  await expect(page.getByText("0 / 7 créatures découvertes")).toBeVisible();
  await expect(page.getByRole("img", { name: /pas encore découverte/ })).toHaveCount(7);
  // Navigation : Accueil · Parcs · Explorer · Collection · Profil, sans « Défis »
  const nav = page.getByRole("navigation", { name: "Navigation principale" }).first();
  await expect(nav.getByRole("link", { name: "Défis" })).toHaveCount(0);
  for (const name of ["Accueil", "Parcs", "Explorer", "Collection", "Profil"]) await expect(nav.getByRole("link", { name })).toBeVisible();
  // « Voir l'aventure » → aventure de Meise (écran de sécurité)
  await page.getByRole("link", { name: "Voir l'aventure" }).click();
  await expect(page).toHaveURL(/\/explore\/le-secret-du-sequoia$/);
  await expect(page.getByRole("dialog", { name: "Avant de commencer" })).toBeVisible();
  // « Explorer un parc » → carte générale, aucun parc sélectionné
  await page.goto("/fr");
  await page.getByRole("link", { name: "Explorer un parc" }).click();
  await expect(page).toHaveURL(/\/fr\/map$/);
  await expect(page.getByRole("dialog", { name: "Plantentuin Meise" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Autour de vous" })).toHaveCount(0);
});
