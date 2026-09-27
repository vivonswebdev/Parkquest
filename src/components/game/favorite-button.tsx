"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const KEY = "parkquest.favorites.v1";
const listeners = new Set<() => void>();

function readFavorites(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function toggleFavorite(id: string) {
  try {
    const list = new Set(JSON.parse(readFavorites()) as string[]);
    if (list.has(id)) list.delete(id);
    else list.add(id);
    localStorage.setItem(KEY, JSON.stringify([...list]));
  } catch {
    /* stockage indisponible */
  }
  listeners.forEach((l) => l());
}

/** Favori local (MVP). Synchronisation avec user_favorites prévue au Sprint 3. */
export function FavoriteButton({ targetId, className }: { targetId: string; className?: string }) {
  const t = useTranslations("spot");
  const raw = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readFavorites,
    () => "[]",
  );
  const on = (JSON.parse(raw) as string[]).includes(targetId);
  return (
    <button
      type="button"
      onClick={() => toggleFavorite(targetId)}
      aria-pressed={on}
      aria-label={on ? t("unfavorite") : t("favorite")}
      className={cn("inline-flex size-12 items-center justify-center rounded-full border border-border transition-colors", on ? "bg-danger/15 text-danger" : "glass text-foreground", className)}
    >
      <Heart className={cn("size-5", on && "fill-current")} />
    </button>
  );
}
