import type {
  LatLng,
  Article,
  ArticleSummary,
  Badge,
  Challenge,
  Facility,
  Park,
  ParkSummary,
  PublicQuiz,
  Spot,
  SpotCategory,
  SpotSummary,
  Trail,
  TrailSummary,
} from "@/lib/domain/types";

/**
 * Accès en lecture aux contenus (déjà traduits).
 * Deux implémentations : démo (données locales) et Supabase (RLS appliquée).
 * Aucune méthode ne renvoie la bonne réponse d'un quiz.
 */
export interface ContentRepository {
  readonly source: "demo" | "supabase";
  listParks(locale: string): Promise<ParkSummary[]>;
  getPark(slug: string, locale: string): Promise<Park | null>;
  listCategories(locale: string): Promise<SpotCategory[]>;
  listSpots(parkId: string, locale: string): Promise<SpotSummary[]>;
  /**
   * Spots publiés autour d'un point, triés par distance (« Autour de vous »).
   * Démo : calcul en mémoire. Production : fonction PostGIS nearby_spots (index GIST).
   * Les coordonnées reçues ne sont jamais stockées.
   */
  listNearbySpots(parkId: string, origin: LatLng, radiusM: number, locale: string): Promise<(SpotSummary & { distanceM: number })[]>;
  getSpot(parkId: string, spotSlug: string, locale: string): Promise<Spot | null>;
  listTrails(parkId: string, locale: string): Promise<TrailSummary[]>;
  getTrail(parkId: string, trailSlug: string, locale: string): Promise<Trail | null>;
  listFacilities(parkId: string, locale: string): Promise<Facility[]>;
  listQuizzesForSpot(spotId: string, locale: string): Promise<PublicQuiz[]>;
  listChallenges(parkId: string, locale: string, spotId?: string): Promise<Challenge[]>;
  listBadges(locale: string): Promise<Badge[]>;
  listArticles(locale: string): Promise<ArticleSummary[]>;
  getArticle(slug: string, locale: string): Promise<Article | null>;
}
