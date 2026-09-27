"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { simulatedPosition, useDemoGeoMode, useDemoGeoTargetValue } from "@/features/demo/demo-geo";
import { isDemoMode } from "@/lib/config/app-mode";

export type GeoStatus = "idle" | "locating" | "active" | "denied" | "unavailable";

export interface GeoState {
  status: GeoStatus;
  position: { lat: number; lng: number; accuracy: number } | null;
}

/**
 * Géolocalisation « à la demande » : la permission n'est demandée que lorsque
 * l'utilisateur appuie sur un bouton (jamais au chargement de la page).
 * La position reste dans le navigateur ; elle n'est transmise au serveur que
 * ponctuellement, lors d'une découverte explicitement demandée, pour calculer
 * une distance (non stockée).
 *
 * En MODE DÉMO, la position peut être simulée (panneau Démo) : même interface,
 * mêmes états (idle → locating → active | denied | unavailable), aucun écran à adapter.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle", position: null });
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setState((s) => ({ status: s.status === "active" || s.status === "locating" ? "idle" : s.status, position: null }));
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "unavailable", position: null });
      return;
    }
    if (watchId.current !== null) return;
    setState((s) => ({ ...s, status: "locating" }));
    watchId.current = navigator.geolocation.watchPosition(
      (p) =>
        setState({
          status: "active",
          position: { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) },
        }),
      (err) => {
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        setState({ status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable", position: null });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, []);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

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
