import "server-only";
import type { UserStats } from "@/lib/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ServerProgress {
  stats: UserStats;
  discoveredSpotIds: string[];
  badgeKeys: string[];
  username: string;
}

/** Progression réelle de l'utilisateur connecté (null si démo ou non connecté). */
export async function getServerProgress(): Promise<ServerProgress | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const [stats, spots, badges, profile] = await Promise.all([
    supabase.rpc("get_my_stats"),
    supabase.from("visit_spots").select("spot_id"),
    supabase.from("user_badges").select("badges(key)"),
    supabase.from("profiles").select("username, display_name").eq("id", auth.user.id).maybeSingle(),
  ]);
  const s = (stats.data ?? {}) as Record<string, number>;
  return {
    stats: {
      totalPoints: s.total_points ?? 0,
      visits: s.visits ?? 0,
      spotsDiscovered: s.spots_discovered ?? 0,
      distanceM: s.distance_m ?? 0,
      photosApproved: s.photos_approved ?? 0,
      badges: s.badges ?? 0,
      quizzesPassed: s.quizzes_passed ?? 0,
    },
    discoveredSpotIds: (spots.data ?? []).map((r) => r.spot_id as string),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    badgeKeys: (badges.data ?? []).map((r: any) => r.badges?.key).filter(Boolean),
    username: (profile.data?.display_name || profile.data?.username || "") as string,
  };
}
