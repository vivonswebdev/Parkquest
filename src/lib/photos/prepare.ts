/**
 * Préparation d'une photo AVANT envoi, sur l'appareil :
 * - contrôle du fichier (type, taille) — fonction pure, testée ;
 * - redimensionnement (côté long ≤ 1600 px) et ré-encodage JPEG, ce qui supprime
 *   toutes les métadonnées EXIF, dont la position GPS de la prise de vue.
 */

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const MIN_SIDE_PX = 480;

export type PhotoFileError = "TYPE" | "TOO_LARGE" | "EMPTY";

export function validatePhotoFile(f: { type: string; size: number }): PhotoFileError | null {
  if (!f.size) return "EMPTY";
  if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(f.type.toLowerCase())) return "TYPE";
  if (f.size > MAX_INPUT_BYTES) return "TOO_LARGE";
  return null;
}

/** Dimensions cibles en conservant les proportions (côté long ≤ maxSide). */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const k = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * k), height: Math.round(height * k) };
}

export interface PreparedPhoto {
  blob: Blob;
  width: number;
  height: number;
}

/** Redimensionne et ré-encode en JPEG (navigateur uniquement). Métadonnées supprimées. */
export async function preparePhoto(file: File, maxSide = 1600, quality = 0.85): Promise<PreparedPhoto> {
  // imageOrientation « from-image » : applique la rotation EXIF avant de l'effacer.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    if (Math.min(bitmap.width, bitmap.height) < MIN_SIDE_PX) throw new Error("TOO_SMALL");
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("ENCODE"))), "image/jpeg", quality));
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}

/** Lecture en data URL (démo : conservation locale sur l'appareil). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
