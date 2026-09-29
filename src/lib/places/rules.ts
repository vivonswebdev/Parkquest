import { isFreeLicense } from "@/lib/photos/wikimedia";
import type { ContentStatus, ParkMedia, ParkPlace } from "./types";

/**
 * Statut réellement affichable : `park_verified` et `published` ne sont montrés que s'ils sont
 * appuyés par une source ET une validation nommée ; sinon la donnée reste « démonstration ».
 */
export function effectiveStatus(item: { status: ContentStatus; source?: { url: string }; verifiedBy?: string }): ContentStatus {
  if (item.status === "park_verified" || item.status === "published") {
    return item.source?.url && item.verifiedBy ? item.status : "demo";
  }
  return item.status;
}

/** Une donnée non confirmée par le parc porte la mention « à valider avec le parc ». */
export function needsParkValidation(item: Parameters<typeof effectiveStatus>[0]): boolean {
  const s = effectiveStatus(item);
  return s === "demo" || s === "proposed";
}

/**
 * Une image n'est publiée que si : vérifiée (`approved`), licence libre clairement identifiée,
 * auteur ou attribution connus, et URL d'image disponible. Sinon → illustration provisoire.
 */
export function isDisplayableMedia(m: ParkMedia): boolean {
  return m.usageStatus === "approved" && Boolean(m.url) && isFreeLicense(m.license) && Boolean(m.author || m.attribution);
}

/** Photo du LIEU dans le parc (jamais une photo d'espèce présentée comme celle du lieu). */
export function placePhoto(media: ParkMedia[], place: Pick<ParkPlace, "parkSlug" | "slug">): ParkMedia | undefined {
  return media.find((m) => m.kind === "place_photo" && m.parkSlug === place.parkSlug && m.placeSlug === place.slug && isDisplayableMedia(m));
}
