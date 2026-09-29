"use client";

import { Car } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Déplacement en véhicule détecté : la progression (distance, arrivées, découvertes) est en
 * pause. Message bienveillant, sans accusation ni sanction : on reprend simplement à pied.
 */
export function VehicleNotice({ className }: { className?: string }) {
  const t = useTranslations("movement");
  return (
    <div role="status" className={cn("glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl border border-gold/40 p-3", className)}>
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold" aria-hidden>
        <Car className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{t("vehicleTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("vehicleBody")}</p>
      </div>
    </div>
  );
}
