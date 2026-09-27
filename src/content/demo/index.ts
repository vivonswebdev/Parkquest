/**
 * Jeu de données de démonstration — SOURCE UNIQUE.
 * Utilisé par : (1) l'app quand Supabase n'est pas configuré ;
 * (2) scripts/generate-seed.ts qui produit supabase/seed.sql.
 */
import { meiseChallenges, meiseFacilities, meisePark, meiseQuizzes, meiseSpots, meiseTrails } from "./meise";
import { articleCategories, articles, badges, showcaseParks, spotCategories } from "./platform";

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
