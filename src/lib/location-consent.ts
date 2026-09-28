"use client";

import { useSyncExternalStore } from "react";

/**
 * Choix de l'utilisateur sur l'écran « Activez votre position » (stocké sur l'appareil).
 * "granted" = il a accepté d'utiliser sa position pour SA visite (jamais partagée).
 * "declined" = « Pas maintenant » : l'app fonctionne sans GPS.
 */
export type LocationConsent = "unset" | "granted" | "declined";

const KEY = "parkquest.location-consent.v1";
const listeners = new Set<() => void>();

function read(): LocationConsent {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "declined" ? v : "unset";
  } catch {
    return "unset";
  }
}

export function setLocationConsent(v: Exclude<LocationConsent, "unset">) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/**
 * "pending" côté serveur / avant hydratation : l'écran de pré-autorisation n'est
 * jamais pré-rendu (pas de flash pour qui a déjà choisi, pas de clic perdu).
 */
export function useLocationConsent(): LocationConsent | "pending" {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "pending",
  );
}
