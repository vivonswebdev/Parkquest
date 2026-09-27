// Captures d'écran de contrôle : [THEME=light|dark|system] node scripts/screenshot.mjs <url> <out.png> [mobile|desktop] [fullPage]
import { chromium } from "playwright";
const [url, out, device = "mobile", full = "true"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext(
  device === "mobile"
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
);
if (process.env.THEME) {
  await ctx.addInitScript((t) => localStorage.setItem("parkquest.theme", t), process.env.THEME);
}
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: full === "true" });
if (errors.length) console.log("ERREURS:\n" + errors.join("\n"));
await browser.close();
