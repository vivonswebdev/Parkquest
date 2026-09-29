/**
 * Types métier de ParkQuest.
 *
 * Deux familles :
 *  - `*Record` : forme « source » avec traductions (miroir des tables Supabase),
 *    utilisée par le jeu de données de démo et le générateur de seed.
 *  - types résolus (`Park`, `Spot`…) : déjà traduits pour une langue donnée,
 *    consommés par l'UI. L'UI ne manipule jamais de colonnes par langue.
 */

export const LOCALES = ["fr", "nl", "en", "es", "de"] as const;
export type Locale = (typeof LOCALES)[number];

/** Contenu traduit : clé = code langue (on accepte d'autres langues que celles de l'UI). */
export type Translations<T> = Partial<Record<Locale | (string & {}), T>>;

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ParkType =
  | "BOTANICAL_GARDEN"
  | "ARBORETUM"
  | "URBAN_PARK"
  | "HISTORIC_PARK"
  | "NATURAL_PARK";
export type SpotKind =
  | "TREE"
  | "PLANT"
  | "FLOWER"
  | "GARDEN"
  | "HISTORIC"
  | "BUILDING"
  | "STATUE"
  | "VIEWPOINT"
  | "WATER"
  | "OTHER";
export type FacilityType =
  | "ENTRANCE"
  | "PARKING"
  | "PARKING_PMR"
  | "BIKE_PARKING"
  | "TOILETS"
  | "TOILETS_PMR"
  | "CAFE"
  | "BENCH"
  | "WATER"
  | "VIEWPOINT"
  | "PLAYGROUND"
  | "INFO_POINT"
  | "PUBLIC_TRANSPORT";
export type TrailDifficulty = "EASY" | "MEDIUM" | "HARD";
export type ChallengeType = "PHOTO" | "OBSERVATION" | "WALK" | "QUIZ_STREAK";
export type BadgeCriteria =
  | "SPOTS_DISCOVERED"
  | "QUIZZES_PASSED"
  | "PHOTOS_APPROVED"
  | "DISTANCE_M"
  | "TRAILS_COMPLETED"
  | "CHALLENGES_COMPLETED";
export type TrailAudience = "FAMILY" | "KIDS" | "CURIOUS" | "SCHOOL" | "SENIORS" | "SOLO";
export type TrailTheme =
  | "ESSENTIALS"
  | "TREES"
  | "FLOWERS"
  | "HISTORY"
  | "PHOTO"
  | "CALM"
  | "PMR";

export interface LatLng {
  lat: number;
  lng: number;
}

// ---------------------------------------------------------------------------
// Records source (avec traductions)
// ---------------------------------------------------------------------------

export interface ParkRecord {
  id: string;
  slug: string;
  type: ParkType;
  status: ContentStatus;
  isDemoData: boolean;
  countryCode: string;
  city: string;
  timezone: string;
  defaultLocale: string;
  availableLocales: string[];
  location: LatLng;
  /** Emprise approximative [sud-ouest, nord-est] pour la carte de repli. */
  bounds: [LatLng, LatLng];
  defaultZoom: number;
  brandColor?: string;
  coverImageUrl: string;
  isFree?: boolean;
  isPmrFriendly?: boolean;
  tags: string[];
  translations: Translations<{
    name: string;
    tagline?: string;
    description?: string;
    practicalNotes?: string;
    accessibilityNotes?: string;
    transportNotes?: string;
    rules?: string;
  }>;
  practicalInfo?: {
    addressLine?: string;
    postalCode?: string;
    websiteUrl?: string;
    ticketUrl?: string;
    phone?: string;
    openingHours: OpeningHours[];
    prices: Price[];
  };
}

export interface OpeningHours {
  /** 1 = lundi … 7 = dimanche */
  days: number[];
  open: string;
  close: string;
  season?: "summer" | "winter";
}

export interface Price {
  /** Clé i18n (next-intl : practical.prices.<labelKey>) */
  labelKey: "adult" | "child" | "senior" | "family" | "free";
  amount: number;
  currency: string;
}

export interface SpotCategoryRecord {
  id: string;
  parkId: string | null;
  key: string;
  icon: string;
  color: string;
  sortOrder: number;
  translations: Translations<{ name: string }>;
}

export interface SpotFacts {
  /** Clé d'origine (traduite dans l'UI) */
  originKey?: string;
  plantedYear?: number;
  heightM?: number;
  girthM?: number;
  bloomMonths?: number[];
  builtYear?: number;
}

export interface SpotRecord {
  id: string;
  parkId: string;
  slug: string;
  kind: SpotKind;
  status: ContentStatus;
  isDemoData: boolean;
  location: LatLng;
  discoveryRadiusM: number;
  scientificName?: string;
  facts: SpotFacts;
  coverImageUrl: string;
  isPmrAccessible?: boolean;
  pointsValue: number;
  sortOrder: number;
  categoryKeys: string[];
  translations: Translations<{
    name: string;
    label?: string;
    summary?: string;
    about?: string;
    funFact?: string;
    directions?: string;
    origin?: string;
  }>;
}

export interface TrailSegmentRecord {
  id: string;
  fromSpotId: string | null;
  toSpotId: string;
  position: number;
  /** Polyligne [lng, lat] (ordre GeoJSON) */
  path: [number, number][];
  translations: Translations<{ instruction: string }>;
}

export interface TrailRecord {
  id: string;
  parkId: string;
  slug: string;
  status: ContentStatus;
  isDemoData: boolean;
  difficulty: TrailDifficulty;
  durationMin: number;
  distanceM: number;
  audiences: TrailAudience[];
  themes: TrailTheme[];
  isPmrAccessible?: boolean;
  pmrPartial: boolean;
  coverImageUrl: string;
  completionPoints: number;
  sortOrder: number;
  /** Point de départ du parcours (entrée) */
  start: LatLng;
  spotIds: string[];
  segments: TrailSegmentRecord[];
  translations: Translations<{
    name: string;
    summary?: string;
    description?: string;
    accessibilityNotes?: string;
  }>;
}

export interface FacilityRecord {
  id: string;
  parkId: string;
  type: FacilityType;
  status: ContentStatus;
  isDemoData: boolean;
  location: LatLng;
  isPmrAccessible?: boolean;
  details: Record<string, string | number | boolean>;
  sortOrder: number;
  translations: Translations<{ name: string; description?: string }>;
}

export interface QuizAnswerRecord {
  id: string;
  isCorrect: boolean;
  position: number;
  translations: Translations<{ label: string }>;
}

export interface QuizRecord {
  id: string;
  parkId: string;
  spotId: string | null;
  status: ContentStatus;
  isDemoData: boolean;
  pointsValue: number;
  sortOrder: number;
  answers: QuizAnswerRecord[];
  translations: Translations<{ question: string; explanation?: string }>;
}

export interface ChallengeRecord {
  id: string;
  parkId: string;
  spotId: string | null;
  type: ChallengeType;
  status: ContentStatus;
  isDemoData: boolean;
  requiresPhoto: boolean;
  pointsValue: number;
  targetValue?: number;
  sortOrder: number;
  translations: Translations<{ title: string; instructions?: string }>;
}

export interface BadgeRecord {
  id: string;
  parkId: string | null;
  key: string;
  icon: string;
  criteria: BadgeCriteria;
  threshold: number;
  sortOrder: number;
  translations: Translations<{ name: string; description?: string }>;
}

export interface ArticleCategoryRecord {
  id: string;
  key: string;
  sortOrder: number;
}

export interface ArticleRecord {
  id: string;
  parkId: string | null;
  categoryKey: string;
  slug: string;
  status: ContentStatus;
  isDemoData: boolean;
  coverImageUrl: string;
  readingMinutes: number;
  publishedAt: string;
  translations: Translations<{ title: string; excerpt?: string; bodyMd?: string }>;
}

// ---------------------------------------------------------------------------
// Types résolus (traduits) pour l'UI
// ---------------------------------------------------------------------------

/** Langue réellement utilisée pour un contenu (pour signaler un repli). */
export interface Localized {
  contentLocale: string;
}

export interface ParkSummary extends Localized {
  id: string;
  slug: string;
  type: ParkType;
  isDemoData: boolean;
  countryCode: string;
  city: string;
  location: LatLng;
  coverImageUrl: string;
  name: string;
  tagline?: string;
  isFree?: boolean;
  isPmrFriendly?: boolean;
  tags: string[];
  availableLocales: string[];
  trailCount: number;
  spotCount: number;
}

export interface Park extends ParkSummary {
  timezone: string;
  defaultLocale: string;
  bounds: [LatLng, LatLng];
  defaultZoom: number;
  brandColor?: string;
  description?: string;
  practicalNotes?: string;
  accessibilityNotes?: string;
  transportNotes?: string;
  rules?: string;
  practicalInfo?: ParkRecord["practicalInfo"];
  badgeCount: number;
}

export interface SpotCategory {
  key: string;
  icon: string;
  color: string;
  name: string;
}

/** Photo libre de l'ESPÈCE (pas du spécimen du parc), toujours créditée. */
export interface SpeciesThumb {
  url: string;
  author: string;
  license: string;
  sourceUrl: string;
}

export interface SpotSummary extends Localized {
  id: string;
  parkId: string;
  slug: string;
  kind: SpotKind;
  isDemoData: boolean;
  location: LatLng;
  coverImageUrl: string;
  name: string;
  label?: string;
  summary?: string;
  scientificName?: string;
  pointsValue: number;
  categoryKeys: string[];
  /** Photo de l'espèce (sources ouvertes, licence libre), si disponible. */
  speciesPhoto?: SpeciesThumb;
}

export interface Spot extends SpotSummary {
  discoveryRadiusM: number;
  facts: SpotFacts;
  isPmrAccessible?: boolean;
  about?: string;
  funFact?: string;
  directions?: string;
  origin?: string;
}

export interface TrailSegment {
  id: string;
  fromSpotId: string | null;
  toSpotId: string;
  position: number;
  path: [number, number][];
  instruction?: string;
}

export interface TrailSummary extends Localized {
  id: string;
  parkId: string;
  slug: string;
  isDemoData: boolean;
  difficulty: TrailDifficulty;
  durationMin: number;
  distanceM: number;
  audiences: TrailAudience[];
  themes: TrailTheme[];
  isPmrAccessible?: boolean;
  pmrPartial: boolean;
  coverImageUrl: string;
  completionPoints: number;
  name: string;
  summary?: string;
  spotCount: number;
}

export interface Trail extends TrailSummary {
  description?: string;
  accessibilityNotes?: string;
  start: LatLng;
  spots: SpotSummary[];
  segments: TrailSegment[];
}

export interface Facility extends Localized {
  id: string;
  type: FacilityType;
  isDemoData: boolean;
  location: LatLng;
  isPmrAccessible?: boolean;
  details: Record<string, string | number | boolean>;
  name: string;
  description?: string;
}

/** Quiz côté client : JAMAIS la bonne réponse. */
export interface PublicQuiz extends Localized {
  id: string;
  spotId: string | null;
  pointsValue: number;
  question: string;
  answers: { id: string; label: string }[];
}

export interface Challenge extends Localized {
  id: string;
  spotId: string | null;
  type: ChallengeType;
  requiresPhoto: boolean;
  pointsValue: number;
  targetValue?: number;
  title: string;
  instructions?: string;
}

export interface Badge extends Localized {
  id: string;
  key: string;
  icon: string;
  criteria: BadgeCriteria;
  threshold: number;
  name: string;
  description?: string;
}

export interface ArticleSummary extends Localized {
  id: string;
  slug: string;
  categoryKey: string;
  isDemoData: boolean;
  coverImageUrl: string;
  readingMinutes: number;
  publishedAt: string;
  title: string;
  excerpt?: string;
}

export interface Article extends ArticleSummary {
  bodyMd?: string;
}

// ---------------------------------------------------------------------------
// Résultats des actions de jeu
// ---------------------------------------------------------------------------

/**
 * `mode: "demo"` = aucune base connectée : le résultat est calculé côté serveur
 * à partir des données de démo mais N'EST PAS enregistré. L'UI doit l'indiquer.
 */
export type ActionMode = "live" | "demo";

export type DiscoverResult =
  | {
      ok: true;
      mode: ActionMode;
      status: "DISCOVERED" | "ALREADY_DISCOVERED" | "TOO_FAR";
      method?: "GPS_VERIFIED" | "SELF_DECLARED";
      distanceM?: number;
      pointsAwarded: number;
      newBadges: string[];
    }
  | { ok: false; error: ActionError };

export type QuizResult =
  | {
      ok: true;
      mode: ActionMode;
      isCorrect: boolean;
      correctAnswerId: string | null;
      firstAttempt: boolean;
      pointsAwarded: number;
      explanation?: string;
      newBadges: string[];
    }
  | { ok: false; error: ActionError };

export type ChallengeResult =
  | {
      ok: true;
      mode: ActionMode;
      status: "APPROVED" | "PENDING" | "ALREADY_SUBMITTED" | "NOT_REACHED";
      pointsAwarded: number;
      newBadges: string[];
    }
  | { ok: false; error: ActionError };

export type ActionError =
  | "AUTH_REQUIRED"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "OFFLINE"
  | "PHOTO_REQUIRED"
  | "CONSENT_REQUIRED"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

/** Photo publiée d'un spot (communauté validée, officielle ou Wikimedia Commons). */
export interface SpotPhoto {
  id: string;
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  source: "COMMUNITY" | "OFFICIAL" | "WIKIMEDIA";
  /** Crédit affiché : pseudonyme ou auteur externe */
  authorName?: string;
  license?: string;
  /** Page d'origine (Wikimedia Commons) */
  sourceUrl?: string;
  isCover: boolean;
}

export type SpotPhotoResult = { ok: true; mode: ActionMode; status: "PENDING" } | { ok: false; error: ActionError };

export interface UserStats {
  totalPoints: number;
  visits: number;
  spotsDiscovered: number;
  distanceM: number;
  photosApproved: number;
  badges: number;
  quizzesPassed: number;
}
