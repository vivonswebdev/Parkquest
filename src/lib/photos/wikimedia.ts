/**
 * Wikimedia Commons : photos libres d'espèces (arbres, plantes) pour illustrer les fiches.
 * Fonctions PURES (testées) ; l'appel réseau est dans scripts/wikimedia-photos.ts.
 *
 * Règles :
 * - uniquement des licences libres réutilisables (CC0, domaine public, CC BY, CC BY-SA) ;
 * - crédit obligatoire affiché : auteur, licence, lien vers la page du fichier ;
 * - ce sont des photos de l'ESPÈCE, pas de l'arbre du parc : légende « photo d'illustration » ;
 * - toujours soumises à la validation de l'équipe du parc avant publication.
 */

export interface CommonsCandidate {
  title: string;
  pageUrl: string;
  imageUrl: string;
  width: number;
  height: number;
  license: string;
  author: string;
}

const FREE_LICENSE = /^(cc0|public domain|pd\b|cc by(-sa)? \d(\.\d)?)/i;
const MIN_SIDE = 1000;

/** Licence libre et réutilisable (exclut GFDL seule, usage équitable, « tous droits réservés »…). */
export function isFreeLicense(shortName: string | undefined): boolean {
  if (!shortName) return false;
  const s = shortName.trim();
  if (/\bnc\b|\bnd\b|non-?commercial|no ?deriv/i.test(s)) return false;
  return FREE_LICENSE.test(s);
}

/** Texte brut d'un champ HTML de métadonnées (auteur, crédit). */
export function stripHtml(html: string | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface ApiImageInfo {
  url?: string;
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  width?: number;
  height?: number;
  descriptionurl?: string;
  mime?: string;
  extmetadata?: Record<string, { value?: string } | undefined>;
}

interface ApiPage {
  title?: string;
  index?: number;
  imageinfo?: ApiImageInfo[];
}

/**
 * Extrait les candidats valables d'une réponse `action=query&generator=search&prop=imageinfo`
 * (iiprop=url|size|mime|extmetadata, iiurlwidth=1600), triés selon l'ordre de pertinence.
 */
export function parseCommonsResponse(json: unknown): CommonsCandidate[] {
  const pages = (json as { query?: { pages?: Record<string, ApiPage> | ApiPage[] } } | null)?.query?.pages;
  if (!pages) return [];
  const list = (Array.isArray(pages) ? pages : Object.values(pages)).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const out: CommonsCandidate[] = [];
  for (const p of list) {
    const ii = p.imageinfo?.[0];
    if (!p.title || !ii?.descriptionurl) continue;
    if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    if (Math.min(ii.width ?? 0, ii.height ?? 0) < MIN_SIDE) continue;
    const meta = ii.extmetadata ?? {};
    const license = meta.LicenseShortName?.value?.trim();
    if (!isFreeLicense(license)) continue;
    const author = stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value) || "Wikimedia Commons";
    out.push({
      title: p.title.replace(/^File:/, ""),
      pageUrl: ii.descriptionurl,
      imageUrl: ii.thumburl ?? ii.url ?? "",
      width: ii.thumbwidth ?? ii.width ?? 0,
      height: ii.thumbheight ?? ii.height ?? 0,
      license: license!,
      author: author.slice(0, 120),
    });
  }
  return out.filter((c) => c.imageUrl);
}

/** URL de recherche Commons (espace Fichier) pour un nom scientifique. */
export function commonsSearchUrl(scientificName: string, limit = 8): string {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  const q: Record<string, string> = {
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: String(limit),
    gsrsearch: `"${scientificName.replace(/ f\. .*| sp\.$/, "")}" filetype:bitmap`,
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1600",
    iiextmetadatafilter: "LicenseShortName|Artist|Credit",
  };
  Object.entries(q).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}
