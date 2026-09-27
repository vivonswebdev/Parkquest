import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSupabaseSession } from "./lib/supabase/proxy";

const intl = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = intl(request);
  // Rafraîchit la session Supabase (cookies) si Supabase est configuré.
  return updateSupabaseSession(request, response);
}

export const config = {
  // Toutes les routes sauf API, fichiers Next internes et fichiers statiques.
  matcher: ["/((?!api|_next|_vercel|sw\\.js|manifest\\.webmanifest|.*\\..*).*)"],
};
