/** Génère les icônes PWA PNG à partir de public/brand/mark.svg. Usage : npm run pwa:icons */
import { resolve } from "node:path";
import sharp from "sharp";

const src = resolve(__dirname, "../public/brand/mark.svg");
const out = resolve(__dirname, "../public/icons");

async function main() {
  for (const size of [192, 512]) {
    await sharp(src).resize(size, size).png().toFile(`${out}/icon-${size}.png`);
  }
  // Icône « maskable » : marge de sécurité de 10 %
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#031711" } })
    .composite([{ input: await sharp(src).resize(410, 410).png().toBuffer(), gravity: "center" }])
    .png()
    .toFile(`${out}/maskable-512.png`);
  await sharp(src).resize(180, 180).flatten({ background: "#031711" }).png().toFile(`${out}/apple-touch-icon.png`);
  await sharp(src).resize(48, 48).png().toFile(`${out}/favicon-48.png`);
  console.log("Icônes générées");
}
main();
