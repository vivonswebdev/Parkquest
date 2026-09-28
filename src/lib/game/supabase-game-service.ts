import "server-only";
import type { ActionError } from "@/lib/domain/types";
import { pickRow } from "@/lib/i18n-content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameService } from "./game-service";

/**
 * Service de jeu SUPABASE : délègue aux fonctions SQL SECURITY DEFINER
 * (RLS, idempotence des points, badges). Les coordonnées reçues servent
 * uniquement au calcul de distance et ne sont pas stockées.
 */

function mapError(e: { message?: string; code?: string } | null): ActionError {
  const m = e?.message ?? "";
  if (m.includes("AUTH_REQUIRED") || e?.code === "28000" || e?.code === "42501") return "AUTH_REQUIRED";
  if (m.includes("NOT_FOUND") || e?.code === "P0002") return "NOT_FOUND";
  if (m.includes("PHOTO_REQUIRED")) return "PHOTO_REQUIRED";
  if (m.includes("CONSENT_REQUIRED")) return "CONSENT_REQUIRED";
  if (m.includes("RATE_LIMITED") || e?.code === "54000") return "RATE_LIMITED";
  return "SERVER_ERROR";
}

async function client() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, uid: null, error: "SERVER_ERROR" as const };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase: null, uid: null, error: "AUTH_REQUIRED" as const };
  return { supabase, uid: data.user.id, error: null };
}

export const supabaseGameService: GameService = {
  mode: "live",

  async startVisit(parkId, trailId) {
    const { supabase, error } = await client();
    if (!supabase) return { ok: false, error };
    const { data, error: e } = await supabase.rpc("start_visit", { p_park_id: parkId, p_trail_id: trailId ?? null });
    if (e) return { ok: false, error: mapError(e) };
    return { ok: true, mode: "live", visitId: data as string };
  },

  async updateVisit(visitId, status, distanceM) {
    const { supabase } = await client();
    if (!supabase) return { ok: false };
    const { error } = await supabase.rpc("update_visit", { p_visit_id: visitId, p_status: status ?? null, p_distance_m: distanceM ?? null });
    return { ok: !error };
  },

  async completeVisit({ visitId, distanceM }) {
    if (!visitId) return { ok: false, error: "AUTH_REQUIRED" };
    const { supabase, error } = await client();
    if (!supabase) return { ok: false, error };
    const { data, error: e } = await supabase.rpc("complete_visit", { p_visit_id: visitId, p_distance_m: distanceM ?? null });
    if (e) return { ok: false, error: mapError(e) };
    const r = data as { trail_completed: boolean; points_awarded: number; new_badges: string[] };
    return { ok: true, mode: "live", trailCompleted: r.trail_completed, pointsAwarded: r.points_awarded, newBadges: r.new_badges ?? [] };
  },

  async discoverSpot(i) {
    const { supabase, error } = await client();
    if (!supabase) return { ok: false, error };
    const { data, error: e } = await supabase.rpc("discover_spot", {
      p_spot_id: i.spotId,
      p_visit_id: i.visitId ?? null,
      p_latitude: i.latitude ?? null,
      p_longitude: i.longitude ?? null,
      p_accuracy_m: i.accuracyM ?? null,
    });
    if (e) return { ok: false, error: mapError(e) };
    const r = data as { status: "DISCOVERED" | "ALREADY_DISCOVERED" | "TOO_FAR"; method?: "GPS_VERIFIED" | "SELF_DECLARED"; distance_m?: number; points_awarded: number; new_badges: string[] };
    return { ok: true, mode: "live", status: r.status, method: r.method, distanceM: r.distance_m ?? undefined, pointsAwarded: r.points_awarded, newBadges: r.new_badges ?? [] };
  },

  async submitQuiz(i) {
    const { supabase, error } = await client();
    if (!supabase) return { ok: false, error };
    const { data, error: e } = await supabase.rpc("submit_quiz_answer", { p_quiz_id: i.quizId, p_answer_id: i.answerId, p_visit_id: i.visitId ?? null });
    if (e) return { ok: false, error: mapError(e) };
    const r = data as { is_correct: boolean; correct_answer_id: string | null; first_attempt: boolean; points_awarded: number; new_badges: string[] };
    const { data: tr } = await supabase.from("quiz_translations").select("locale, explanation").eq("quiz_id", i.quizId);
    return {
      ok: true,
      mode: "live",
      isCorrect: r.is_correct,
      correctAnswerId: r.correct_answer_id,
      firstAttempt: r.first_attempt,
      pointsAwarded: r.points_awarded,
      explanation: (pickRow(tr ?? [], i.locale)?.explanation as string | null | undefined) ?? undefined,
      newBadges: r.new_badges ?? [],
    };
  },

  async completeChallenge(i) {
    const { supabase, uid, error } = await client();
    if (!supabase || !uid) return { ok: false, error: error ?? "AUTH_REQUIRED" };
    let mediaId: string | null = null;
    if (i.photo) {
      const ext = i.photo.type.split("/")[1] ?? "jpg";
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("user-photos").upload(path, i.photo, { contentType: i.photo.type });
      if (upErr) return { ok: false, error: "SERVER_ERROR" };
      // Photo toujours PENDING : publiée seulement après modération.
      const { data: media, error: mErr } = await supabase
        .from("media")
        .insert({ owner_id: uid, park_id: i.parkId, spot_id: i.spotId ?? null, storage_path: path, moderation_status: "PENDING" })
        .select("id")
        .single();
      if (mErr) return { ok: false, error: mapError(mErr) };
      mediaId = media.id as string;
    }
    const { data, error: e } = await supabase.rpc("complete_challenge", { p_challenge_id: i.challengeId, p_visit_id: i.visitId ?? null, p_media_id: mediaId });
    if (e) return { ok: false, error: mapError(e) };
    const r = data as { status: "APPROVED" | "PENDING" | "ALREADY_SUBMITTED" | "NOT_REACHED"; points_awarded: number; new_badges: string[] };
    return { ok: true, mode: "live", status: r.status, pointsAwarded: r.points_awarded, newBadges: r.new_badges ?? [] };
  },

  async submitSpotPhoto(i) {
    const { supabase, uid, error } = await client();
    if (!supabase || !uid) return { ok: false, error: error ?? "AUTH_REQUIRED" };
    // Dossier privé de l'auteur ; publication (copie publique) seulement après modération.
    const path = `${uid}/spots/${crypto.randomUUID()}.jpg`;
    const { error: upErr } = await supabase.storage.from("user-photos").upload(path, i.photo, { contentType: "image/jpeg" });
    if (upErr) return { ok: false, error: "SERVER_ERROR" };
    const { error: e } = await supabase.rpc("submit_spot_photo", {
      p_spot_id: i.spotId,
      p_storage_path: path,
      p_width: i.width,
      p_height: i.height,
      p_alt: i.alt ?? null,
      p_license_consent: i.licenseConsent,
    });
    if (e) {
      await supabase.storage.from("user-photos").remove([path]);
      return { ok: false, error: mapError(e) };
    }
    return { ok: true, mode: "live", status: "PENDING" };
  },
};
