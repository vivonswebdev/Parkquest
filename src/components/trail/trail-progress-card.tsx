"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useDemoProgress } from "@/features/demo/demo-progress";
import { isDemoMode } from "@/lib/config/app-mode";
import { trailRemaining, trailStepStates } from "@/lib/game/trail-progress";
import { TrailProgress } from "./trail-progress";

/** Fiche parcours : progression du visiteur (démo : sur l'appareil ; sinon : serveur). */
export function TrailProgressCard({
  trailName,
  spots,
  segments,
  completionPoints,
  serverDiscovered,
}: {
  trailName: string;
  spots: { id: string; pointsValue: number }[];
  segments: { toSpotId: string; path: [number, number][] }[];
  completionPoints: number;
  serverDiscovered: string[] | null;
}) {
  const demo = useDemoProgress();
  const discovered = useMemo(() => new Set(isDemoMode ? demo.discovered : (serverDiscovered ?? [])), [demo.discovered, serverDiscovered]);
  const ids = spots.map((s) => s.id);
  const firstLeft = Math.max(0, ids.findIndex((id) => !discovered.has(id)));
  const allDone = ids.every((id) => discovered.has(id));
  const states = trailStepStates(ids, discovered, allDone ? ids.length - 1 : firstLeft);
  const remaining = trailRemaining(spots, segments, discovered, completionPoints);
  return (
    <Card className="p-4">
      <TrailProgress trailName={trailName} states={states} stepIndex={firstLeft} remaining={remaining} />
    </Card>
  );
}
