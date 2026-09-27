import type { ActionError, ActionMode, ChallengeResult, DiscoverResult, QuizResult } from "@/lib/domain/types";

/**
 * Couche de service du jeu. Les écrans et les Server Actions ne connaissent que
 * cette interface : on remplace la démo par Supabase sans toucher à l'UI.
 */
export interface DiscoverInput {
  spotId: string;
  visitId?: string | null;
  latitude?: number;
  longitude?: number;
  accuracyM?: number;
  inVisit: boolean;
}

export interface QuizInput {
  quizId: string;
  answerId: string;
  visitId?: string | null;
  locale: string;
  /** Utilisé par la démo (l'historique est sur l'appareil) ; la base fait foi en mode Supabase. */
  firstAttempt: boolean;
}

export interface ChallengeInput {
  challengeId: string;
  parkId: string;
  spotId?: string;
  visitId?: string;
  photo: File | null;
}

export type StartVisitResult = { ok: true; mode: ActionMode; visitId: string | null } | { ok: false; error: ActionError };
export type CompleteVisitResult =
  | { ok: true; mode: ActionMode; trailCompleted: boolean; pointsAwarded: number; newBadges: string[] }
  | { ok: false; error: ActionError };

export interface GameService {
  readonly mode: ActionMode;
  startVisit(parkId: string, trailId?: string): Promise<StartVisitResult>;
  updateVisit(visitId: string, status?: "IN_PROGRESS" | "PAUSED" | "ABANDONED", distanceM?: number): Promise<{ ok: boolean }>;
  completeVisit(input: { visitId?: string | null; trailId: string; distanceM?: number; spotsFound: number }): Promise<CompleteVisitResult>;
  discoverSpot(input: DiscoverInput): Promise<DiscoverResult>;
  submitQuiz(input: QuizInput): Promise<QuizResult>;
  completeChallenge(input: ChallengeInput): Promise<ChallengeResult>;
}
