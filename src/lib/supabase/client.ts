"use client";
import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/** Client navigateur (clé anonyme uniquement). */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
