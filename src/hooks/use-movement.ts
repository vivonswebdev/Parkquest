"use client";

import { useEffect, useReducer } from "react";
import type { GeoPosition } from "@/hooks/use-geolocation";
import { addFix, initialMovement, resumeMovement, type Fix, type MovementState } from "@/lib/movement";

type Action = { type: "fix"; fix: Fix } | { type: "pause" };

function reducer(state: MovementState, action: Action): MovementState {
  return action.type === "fix" ? addFix(state, action.fix) : resumeMovement(state);
}

/**
 * Tableau de bord de déplacement à partir de la position personnelle (calcul local uniquement).
 * En pause, l'intervalle n'est compté ni en distance ni en vitesse.
 */
export function useMovement(position: GeoPosition | null, active: boolean): MovementState {
  const [state, dispatch] = useReducer(reducer, undefined, initialMovement);
  useEffect(() => {
    if (active && position) dispatch({ type: "fix", fix: { ...position, t: position.timestamp ?? Date.now() } });
  }, [position, active]);
  useEffect(() => {
    if (!active) dispatch({ type: "pause" });
  }, [active]);
  return state;
}
