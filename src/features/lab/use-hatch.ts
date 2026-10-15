"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HATCH_TIMELINE, type HatchPhase } from "./art/hatch-scene";

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Chronologie de l'éclosion. Animations réduites : pas de secousses ni de morceaux,
 * l'œuf s'efface et le compagnon apparaît en fondu (« appear » → « done »).
 */
export function useHatch(initial: HatchPhase = "dormant") {
  const [phase, setPhase] = useState<HatchPhase>(initial);
  const [reduced, setReduced] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const open = useCallback((onDone?: () => void) => {
    clear();
    const r = prefersReduced();
    setReduced(r);
    const steps: [HatchPhase, number][] = r ? [["glow", 0], ["split", 400], ["appear", 700], ["done", 1500]] : HATCH_TIMELINE;
    for (const [p, ms] of steps) timers.current.push(setTimeout(() => setPhase(p), ms));
    if (onDone) timers.current.push(setTimeout(onDone, steps[steps.length - 1][1]));
  }, []);

  const skip = useCallback(() => {
    clear();
    setPhase("done");
  }, []);

  const reset = useCallback((p: HatchPhase = "dormant") => {
    clear();
    setPhase(p);
  }, []);

  return { phase, setPhase, reduced, open, skip, reset };
}
