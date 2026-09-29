import type { LatLng } from "@/lib/domain/types";

/**
 * Modèle multi-parcs (local aujourd'hui, Supabase plus tard) : chaque parc a ses propres lieux,
 * avec une catégorie souple et des attributs optionnels — jamais de colonnes rigides du type
 * `has_lake` / `has_castle`. Voir docs/PARKS_DATA_AND_MEDIA.md.
 */

/** Statut de confiance d'une donnée. `park_verified` et `published` exigent une source réelle. */
export type ContentStatus = "demo" | "proposed" | "park_verified" | "published";

export const PLACE_CATEGORIES = [
  "tree",
  "ancient_tree",
  "plant",
  "flower",
  "greenhouse",
  "lake",
  "pond",
  "river",
  "castle",
  "historic_building",
  "ruin",
  "cafe",
  "restaurant",
  "viewpoint",
  "garden",
  "forest",
  "playground",
  "picnic_area",
  "toilet",
  "accessible_toilet",
  "entrance",
  "parking",
  "bike_parking",
  "photo_spot",
  "history",
  "challenge",
  "museum",
  "walk",
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export interface DataSource {
  label: string;
  url: string;
  /** Date de consultation (AAAA-MM-JJ). */
  checkedAt?: string;
}

export interface ParkPlace {
  id: string;
  parkSlug: string;
  slug: string;
  /** Nom affiché (fr requis ; repli sur fr). */
  name: { fr: string; nl?: string; en?: string };
  category: PlaceCategory;
  /** Position ; `approximate` = à confirmer sur place ou avec le parc. */
  location?: LatLng & { approximate?: boolean };
  status: ContentStatus;
  source?: DataSource;
  /** Validé par (personne / organisme), requis pour park_verified et published. */
  verifiedBy?: string;
  featured?: boolean;
  accessibility?: { pmr?: boolean | "partial" };
}

export type MediaKind = "place_photo" | "species_photo" | "illustration";
export type MediaUsageStatus = "to_verify" | "approved" | "rejected";

export interface ParkMedia {
  id: string;
  parkSlug: string;
  placeSlug?: string;
  kind: MediaKind;
  /** Page de la source (ex. page du fichier sur Wikimedia Commons). */
  sourceUrl: string;
  /** Image à afficher (connue seulement après vérification). */
  url?: string;
  originalUrl?: string;
  author?: string;
  license?: string;
  attribution?: string;
  fetchedAt?: string;
  usageStatus: MediaUsageStatus;
  verifiedBy?: string;
}

export interface ParkFeature {
  feature: PlaceCategory;
  status: ContentStatus;
  source?: DataSource;
}

export interface ParkProfile {
  parkSlug: string;
  region: string;
  country: string;
  /** Statut global des données du parc. */
  dataStatus: ContentStatus;
  /** Particularités mises en avant sur la fiche (ordre d'affichage). */
  features: ParkFeature[];
  /** Sources officielles consultées (horaires, accès, règles : uniquement depuis ces sources). */
  sources: DataSource[];
  /** Contenu (lieux, parcours) encore en préparation. */
  contentInPreparation: boolean;
}
