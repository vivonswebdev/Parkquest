import "server-only";
import type { LatLng } from "@/lib/domain/types";
import { commonsSearchUrl, parseCommonsResponse } from "@/lib/photos/wikimedia";
import {
  mergeSpeciesPhotos,
  parseGbifMatch,
  parseGbifOccurrences,
  parseINatObservations,
  parseINatTaxon,
  queryableName,
  type SpeciesInfo,
  type SpeciesPhoto,
} from "./parse";

export type { SpeciesInfo, SpeciesPhoto };

/**
 * Photos réelles et fiche d'une espèce, depuis des sources ouvertes SANS clé :
 * iNaturalist → GBIF → Wikimedia Commons. Aussi en mode démo (données publiques réelles).
 *
 * - Seul le nom scientifique et la position du PARC sont envoyés (jamais celle du visiteur).
 * - Cache serveur 7 jours ; 4 s max par appel ; en cas d'échec, la fiche s'affiche sans ces données.
 * - `SPECIES_DATA=off` désactive tout appel (tests hors ligne, CI).
 */
const ENABLED = process.env.SPECIES_DATA !== "off";
const WEEK = 60 * 60 * 24 * 7;
const USER_AGENT = "ParkQuest/0.1 (https://github.com/vivonswebdev/Parkquest)";
const NEAR_RADIUS_KM = 50;

// Coupe-circuit : un hôte injoignable n'est plus sollicité pendant 10 minutes
// (évite d'attendre le délai à chaque page lors d'un build hors ligne).
const downUntil = new Map<string, number>();

async function getJson(url: string): Promise<unknown | null> {
  const host = new URL(url).host;
  if ((downUntil.get(host) ?? 0) > Date.now()) return null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: WEEK },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    downUntil.set(host, Date.now() + 10 * 60 * 1000);
    return null;
  }
}

const FREE_LICENSES = "cc0,cc-by,cc-by-sa";

function inatObservationsUrl(name: string, near?: LatLng): string {
  const u = new URL("https://api.inaturalist.org/v1/observations");
  u.searchParams.set("taxon_name", name);
  u.searchParams.set("photos", "true");
  u.searchParams.set("photo_license", FREE_LICENSES);
  u.searchParams.set("quality_grade", "research");
  u.searchParams.set("order_by", "votes");
  u.searchParams.set("per_page", "12");
  if (near) {
    u.searchParams.set("lat", near.lat.toFixed(3));
    u.searchParams.set("lng", near.lng.toFixed(3));
    u.searchParams.set("radius", String(NEAR_RADIUS_KM));
  }
  return u.toString();
}

export interface SpeciesData {
  info: SpeciesInfo;
  photos: SpeciesPhoto[];
}

export async function getSpeciesData(scientificName: string | undefined, locale: string, parkLocation: LatLng): Promise<SpeciesData | null> {
  if (!ENABLED || !scientificName) return null;
  const name = queryableName(scientificName);
  const q = encodeURIComponent(name);

  const [nearObs, taxon, match] = await Promise.all([
    getJson(inatObservationsUrl(name, parkLocation)),
    getJson(`https://api.inaturalist.org/v1/taxa?q=${q}&is_active=true&per_page=5&locale=${locale}`),
    getJson(`https://api.gbif.org/v1/species/match?name=${q}`),
  ]);

  const lists: SpeciesPhoto[][] = [parseINatObservations(nearObs, parkLocation)];
  // Pas assez de photos près du parc : compléter avec le monde entier, puis GBIF, puis Wikimedia.
  if (lists.flat().length < 6) lists.push(parseINatObservations(await getJson(inatObservationsUrl(name)), parkLocation));
  const gbif = parseGbifMatch(match);
  if (lists.flat().length < 6 && gbif) {
    lists.push(parseGbifOccurrences(await getJson(`https://api.gbif.org/v1/occurrence/search?taxonKey=${gbif.usageKey}&mediaType=StillImage&limit=20`), parkLocation));
  }
  if (lists.flat().length < 4) {
    lists.push(
      parseCommonsResponse(await getJson(commonsSearchUrl(name))).map((c, i) => ({
        id: `wm-${i}-${c.title}`,
        thumbUrl: c.imageUrl,
        url: c.imageUrl,
        source: "WIKIMEDIA" as const,
        author: c.author,
        license: c.license,
        sourceUrl: c.pageUrl,
      })),
    );
  }

  const inat = parseINatTaxon(taxon, name);
  const photos = mergeSpeciesPhotos(lists);
  if (!photos.length && !inat && !gbif) return null;
  return {
    info: {
      scientificName,
      ...inat,
      family: gbif?.family,
      gbifUrl: gbif ? `https://www.gbif.org/species/${gbif.usageKey}` : undefined,
    },
    photos,
  };
}
