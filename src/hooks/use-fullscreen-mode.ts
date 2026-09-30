"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Plein écran d'une carte.
 *  - Toujours : pseudo plein écran CSS (le conteneur passe en `fixed inset-0`, 100dvh, zones sûres,
 *    défilement de la page bloqué via `html.pq-immersive`, navigation du site recouverte).
 *  - En plus, si le navigateur le permet (desktop, Android) : API Fullscreen native sur le document.
 *    Sur iPhone, l'API n'existe pas pour une page web : le pseudo plein écran suffit.
 * Sortie : bouton, touche Échap, sortie native du navigateur, ou démontage de l'écran.
 */
export function useFullscreenMode() {
  const [active, setActive] = useState(false);
  const native = useRef(false);

  const exit = useCallback(() => {
    setActive(false);
    if (native.current && typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    native.current = false;
  }, []);

  const enter = useCallback(() => {
    setActive(true);
    const root = document.documentElement;
    if (document.fullscreenEnabled && typeof root.requestFullscreen === "function") {
      root
        .requestFullscreen({ navigationUI: "hide" })
        .then(() => {
          native.current = true;
        })
        .catch(() => {
          /* refusé ou indisponible : le pseudo plein écran reste actif */
        });
    }
  }, []);

  const toggle = useCallback(() => (active ? exit() : enter()), [active, enter, exit]);

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.classList.add("pq-immersive");
    // Sortie native (Échap, geste du navigateur) → on quitte aussi le pseudo plein écran.
    const onChange = () => {
      if (native.current && !document.fullscreenElement) {
        native.current = false;
        setActive(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !native.current) setActive(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    // Laisse la carte recalculer sa taille (changement de conteneur sur desktop).
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    return () => {
      root.classList.remove("pq-immersive");
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };
  }, [active]);

  // Quitter l'écran en plein écran natif : on rend la main au navigateur.
  useEffect(
    () => () => {
      if (native.current && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    },
    [],
  );

  return { active, toggle, exit };
}
