import { Compass, Home, Map, Trophy, UserRound } from "lucide-react";
import { FEATURED_PARK_SLUG_PUBLIC } from "@/lib/constants";

export const NAV_ITEMS = [
  { key: "home", href: "/", icon: Home, match: (p: string) => p === "/" },
  { key: "map", href: `/parks/${FEATURED_PARK_SLUG_PUBLIC}/map`, icon: Map, match: (p: string) => p.endsWith("/map") },
  {
    key: "discover",
    href: "/parks",
    icon: Compass,
    match: (p: string) => (p.startsWith("/parks") && !p.endsWith("/map")) || p.startsWith("/blog"),
  },
  { key: "challenges", href: "/challenges", icon: Trophy, match: (p: string) => p.startsWith("/challenges") },
  { key: "profile", href: "/profile", icon: UserRound, match: (p: string) => p.startsWith("/profile") },
] as const;
