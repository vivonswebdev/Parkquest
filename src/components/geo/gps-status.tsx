"use client";

import { Loader2, LocateFixed, LocateOff, Satellite } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GeoStatus } from "@/hooks/use-geolocation";
import { GPS_RULES } from "@/lib/geo";
import { cn } from "@/lib/utils";

/** Indicateur d'état GPS (design system) : texte + icône, jamais la couleur seule. */
export function GpsStatus({ status, accuracy, className }: { status: GeoStatus; accuracy?: number | null; className?: string }) {
  const t = useTranslations("geo");
  const tier =
    status === "locating"
      ? "locating"
      : status === "denied"
        ? "denied"
        : status !== "active" || accuracy == null
          ? "off"
          : accuracy <= GPS_RULES.preciseAccuracyM
            ? "precise"
            : accuracy <= GPS_RULES.maxAccuracyM
              ? "approximate"
              : "imprecise";
  const Icon = tier === "locating" ? Loader2 : tier === "off" || tier === "denied" ? LocateOff : tier === "precise" ? LocateFixed : Satellite;
  return (
    <span
      role="status"
      className={cn(
        "glass-strong inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
        tier === "precise" && "text-primary",
        (tier === "approximate" || tier === "imprecise" || tier === "denied") && "text-gold",
        className,
      )}
    >
      <Icon className={cn("size-3.5", tier === "locating" && "animate-spin")} />
      {t(`status.${tier}`)}
      {status === "active" && accuracy != null && <span className="font-normal text-muted-foreground">± {accuracy} m</span>}
    </span>
  );
}
