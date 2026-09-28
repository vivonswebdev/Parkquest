"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { simulatedPosition, useDemoGeoMode, useDemoGeoTargetValue } from "@/features/demo/demo-geo";
import { isDemoMode } from "@/lib/config/app-mode";
import { distanceM } from "@/lib/geo";

export type GeoStatus = "idle" | "locating" | "active" | "denied" | "unavailable";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface GeoState {
  status: GeoStatus;
  position: GeoPosition | null;
}

export interface GeoOptions {
  /** Haute précision (plus de batterie) : uniquement pendant une navigation active. */
  highAccuracy?: boolean;
}

/**
 * Géolocalisation PERSONNELLE, « à la demande » :
 *  - la permission n'est demandée qu'après un geste de l'utilisateur (écran d'explication) ;
 *  - le suivi (watchPosition) ne tourne que tant qu'un écran l'a démarré ;
 *  - il est coupé quand l'app passe en arrière-plan et repris au retour ;
 *  - lissage léger des sauts GPS ;
 *  - la position reste dans le navigateur ; elle n'est envoyée au serveur que lors
 *    d'une découverte explicitement demandée (calcul de distance, non stockée).
 *  - Jamais visible par d'autres utilisateurs.
 *
 * En MODE DÉMO, la position peut être simulée (panneau Démo) : même interface.
 */
export function useGeolocation({ highAccuracy = true }: GeoOptions = {}) {
  const [state, setState] = useState<GeoState>({ status: "idle", position: null });
  const watchId = useRef<number | null>(null);
  const wanted = useRef(false);
  const last = useRef<GeoPosition | null>(null);

  const clear = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  };

  const watch = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "unavailable", position: null });
      return;
    }
    if (watchId.current !== null) return;
    setState((s) => ({ ...s, status: s.position ? "active" : "locating" }));
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const next: GeoPosition = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) };
        const prev = last.current;
        // Lissage : un point moins précis et proche du précédent est moyenné (évite les sauts).
        const smoothed =
          prev && next.accuracy >= prev.accuracy && distanceM(prev, next) < next.accuracy
            ? { lat: (prev.lat + next.lat) / 2, lng: (prev.lng + next.lng) / 2, accuracy: next.accuracy }
            : next;
        last.current = smoothed;
        setState({ status: "active", position: smoothed });
      },
      (err) => {
        clear();
        wanted.current = false;
        setState({ status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable", position: null });
      },
      { enableHighAccuracy: highAccuracy, maximumAge: highAccuracy ? 3000 : 15000, timeout: 20000 },
    );
  }, [highAccuracy]);

  const start = useCallback(() => {
    wanted.current = true;
    watch();
  }, [watch]);

  const stop = useCallback(() => {
    wanted.current = false;
    clear();
    last.current = null;
    setState((s) => ({ status: s.status === "active" || s.status === "locating" ? "idle" : s.status, position: null }));
  }, []);

  // Arrière-plan : on coupe le GPS, on le reprend au retour si l'écran le souhaite encore.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") clear();
      else if (wanted.current) watch();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clear();
    };
  }, [watch]);

  // --- Simulation (mode démo) ---
  const simMode = useDemoGeoMode(isDemoMode);
  const simTarget = useDemoGeoTargetValue();
  const [sim, setSim] = useState<"idle" | "locating" | "ready">("idle");
  const simTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (simTimer.current) window.clearTimeout(simTimer.current);
  }, []);

  if (simMode !== "real") {
    const status: GeoStatus =
      sim === "idle" ? "idle" : sim === "locating" ? "locating" : simMode === "denied" ? "denied" : simMode === "unavailable" ? "unavailable" : "active";
    return {
      status,
      position: status === "active" ? simulatedPosition(simMode, simTarget) : null,
      simulated: true as const,
      start: () => {
        setSim("locating");
        simTimer.current = window.setTimeout(() => setSim("ready"), 450);
      },
      stop: () => setSim("idle"),
    };
  }

  return { ...state, simulated: false as const, start, stop };
}
