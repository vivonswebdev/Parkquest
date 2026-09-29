/**
 * Avatar du profil : un emblème nature (dessin original) ou une photo personnelle.
 * Stocké UNIQUEMENT sur l'appareil : jamais envoyé, jamais public, jamais montré à d'autres
 * utilisateurs (MVP). La photo est recadrée, réduite (256 px) et ré-encodée
 * en JPEG, ce qui supprime ses métadonnées (dont la position GPS de la prise de vue).
 */
export const AVATAR_PRESETS = ["leaf", "water", "flower", "air", "forest", "moon", "sun", "bird", "squirrel", "mountain"] as const;
export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

export type Avatar = { kind: "preset"; preset: AvatarPreset } | { kind: "photo"; dataUrl: string };

/** Emblème affiché sans choix, ou après suppression de la photo. */
export const DEFAULT_AVATAR: Avatar = { kind: "preset", preset: "leaf" };

export const AVATAR_KEY = "parkquest.avatar.v1";
export const AVATAR_PHOTO_SIDE = 256;
/** Garde-fou de stockage (~200 Ko) : une photo 256 px en JPEG pèse ~20–40 Ko. */
export const MAX_AVATAR_DATA_URL = 200_000;

/** Carré centré le plus grand possible dans l'image (recadrage de la photo). */
export function squareCrop(width: number, height: number): { sx: number; sy: number; side: number } {
  const side = Math.min(width, height);
  return { sx: Math.round((width - side) / 2), sy: Math.round((height - side) / 2), side };
}

/** Lecture tolérante : format inconnu, corrompu ou photo trop lourde → pas d'avatar. */
export function parseAvatar(raw: string | null): Avatar | null {
  if (!raw) return null;
  try {
    const a = JSON.parse(raw) as Partial<{ kind: string; preset: string; dataUrl: string }>;
    if (a.kind === "preset" && (AVATAR_PRESETS as readonly string[]).includes(a.preset ?? "")) return { kind: "preset", preset: a.preset as AvatarPreset };
    if (a.kind === "photo" && typeof a.dataUrl === "string" && a.dataUrl.startsWith("data:image/jpeg;base64,") && a.dataUrl.length <= MAX_AVATAR_DATA_URL) {
      return { kind: "photo", dataUrl: a.dataUrl };
    }
  } catch {
    /* ignoré */
  }
  return null;
}
