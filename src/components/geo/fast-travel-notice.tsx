"use client";

import { Gauge } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Déplacement rapide détecté : le suivi de découverte (distance, arrivées, découvertes) est en
 * pause. Message neutre, sans supposition sur le moyen de transport ni reproche.
 */
export function FastTravelNotice({ className }: { className?: string }) {
  const t = useTranslations("movement");
  return (
    <div role="status" className={cn("glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl border border-gold/40 p-3", className)}>
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold" aria-hidden>
        <Gauge className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{t("pausedTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("pausedBody")}</p>
      </div>
    </div>
  );
}
