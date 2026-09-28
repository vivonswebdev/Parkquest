"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { mapEngine } from "@/lib/map/config";
import { FallbackMap } from "./fallback-map";
import type { MapEngine, ParkMapProps } from "./types";

// MapLibre GL n'est chargé que côté client, à la demande (bundle initial plus léger).
const MapLibreParkMap = dynamic(() => import("./maplibre-map").then((m) => m.MapLibreParkMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

// Détection faite une seule fois (chaque test crée un contexte WebGL, ressource limitée).
let webglSupport: boolean | undefined;
function detectWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") ?? c.getContext("webgl");
      webglSupport = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}
const noop = () => () => {};
function useWebGL(): boolean | null {
  return useSyncExternalStore(noop, detectWebGL, () => null);
}

/**
 * Carte du parc : MapLibre GL (OpenStreetMap, 3D) ; repli automatique sur la carte
 * simplifiée intégrée si WebGL est absent ou si le fond de carte ne charge pas.
 */
export function ParkMap({ onEngine, ...props }: ParkMapProps) {
  const webgl = useWebGL();
  const [failed, setFailed] = useState(false);
  const engine: MapEngine | null = mapEngine === "fallback" || failed || webgl === false ? "fallback" : webgl === null ? null : "maplibre";

  useEffect(() => {
    if (engine) onEngine?.(engine);
  }, [engine, onEngine]);

  if (engine === null) return <div className="h-full w-full bg-background" />;
  if (engine === "fallback") return <FallbackMap {...props} />;
  return <MapLibreParkMap {...props} onFail={() => setFailed(true)} />;
}
