"use client";

import { Loader2, LocateFixed, LocateOff, Satellite } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { GeoStatus } from "@/hooks/use-geolocation";
import { GPS_RULES } from "@/lib/geo";
import { cn } from "@/lib/utils";

/** Durée d'affichage du détail (« GPS précis ± 6 m ») avant réduction à l'icône. */
const DETAIL_VISIBLE_MS = 4000;

/**
 * Indicateur d'état GPS (design system) : texte + icône, jamais la couleur seule.
 * Quand le GPS fonctionne, le détail se réduit automatiquement à une pastille (icône) pour
 * libérer la carte ; un toucher le réaffiche. Les états à connaître (refusé, désactivé,
 * localisation) restent toujours écrits en entier.
 */
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
  const collapsible = tier === "precise" || tier === "approximate" || tier === "imprecise";
  // Réduction automatique : le détail réapparaît quand l'état change ou au toucher.
  const [shownAt, setShownAt] = useState(() => ({ tier, at: 0 }));
  const [now, setNow] = useState(0);
  if (shownAt.tier !== tier) setShownAt({ tier, at: now });
  useEffect(() => {
    if (!collapsible) return;
    const id = window.setTimeout(() => setNow(shownAt.at + DETAIL_VISIBLE_MS), DETAIL_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [collapsible, shownAt]);
  const compact = collapsible && now >= shownAt.at + DETAIL_VISIBLE_MS;

  const label = (
    <>
      {t(`status.${tier}`)}
      {status === "active" && accuracy != null && <span className="font-normal text-muted-foreground">± {accuracy} m</span>}
    </>
  );
  return (
    <span role="status" className="contents">
      <button
        type="button"
        aria-expanded={collapsible ? !compact : undefined}
        onClick={() => collapsible && setShownAt({ tier, at: now })}
        className={cn(
          "glass-strong inline-flex h-8 items-center gap-1.5 rounded-full text-xs font-semibold transition-[padding,width] duration-300",
          compact ? "w-8 justify-center px-0" : "px-3",
          tier === "precise" && "text-primary",
          (tier === "approximate" || tier === "imprecise" || tier === "denied") && "text-gold",
          className,
        )}
      >
        <Icon className={cn("size-3.5 shrink-0", tier === "locating" && "animate-spin")} aria-hidden />
        {compact ? <span className="sr-only">{label}</span> : label}
      </button>
    </span>
  );
}
