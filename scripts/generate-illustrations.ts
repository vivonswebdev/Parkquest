/**
 * Génère les illustrations SVG originales des données de démo (public/demo/**).
 * Style : nature stylisée, nuit verte douce, cohérente avec le thème sombre.
 * Usage : npm run demo:illustrations
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const W = 800;
const H = 600;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

type Palette = { sky1: string; sky2: string; hill1: string; hill2: string; ground: string; glow: string };

const palettes: Record<string, Palette> = {
  dusk: { sky1: "#0B3B2E", sky2: "#1E6B52", hill1: "#0F4A38", hill2: "#12573F", ground: "#0A3A2B", glow: "#8AF4C9" },
  day: { sky1: "#1B5E4A", sky2: "#6FCFA8", hill1: "#1D6B4F", hill2: "#2A8A63", ground: "#16553F", glow: "#F5FFFA" },
  golden: { sky1: "#20402F", sky2: "#C9A45A", hill1: "#2B5A3F", hill2: "#3B7050", ground: "#1F4A34", glow: "#F4C95D" },
  night: { sky1: "#031711", sky2: "#0D3428", hill1: "#08251D", hill2: "#0B3024", ground: "#06201A", glow: "#19E6A2" },
};

function base(p: Palette, extra = ""): string {
  return `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky1}"/><stop offset="1" stop-color="${p.sky2}"/></linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${p.glow}" stop-opacity="0.55"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#031711" stop-opacity="0"/><stop offset="1" stop-color="#031711" stop-opacity="0.55"/></linearGradient>
  ${extra}
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<circle cx="610" cy="150" r="170" fill="url(#sun)"/>
<path d="M0 360 C 140 300 260 330 380 310 S 640 270 800 320 V600 H0Z" fill="${p.hill1}"/>
<path d="M0 420 C 160 380 300 410 460 390 S 700 360 800 400 V600 H0Z" fill="${p.hill2}"/>
<path d="M0 480 C 200 455 420 470 800 450 V600 H0Z" fill="${p.ground}"/>`;
}

function roundTree(x: number, y: number, s: number, c1: string, c2: string, trunk = "#4A3322"): string {
  return `<g><rect x="${x - 6 * s}" y="${y - 40 * s}" width="${12 * s}" height="${48 * s}" rx="${4 * s}" fill="${trunk}"/>
<circle cx="${x}" cy="${y - 70 * s}" r="${44 * s}" fill="${c1}"/>
<circle cx="${x - 30 * s}" cy="${y - 52 * s}" r="${30 * s}" fill="${c1}"/>
<circle cx="${x + 32 * s}" cy="${y - 50 * s}" r="${30 * s}" fill="${c2}"/>
<circle cx="${x - 12 * s}" cy="${y - 88 * s}" r="${22 * s}" fill="${c2}" opacity="0.8"/></g>`;
}

function conifer(x: number, y: number, s: number, c1: string, c2: string, trunk = "#6B3A24"): string {
  return `<g><rect x="${x - 5 * s}" y="${y - 30 * s}" width="${10 * s}" height="${36 * s}" fill="${trunk}"/>
<path d="M${x} ${y - 170 * s} L${x + 34 * s} ${y - 90 * s} H${x - 34 * s}Z" fill="${c2}"/>
<path d="M${x} ${y - 130 * s} L${x + 44 * s} ${y - 50 * s} H${x - 44 * s}Z" fill="${c1}"/>
<path d="M${x} ${y - 95 * s} L${x + 52 * s} ${y - 20 * s} H${x - 52 * s}Z" fill="${c2}"/></g>`;
}

function forest(seed: number, count: number, yMin: number, yMax: number, colors: [string, string][], scale = 0.45): string {
  const r = rng(seed);
  const items: { y: number; svg: string }[] = [];
  for (let i = 0; i < count; i++) {
    const x = r() * W;
    const y = yMin + r() * (yMax - yMin);
    const s = scale * (0.6 + ((y - yMin) / (yMax - yMin + 1)) * 0.6);
    const [c1, c2] = colors[Math.floor(r() * colors.length)];
    items.push({ y, svg: r() > 0.35 ? roundTree(x, y, s, c1, c2) : conifer(x, y, s * 0.8, c1, c2) });
  }
  return items.sort((a, b) => a.y - b.y).map((i) => i.svg).join("\n");
}

const greens: [string, string][] = [
  ["#1F7A57", "#2E9C6F"],
  ["#15664A", "#1F8A62"],
  ["#2A8F63", "#43B07D"],
];

function path(d: string, color = "#CDB88A", width = 16): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="0.55" stroke-width="${width}" stroke-linecap="round"/>
<path d="${d}" fill="none" stroke="#F5FFFA" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="6 10" stroke-linecap="round"/>`;
}

function sparkle(seed: number, n: number, color: string): string {
  const r = rng(seed);
  return Array.from({ length: n }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 300).toFixed(0)}" r="${(r() * 1.8 + 0.4).toFixed(1)}" fill="${color}" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`).join("");
}

function svg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">\n${body}\n<rect width="${W}" height="${H}" fill="url(#fade)"/>\n</svg>\n`;
}

const scenes: Record<string, string> = {
  // --- Spots ---
  "spots/sequoia.svg": svg(
    base(palettes.dusk) +
      forest(11, 14, 360, 430, greens, 0.4) +
      `<g><rect x="372" y="140" width="56" height="360" rx="14" fill="#8A4A2B"/><rect x="386" y="140" width="10" height="360" fill="#A6603A" opacity="0.6"/>
<path d="M400 20 L470 150 H330Z" fill="#1A6A4B"/><path d="M400 70 L490 220 H310Z" fill="#15603F"/><path d="M400 140 L505 300 H295Z" fill="#1B7050"/><path d="M400 210 L515 370 H285Z" fill="#146245"/></g>` +
      `<g opacity="0.9"><circle cx="340" cy="520" r="10" fill="#F5FFFA"/><rect x="334" y="530" width="12" height="30" rx="5" fill="#19E6A2"/></g>` +
      forest(12, 6, 470, 560, greens, 0.55),
  ),
  "spots/oak.svg": svg(base(palettes.day) + forest(21, 10, 360, 420, greens, 0.35) + roundTree(400, 500, 2.3, "#2F8A5C", "#3FA36E", "#5A3E28") + forest(22, 4, 500, 580, greens, 0.5)),
  "spots/magnolia.svg": svg(
    base(palettes.golden) +
      forest(31, 10, 360, 430, greens, 0.35) +
      roundTree(400, 500, 2.1, "#3E7A55", "#4E8F63", "#5A3E28") +
      (() => {
        const r = rng(33);
        return Array.from({ length: 70 }, () => {
          const a = r() * Math.PI * 2;
          const d = Math.sqrt(r()) * 120;
          return `<circle cx="${(400 + Math.cos(a) * d * 1.3).toFixed(0)}" cy="${(340 + Math.sin(a) * d * 0.9).toFixed(0)}" r="${(6 + r() * 7).toFixed(1)}" fill="${r() > 0.5 ? "#F7C6DA" : "#F28DB2"}"/>`;
        }).join("");
      })(),
  ),
  "spots/roses.svg": svg(
    base(palettes.day) +
      forest(41, 8, 350, 400, greens, 0.3) +
      `<path d="M220 470 Q400 230 580 470" fill="none" stroke="#6B4A2F" stroke-width="12"/><path d="M260 470 Q400 290 540 470" fill="none" stroke="#6B4A2F" stroke-width="8" opacity="0.7"/>` +
      (() => {
        const r = rng(44);
        let s = "";
        for (let i = 0; i < 16; i++) {
          const x = 40 + i * 48 + r() * 10;
          const y = 470 + r() * 90;
          s += `<ellipse cx="${x}" cy="${y}" rx="34" ry="22" fill="#1E7A52"/>`;
          for (let j = 0; j < 5; j++) s += `<circle cx="${x - 20 + r() * 40}" cy="${y - 14 + r() * 18}" r="${5 + r() * 4}" fill="${["#E8467A", "#F28DB2", "#FFD1DC", "#D7263D"][Math.floor(r() * 4)]}"/>`;
        }
        for (let j = 0; j < 24; j++) {
          const t = j / 23;
          const x = 220 + t * 360;
          const y = 470 - Math.sin(t * Math.PI) * 235 + (r() - 0.5) * 16;
          s += `<circle cx="${x}" cy="${y}" r="${6 + r() * 4}" fill="${["#E8467A", "#F28DB2", "#FFD1DC"][Math.floor(r() * 3)]}"/>`;
        }
        return s;
      })(),
  ),
  "spots/viewpoint.svg": svg(
    base(palettes.golden) +
      `<ellipse cx="420" cy="455" rx="260" ry="46" fill="#3A8FA8" opacity="0.75"/><ellipse cx="420" cy="448" rx="200" ry="26" fill="#9FE3F0" opacity="0.25"/>` +
      `<g fill="#0E3A2C"><rect x="520" y="300" width="120" height="110"/><rect x="540" y="250" width="30" height="60"/><path d="M540 250 l15 -30 l15 30z"/><rect x="600" y="270" width="26" height="40"/><path d="M600 270 l13 -24 l13 24z"/></g>` +
      forest(51, 16, 370, 430, greens, 0.35) +
      `<path d="M0 600 L0 500 Q160 460 300 520 L330 600Z" fill="#0A3A2B"/>` +
      `<g><circle cx="150" cy="468" r="10" fill="#F5FFFA"/><rect x="144" y="478" width="12" height="28" rx="5" fill="#19E6A2"/></g>`,
  ),
  "spots/pavilion.svg": svg(
    base(palettes.dusk) +
      forest(61, 10, 350, 420, greens, 0.35) +
      `<g><rect x="260" y="330" width="280" height="150" fill="#D9CBB0"/><path d="M240 330 L400 240 L560 330Z" fill="#8C6A4A"/>` +
      [290, 345, 400, 455, 510].map((x) => `<rect x="${x - 10}" y="345" width="20" height="135" fill="#F2E8D5"/>`).join("") +
      `<rect x="370" y="400" width="60" height="80" fill="#5B4632"/><rect x="250" y="478" width="300" height="16" fill="#BFB29A"/></g>` +
      `<text x="400" y="560" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#F4C95D" opacity="0.85">DEMO</text>`,
  ),
  "spots/ginkgo.svg": svg(
    base(palettes.golden) +
      forest(71, 8, 360, 420, greens, 0.35) +
      roundTree(400, 500, 2.2, "#D9A62E", "#F4C95D", "#5A3E28") +
      (() => {
        const r = rng(72);
        return Array.from({ length: 30 }, () => `<path transform="translate(${(r() * 800).toFixed(0)} ${(420 + r() * 170).toFixed(0)}) rotate(${(r() * 360).toFixed(0)})" d="M0 0 L-9 -14 Q0 -20 9 -14Z" fill="#F4C95D" opacity="0.85"/>`).join("");
      })(),
  ),
  "spots/cedar.svg": svg(
    base(palettes.dusk) +
      forest(81, 10, 360, 420, greens, 0.35) +
      `<g><rect x="388" y="220" width="24" height="290" fill="#5A3E28"/>` +
      [220, 290, 360, 430].map((y, i) => `<ellipse cx="${400 + (i % 2 ? 30 : -30)}" cy="${y}" rx="${190 - i * 10}" ry="26" fill="${i % 2 ? "#1C6A4C" : "#237A57"}"/>`).join("") +
      `</g>`,
  ),
  "spots/beech.svg": svg(base(palettes.dusk) + forest(91, 10, 360, 420, greens, 0.35) + roundTree(400, 500, 2.3, "#6B2E4A", "#8A3D5E", "#4A3A30")),
  "spots/pond.svg": svg(
    base(palettes.day) +
      forest(101, 14, 350, 410, greens, 0.35) +
      `<ellipse cx="400" cy="490" rx="360" ry="90" fill="#2E7F9A"/><ellipse cx="380" cy="480" rx="280" ry="50" fill="#9FE3F0" opacity="0.22"/>` +
      [[240, 500], [300, 470], [520, 510], [600, 480], [430, 530]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="10" fill="#2E9C6F"/><circle cx="${x + 8}" cy="${y - 4}" r="5" fill="#FFD1DC"/>`).join(""),
  ),
  "spots/glasshouse.svg": svg(
    base(palettes.night) +
      sparkle(111, 40, "#8AF4C9") +
      forest(112, 10, 380, 430, greens, 0.3) +
      `<g><path d="M180 480 V360 Q400 150 620 360 V480Z" fill="#8AF4C9" fill-opacity="0.18" stroke="#8AF4C9" stroke-opacity="0.8" stroke-width="3"/>` +
      [240, 300, 360, 420, 480, 540].map((x) => `<line x1="${x}" y1="480" x2="${x}" y2="${360 - Math.sin(((x - 180) / 440) * Math.PI) * 170}" stroke="#8AF4C9" stroke-opacity="0.5" stroke-width="2"/>`).join("") +
      `<path d="M180 400 Q400 230 620 400" fill="none" stroke="#8AF4C9" stroke-opacity="0.5" stroke-width="2"/>` +
      `<path d="M330 470 q-10 -120 40 -170 M330 470 q30 -90 90 -110 M470 470 q0 -100 -30 -150" stroke="#2E9C6F" stroke-width="8" fill="none"/>` +
      `<circle cx="400" cy="300" r="40" fill="#19E6A2" opacity="0.25"/></g>`,
  ),
  "spots/bamboo.svg": svg(
    base(palettes.day) +
      (() => {
        const r = rng(121);
        let s = "";
        for (let i = 0; i < 26; i++) {
          const x = 20 + i * 30 + r() * 12;
          const c = ["#3FA36E", "#2E8A5C", "#5CB87F"][i % 3];
          s += `<rect x="${x}" y="${120 + r() * 80}" width="12" height="480" rx="6" fill="${c}"/>`;
          for (let k = 0; k < 6; k++) s += `<rect x="${x - 1}" y="${200 + k * 70 + r() * 10}" width="14" height="3" fill="#1D6B4F"/>`;
          s += `<path d="M${x + 6} ${200 + r() * 60} q30 -20 50 -10 q-30 10 -50 10z" fill="#2A8F63"/>`;
        }
        return s;
      })(),
  ),
  "spots/placeholder.svg": svg(base(palettes.night) + sparkle(131, 50, "#8AF4C9") + forest(132, 16, 380, 520, greens, 0.45)),

  // --- Parcs ---
  "parks/meise.svg": svg(
    base(palettes.dusk) +
      sparkle(201, 20, "#F5FFFA") +
      `<ellipse cx="300" cy="455" rx="220" ry="36" fill="#2E7F9A" opacity="0.7"/>` +
      `<g fill="#0E3A2C" opacity="0.95"><rect x="200" y="330" width="120" height="100"/><rect x="220" y="280" width="28" height="60"/><path d="M220 280 l14 -28 l14 28z"/><rect x="280" y="296" width="24" height="44"/><path d="M280 296 l12 -22 l12 22z"/></g>` +
      `<path d="M470 430 V360 Q560 270 650 360 V430Z" fill="#8AF4C9" fill-opacity="0.2" stroke="#8AF4C9" stroke-opacity="0.8" stroke-width="2.5"/>` +
      forest(202, 22, 380, 560, greens, 0.45) +
      path("M60 600 C 200 520 320 560 420 500 S 640 470 760 520"),
  ),
  "parks/central-park.svg": svg(
    base(palettes.dusk) +
      `<g fill="#0B2E24">${[40, 90, 150, 220, 300, 380, 450, 520, 600, 660, 720].map((x, i) => `<rect x="${x}" y="${150 + ((i * 37) % 120)}" width="${40 + (i % 3) * 14}" height="300"/>`).join("")}</g>` +
      `<g fill="#F4C95D" opacity="0.5">${Array.from({ length: 60 }, (_, i) => `<rect x="${50 + ((i * 53) % 700)}" y="${180 + ((i * 29) % 150)}" width="4" height="6"/>`).join("")}</g>` +
      forest(211, 30, 390, 580, greens, 0.45),
  ),
  "parks/kew.svg": svg(
    base(palettes.day) +
      forest(221, 10, 360, 420, greens, 0.35) +
      `<path d="M150 470 V400 Q260 300 330 330 Q400 200 470 330 Q540 300 650 400 V470Z" fill="#F5FFFA" fill-opacity="0.35" stroke="#F5FFFA" stroke-opacity="0.9" stroke-width="3"/>` +
      forest(222, 10, 480, 580, greens, 0.5),
  ),
  "parks/jardin-des-plantes.svg": svg(
    base(palettes.golden) +
      `<path d="M340 600 L390 380 H410 L460 600Z" fill="#CDB88A" opacity="0.6"/>` +
      Array.from({ length: 6 }, (_, i) => roundTree(250 - i * 30, 600 - i * 36, 0.9 - i * 0.1, "#2F8A5C", "#3FA36E") + roundTree(550 + i * 30, 600 - i * 36, 0.9 - i * 0.1, "#2F8A5C", "#3FA36E")).reverse().join(""),
  ),
  "parks/hyde-park.svg": svg(
    base(palettes.dusk) +
      `<path d="M0 470 C 200 430 500 520 800 450 V520 C 500 580 200 500 0 540Z" fill="#2E7F9A" opacity="0.8"/>` +
      forest(241, 26, 370, 600, greens, 0.45),
  ),
  "parks/placeholder.svg": svg(base(palettes.night) + forest(251, 26, 380, 600, greens, 0.45)),

  // --- Parcours ---
  "trails/remarkable-trees.svg": svg(
    base(palettes.golden) +
      forest(301, 12, 360, 420, greens, 0.35) +
      path("M400 600 C 300 540 520 500 420 450 S 300 400 380 370", "#CDB88A", 26) +
      conifer(180, 560, 1.3, "#1A6A4B", "#15603F") +
      roundTree(640, 560, 1.4, "#2F8A5C", "#3FA36E") +
      roundTree(560, 470, 0.8, "#D9A62E", "#F4C95D") +
      `<g><circle cx="424" cy="470" r="9" fill="#F5FFFA"/><rect x="418" y="479" width="12" height="26" rx="5" fill="#19E6A2"/><circle cx="446" cy="480" r="7" fill="#F5FFFA"/><rect x="441" y="487" width="10" height="20" rx="4" fill="#F4C95D"/></g>`,
  ),
  "trails/placeholder.svg": svg(base(palettes.dusk) + path("M400 600 C 300 540 520 500 420 450", "#CDB88A", 26) + forest(311, 18, 380, 600, greens, 0.45)),
};

const root = resolve(__dirname, "../public/demo");
for (const [file, content] of Object.entries(scenes)) {
  const out = resolve(root, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
}
console.log(`${Object.keys(scenes).length} illustrations générées dans public/demo/`);
