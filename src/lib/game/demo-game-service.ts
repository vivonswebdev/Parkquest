import "server-only";
import { demoData } from "@/features/demo/demo-data";
import { pickTranslation } from "@/lib/i18n-content";
import type { GameService } from "./game-service";
import { challengeOutcome, evaluateDiscovery, quizPoints, trailCompletionPoints } from "./rules";

/**
 * Service de jeu du MODE DÉMO : mêmes règles que les fonctions SQL, évaluées
 * côté serveur à partir des données locales. Rien n'est enregistré (mode "demo") :
 * la progression simulée est tenue sur l'appareil (src/features/demo/demo-progress.ts).
 * La bonne réponse des quiz ne quitte jamais le serveur.
 */
export const demoGameService: GameService = {
  mode: "demo",

  async startVisit() {
    return { ok: true, mode: "demo", visitId: null };
  },

  async updateVisit() {
    return { ok: true };
  },

  async completeVisit({ trailId, spotsFound }) {
    const trail = demoData.trails.find((t) => t.id === trailId);
    if (!trail) return { ok: false, error: "NOT_FOUND" };
    const r = trailCompletionPoints(spotsFound, trail.spotIds.length, trail.completionPoints);
    return { ok: true, mode: "demo", trailCompleted: r.completed, pointsAwarded: r.points, newBadges: [] };
  },

  async discoverSpot(i) {
    const spot = demoData.spots.find((s) => s.id === i.spotId && s.status === "PUBLISHED");
    if (!spot) return { ok: false, error: "NOT_FOUND" };
    const r = evaluateDiscovery({
      spotLocation: spot.location,
      radiusM: spot.discoveryRadiusM,
      pointsValue: spot.pointsValue,
      position: i.latitude !== undefined && i.longitude !== undefined ? { lat: i.latitude, lng: i.longitude, accuracyM: i.accuracyM } : undefined,
      inVisit: i.inVisit,
    });
    if (r.status === "TOO_FAR") return { ok: true, mode: "demo", status: "TOO_FAR", distanceM: r.distanceM, pointsAwarded: 0, newBadges: [] };
    return { ok: true, mode: "demo", status: "DISCOVERED", method: r.method, distanceM: r.distanceM, pointsAwarded: r.points, newBadges: [] };
  },

  async submitQuiz(i) {
    const quiz = demoData.quizzes.find((q) => q.id === i.quizId && q.status === "PUBLISHED");
    const answer = quiz?.answers.find((a) => a.id === i.answerId);
    if (!quiz || !answer) return { ok: false, error: "NOT_FOUND" };
    return {
      ok: true,
      mode: "demo",
      isCorrect: answer.isCorrect,
      correctAnswerId: quiz.answers.find((a) => a.isCorrect)?.id ?? null,
      firstAttempt: i.firstAttempt,
      pointsAwarded: quizPoints(answer.isCorrect, i.firstAttempt, quiz.pointsValue),
      explanation: pickTranslation(quiz.translations, i.locale)?.value.explanation,
      newBadges: [],
    };
  },

  async completeChallenge(i) {
    const ch = demoData.challenges.find((c) => c.id === i.challengeId && c.status === "PUBLISHED");
    if (!ch) return { ok: false, error: "NOT_FOUND" };
    const r = challengeOutcome(ch.requiresPhoto, Boolean(i.photo), ch.pointsValue);
    if ("error" in r) return { ok: false, error: "PHOTO_REQUIRED" };
    // La photo n'est ni envoyée ni stockée en mode démo.
    return { ok: true, mode: "demo", status: r.status, pointsAwarded: r.points, newBadges: [] };
  },
};
