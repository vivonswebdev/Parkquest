// Lance la démo accessible depuis un téléphone du même Wi-Fi (Solution A du README).
// Usage : npm run dev:lan   (port : PORT=3000 par défaut)
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

const port = process.env.PORT || "3000";
const ips = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n.address);

console.log("\n  TYLIA — démo sur le réseau local");
console.log("  ─────────────────────────────────────");
console.log(`  Sur ce PC        : http://localhost:${port}/fr`);
if (ips.length) for (const ip of ips) console.log(`  Sur l'iPhone     : http://${ip}:${port}/fr`);
else console.log("  Aucune adresse réseau trouvée : vérifiez la connexion Wi-Fi.");
console.log("  (iPhone et PC sur le même Wi-Fi ; autorisez Node.js dans le pare-feu si demandé)\n");

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    NEXT_PUBLIC_DEMO_MODE: "true",
    // Autorise les requêtes de développement venant des adresses du réseau local.
    PQ_ALLOWED_DEV_ORIGINS: [process.env.PQ_ALLOWED_DEV_ORIGINS, ...ips].filter(Boolean).join(","),
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
