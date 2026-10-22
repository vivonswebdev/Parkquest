import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: "Explorez. Apprenez. Jouez. Le compagnon de visite des parcs et jardins.",
    start_url: "/fr",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#031711",
    theme_color: "#031711",
    categories: ["travel", "education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
