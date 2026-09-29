/**
 * Vérifie les licences des photos candidates des parcs (Wikimedia Commons) — sans rien publier.
 * Usage : npm run media:verify   (accès réseau à commons.wikimedia.org requis)
 *
 * Pour chaque fichier : licence libre réutilisable (CC0, domaine public, CC BY, CC BY-SA) ?
 * auteur ? URL d'image ? Résultat écrit dans src/lib/places/media-license-check.json.
 * La PUBLICATION reste manuelle : une personne doit confirmer que la photo montre bien le lieu,
 * puis passer `usageStatus` à "approved" avec `verifiedBy` dans src/lib/places/data.ts.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PARK_MEDIA } from "../src/lib/places/data";
import { isFreeLicense, stripHtml } from "../src/lib/photos/wikimedia";

type Meta = Record<string, { value?: string } | undefined>;

async function main() {
  const candidates = PARK_MEDIA.filter((m) => m.sourceUrl.includes("commons.wikimedia.org/wiki/File:"));
  const titles = candidates.map((m) => decodeURIComponent(m.sourceUrl.split("/wiki/")[1]));
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo" +
    "&iiprop=url|size|mime|extmetadata&iiurlwidth=1600&titles=" +
    encodeURIComponent(titles.join("|"));
  const res = await fetch(url, { headers: { "User-Agent": "ParkQuest media check (https://github.com/vivonswebdev/Parkquest)" } });
  if (!res.ok) throw new Error(`Commons : HTTP ${res.status}`);
  const json = (await res.json()) as { query?: { pages?: { title: string; missing?: boolean; imageinfo?: { thumburl?: string; url?: string; extmetadata?: Meta }[] }[] } };
  const byTitle = new Map((json.query?.pages ?? []).map((p) => [p.title.replace(/ /g, "_"), p]));
  const fetchedAt = new Date().toISOString();
  const report = candidates.map((m, i) => {
    const page = byTitle.get(titles[i].replace(/ /g, "_"));
    const ii = page?.imageinfo?.[0];
    const meta = ii?.extmetadata ?? {};
    const license = meta.LicenseShortName?.value?.trim();
    const author = stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value) || undefined;
    return {
      id: m.id,
      sourceUrl: m.sourceUrl,
      found: Boolean(ii),
      url: ii?.thumburl,
      originalUrl: ii?.url,
      author,
      license,
      licenseUrl: meta.LicenseUrl?.value,
      attribution: author && license ? `© ${author} · ${license} · Wikimedia Commons` : undefined,
      description: stripHtml(meta.ImageDescription?.value).slice(0, 200) || undefined,
      freeLicense: isFreeLicense(license),
      fetchedAt,
      // Jamais « approved » automatiquement : le sujet réel doit être confirmé par une personne.
      usageStatus: "to_verify",
    };
  });
  const out = resolve(__dirname, "../src/lib/places/media-license-check.json");
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  for (const r of report) console.log(`${r.freeLicense ? "✓" : "✗"} ${r.id} — ${r.license ?? "licence inconnue"} — ${r.author ?? "auteur inconnu"}`);
  console.log(`\nRapport : ${out}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
