"use server";

import { z } from "zod";
import type { ChallengeResult, DiscoverResult, QuizResult } from "@/lib/domain/types";
import { gameService } from "@/lib/game";
import type { CompleteVisitResult, StartVisitResult } from "@/lib/game/game-service";

/**
 * Server Actions de jeu : VALIDATION des entrées (Zod) puis délégation au
 * service actif (démo ou Supabase, voir src/lib/game/index.ts).
 * Toute attribution de points se fait côté serveur, jamais dans le navigateur.
 */

const uuid = z.string().uuid();

const startVisitSchema = z.object({ parkId: uuid, trailId: uuid.optional() });

export async function startVisitAction(input: z.infer<typeof startVisitSchema>): Promise<StartVisitResult> {
  const p = startVisitSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "INVALID_INPUT" };
  return gameService.startVisit(p.data.parkId, p.data.trailId);
}

const discoverSchema = z.object({
  spotId: uuid,
  visitId: uuid.nullish(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracyM: z.number().min(0).max(100000).optional(),
  inVisit: z.boolean().default(false),
});

export async function discoverSpotAction(input: z.input<typeof discoverSchema>): Promise<DiscoverResult> {
  const p = discoverSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "INVALID_INPUT" };
  return gameService.discoverSpot(p.data);
}

const quizSchema = z.object({
  quizId: uuid,
  answerId: uuid,
  visitId: uuid.nullish(),
  locale: z.string().max(10),
  firstAttempt: z.boolean().default(true),
});

export async function submitQuizAction(input: z.input<typeof quizSchema>): Promise<QuizResult> {
  const p = quizSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "INVALID_INPUT" };
  return gameService.submitQuiz(p.data);
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/** Défi : FormData { challengeId, parkId, spotId?, visitId?, photo? } */
export async function completeChallengeAction(form: FormData): Promise<ChallengeResult> {
  const p = z
    .object({ challengeId: uuid, parkId: uuid, spotId: uuid.optional(), visitId: uuid.optional() })
    .safeParse({
      challengeId: form.get("challengeId"),
      parkId: form.get("parkId"),
      spotId: form.get("spotId") || undefined,
      visitId: form.get("visitId") || undefined,
    });
  if (!p.success) return { ok: false, error: "INVALID_INPUT" };
  const raw = form.get("photo");
  const photo = raw instanceof File && raw.size > 0 ? raw : null;
  if (photo && (photo.size > MAX_PHOTO_BYTES || !PHOTO_TYPES.includes(photo.type))) return { ok: false, error: "INVALID_INPUT" };
  return gameService.completeChallenge({ ...p.data, photo });
}

const updateVisitSchema = z.object({
  visitId: uuid,
  status: z.enum(["IN_PROGRESS", "PAUSED", "ABANDONED"]).optional(),
  distanceM: z.number().int().min(0).max(100000).optional(),
});

export async function updateVisitAction(input: z.infer<typeof updateVisitSchema>): Promise<{ ok: boolean }> {
  const p = updateVisitSchema.safeParse(input);
  if (!p.success) return { ok: false };
  return gameService.updateVisit(p.data.visitId, p.data.status, p.data.distanceM);
}

const completeVisitSchema = z.object({
  visitId: uuid.nullish(),
  trailId: uuid,
  distanceM: z.number().int().min(0).max(100000).optional(),
  spotsFound: z.number().int().min(0),
});

export async function completeVisitAction(input: z.infer<typeof completeVisitSchema>): Promise<CompleteVisitResult> {
  const p = completeVisitSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "INVALID_INPUT" };
  return gameService.completeVisit(p.data);
}
