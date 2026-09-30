import { Compass, Egg, Home, Trees, UserRound } from "lucide-react";

/**
 * Navigation principale TYLIA : Accueil · Parcs · Explorer · Collection · Profil.
 * « Explorer » (au centre, mis en avant) ouvre la carte générale : aucun parc sélectionné d'office.
 * Les défis sont désormais des étapes d'aventure (la page /challenges reste accessible par lien).
 */
export const NAV_ITEMS = [
  { key: "home", href: "/", icon: Home, primary: false, match: (p: string) => p === "/" },
  { key: "parksTab", href: "/parks", icon: Trees, primary: false, match: (p: string) => p.startsWith("/parks") && !p.endsWith("/map") && !p.includes("/explore/") },
  { key: "explore", href: "/map", icon: Compass, primary: true, match: (p: string) => p.endsWith("/map") || p.includes("/explore/") },
  { key: "collection", href: "/collection", icon: Egg, primary: false, match: (p: string) => p.startsWith("/collection") },
  { key: "profile", href: "/profile", icon: UserRound, primary: false, match: (p: string) => p.startsWith("/profile") },
] as const;
