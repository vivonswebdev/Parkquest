"use client";

import { ArrowUp, Compass, Navigation, Pause, Play, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ExplorationBottomPanel,
  ExplorationControlButton,
  ExplorationControls,
  ExplorationDialog,
  ExplorationShell,
  ExplorationTopBar,
} from "@/components/exploration/exploration-shell";
import { SafetyScreen } from "@/components/exploration/safety-screen";
import { GpsStatus } from "@/components/geo/gps-status";
import { LocationConsentSheet } from "@/components/geo/location-consent-sheet";
import { ParkMap } from "@/components/map/park-map";
import type { MapEngine, MapHandle, MapMarker, MapPath } from "@/components/map/types";
import { DemoBadge } from "@/components/shared/demo-badge";
import { SPOT_KIND_COLOR } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { useDemoGeoTarget } from "@/features/demo/demo-geo";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useMovement } from "@/hooks/use-movement";
import { useRouter } from "@/i18n/navigation";
import { isDemoMode } from "@/lib/config/app-mode";
import type { LatLng, Trail } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { segmentVariant, trailStepStates } from "@/lib/game/trail-progress";
import { bearingDeg, distanceM, pathLengthM } from "@/lib/geo";
import { useLocationConsent } from "@/lib/location-consent";
import { cardinal, etaMinutes, speedKmh } from "@/lib/movement";
import type { QuestSummary } from "@/lib/quests/catalog";

interface Props {
  park: { slug: string; bounds: [LatLng, LatLng] };
  quest: QuestSummary;
  trail: Trail;
}

type Phase = "safety" | "playing";

/**
 * Mode Exploration (E2) : écran de sécurité, carte plein écran, objectif en cours,
 * tableau de déplacement (local), contrôles (recentrer, 2D/3D, nord), pause et sortie.
 * Les objectifs sont les spots du parcours support, uniquement sur les chemins autorisés.
 * Le moteur de quête (énigmes, récompenses) arrive en E3.
 */
export function ExplorationRunner({ park, quest, trail }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const [phase, setPhase] = useState<Phase>("safety");
  const [paused, setPaused] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [engine, setEngine] = useState<MapEngine | null>(null);
  const [view3d, setView3d] = useState(false);
  const [index, setIndex] = useState(0);
  const [announce, setAnnounce] = useState("");

  // Haute précision uniquement pendant l'aventure active ; jamais avant l'écran de sécurité.
  const geo = useGeolocation({ highAccuracy: true });
  const consent = useLocationConsent();
  const [askConsent, setAskConsent] = useState(false);
  const movement = useMovement(geo.position, phase === "playing" && !paused);

  const target = trail.spots[index];
  // Démo : la position simulée suit l'objectif en cours.
  useDemoGeoTarget(phase === "playing" ? target?.location : undefined);

  const trailHref = `/parks/${park.slug}/trails/${trail.slug}`;
  const questTitle = t(`explore.quests.${quest.key}.title`);

  const stepStates = useMemo(() => trailStepStates(trail.spots.map((s) => s.id), new Set<string>(), index), [trail.spots, index]);

  const markers: MapMarker[] = useMemo(
    () => [
      { id: "start", type: "start", location: trail.start, color: "#F5FFFA", iconKey: "start", label: t("visit.start") },
      ...trail.spots.map((s, i) => ({
        id: s.id,
        type: "spot" as const,
        location: s.location,
        color: SPOT_KIND_COLOR[s.kind],
        iconKey: s.kind,
        label: t("visit.markerLabel", { n: i + 1, name: s.name }),
        ariaLabel: `${t("visit.stepOf", { current: i + 1, total: trail.spots.length })} · ${s.name}${i === index ? ` · ${t("explore.objective")}` : ""}`,
        highlighted: i === index,
        step: { n: i + 1, state: stepStates[i], last: i === trail.spots.length - 1 },
      })),
    ],
    [trail, stepStates, index, t],
  );

  const paths: MapPath[] = useMemo(
    () =>
      trail.segments.map((sg) => {
        const i = trail.spots.findIndex((s) => s.id === sg.toSpotId);
        return { id: sg.id, coordinates: sg.path, variant: segmentVariant(stepStates[i]) };
      }),
    [trail, stepStates],
  );

  const trailBounds = useMemo<[LatLng, LatLng]>(() => {
    const pts = [trail.start, ...trail.spots.map((s) => s.location), ...trail.segments.flatMap((g) => g.path.map(([lng, lat]) => ({ lat, lng })))];
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const mLat = (Math.max(...lats) - Math.min(...lats)) * 0.18;
    const mLng = (Math.max(...lngs) - Math.min(...lngs)) * 0.18;
    return [
      { lat: Math.min(...lats) - mLat, lng: Math.min(...lngs) - mLng },
      { lat: Math.max(...lats) + mLat, lng: Math.max(...lngs) + mLng },
    ];
  }, [trail]);

  // Distance à l'objectif : depuis la position si connue, sinon longueur du tronçon balisé.
  const segment = trail.segments.find((s) => s.toSpotId === target?.id);
  const from: LatLng = index === 0 ? trail.start : trail.spots[index - 1].location;
  const remainingM = target ? (geo.position ? distanceM(geo.position, target.location) : segment ? pathLengthM(segment.path) : distanceM(from, target.location)) : 0;
  const direction = geo.position && target ? bearingDeg(geo.position, target.location) : null;

  const start = () => {
    setPhase("playing");
    if (consent === "granted") geo.start();
    else setAskConsent(true);
    setAnnounce(t("explore.announceStart", { name: target?.name ?? "", distance: formatDistance(remainingM, locale) }));
  };

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    if (next) geo.stop();
    else if (consent === "granted") geo.start();
    setAnnounce(next ? t("explore.paused") : t("explore.announceResumed"));
  };

  const quit = () => {
    geo.stop();
    router.push(trailHref);
  };

  const selectObjective = useCallback(
    (id: string | null) => {
      const i = trail.spots.findIndex((s) => s.id === id);
      if (i < 0) return;
      setIndex(i);
      setAnnounce(t("explore.announceObjective", { name: trail.spots[i].name }));
    },
    [trail.spots, t],
  );

  const recenter = () => {
    if (target) mapRef.current?.flyTo(geo.position ?? target.location, 17);
  };

  // Le GPS s'arrête toujours en quittant l'écran (au démontage seulement : `geo.stop` peut
  // changer d'identité à chaque rendu, on garde donc la dernière version dans une ref).
  const stopGeo = useRef(geo.stop);
  useEffect(() => {
    stopGeo.current = geo.stop;
  });
  useEffect(() => () => stopGeo.current(), []);

  const km = movement.speedMps !== null ? speedKmh(movement.speedMps) : null;

  return (
    <ExplorationShell>
      <ParkMap
        ref={mapRef}
        bounds={trailBounds}
        markers={markers}
        paths={paths}
        user={geo.position}
        selectedId={target?.id}
        onSelect={selectObjective}
        paddingBottom={320}
        attributionTop={132}
        view3d={view3d}
        onEngine={setEngine}
      />

      {/* Annonces pour les lecteurs d'écran (événements, jamais la distance en continu) */}
      <p className="sr-only" aria-live="polite">{announce}</p>

      <ExplorationTopBar>
        <div className="glass-strong mx-auto flex max-w-xl items-center gap-3 rounded-[22px] p-3 card-shadow">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{t("explore.title")}</p>
            <h1 className="truncate font-display text-lg font-extrabold leading-tight">{questTitle}</h1>
          </div>
          <button type="button" onClick={() => setConfirmQuit(true)} aria-label={t("explore.quit")} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-inset hover:bg-danger/20 hover:text-danger">
            <X className="size-5" />
          </button>
        </div>
        {phase === "playing" && (
          <div className="mx-auto mt-2 flex max-w-xl items-center justify-center gap-2">
            <GpsStatus status={geo.status} accuracy={geo.position?.accuracy} />
            {isDemoMode && <DemoBadge className="border-transparent bg-black/55 text-[#f4c95d] backdrop-blur" />}
          </div>
        )}
      </ExplorationTopBar>

      {phase === "playing" && (
        <ExplorationControls className="top-[38%]">
          <ExplorationControlButton label={t("map.myPosition")} onClick={recenter}>
            <Navigation className="size-5" />
          </ExplorationControlButton>
          {engine === "maplibre" && (
            <ExplorationControlButton label={view3d ? t("map.view2d") : t("map.view3d")} onClick={() => setView3d((v) => !v)} active={view3d}>
              <span className="text-xs font-extrabold tracking-tight">{view3d ? "2D" : "3D"}</span>
            </ExplorationControlButton>
          )}
          <ExplorationControlButton label={t("map.resetNorth")} onClick={() => mapRef.current?.resetNorth()}>
            <Compass className="size-5" />
          </ExplorationControlButton>
        </ExplorationControls>
      )}

      {phase === "playing" && (
        <ExplorationBottomPanel>
          {(geo.status === "denied" || geo.status === "unavailable") && !paused && (
            <p role="status" className="glass-strong rounded-2xl px-4 py-3 text-sm">
              <span className="font-semibold text-gold">{t("gps.unavailable")}</span> <span className="text-muted-foreground">{t("gps.unavailableBody")}</span>
            </p>
          )}

          {paused ? (
            <div className="glass-strong rounded-[var(--radius-sheet)] p-5 text-center card-shadow">
              <p className="font-display text-xl font-bold">{t("explore.paused")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("explore.pausedBody")}</p>
              <Button size="lg" block className="mt-4" onClick={togglePause}>
                <Play className="fill-current" /> {t("explore.resume")}
              </Button>
            </div>
          ) : target ? (
            <div className="glass-strong rounded-[var(--radius-sheet)] p-4 card-shadow">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {t("explore.objective")} · {t("visit.stepOf", { current: index + 1, total: trail.spots.length })}
              </p>
              <h2 className="truncate font-display text-2xl font-extrabold leading-tight">{target.name}</h2>
              {index === 0 && <p className="text-sm text-muted-foreground">{t(`explore.quests.${quest.key}.intro`)}</p>}

              <dl className="mt-3 grid grid-cols-4 gap-1.5 text-center" aria-label={t("explore.dashboard.title")}>
                <DashTile label={t("explore.dashboard.remaining")} value={formatDistance(remainingM, locale)} sub={t("explore.dashboard.minutes", { minutes: etaMinutes(remainingM, movement.speedMps) })} />
                <DashTile
                  label={t("explore.dashboard.direction")}
                  value={
                    direction !== null ? (
                      // Carte orientée nord en haut : la flèche indique la direction de l'objectif sur la carte.
                      <span className="inline-flex items-center gap-1" aria-label={t(`explore.cardinals.${cardinal(direction)}`)}>
                        <ArrowUp className="size-4 text-primary motion-safe:transition-transform" style={{ transform: `rotate(${Math.round(direction)}deg)` }} aria-hidden />
                        <span aria-hidden>{t(`explore.cardinalsShort.${cardinal(direction)}`)}</span>
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <DashTile label={t("explore.dashboard.walked")} value={formatDistance(movement.distanceM, locale)} />
                <DashTile label={t("explore.dashboard.speed")} value={km !== null ? t("explore.dashboard.speedValue", { value: km }) : "—"} />
              </dl>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{t("explore.dashboard.note")}</p>

              {geo.status === "idle" && (
                <Button variant="outline" block className="mt-3" onClick={() => (consent === "granted" ? geo.start() : setAskConsent(true))}>
                  <Navigation /> {t("gps.enable")}
                </Button>
              )}

              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <Button size="lg" variant="secondary" onClick={togglePause} className="text-base">
                  <Pause className="fill-current" /> {t("explore.pause")}
                </Button>
                <Button size="lg" variant="ghost" className="border border-border" onClick={() => setConfirmQuit(true)}>
                  <X /> {t("explore.quit")}
                </Button>
              </div>
              {quest.status === "demo" && <p className="mt-2 text-center text-[11px] text-gold/90">{t("explore.demoData")}</p>}
            </div>
          ) : null}
        </ExplorationBottomPanel>
      )}

      {phase === "safety" && <SafetyScreen backHref={trailHref} onStart={start} />}

      {phase === "playing" && !paused && askConsent && (
        <LocationConsentSheet
          onAccept={() => {
            setAskConsent(false);
            geo.start();
          }}
          onDecline={() => setAskConsent(false)}
        />
      )}

      {confirmQuit && (
        <ExplorationDialog labelledBy="explore-quit-title">
          <p id="explore-quit-title" className="font-display text-lg font-bold">{t("explore.quitTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("explore.quitBody")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirmQuit(false)}>{t("explore.continue")}</Button>
            <Button variant="danger" onClick={quit}>{t("explore.quit")}</Button>
          </div>
        </ExplorationDialog>
      )}
    </ExplorationShell>
  );
}

function DashTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-inset px-1.5 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold tabular-nums leading-tight">{value}</dd>
      {sub && <dd className="text-[11px] tabular-nums text-muted-foreground">{sub}</dd>}
    </div>
  );
}
