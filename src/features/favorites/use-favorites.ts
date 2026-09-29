"use client";

import { useSyncExternalStore } from "react";
import { FAVORITES_KEY, parseFavorites, type Favorite } from "@/lib/favorites";

/** Favoris de la carte, stockés sur l'appareil uniquement. */
const listeners = new Set<() => void>();
const EMPTY: Favorite[] = [];
let cache: { raw: string | null; list: Favorite[] } = { raw: null, list: EMPTY };

function read(): Favorite[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(FAVORITES_KEY);
  } catch {
    /* stockage indisponible (navigation privée) : aucun favori */
  }
  if (raw !== cache.raw) cache = { raw, list: parseFavorites(raw) };
  return cache.list;
}

export function saveFavorites(list: Favorite[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useFavorites(): Favorite[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => e.key === FAVORITES_KEY && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => EMPTY,
  );
}
