"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { LatLng } from "@/lib/domain/types";
import { demoGeo, type DemoGeoMode } from "./demo-data";

/**
 * Position SIMULÉE du mode démo (choisie dans le panneau Démo).
 *  - near         : à ~8 m du spot ciblé, précision 6 m → découverte validée par GPS
 *  - entrance     : à l'entrée du parc, précision 10 m
 *  - low-accuracy : près du spot mais précision 60 m → pas de validation GPS
 *  - denied       : permission refusée
 *  - unavailable  : position indisponible
 *  - real         : vrai GPS du navigateur (HTTPS requis sur iPhone)
 * Rien n'est envoyé ailleurs qu'aux actions de découverte, comme en production.
 */

export type { DemoGeoMode };
export const DEMO_GEO_MODES: DemoGeoMode[] = ["near", "entrance", "low-accuracy", "denied", "unavailable", "real"];

const KEY = "parkquest.demo-geo.v1";
const listeners = new Set<() => void>();
let target: LatLng | null = null;
let modeCache: DemoGeoMode | null = null;

function readMode(): DemoGeoMode {
  if (modeCache) return modeCache;
  try {
    const m = window.localStorage.getItem(KEY) as DemoGeoMode | null;
    modeCache = m && DEMO_GEO_MODES.includes(m) ? m : demoGeo.defaultMode;
  } catch {
    modeCache = demoGeo.defaultMode;
  }
  return modeCache;
}

const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function setDemoGeoMode(mode: DemoGeoMode) {
  modeCache = mode;
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
  emit();
}

export function useDemoGeoMode(enabled: boolean): DemoGeoMode {
  const m = useSyncExternalStore(subscribe, readMode, () => demoGeo.defaultMode);
  return enabled ? m : "real";
}

/** Déclare le lieu autour duquel simuler la position (spot en cours, spot affiché). */
export function useDemoGeoTarget(location: LatLng | null | undefined) {
  useEffect(() => {
    if (!location) return;
    target = location;
    emit();
  }, [location?.lat, location?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
}

function readTarget(): string {
  return target ? `${target.lat},${target.lng}` : "";
}

export function useDemoGeoTargetValue(): LatLng | null {
  const key = useSyncExternalStore(subscribe, readTarget, () => "");
  if (!key) return null;
  const [lat, lng] = key.split(",").map(Number);
  return { lat, lng };
}

/** Position simulée pour un mode donné. */
export function simulatedPosition(mode: DemoGeoMode, near: LatLng | null): { lat: number; lng: number; accuracy: number } | null {
  if (mode === "entrance") return { ...demoGeo.entrance, accuracy: demoGeo.entranceAccuracyM };
  if (mode === "near" || mode === "low-accuracy") {
    const base = near ?? demoGeo.entrance;
    return {
      lat: base.lat + demoGeo.nearOffset.lat,
      lng: base.lng + demoGeo.nearOffset.lng,
      accuracy: mode === "near" ? demoGeo.nearAccuracyM : demoGeo.lowAccuracyM,
    };
  }
  return null;
}
