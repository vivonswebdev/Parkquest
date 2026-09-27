"use server";

import { headers } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, type SignInInput } from "@/lib/validation";

export async function sendMagicLinkAction(input: SignInInput): Promise<{ ok: boolean; error?: "DEMO" | "INVALID" | "SERVER" }> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  if (!isSupabaseConfigured) return { ok: false, error: "DEMO" };
  const supabase = await createSupabaseServerClient();
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const { error } = await supabase!.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?next=/${parsed.data.locale}/profile`,
      // La langue est reprise par le trigger handle_new_user (pseudonyme par défaut, jamais l'e-mail).
      data: { locale: parsed.data.locale },
    },
  });
  return error ? { ok: false, error: "SERVER" } : { ok: true };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
}
