import { expect, test } from "@playwright/test";


test("profil : choisir un emblème, puis une photo, puis retirer l'avatar", async ({ page }) => {
  await page.goto("/fr/profile");
  await page.getByRole("button", { name: "Changer d'avatar" }).click();
  const dialog = page.getByRole("dialog", { name: "Ton avatar" });
  await expect(dialog.getByText(/reste sur ce téléphone/)).toBeVisible();
  await expect(dialog.getByText(/jamais visible par d'autres personnes/)).toBeVisible();
  // Emblème par défaut sans choix
  await expect(dialog.getByRole("button", { name: "Feuille" })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Lune" }).click();
  await expect(dialog).toHaveCount(0);

  // Conservé sur l'appareil
  await page.reload();
  await page.getByRole("button", { name: "Changer d'avatar" }).click();
  await expect(page.getByRole("dialog", { name: "Ton avatar" }).getByRole("button", { name: "Lune" })).toHaveAttribute("aria-pressed", "true");

  // Photo : recadrée et ré-encodée en JPEG, sur l'appareil (image de test générée dans le navigateur)
  const b64 = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 480;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#19E6A2";
    ctx.fillRect(0, 0, 640, 480);
    return c.toDataURL("image/png").split(",")[1];
  });
  const PNG = Buffer.from(b64, "base64");
  await page.getByLabel("Choisir une photo").setInputFiles({ name: "moi.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("dialog", { name: "Ton avatar" })).toHaveCount(0);
  const stored = await page.evaluate(() => localStorage.getItem("parkquest.avatar.v1"));
  expect(stored).toContain("data:image/jpeg;base64,");
  await expect(page.getByRole("button", { name: "Changer d'avatar" }).locator("img")).toHaveCount(1);

  // « Supprimer ma photo » : photo effacée de l'appareil, retour à l'emblème par défaut (Feuille)
  await page.getByRole("button", { name: "Changer d'avatar" }).click();
  await page.getByRole("button", { name: "Supprimer ma photo" }).click();
  expect(await page.evaluate(() => localStorage.getItem("parkquest.avatar.v1"))).toBeNull();
  await expect(page.getByRole("button", { name: "Changer d'avatar" }).locator("img")).toHaveCount(0);
  await page.getByRole("button", { name: "Changer d'avatar" }).click();
  await expect(page.getByRole("button", { name: "Feuille" })).toHaveAttribute("aria-pressed", "true");
  // Pas de photo : pas de bouton de suppression
  await expect(page.getByRole("button", { name: "Supprimer ma photo" })).toHaveCount(0);
});

test("profil : format de fichier refusé avec un message clair", async ({ page }) => {
  await page.goto("/fr/profile");
  await page.getByRole("button", { name: "Changer d'avatar" }).click();
  await page.getByLabel("Choisir une photo").setInputFiles({ name: "note.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
  await expect(page.getByRole("alert").filter({ hasText: "Format non pris en charge" })).toBeVisible();
});
