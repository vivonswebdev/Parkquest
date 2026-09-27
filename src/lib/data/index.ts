import "server-only";
import { cache } from "react";
import { isDemoMode } from "@/lib/config/app-mode";
import { demoRepository } from "./demo-repository";
import type { ContentRepository } from "./repository";
import { supabaseRepository } from "./supabase-repository";

/** Source de contenu active : Supabase si configuré, sinon données de démo locales. */
export const repo: ContentRepository = !isDemoMode ? supabaseRepository : demoRepository;

/** Mémoïsation par requête (évite les doubles chargements layout/page/metadata). */
export const getPark = cache((slug: string, locale: string) => repo.getPark(slug, locale));
export const listSpots = cache((parkId: string, locale: string) => repo.listSpots(parkId, locale));
export const listTrails = cache((parkId: string, locale: string) => repo.listTrails(parkId, locale));

/** Parc pilote mis en avant tant qu'il n'y a pas de sélection utilisateur. */
export { FEATURED_PARK_SLUG_PUBLIC as FEATURED_PARK_SLUG } from "@/lib/constants";
