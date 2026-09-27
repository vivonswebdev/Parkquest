import "server-only";
import { demoData } from "@/content/demo";
import type { ChallengeResult, DiscoverResult, QuizResult } from "@/lib/domain/types";
import { GPS_RULES, distanceM } from "@/lib/geo";
import { pickTranslation } from "@/lib/i18n-content";

/**
 * Moteur de jeu du MODE DÉMO (sans base). Mêmes règles que les fonctions SQL,
 * évaluées côté serveur, mais RIEN n'est enregistré : `mode: "demo"`.
 * La bonne réponse des quiz reste côté serveur.
 */
export function demoDiscover(input: {
  spotId: string;
  latitude?: number;
  longitude?: number;
  accuracyM?: number;
  inVisit: boolean;
}): DiscoverResult {
  const spot = demoData.spots.find((s) => s.id === input.spotId && s.status === "PUBLISHED");
  if (!spot) return { ok: false, error: "NOT_FOUND" };

  let method: "GPS_VERIFIED" | "SELF_DECLARED" = "SELF_DECLARED";
  let d: number | undefined;
  if (input.latitude !== undefined && input.longitude !== undefined) {
    d = Math.round(distanceM(spot.location, { lat: input.latitude, lng: input.longitude }));
    const reliable = input.accuracyM !== undefined && input.accuracyM <= GPS_RULES.maxAccuracyM;
    if (reliable && d <= spot.discoveryRadiusM) method = "GPS_VERIFIED";
    else if (reliable && d > GPS_RULES.rejectDistanceM) {
      return { ok: true, mode: "demo", status: "TOO_FAR", distanceM: d, pointsAwarded: 0, newBadges: [] };
    }
  }
  const points = method === "GPS_VERIFIED" ? spot.pointsValue : input.inVisit ? Math.ceil(spot.pointsValue / 2) : 0;
  return { ok: true, mode: "demo", status: "DISCOVERED", method, distanceM: d, pointsAwarded: points, newBadges: [] };
}

export function demoQuiz(quizId: string, answerId: string, locale: string, firstAttempt: boolean): QuizResult {
  const quiz = demoData.quizzes.find((q) => q.id === quizId && q.status === "PUBLISHED");
  const answer = quiz?.answers.find((a) => a.id === answerId);
  if (!quiz || !answer) return { ok: false, error: "NOT_FOUND" };
  const correct = quiz.answers.find((a) => a.isCorrect)?.id ?? null;
  return {
    ok: true,
    mode: "demo",
    isCorrect: answer.isCorrect,
    correctAnswerId: correct,
    firstAttempt,
    pointsAwarded: answer.isCorrect && firstAttempt ? quiz.pointsValue : 0,
    explanation: pickTranslation(quiz.translations, locale)?.value.explanation,
    newBadges: [],
  };
}

export function demoChallenge(challengeId: string, hasPhoto: boolean): ChallengeResult {
  const ch = demoData.challenges.find((c) => c.id === challengeId && c.status === "PUBLISHED");
  if (!ch) return { ok: false, error: "NOT_FOUND" };
  if (ch.requiresPhoto && !hasPhoto) return { ok: false, error: "PHOTO_REQUIRED" };
  if (ch.requiresPhoto) return { ok: true, mode: "demo", status: "PENDING", pointsAwarded: 0, newBadges: [] };
  return { ok: true, mode: "demo", status: "APPROVED", pointsAwarded: ch.pointsValue, newBadges: [] };
}
