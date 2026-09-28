import { mapboxToken } from "@/lib/supabase/env";

/**
 * Configuration cartographique (publique, aucune clé secrète).
 *
 * - Moteur : MapLibre GL (open source). `NEXT_PUBLIC_MAP_ENGINE=fallback` force la
 *   carte simplifiée intégrée (tests, appareils sans WebGL).
 * - Fond : OpenStreetMap vectoriel via OpenFreeMap (gratuit, sans clé) ou tout style
 *   MapLibre compatible OpenMapTiles (`NEXT_PUBLIC_MAP_STYLE_URL`, ex. MapTiler, Stadia).
 * - Satellite : Mapbox (si `NEXT_PUBLIC_MAPBOX_TOKEN`) ou tuiles raster personnalisées.
 * - Relief 3D : tuiles d'altitude ouvertes « Terrain Tiles » (AWS Open Data, Terrarium).
 */
export const mapEngine: "maplibre" | "fallback" = process.env.NEXT_PUBLIC_MAP_ENGINE === "fallback" ? "fallback" : "maplibre";

export const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";

export const satelliteTilesUrl: string | null =
  process.env.NEXT_PUBLIC_SATELLITE_TILES_URL ||
  (mapboxToken ? `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${mapboxToken}` : null);

export const satelliteAttribution = process.env.NEXT_PUBLIC_SATELLITE_TILES_URL
  ? (process.env.NEXT_PUBLIC_SATELLITE_ATTRIBUTION ?? "")
  : '© <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">Mapbox</a> © <a href="https://www.maxar.com/" target="_blank" rel="noopener">Maxar</a>';

export const terrainTilesUrl = process.env.NEXT_PUBLIC_TERRAIN_TILES_URL ?? "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/** Le worker MapLibre est copié dans public/ (scripts/copy-maplibre-worker.mjs). */
export const maplibreWorkerUrl = "/vendor/maplibre/maplibre-gl-worker.mjs";
