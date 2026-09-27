import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/config/app-mode";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Rafraîchit les cookies de session Supabase sur la réponse produite par next-intl. */
export async function updateSupabaseSession(request: NextRequest, response: NextResponse) {
  if (isDemoMode) return response;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}
