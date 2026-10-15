/**
 * Identité de marque — source unique. Changer de nom ou de couleurs se fait ici
 * (métadonnées, manifeste PWA, en-têtes, pied de page). Les identifiants techniques
 * (clés localStorage `parkquest.*`, nom du dépôt, cookies) restent inchangés.
 */
export const brand = {
  name: "TYLIA",
  /** Ancien nom, pour la transition (README, mentions). */
  formerName: "ParkQuest",
  tagline: "Discover Nature",
  colors: {
    /** Vert forêt du mot-symbole. */
    forest: "#2E543E",
    /** Demi-feuille gauche. */
    leafDark: "#2F573D",
    /** Demi-feuille droite (dégradé). */
    leafLight: "#A3C9AE",
    leafMid: "#66997B",
    /** Signature « Discover Nature ». */
    sage: "#6E9C82",
    /** Fond des icônes d'application. */
    iconBackground: "#F6FAF7",
  },
} as const;
