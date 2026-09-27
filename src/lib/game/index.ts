import "server-only";
import { isDemoMode } from "@/lib/config/app-mode";
import { demoGameService } from "./demo-game-service";
import type { GameService } from "./game-service";
import { supabaseGameService } from "./supabase-game-service";

/** Service de jeu actif : démo (données locales) ou Supabase. */
export const gameService: GameService = isDemoMode ? demoGameService : supabaseGameService;
