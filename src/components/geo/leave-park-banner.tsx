"use client";

import { DoorOpen, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { UserPosition } from "@/components/map/types";
import { boundaryState, nextLeaveAlert, type LeaveAlertState } from "@/lib/map/boundary";
import type { Ring } from "@/lib/map/nature";

/**
 * Alerte douce quand on s'éloigne de la zone de visite APPROXIMATIVE (éviter de se perdre) ;
 * jamais présentée comme une limite officielle du parc, dont les consignes restent prioritaires : confirmée sur plusieurs
 * positions précises, une seule vibration courte, jamais répétée tant qu'on n'est pas revenu.
 */
export function useLeaveAlert(ring: Ring | null, position: UserPosition | null | undefined, { simulated = false } = {}) {
  const [state, setState] = useState<LeaveAlertState>({ outsideCount: 0, alerted: false });
  const [dismissed, setDismissed] = useState(false);
  // Chaque nouvelle position est évaluée une fois (comparée par valeur : la position simulée
  // du mode démo est recréée à chaque rendu).
  const fixKey = position ? `${position.lat},${position.lng},${position.accuracy}` : "";
  const [lastFix, setLastFix] = useState("");
  if (position && fixKey !== lastFix) {
    setLastFix(fixKey);
    // Position simulée (démo) : fixe, donc confirmée dès la première lecture.
    const next = nextLeaveAlert(state, boundaryState(position, ring), simulated ? 1 : undefined);
    if (next.outsideCount !== state.outsideCount || next.alerted !== state.alerted) {
      setState(next);
      if (!next.alerted && dismissed) setDismissed(false);
    }
  }
  const active = state.alerted && !dismissed;
  const vibrated = useRef(false);
  useEffect(() => {
    if (active && !vibrated.current) {
      vibrated.current = true;
      try {
        navigator.vibrate?.(150);
      } catch {
        /* vibration non prise en charge (iPhone) : l'alerte reste visuelle */
      }
    }
    if (!state.alerted) vibrated.current = false;
  }, [active, state.alerted]);
  return { active, dismiss: () => setDismissed(true) };
}

export function LeaveParkBanner({ onBackToEntrance, onDismiss }: { onBackToEntrance?(): void; onDismiss(): void }) {
  const t = useTranslations("map");
  return (
    <div role="alert" className="glass-strong pointer-events-auto rounded-2xl border border-gold/40 p-3 card-shadow">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold" aria-hidden>
          <DoorOpen className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("leaveTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("leaveBody")}</p>
        </div>
        <button type="button" onClick={onDismiss} aria-label={t("leaveDismiss")} className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
          <X className="size-4" />
        </button>
      </div>
      {onBackToEntrance && (
        <Button variant="secondary" block className="mt-2" onClick={onBackToEntrance}>
          {t("backToEntrance")}
        </Button>
      )}
    </div>
  );
}
