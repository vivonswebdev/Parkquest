import "server-only";

/**
 * Environnement de déploiement (variables système Vercel, lues côté serveur à la construction).
 *  - production : branche `main` → aucun outil de développement visible ;
 *  - preview    : branches de PR → bannière « Aperçu de développement » + panneau de démonstration ;
 *  - local      : développement et tests e2e → panneau de démonstration, pas de bannière
 *                 (sauf PARKQUEST_PREVIEW_BANNER=1 pour la vérifier en local).
 */
export type DeployEnv = "production" | "preview" | "local";

/**
 * APERÇU TEMPORAIRE UNIQUEMENT (branche `feature/release-preview-wave-1`, jamais fusionnée) :
 * cet aperçu combiné se comporte comme la production (ni bannière ni panneau de démonstration),
 * pour tester sur téléphone la première tranche telle qu'elle apparaîtra sur `main`.
 */
const productionLikePreview = process.env.VERCEL_GIT_COMMIT_REF === "feature/release-preview-wave-1";

export const deployEnv: DeployEnv =
  process.env.VERCEL_ENV === "production" || productionLikePreview ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "local";

/** Outils de démonstration (position simulée, remise à zéro…) : jamais en production. */
export const showDemoTools = deployEnv !== "production";

export const showPreviewBanner = deployEnv === "preview" || process.env.PARKQUEST_PREVIEW_BANNER === "1";

/** Branche et commit de l'aperçu (affichés dans la bannière pour les testeurs). */
export const previewBuild = {
  branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
};
