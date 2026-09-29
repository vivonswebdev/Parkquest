"use client";

import { useSyncExternalStore } from "react";
import { AVATAR_KEY, AVATAR_PHOTO_SIDE, MAX_AVATAR_DATA_URL, parseAvatar, squareCrop, type Avatar } from "@/lib/avatar";

/** Avatar du profil, stocké sur l'appareil uniquement. */
const listeners = new Set<() => void>();
let cache: { raw: string | null; avatar: Avatar | null } = { raw: null, avatar: null };

function read(): Avatar | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(AVATAR_KEY);
  } catch {
    /* stockage indisponible */
  }
  if (raw !== cache.raw) cache = { raw, avatar: parseAvatar(raw) };
  return cache.avatar;
}

/** Enregistre (ou efface avec `null`). Renvoie false si le stockage est plein ou indisponible. */
export function saveAvatar(avatar: Avatar | null): boolean {
  try {
    if (avatar) localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar));
    else localStorage.removeItem(AVATAR_KEY);
  } catch {
    return false;
  }
  listeners.forEach((l) => l());
  return true;
}

export function useAvatar(): Avatar | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}

/** Photo → carré 256 px JPEG (métadonnées supprimées), sur l'appareil. */
export async function photoToAvatar(file: File): Promise<Avatar> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const { sx, sy, side } = squareCrop(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_PHOTO_SIDE;
    canvas.height = AVATAR_PHOTO_SIDE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS");
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_PHOTO_SIDE, AVATAR_PHOTO_SIDE);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (dataUrl.length > MAX_AVATAR_DATA_URL) throw new Error("TOO_LARGE");
    return { kind: "photo", dataUrl };
  } finally {
    bitmap.close();
  }
}
