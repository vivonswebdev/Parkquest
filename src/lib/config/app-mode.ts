import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Mode de l'application.
 *
 * NEXT_PUBLIC_DEMO_MODE=true → MODE DÉMONSTRATION :
 *  - données exclusivement locales (src/features/demo/demo-data.ts) ;
 *  - aucun appel Supabase, aucune clé requise ;
 *  - GPS, points, progression et badges simulés sur l'appareil.
 *
 * Sans Supabase configuré, le mode démo s'active aussi automatiquement
 * (l'app reste toujours lançable en local).
 */
export const DEMO_MODE_FLAG = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const isDemoMode = DEMO_MODE_FLAG || !isSupabaseConfigured;
export const dataSource: "demo" | "supabase" = isDemoMode ? "demo" : "supabase";
