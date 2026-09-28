/**
 * Données d'espèces (photos réelles + fiche) depuis des sources ouvertes, SANS clé :
 * iNaturalist (observations de science participative), GBIF (taxonomie, médias), Wikimedia Commons.
 * Fonctions PURES (testées) : analyse des réponses et filtrage des licences.
 *
 * Règles :
 * - licences libres réutilisables commercialement uniquement : CC0, CC BY, CC BY-SA
 *   (NC « non commercial », ND « pas de modification » et « tous droits réservés » exclues) ;
 * - crédit affiché (auteur, licence, source avec lien) ;
 * - ce sont des photos de l'ESPÈCE, pas du spécimen du parc.
 */
import type { LatLng } from "@/lib/domain/types";
import { distanceM } from "@/lib/geo";

export type SpeciesPhotoSource = "INATURALIST" | "GBIF" | "WIKIMEDIA";

export interface SpeciesPhoto {
  id: string;
  /** Vignette (~500 px) pour le bandeau */
  thumbUrl: string;
  /** Grande image (~1000–1600 px) pour la visionneuse */
  url: string;
  source: SpeciesPhotoSource;
  author: string;
  license: string;
  /** Page d'origine (observation, occurrence, fichier) */
  sourceUrl: string;
  /** Distance au parc (m), si la photo vient d'une observation géolocalisée */
  distanceM?: number;
  place?: string;
  observedOn?: string;
}

export interface SpeciesInfo {
  scientificName: string;
  commonName?: string;
  family?: string;
  /** Statut UICN (ex. « EN », « VU ») */
  iucn?: string;
  observationsCount?: number;
  wikipediaUrl?: string;
  inaturalistUrl?: string;
  gbifUrl?: string;
}

/** Normalise un code ou une URL de licence ; null si non libre (NC, ND, droits réservés…). */
export function normalizeLicense(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (/(^|[^a-z])(nc|nd)([^a-z]|$)|noncommercial|non-commercial|noderiv/.test(s)) return null;
  if (/cc0|publicdomain\/zero|public domain|^pd$/.test(s)) return "CC0";
  const v = s.match(/(\d\.\d)/)?.[1];
  if (/by-sa|by_sa|bysa/.test(s)) return `CC BY-SA${v ? ` ${v}` : ""}`;
  if (/(^|[^a-z])by([^a-z-]|$)|licenses\/by\//.test(s) || s === "cc-by") return `CC BY${v ? ` ${v}` : ""}`;
  return null;
}

const toLatLng = (loc: string | undefined): LatLng | null => {
  const m = loc?.split(",").map(Number);
  return m && m.length === 2 && m.every(Number.isFinite) ? { lat: m[0], lng: m[1] } : null;
};

/** iNaturalist `/v1/observations` → photos libres (taille « medium » et « large »). */
export function parseINatObservations(json: unknown, near?: LatLng): SpeciesPhoto[] {
  const results = (json as { results?: unknown[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const out: SpeciesPhoto[] = [];
  for (const r of results as {
    id?: number;
    uri?: string;
    location?: string;
    place_guess?: string;
    observed_on?: string;
    user?: { name?: string; login?: string };
    photos?: { id?: number; url?: string; license_code?: string | null; attribution?: string }[];
  }[]) {
    const loc = toLatLng(r.location);
    for (const p of r.photos ?? []) {
      const license = normalizeLicense(p.license_code);
      if (!license || !p.url || !p.id) continue;
      out.push({
        id: `inat-${p.id}`,
        thumbUrl: p.url.replace(/\/square\./, "/medium."),
        url: p.url.replace(/\/square\./, "/large."),
        source: "INATURALIST",
        author: r.user?.name?.trim() || r.user?.login || "iNaturalist",
        license,
        sourceUrl: r.uri ?? `https://www.inaturalist.org/observations/${r.id}`,
        distanceM: near && loc ? Math.round(distanceM(near, loc)) : undefined,
        place: r.place_guess || undefined,
        observedOn: r.observed_on || undefined,
      });
      break; // une photo par observation : variété des points de vue
    }
  }
  return out;
}

/** iNaturalist `/v1/taxa?q=…&locale=…` → fiche (nom commun localisé, statut, observations). */
export function parseINatTaxon(json: unknown, scientificName: string): Partial<SpeciesInfo> | null {
  const results = (json as { results?: unknown[] } | null)?.results;
  if (!Array.isArray(results)) return null;
  const wanted = scientificName.toLowerCase();
  const t = (results as {
    id?: number;
    name?: string;
    rank?: string;
    preferred_common_name?: string;
    wikipedia_url?: string | null;
    observations_count?: number;
    conservation_status?: { iucn?: number; status?: string } | null;
  }[]).find((x) => x.name?.toLowerCase() === wanted) ?? (results[0] as { id?: number; name?: string } | undefined);
  if (!t?.id) return null;
  const full = t as {
    id: number;
    preferred_common_name?: string;
    wikipedia_url?: string | null;
    observations_count?: number;
    conservation_status?: { status?: string } | null;
  };
  return {
    commonName: full.preferred_common_name || undefined,
    wikipediaUrl: full.wikipedia_url || undefined,
    observationsCount: full.observations_count,
    iucn: full.conservation_status?.status?.toUpperCase() || undefined,
    inaturalistUrl: `https://www.inaturalist.org/taxa/${full.id}`,
  };
}

/** GBIF `/v1/species/match` → famille et clé du taxon. */
export function parseGbifMatch(json: unknown): { usageKey: number; family?: string } | null {
  const m = json as { usageKey?: number; family?: string; matchType?: string; confidence?: number } | null;
  if (!m?.usageKey || m.matchType === "NONE" || (m.confidence ?? 0) < 80) return null;
  return { usageKey: m.usageKey, family: m.family };
}

/** GBIF `/v1/occurrence/search?mediaType=StillImage` → photos libres géolocalisées. */
export function parseGbifOccurrences(json: unknown, near?: LatLng): SpeciesPhoto[] {
  const results = (json as { results?: unknown[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const out: SpeciesPhoto[] = [];
  for (const r of results as {
    key?: number;
    decimalLatitude?: number;
    decimalLongitude?: number;
    locality?: string;
    country?: string;
    eventDate?: string;
    publisher?: string;
    media?: { type?: string; identifier?: string; license?: string; creator?: string; rightsHolder?: string }[];
  }[]) {
    const m = r.media?.find((x) => x.type === "StillImage" && x.identifier);
    const license = normalizeLicense(m?.license);
    if (!m?.identifier || !license || !r.key) continue;
    const loc = Number.isFinite(r.decimalLatitude) && Number.isFinite(r.decimalLongitude) ? { lat: r.decimalLatitude!, lng: r.decimalLongitude! } : null;
    out.push({
      id: `gbif-${r.key}`,
      thumbUrl: m.identifier,
      url: m.identifier,
      source: "GBIF",
      author: m.creator || m.rightsHolder || "GBIF",
      license,
      sourceUrl: `https://www.gbif.org/occurrence/${r.key}`,
      distanceM: near && loc ? Math.round(distanceM(near, loc)) : undefined,
      place: [r.locality, r.country].filter(Boolean).join(", ") || undefined,
      observedOn: r.eventDate?.slice(0, 10),
    });
  }
  return out;
}

/** Fusionne les sources : proches du parc d'abord, sans doublon d'URL, limité. */
export function mergeSpeciesPhotos(lists: SpeciesPhoto[][], max = 12): SpeciesPhoto[] {
  const seen = new Set<string>();
  const all = lists.flat().filter((p) => {
    const key = p.url.replace(/\/(square|small|medium|large|original)\./, "/");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const near = all.filter((p) => p.distanceM !== undefined && p.distanceM <= 50_000).sort((a, b) => a.distanceM! - b.distanceM!);
  const rest = all.filter((p) => !near.includes(p));
  return [...near, ...rest].slice(0, max);
}

/** Nom scientifique interrogeable : retire la forme/cultivar et « sp. ». */
export function queryableName(scientificName: string): string {
  return scientificName
    .replace(/\s+(f\.|var\.|subsp\.|cv\.)\s.*$/i, "")
    .replace(/\s+sp\.?$/i, "")
    .replace(/'.*'/, "")
    .trim();
}
