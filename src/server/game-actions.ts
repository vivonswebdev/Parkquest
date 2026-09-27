"use server";

import { z } from "zod";
import type { ActionError, ChallengeResult, DiscoverResult, QuizResult } from "@/lib/domain/types";
import { demoChallenge, demoDiscover, demoQuiz } from "@/lib/game/demo-engine";
import { pickRow } from "@/lib/i18n-content";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Actions de jeu. Toute attribution de points se fait côté serveur :
 *  - Supabase configuré : appel des fonctions SQL SECURITY DEFINER (RLS + idempotence).
 *  - Mode démo : même règles évaluées côté serveur, rien n'est enregistré (mode: "demo").
 * Les coordonnées GPS reçues servent uniquement au calcul de distance et ne sont pas stockées.
 */

const uuid = z.string().uuid();

function mapError(e: { message?: string; code?: string } | null): ActionError {
  const m = e?.message ?? "";
  if (m.includes("AUTH_REQUIRED") || e?.code === "28000" || e?.code === "42501") return "AUTH_REQUIRED";
  if (m.includes("NOT_FOUND") || e?.code === "P0002") return "NOT_FOUND";
  if (m.includes("PHOTO_REQUIRED")) return "PHOTO_REQUIRED";
  return "SERVER_ERROR";
}

async function liveClientOrAuthError() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, error: "SERVER_ERROR" as const };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase: null, error: "AUTH_REQUIRED" as const };
  return { supabase, error: null };
}

// ---------------------------------------------------------------------------

const startVisitSchema = z.object({ parkId: uuid, trailId: uuid.optional() });

export async function startVisitAction(
  input: z.infer<typeof startVisitSchema>,
): Promise<{ ok: true; mode: "live" | "demo"; visitId: string | null } | { ok: false; error: ActionError }> {
  const parsed = startVisitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  if (!isSupabaseConfigured) return { ok: true, mode: "demo", visitId: null };

  const { supabase, error } = await liveClientOrAuthError();
  if (!supabase) return { ok: false, error };
  const { data, error: rpcError } = await supabase.rpc("start_visit", {
    p_park_id: parsed.data.parkId,
    p_trail_id: parsed.data.trailId ?? null,
  });
  if (rpcError) return { ok: false, error: mapError(rpcError) };
  return { ok: true, mode: "live", visitId: data as string };
}

// ---------------------------------------------------------------------------

const discoverSchema = z.object({
  spotId: uuid,
  visitId: uuid.nullish(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracyM: z.number().min(0).max(100000).optional(),
  inVisit: z.boolean().default(false),
});

export async function discoverSpotAction(input: z.input<typeof discoverSchema>): Promise<DiscoverResult> {
  const parsed = discoverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const i = parsed.data;
  if (!isSupabaseConfigured) return demoDiscover(i);

  const { supabase, error } = await liveClientOrAuthError();
  if (!supabase) return { ok: false, error };
  const { data, error: rpcError } = await supabase.rpc("discover_spot", {
    p_spot_id: i.spotId,
    p_visit_id: i.visitId ?? null,
    p_latitude: i.latitude ?? null,
    p_longitude: i.longitude ?? null,
    p_accuracy_m: i.accuracyM ?? null,
  });
  if (rpcError) return { ok: false, error: mapError(rpcError) };
  const r = data as { status: "DISCOVERED" | "ALREADY_DISCOVERED" | "TOO_FAR"; method?: "GPS_VERIFIED" | "SELF_DECLARED"; distance_m?: number; points_awarded: number; new_badges: string[] };
  return {
    ok: true,
    mode: "live",
    status: r.status,
    method: r.method,
    distanceM: r.distance_m ?? undefined,
    pointsAwarded: r.points_awarded,
    newBadges: r.new_badges ?? [],
  };
}

// ---------------------------------------------------------------------------

const quizSchema = z.object({
  quizId: uuid,
  answerId: uuid,
  visitId: uuid.nullish(),
  locale: z.string().max(10),
  /** Mode démo uniquement : la base fait foi en mode live. */
  firstAttempt: z.boolean().default(true),
});

export async function submitQuizAction(input: z.input<typeof quizSchema>): Promise<QuizResult> {
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const i = parsed.data;
  if (!isSupabaseConfigured) return demoQuiz(i.quizId, i.answerId, i.locale, i.firstAttempt);

  const { supabase, error } = await liveClientOrAuthError();
  if (!supabase) return { ok: false, error };
  const { data, error: rpcError } = await supabase.rpc("submit_quiz_answer", {
    p_quiz_id: i.quizId,
    p_answer_id: i.answerId,
    p_visit_id: i.visitId ?? null,
  });
  if (rpcError) return { ok: false, error: mapError(rpcError) };
  const r = data as { is_correct: boolean; correct_answer_id: string | null; first_attempt: boolean; points_awarded: number; new_badges: string[] };
  const { data: tr } = await supabase.from("quiz_translations").select("locale, explanation").eq("quiz_id", i.quizId);
  return {
    ok: true,
    mode: "live",
    isCorrect: r.is_correct,
    correctAnswerId: r.correct_answer_id,
    firstAttempt: r.first_attempt,
    pointsAwarded: r.points_awarded,
    explanation: pickRow(tr ?? [], i.locale)?.explanation ?? undefined,
    newBadges: r.new_badges ?? [],
  };
}

// ---------------------------------------------------------------------------

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/** Défi : FormData { challengeId, parkId, spotId?, visitId?, photo? } */
export async function completeChallengeAction(form: FormData): Promise<ChallengeResult> {
  const parsed = z
    .object({
      challengeId: uuid,
      parkId: uuid,
      spotId: uuid.optional(),
      visitId: uuid.optional(),
    })
    .safeParse({
      challengeId: form.get("challengeId"),
      parkId: form.get("parkId"),
      spotId: form.get("spotId") || undefined,
      visitId: form.get("visitId") || undefined,
    });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const photo = form.get("photo");
  const file = photo instanceof File && photo.size > 0 ? photo : null;
  if (file && (file.size > MAX_PHOTO_BYTES || !PHOTO_TYPES.includes(file.type))) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (!isSupabaseConfigured) return demoChallenge(parsed.data.challengeId, Boolean(file));

  const { supabase, error } = await liveClientOrAuthError();
  if (!supabase) return { ok: false, error };
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user!.id;

  let mediaId: string | null = null;
  if (file) {
    const ext = file.type.split("/")[1] ?? "jpg";
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("user-photos").upload(path, file, { contentType: file.type });
    if (upErr) return { ok: false, error: "SERVER_ERROR" };
    // Photo toujours PENDING : publiée seulement après modération.
    const { data: media, error: mErr } = await supabase
      .from("media")
      .insert({ owner_id: uid, park_id: parsed.data.parkId, spot_id: parsed.data.spotId ?? null, storage_path: path, moderation_status: "PENDING" })
      .select("id")
      .single();
    if (mErr) return { ok: false, error: mapError(mErr) };
    mediaId = media.id as string;
  }

  const { data, error: rpcError } = await supabase.rpc("complete_challenge", {
    p_challenge_id: parsed.data.challengeId,
    p_visit_id: parsed.data.visitId ?? null,
    p_media_id: mediaId,
  });
  if (rpcError) return { ok: false, error: mapError(rpcError) };
  const r = data as { status: "APPROVED" | "PENDING" | "ALREADY_SUBMITTED" | "NOT_REACHED"; points_awarded: number; new_badges: string[] };
  return { ok: true, mode: "live", status: r.status, pointsAwarded: r.points_awarded, newBadges: r.new_badges ?? [] };
}

// ---------------------------------------------------------------------------

const updateVisitSchema = z.object({
  visitId: uuid,
  status: z.enum(["IN_PROGRESS", "PAUSED", "ABANDONED"]).optional(),
  distanceM: z.number().int().min(0).max(100000).optional(),
});

export async function updateVisitAction(input: z.infer<typeof updateVisitSchema>): Promise<{ ok: boolean }> {
  const parsed = updateVisitSchema.safeParse(input);
  if (!parsed.success || !isSupabaseConfigured) return { ok: parsed.success };
  const { supabase } = await liveClientOrAuthError();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("update_visit", {
    p_visit_id: parsed.data.visitId,
    p_status: parsed.data.status ?? null,
    p_distance_m: parsed.data.distanceM ?? null,
  });
  return { ok: !error };
}

const completeVisitSchema = z.object({ visitId: uuid.nullish(), trailId: uuid, distanceM: z.number().int().min(0).max(100000).optional(), spotsFound: z.number().int().min(0) });

export async function completeVisitAction(
  input: z.infer<typeof completeVisitSchema>,
): Promise<{ ok: true; mode: "live" | "demo"; trailCompleted: boolean; pointsAwarded: number; newBadges: string[] } | { ok: false; error: ActionError }> {
  const parsed = completeVisitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  if (!isSupabaseConfigured) {
    const { demoData } = await import("@/content/demo");
    const trail = demoData.trails.find((t) => t.id === parsed.data.trailId);
    const complete = Boolean(trail && parsed.data.spotsFound >= trail.spotIds.length);
    return { ok: true, mode: "demo", trailCompleted: complete, pointsAwarded: complete ? (trail?.completionPoints ?? 0) : 0, newBadges: [] };
  }
  if (!parsed.data.visitId) return { ok: false, error: "AUTH_REQUIRED" };
  const { supabase, error } = await liveClientOrAuthError();
  if (!supabase) return { ok: false, error };
  const { data, error: rpcError } = await supabase.rpc("complete_visit", { p_visit_id: parsed.data.visitId, p_distance_m: parsed.data.distanceM ?? null });
  if (rpcError) return { ok: false, error: mapError(rpcError) };
  const r = data as { trail_completed: boolean; points_awarded: number; new_badges: string[] };
  return { ok: true, mode: "live", trailCompleted: r.trail_completed, pointsAwarded: r.points_awarded, newBadges: r.new_badges ?? [] };
}
