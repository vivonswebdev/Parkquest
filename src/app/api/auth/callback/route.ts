import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Retour du lien magique Supabase : échange du code contre une session (cookies). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/fr/profile";
  // Anti open-redirect : chemin interne uniquement.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/fr/profile";
  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, origin));
}
