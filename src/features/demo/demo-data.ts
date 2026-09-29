/**
 * ============================================================================
 * DONNÉES DE DÉMONSTRATION — SOURCE UNIQUE
 * ============================================================================
 *
 * Tout ce que le mode démo affiche vient d'ici :
 *  - parc pilote Plantentuin Meise (+ parcs vitrine) ...... ./content/meise.ts, ./content/platform.ts
 *  - parcours « Découverte des arbres remarquables » ....... meiseTrails
 *  - spots, services, quiz, défis .......................... meiseSpots, meiseFacilities, meiseQuizzes, meiseChallenges
 *  - badges, articles ...................................... badges, articles
 *  - informations pratiques ................................ meisePark.practicalInfo
 *  - profil utilisateur fictif, statistiques, collection ... demoUser, demoBaselineProgress (ci-dessous)
 *  - position simulée ...................................... demoGeo (ci-dessous)
 *
 * Utilisé par :
 *  1. l'app en mode démo (NEXT_PUBLIC_DEMO_MODE=true ou Supabase absent) ;
 *  2. scripts/generate-seed.ts, qui produit supabase/seed.sql avec les MÊMES UUID.
 *
 * ⚠️ Données plausibles mais NON VALIDÉES par les parcs (voir docs/DEMO_DATA_VALIDATION.md).
 * Aucune clé, aucun secret, aucune dépendance externe ici.
 */
import type { LatLng } from "@/lib/domain/types";
import { MEISE_ID, meiseChallenges, meiseFacilities, meisePark, meiseQuizzes, meiseSpots, meiseTrails } from "./content/meise";
import { articleCategories, articles, badges, showcaseParks, spotCategories } from "./content/platform";
import { demoId } from "./content/ids";

export { MEISE_ID, demoId };

export const demoData = {
  parks: [meisePark, ...showcaseParks],
  spotCategories,
  spots: [...meiseSpots],
  trails: [...meiseTrails],
  facilities: [...meiseFacilities],
  quizzes: [...meiseQuizzes],
  challenges: [...meiseChallenges],
  badges,
  articleCategories,
  articles,
} as const;

export type DemoData = typeof demoData;

// ---------------------------------------------------------------------------
// Profil utilisateur fictif
// ---------------------------------------------------------------------------

export const demoUser = {
  username: "lina.explore",
  displayName: "Lina",
  /** Pseudonyme par défaut, jamais de nom réel ni d'e-mail. */
  avatarInitials: "L",
  preferredLocale: "fr",
  memberSince: "2026-06-14",
} as const;

// ---------------------------------------------------------------------------
// Progression de départ (historique fictif avant la visite de démo)
// ---------------------------------------------------------------------------

export interface DemoProgress {
  /** Spots découverts (collection) */
  discovered: string[];
  /** quizId → réussi au premier essai */
  quizAttempts: Record<string, boolean>;
  /** challengeId → statut */
  challenges: Record<string, "APPROVED" | "PENDING">;
  points: number;
  distanceM: number;
  visits: number;
  photosApproved: number;
  trailsCompleted: number;
  /** Clés des badges débloqués */
  badges: string[];
}

const spot = (slug: string) => meiseSpots.find((s) => s.slug === slug)!.id;

/**
 * Deux visites passées : Ginkgo et Étang déjà découverts, un quiz réussi, une photo validée.
 * Le parcours pilote reste entièrement à faire pendant la démo.
 */
export const demoBaselineProgress: DemoProgress = {
  discovered: [spot("ginkgo"), spot("etang")],
  quizAttempts: { [demoId("quiz", 4)]: true },
  challenges: {},
  points: 35,
  distanceM: 3200,
  visits: 2,
  photosApproved: 1,
  trailsCompleted: 0,
  badges: ["premier-pas"],
};

// ---------------------------------------------------------------------------
// Position simulée
// ---------------------------------------------------------------------------

export type DemoGeoMode = "near" | "approximate" | "entrance" | "outside" | "fast" | "low-accuracy" | "denied" | "unavailable" | "real";

export const demoGeo = {
  /** Mode par défaut : « près du spot » pour tester la découverte validée par GPS. */
  defaultMode: "near" as DemoGeoMode,
  /** Entrée principale du parc pilote (position de départ). */
  entrance: meiseFacilities.find((f) => f.type === "ENTRANCE")!.location as LatLng,
  /** Décalage appliqué autour du spot ciblé (≈ 8 m). */
  nearOffset: { lat: 0.00006, lng: 0.00004 },
  nearAccuracyM: 6,
  /** GPS approximatif : proche mais précision moyenne (10–25 m) → confirmation demandée. */
  approximateAccuracyM: 18,
  approximateOffset: { lat: 0.00012, lng: 0.00008 },
  entranceAccuracyM: 10,
  lowAccuracyM: 60,
} as const;
