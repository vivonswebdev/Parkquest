import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isDemoMode } from "@/lib/config/app-mode";
import { supabaseUrl } from "./env";

/**
 * Client « service role » — contourne la RLS.
 * ⚠️ Serveur uniquement (import "server-only"). Réservé aux tâches d'administration
 * explicites (ex. scripts, jobs). Les actions utilisateur passent par le client
 * de session + fonctions SQL sécurisées.
 */
export function createSupabaseAdminClient() {
  if (isDemoMode) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) return null;
  return createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
