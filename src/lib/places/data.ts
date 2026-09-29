import type { ParkMedia, ParkPlace, ParkProfile } from "./types";

/**
 * Données multi-parcs LOCALES (démonstration). Rien ici n'est présenté comme officiel :
 * statut `demo` ou `proposed`, sources indiquées mais non vérifiées depuis cet environnement.
 * Horaires, accès et règles : uniquement via les sources officielles (liens affichés).
 * Interface stable (`placesRepo`) : branchable plus tard sur Supabase sans toucher aux composants.
 */

const MEISE_SITE = { label: "Plantentuin Meise — site officiel", url: "https://www.plantentuinmeise.be/en" };
const SOLVAY_SITE = { label: "Château de La Hulpe — site officiel", url: "https://www.chateaudelahulpe.be/" };
const SOLVAY_BW = { label: "Destination Brabant wallon — Domaine régional Solvay", url: "https://www.destinationbw.be/fr/decouvrir/les-incontournables/le-domaine-regional-solvay/" };
const SOLVAY_PAJAWA = { label: "PAJAWA — Domaine régional Solvay", url: "https://www.pajawa.be/fr/parcs-et-jardins/domaine-regional-solvay-chateau-de-la-hulpe" };
const SCHELDE_NP = { label: "Nationaal Park Scheldevallei — Stad Dendermonde", url: "https://www.nationaalparkscheldevallei.be/toegangspoorten/stad-dendermonde" };
const SCHELDE_VISIT = { label: "Visit Dendermonde — Scheldt Valley National Park", url: "https://visit.dendermonde.be/en/scheldt-valley-national-park" };

export const PARK_PROFILES: ParkProfile[] = [
  {
    parkSlug: "plantentuin-meise",
    region: "Brabant flamand",
    country: "BE",
    dataStatus: "demo",
    contentInPreparation: false,
    features: [
      { feature: "garden", status: "demo", source: MEISE_SITE },
      { feature: "tree", status: "demo", source: MEISE_SITE },
      { feature: "greenhouse", status: "demo", source: MEISE_SITE },
      { feature: "castle", status: "proposed", source: MEISE_SITE },
      { feature: "pond", status: "demo", source: MEISE_SITE },
    ],
    sources: [MEISE_SITE],
  },
  {
    parkSlug: "dendermonde-vallee-escaut",
    region: "Flandre orientale",
    country: "BE",
    dataStatus: "proposed",
    contentInPreparation: true,
    // Contexte général (vallée de l'Escaut) : aucun lieu précis n'est fixé sans source officielle.
    features: [
      { feature: "river", status: "proposed", source: SCHELDE_NP },
      { feature: "walk", status: "proposed", source: SCHELDE_NP },
      { feature: "viewpoint", status: "proposed", source: SCHELDE_VISIT },
      { feature: "history", status: "proposed", source: SCHELDE_VISIT },
    ],
    sources: [SCHELDE_NP, SCHELDE_VISIT],
  },
  {
    parkSlug: "domaine-solvay-la-hulpe",
    region: "Brabant wallon",
    country: "BE",
    dataStatus: "proposed",
    contentInPreparation: true,
    features: [
      { feature: "castle", status: "proposed", source: SOLVAY_SITE },
      { feature: "pond", status: "proposed", source: SOLVAY_BW },
      { feature: "forest", status: "proposed", source: SOLVAY_BW },
      { feature: "flower", status: "proposed", source: SOLVAY_BW },
      { feature: "garden", status: "proposed", source: SOLVAY_PAJAWA },
    ],
    sources: [SOLVAY_SITE, SOLVAY_BW, SOLVAY_PAJAWA],
  },
];

/**
 * Lieux proposés (sans coordonnées tant qu'elles ne sont pas confirmées : ils apparaissent dans la
 * fiche, pas sur la carte). Les lieux de Meise déjà en démonstration restent les spots existants.
 */
export const PARK_PLACES: ParkPlace[] = [
  { id: "meise-bouchout", parkSlug: "plantentuin-meise", slug: "chateau-de-bouchout", name: { fr: "Château de Bouchout", nl: "Kasteel van Bouchout", en: "Bouchout Castle" }, category: "castle", status: "proposed", source: MEISE_SITE },
  { id: "solvay-chateau", parkSlug: "domaine-solvay-la-hulpe", slug: "chateau-de-la-hulpe", name: { fr: "Château de La Hulpe", nl: "Kasteel van Terhulpen", en: "La Hulpe Castle" }, category: "castle", status: "proposed", source: SOLVAY_SITE, featured: true },
  { id: "solvay-etangs", parkSlug: "domaine-solvay-la-hulpe", slug: "etangs", name: { fr: "Étangs du domaine", nl: "Vijvers van het domein", en: "Estate ponds" }, category: "pond", status: "proposed", source: SOLVAY_BW },
  { id: "solvay-bois", parkSlug: "domaine-solvay-la-hulpe", slug: "bois", name: { fr: "Bois du domaine", nl: "Bossen van het domein", en: "Estate woods" }, category: "forest", status: "proposed", source: SOLVAY_BW },
  { id: "solvay-rhodo", parkSlug: "domaine-solvay-la-hulpe", slug: "rhododendrons", name: { fr: "Rhododendrons", nl: "Rododendrons", en: "Rhododendrons" }, category: "flower", status: "proposed", source: SOLVAY_BW },
  { id: "solvay-pelouses", parkSlug: "domaine-solvay-la-hulpe", slug: "pelouses", name: { fr: "Grandes pelouses", nl: "Grote grasvelden", en: "Great lawns" }, category: "garden", status: "proposed", source: SOLVAY_PAJAWA },
  { id: "solvay-folon", parkSlug: "domaine-solvay-la-hulpe", slug: "fondation-folon", name: { fr: "Fondation Folon (si incluse dans le parcours)", nl: "Fondation Folon (indien opgenomen)", en: "Folon Foundation (if included)" }, category: "museum", status: "proposed", source: SOLVAY_PAJAWA },
  { id: "solvay-parking", parkSlug: "domaine-solvay-la-hulpe", slug: "parking", name: { fr: "Parking", nl: "Parking", en: "Car park" }, category: "parking", status: "proposed", source: SOLVAY_BW },
];

/**
 * Photos candidates (Wikimedia Commons, proposées) : NON affichées tant qu'elles ne sont pas vérifiées
 * (licence, auteur, sujet réel). Vérification : `npm run media:verify` (accès réseau à Commons requis).
 */
export const PARK_MEDIA: ParkMedia[] = [
  "Rozenbogen_Plantentuin_Meise_01.jpg",
  "Meise-Plantentuin_Meise_(6).jpg",
  "Meise-Plantentuin_Meise_(39).jpg",
  "Nationale_Plantentuin,_Meise_07.jpg",
  "Nationale_Plantentuin,_Meise_05.jpg",
  "20100620_Plantentuin_Meise_(0049).jpg",
  "20100620_Plantentuin_Meise_(0009).jpg",
].map((file, i) => ({
  id: `meise-commons-${i + 1}`,
  parkSlug: "plantentuin-meise",
  kind: "place_photo" as const,
  sourceUrl: `https://commons.wikimedia.org/wiki/File:${file}`,
  usageStatus: "to_verify" as const,
}));

export const placesRepo = {
  getProfile: (parkSlug: string) => PARK_PROFILES.find((p) => p.parkSlug === parkSlug) ?? null,
  listPlaces: (parkSlug: string) => PARK_PLACES.filter((p) => p.parkSlug === parkSlug),
  listMedia: (parkSlug?: string) => (parkSlug ? PARK_MEDIA.filter((m) => m.parkSlug === parkSlug) : PARK_MEDIA),
  listProfiles: () => PARK_PROFILES,
};
