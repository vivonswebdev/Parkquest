"use client";

import { Check, Loader2, MapPinCheck, Navigation, Radar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useOnline } from "@/components/layout/network-status";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { DiscoverResult, LatLng } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { updateDemoProgress, useDemoProgress } from "@/features/demo/demo-progress";
import { distanceM } from "@/lib/geo";
import { proximityTier } from "@/lib/game/rules";
import { useDemoGeoTarget } from "@/features/demo/demo-geo";
import { isDemoMode } from "@/lib/config/app-mode";
import { cn } from "@/lib/utils";
import { discoverSpotAction } from "@/server/game-actions";
import { ActionErrorMessage, ModeNotice, PointsBurst } from "./feedback";

/**
 * Découverte d'un spot — JAMAIS automatique :
 *   distance + précision GPS + geste explicite = découverte.
 * Paliers affichés (src/lib/game/rules.ts → proximityTier) :
 *  - précision ≤ 10 m et ≤ 25 m : « Vous êtes près de … », distance et précision ;
 *  - précision 10–25 m : « Vous semblez proche de ce lieu », confirmation ;
 *  - précision > 25 m : pas de validation GPS, confirmation manuelle (déclarative).
 * Le serveur revérifie tout et n'attribue les points qu'une seule fois.
 */
export function DiscoverSpotCard({
  spotId,
  spotName,
  spotLocation,
  radiusM,
  visitId,
  inVisit,
  serverDiscovered,
  onDiscovered,
  geo: externalGeo,
  fastTravel = false,
  className,
}: {
  spotId: string;
  spotName?: string;
  spotLocation: LatLng;
  radiusM: number;
  visitId?: string | null;
  inVisit?: boolean;
  serverDiscovered?: boolean;
  onDiscovered?: (r: Extract<DiscoverResult, { ok: true }>) => void;
  geo?: ReturnType<typeof useGeolocation>;
  /** Déplacement rapide détecté : suivi de découverte en pause. */
  fastTravel?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const online = useOnline();
  const ownGeo = useGeolocation();
  const geo = externalGeo ?? ownGeo;
  // Démo : la position simulée « près du spot » vise ce spot.
  useDemoGeoTarget(spotLocation);
  const demo = useDemoProgress();
  const [result, setResult] = useState<DiscoverResult | null>(null);
  const [pending, start] = useTransition();

  // En mode démo, la collection locale fait foi ; en mode Supabase, uniquement le serveur.
  const already = serverDiscovered || (isDemoMode && demo.discovered.includes(spotId)) || (result?.ok && result.status === "ALREADY_DISCOVERED");

  const d = geo.position ? distanceM(geo.position, spotLocation) : null;
  const tier = geo.position && d !== null ? proximityTier(d, geo.position.accuracy, radiusM) : null;
  const near = tier === "precise" || tier === "likely";

  const discover = () => {
    if (!online) {
      setResult({ ok: false, error: "OFFLINE" });
      return;
    }
    start(async () => {
      const r = await discoverSpotAction({
        spotId,
        visitId: visitId ?? null,
        latitude: geo.position?.lat,
        longitude: geo.position?.lng,
        accuracyM: geo.position?.accuracy,
        inVisit: Boolean(inVisit),
      });
      setResult(r);
      if (r.ok && r.status === "DISCOVERED") {
        if (r.mode === "demo") {
          updateDemoProgress((p) => (p.discovered.includes(spotId) ? p : { ...p, discovered: [...p.discovered, spotId], points: p.points + r.pointsAwarded }));
        }
        onDiscovered?.(r);
      }
    });
  };

  if (already && !(result?.ok && result.status === "DISCOVERED")) {
    return (
      <div className={cn("flex items-center gap-3 rounded-[var(--radius-card)] border border-primary/30 bg-primary/10 p-4", className)}>
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-5" strokeWidth={3} /></span>
        <p className="font-semibold text-primary">{t("visit.alreadyDiscovered")}</p>
      </div>
    );
  }

  if (result?.ok && result.status === "DISCOVERED") {
    return (
      <div className={cn("space-y-3 rounded-[var(--radius-card)] border border-primary/40 bg-primary/10 p-4", className)} aria-live="polite">
        <p className="flex items-center gap-2 font-display text-xl font-extrabold text-primary">
          <MapPinCheck className="size-6" /> {t("visit.discovered")}
        </p>
        <p className="text-sm text-muted-foreground">
          {result.method === "GPS_VERIFIED" ? t("visit.discoveredVerified") : t("visit.discoveredDeclared")}
        </p>
        <PointsBurst points={result.pointsAwarded} badges={result.newBadges} />
        <ModeNotice mode={result.mode} />
      </div>
    );
  }

  if (fastTravel) {
    return (
      <div role="status" className={cn("rounded-[var(--radius-card)] border border-gold/40 bg-surface p-4 text-sm", className)}>
        <span className="font-semibold text-gold">{t("movement.pausedDiscover")}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-[var(--radius-card)] border border-border bg-surface p-4", near && "border-primary/50 glow-mint", className)}>
      {geo.status === "idle" && (
        <>
          <p className="text-sm text-muted-foreground">{t("map.positionPrompt")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button block onClick={geo.start}>
              <Navigation /> {t("gps.enable")}
            </Button>
            <Button block variant="secondary" onClick={discover} disabled={pending}>
              {t("gps.discoverManual")}
            </Button>
          </div>
        </>
      )}

      {geo.status === "locating" && (
        <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin text-primary" /> {t("map.locating")}</p>
      )}

      {(geo.status === "denied" || geo.status === "unavailable") && (
        <>
          <p className="text-sm">
            <span className="font-semibold text-gold">{geo.status === "denied" ? t("gps.denied") : t("gps.unavailable")}</span>{" "}
            <span className="text-muted-foreground">{t("gps.unavailableBody")}</span>
          </p>
          <Button block variant="secondary" onClick={discover} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {t("gps.withoutGpsMode")} · {t("gps.discoverManual")}
          </Button>
        </>
      )}

      {geo.status === "active" && d !== null && tier && (
        <>
          <div className="flex items-center gap-3">
            <span className={cn("relative inline-flex size-11 shrink-0 items-center justify-center rounded-full", near ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {near && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-primary/50" />}
              <Radar className="relative size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">
                {tier === "precise"
                  ? t("geo.precise", { name: spotName ?? "" })
                  : tier === "likely"
                    ? t("gps.near")
                    : tier === "imprecise"
                      ? t("geo.imprecise", { count: geo.position!.accuracy })
                      : formatDistance(d, locale)}
              </p>
              <p className="text-xs text-muted-foreground">
                {tier === "likely" ? `${t("geo.likelyBody")} · ` : ""}
                {t("geo.estDistance", { distance: formatDistance(d, locale) })} · {t("geo.accuracy", { count: geo.position!.accuracy })}
              </p>
            </div>
          </div>
          {tier === "imprecise" && <p className="text-sm text-muted-foreground">{t("geo.impreciseBody")}</p>}
          <Button block size="lg" onClick={discover} disabled={pending} variant={near ? "primary" : "secondary"}>
            {pending && <Loader2 className="animate-spin" />}
            {near ? t("gps.discover") : tier === "imprecise" ? t("geo.confirmHere") : t("gps.discoverManual")}
          </Button>
        </>
      )}

      {result?.ok && result.status === "TOO_FAR" && (
        <p className="text-sm text-gold">{t("gps.tooFar", { distance: formatDistance(result.distanceM ?? 0, locale) })}</p>
      )}
      {result && !result.ok && <ActionErrorMessage error={result.error} />}
    </div>
  );
}
