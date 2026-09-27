"use client";
import { createBrowserClient } from "@supabase/ssr";
import { isDemoMode } from "@/lib/config/app-mode";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Client navigateur (clé anonyme uniquement). */
export function createSupabaseBrowserClient() {
  if (isDemoMode) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
