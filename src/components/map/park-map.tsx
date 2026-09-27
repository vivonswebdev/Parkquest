"use client";

import dynamic from "next/dynamic";
import { mapboxToken } from "@/lib/supabase/env";
import { FallbackMap } from "./fallback-map";
import type { ParkMapProps } from "./types";

// Mapbox GL n'est chargé que si une clé est configurée (bundle plus léger sinon).
const MapboxMap = dynamic(() => import("./mapbox-map").then((m) => m.MapboxMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

export const hasMapbox = Boolean(mapboxToken);

export function ParkMap(props: ParkMapProps) {
  return hasMapbox ? <MapboxMap {...props} /> : <FallbackMap {...props} />;
}
