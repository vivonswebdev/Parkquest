import type { LatLng } from "@/lib/domain/types";

/**
 * Favoris de la carte : spots, services ou points personnels.
 * Stockés UNIQUEMENT sur l'appareil (localStorage) : jamais envoyés, jamais publics.
 */
export type FavoriteKind = "spot" | "facility" | "point";

export interface Favorite {
  id: string;
  parkSlug: string;
  kind: FavoriteKind;
  /** Spot ou service d'origine (absent pour un point personnel) */
  refId?: string;
  name: string;
  location: LatLng;
  createdAt: number;
}

export const FAVORITES_KEY = "parkquest.favorites.v1";
export const MAX_FAVORITES = 100;

const round = (n: number) => Math.round(n * 1e6) / 1e6;

export function isFavorite(list: Favorite[], parkSlug: string, refId: string): boolean {
  return list.some((f) => f.parkSlug === parkSlug && f.refId === refId);
}

/** Ajoute un favori (un seul par spot/service ; position arrondie ~10 cm ; plafond MAX_FAVORITES). */
export function addFavorite(list: Favorite[], fav: Omit<Favorite, "id" | "createdAt">, now = Date.now()): Favorite[] {
  if (fav.refId && isFavorite(list, fav.parkSlug, fav.refId)) return list;
  const entry: Favorite = {
    ...fav,
    name: fav.name.trim().slice(0, 60) || "★",
    location: { lat: round(fav.location.lat), lng: round(fav.location.lng) },
    id: `fav-${now.toString(36)}-${list.length}`,
    createdAt: now,
  };
  return [...list, entry].slice(-MAX_FAVORITES);
}

export function removeFavorite(list: Favorite[], id: string): Favorite[] {
  return list.filter((f) => f.id !== id);
}

export function toggleFavorite(list: Favorite[], fav: Omit<Favorite, "id" | "createdAt"> & { refId: string }, now = Date.now()): Favorite[] {
  const existing = list.find((f) => f.parkSlug === fav.parkSlug && f.refId === fav.refId);
  return existing ? removeFavorite(list, existing.id) : addFavorite(list, fav, now);
}

export function favoritesOfPark(list: Favorite[], parkSlug: string): Favorite[] {
  return list.filter((f) => f.parkSlug === parkSlug);
}

/** Lecture tolérante (données absentes, corrompues ou d'un autre format → liste vide). */
export function parseFavorites(raw: string | null): Favorite[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (f): f is Favorite =>
        f && typeof f.id === "string" && typeof f.parkSlug === "string" && typeof f.name === "string" && typeof f.location?.lat === "number" && typeof f.location?.lng === "number",
    );
  } catch {
    return [];
  }
}
