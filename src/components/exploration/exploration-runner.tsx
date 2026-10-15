"use client";

import { ArrowUp, Check, Compass, MapPin, Navigation, Pause, Play, RotateCcw, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DemoEgg } from "@/components/exploration/demo-egg";
import {
  ExplorationBottomPanel,
  ExplorationControlButton,
  ExplorationControls,
  ExplorationDialog,
  ExplorationShell,
  ExplorationTopBar,
} from "@/components/exploration/exploration-shell";
import { ACTIVITY_ICON, QuestActivity } from "@/components/exploration/quest-step-panel";
import { SafetyScreen } from "@/components/exploration/safety-screen";
import { GpsStatus } from "@/components/geo/gps-status";
import { LocationConsentSheet } from "@/components/geo/location-consent-sheet";
import { ParkMap } from "@/components/map/park-map";
import type { MapEngine, MapHandle, MapMarker, MapPath } from "@/components/map/types";
import { DemoBadge } from "@/components/shared/demo-badge";
import { SPOT_KIND_COLOR } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useDemoGeoTarget } from "@/features/demo/demo-geo";
import { grantReward, resetQuest, saveQuestState, useQuestState } from "@/features/quests/quest-store";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useMovement } from "@/hooks/use-movement";
import { Link, useRouter } from "@/i18n/navigation";
import { isDemoMode } from "@/lib/config/app-mode";
import type { LatLng, PublicQuiz, SpotKind } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { segmentVariant, type StepState } from "@/lib/game/trail-progress";
import { bearingDeg, distanceM, GPS_RULES, pathLengthM } from "@/lib/geo";
import { useLocationConsent } from "@/lib/location-consent";
import { cardinal, etaMinutes, speedKmh } from "@/lib/movement";
import type { QuestSummary } from "@/lib/quests/catalog";
import { arrive, completeStep, currentStepIndex, earnedReward, skipStep, stepPhase, type DiscoveredVia, type QuestDef, type QuestResult } from "@/lib/quests/engine";
import { cn } from "@/lib/utils";

export interface QuestStop {
  spot: { id: string; slug: string; name: string; kind: SpotKind; location: LatLng; radiusM: number };
}

interface Props {
  quest: QuestSummary;
  def: QuestDef;
  /** Un arrêt par étape de `def.steps` (même ordre). */
  stops: QuestStop[];
  /** Tracés indicatifs : départ → étape 1 → … */
  legs: [number, number][][];
  start: LatLng;
  quizzes: PublicQuiz[];
  backHref: string;
}

type Phase = "safety" | "playing";

/** Phase du moteur → état visuel des marqueurs et tracés (✓ ● ◉ ○). */
function toStepState(phase: ReturnType<typeof stepPhase>): StepState {
  return phase === "done" || phase === "skipped" ? "done" : phase === "activity" ? "current" : phase === "arrive" ? "next" : "future";
}

/**
 * Mode Exploration : écran de sécurité, carte plein écran et quête (moteur pur `lib/quests/engine`).
 * Chaque étape : se rendre au spot (tableau de déplacement local), confirmer son arrivée
 * (GPS précis ou confirmation manuelle ; QR code plus tard), puis réaliser l'activité.
 * La progression reste sur l'appareil ; la récompense finale est un œuf spécial de démonstration.
 */
export function ExplorationRunner({ quest, def, stops, legs, start, quizzes, backHref }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const [phase, setPhase] = useState<Phase>("safety");
  const [paused, setPaused] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [confirmArrival, setConfirmArrival] = useState(false);
  const [engine, setEngine] = useState<MapEngine | null>(null);
  const [view3d, setView3d] = useState(false);
  const [announce, setAnnounce] = useState("");

  const geo = useGeolocation({ highAccuracy: true });
  const consent = useLocationConsent();
  const [askConsent, setAskConsent] = useState(false);
  const movement = useMovement(geo.position, phase === "playing" && !paused);

  const state = useQuestState(quest.slug);
  const cur = currentStepIndex(def, state);
  const step = cur >= 0 ? def.steps[cur] : null;
  const stop = cur >= 0 ? stops[cur] : null;
  const target = stop?.spot;
  const curPhase = cur >= 0 ? stepPhase(def, state, cur) : null;
  const reward = earnedReward(def, state);
  const total = def.steps.length;
  const stepTitle = (i: number) => t(`explore.quests.${quest.key}.steps.${def.steps[i].id}.title`);

  // Démo : la position simulée suit l'objectif en cours.
  useDemoGeoTarget(phase === "playing" ? target?.location : undefined);

  const states = useMemo(() => def.steps.map((_, i) => toStepState(stepPhase(def, state, i))), [def, state]);

  // Un marqueur par spot : un spot visité deux fois (départ et trésor) affiche l'étape pertinente.
  const markers: MapMarker[] = useMemo(() => {
    const bySpot = new Map<string, number>();
    def.steps.forEach((s, i) => {
      const prev = bySpot.get(s.spotSlug);
      const pending = states[i] !== "done";
      if (prev === undefined || (states[prev] === "done" && pending)) bySpot.set(s.spotSlug, i);
    });
    return [
      { id: "start", type: "start" as const, location: start, color: "#F5FFFA", iconKey: "start", label: t("visit.start") },
      ...[...bySpot.values()].map((i) => {
        const sp = stops[i].spot;
        return {
          id: sp.id,
          type: "spot" as const,
          location: sp.location,
          color: SPOT_KIND_COLOR[sp.kind],
          iconKey: sp.kind,
          label: t("visit.markerLabel", { n: i + 1, name: sp.name }),
          ariaLabel: `${t("visit.stepOf", { current: i + 1, total })} · ${sp.name} · ${t(`visit.stepStates.${states[i]}`)}`,
          highlighted: i === cur,
          discovered: states[i] === "done",
          step: { n: i + 1, state: states[i], last: i === total - 1 },
        };
      }),
    ];
  }, [def.steps, states, stops, start, cur, total, t]);

  const paths: MapPath[] = useMemo(() => legs.map((coords, i) => ({ id: `leg-${i}`, coordinates: coords, variant: segmentVariant(states[i]) })), [legs, states]);

  const bounds = useMemo<[LatLng, LatLng]>(() => {
    const pts = [start, ...stops.map((s) => s.spot.location), ...legs.flat().map(([lng, lat]) => ({ lat, lng }))];
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const mLat = (Math.max(...lats) - Math.min(...lats)) * 0.18;
    const mLng = (Math.max(...lngs) - Math.min(...lngs)) * 0.18;
    return [
      { lat: Math.min(...lats) - mLat, lng: Math.min(...lngs) - mLng },
      { lat: Math.max(...lats) + mLat, lng: Math.max(...lngs) + mLng },
    ];
  }, [start, stops, legs]);

  // Distance à l'objectif : depuis la position si connue, sinon longueur du tronçon indicatif.
  const remainingM = target ? (geo.position ? distanceM(geo.position, target.location) : pathLengthM(legs[cur] ?? [])) : 0;
  const direction = geo.position && target ? bearingDeg(geo.position, target.location) : null;
  const km = movement.speedMps !== null ? speedKmh(movement.speedMps) : null;

  const apply = (r: QuestResult) => {
    if (!r.ok) return null;
    saveQuestState(quest.slug, r.state);
    return r.state;
  };

  const announceStep = (i: number) => {
    if (i >= 0) setAnnounce(t("explore.announceStep", { n: i + 1, title: stepTitle(i), spot: stops[i].spot.name }));
  };

  const begin = () => {
    setPhase("playing");
    if (consent === "granted") geo.start();
    // Refus déjà exprimé : on ne redemande pas (bouton « Activer ma position » disponible).
    else if (consent === "unset") setAskConsent(true);
    if (cur >= 0) announceStep(cur);
  };

  const doArrive = (via: DiscoveredVia) => {
    if (!step || !target) return;
    setConfirmArrival(false);
    if (apply(arrive(def, state, step.id, via))) setAnnounce(t(`explore.arrivedVia.${via}`, { spot: target.name }));
  };

  // Arrivée : validée par GPS seulement si la position est précise et dans le rayon du spot,
  // sinon confirmation manuelle (toujours possible : accessibilité, GPS indisponible).
  const onArrived = () => {
    if (!target) return;
    const p = geo.position;
    if (p && p.accuracy <= GPS_RULES.maxAccuracyM && distanceM(p, target.location) <= target.radiusM) doArrive("gps");
    else setConfirmArrival(true);
  };

  const onComplete = () => {
    if (!step) return;
    const next = apply(completeStep(def, state, step.id));
    if (!next) return;
    const nextIndex = currentStepIndex(def, next);
    if (nextIndex === -1) {
      grantReward(def.reward);
      setAnnounce(t("explore.reward.announce"));
    } else announceStep(nextIndex);
  };

  const onSkip = () => {
    if (!step) return;
    const next = apply(skipStep(def, state, step.id));
    if (next) announceStep(currentStepIndex(def, next));
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
    router.push(backHref);
  };

  const replay = () => {
    resetQuest(quest.slug);
    announceStep(0);
  };

  const recenter = useCallback(() => {
    if (target) mapRef.current?.flyTo(geo.position ?? target.location, 17);
  }, [target, geo.position]);

  // Le GPS s'arrête toujours en quittant l'écran (au démontage seulement : `geo.stop` peut
  // changer d'identité à chaque rendu, on garde donc la dernière version dans une ref).
  const stopGeo = useRef(geo.stop);
  useEffect(() => {
    stopGeo.current = geo.stop;
  });
  useEffect(() => () => stopGeo.current(), []);

  const ActivityIcon = step ? ACTIVITY_ICON[step.activity] : null;

  return (
    <ExplorationShell>
      <ParkMap
        ref={mapRef}
        bounds={bounds}
        markers={markers}
        paths={paths}
        user={geo.position}
        selectedId={target?.id}
        paddingBottom={340}
        attributionTop={150}
        view3d={view3d}
        onEngine={setEngine}
      />

      {/* Annonces pour les lecteurs d'écran (événements, jamais la distance en continu) */}
      <p className="sr-only" aria-live="polite">{announce}</p>

      <ExplorationTopBar>
        <div className="glass-strong mx-auto max-w-xl rounded-[22px] p-3 card-shadow">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{t("explore.title")}</p>
              <h1 className="truncate font-display text-lg font-extrabold leading-tight">{t(`explore.quests.${quest.key}.title`)}</h1>
            </div>
            <button type="button" onClick={() => setConfirmQuit(true)} aria-label={t("explore.quit")} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-inset hover:bg-danger/20 hover:text-danger">
              <X className="size-5" />
            </button>
          </div>
          <ol className="mt-2 flex gap-1.5" aria-label={t("explore.step.progress", { done: states.filter((s) => s === "done").length, total })}>
            {states.map((s, i) => (
              <li
                key={def.steps[i].id}
                aria-current={i === cur ? "step" : undefined}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  s === "done" ? "bg-primary" : i === cur ? "bg-primary/50 ring-1 ring-primary" : "bg-inset",
                  def.steps[i].optional && s !== "done" && "opacity-60",
                )}
              >
                <span className="sr-only">{`${t("visit.stepOf", { current: i + 1, total })} · ${t(`visit.stepStates.${s}`)}`}</span>
              </li>
            ))}
          </ol>
        </div>
        {phase === "playing" && (
          <div className="mx-auto mt-2 flex max-w-xl items-center justify-center gap-2">
            <GpsStatus status={geo.status} accuracy={geo.position?.accuracy} />
            {isDemoMode && <DemoBadge className="border-transparent bg-black/55 text-[#f4c95d] backdrop-blur" />}
          </div>
        )}
      </ExplorationTopBar>

      {phase === "playing" && (
        <ExplorationControls className="top-[36%]">
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
          {(geo.status === "denied" || geo.status === "unavailable") && !paused && curPhase === "arrive" && (
            <p role="status" className="glass-strong rounded-2xl px-4 py-3 text-sm">
              <span className="font-semibold text-gold">{t("gps.unavailable")}</span> <span className="text-muted-foreground">{t("explore.step.gpsFallback")}</span>
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
          ) : reward ? (
            <div className="glass-strong rounded-[var(--radius-sheet)] p-5 text-center card-shadow" aria-live="polite">
              <DemoEgg className="mx-auto motion-safe:animate-[pq-float_3s_ease-in-out_infinite]" />
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{t("explore.reward.title")}</p>
              <h2 className="font-display text-2xl font-extrabold">{t(`explore.quests.${quest.key}.reward.name`)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`explore.quests.${quest.key}.reward.body`)}</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">{t("explore.reward.rules")}</p>
              <p className="mt-1 text-[11px] text-gold/90">{t("explore.demoData")}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={replay}>
                  <RotateCcw /> {t("explore.reward.replay")}
                </Button>
                <Button asChild>
                  <Link href={backHref}>{t("explore.reward.back")}</Link>
                </Button>
              </div>
            </div>
          ) : step && target && ActivityIcon ? (
            <div className="glass-strong rounded-[var(--radius-sheet)] p-4 card-shadow">
              {/* Contenu défilant ; Pause et Quitter restent toujours visibles en dessous */}
              <div className={cn(curPhase === "activity" && "max-h-[52dvh] overflow-y-auto overscroll-contain")}>
                <div className="flex items-center gap-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                    <ActivityIcon className="size-3.5" aria-hidden />
                    {t("visit.stepOf", { current: cur + 1, total })} · {t(`explore.activity.kind.${step.activity}`)}
                  </p>
                  {step.optional && <Pill size="sm">{t("explore.step.optional")}</Pill>}
                </div>
                <h2 className="font-display text-2xl font-extrabold leading-tight">{stepTitle(cur)}</h2>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  {curPhase === "activity" ? <Check className="size-4 text-primary" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
                  {curPhase === "activity" ? t("explore.step.here", { spot: target.name }) : t("explore.step.goTo", { spot: target.name })}
                </p>

                {curPhase === "arrive" ? (
                  <>
                    {cur === 0 && <p className="mt-1 text-sm text-muted-foreground">{t(`explore.quests.${quest.key}.intro`)}</p>}
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
                    <Button size="lg" block className="mt-3" onClick={onArrived}>
                      <MapPin /> {t("explore.step.arrived")}
                    </Button>
                    {step.optional && (
                      <Button variant="ghost" block className="mt-1" onClick={onSkip}>
                        {t("explore.step.skip")}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="mt-3">
                    <QuestActivity
                      key={step.id}
                      questKey={quest.key}
                      stepId={step.id}
                      activity={step.activity}
                      optional={step.optional}
                      quizzes={step.activity === "quiz" ? quizzes : []}
                      onComplete={onComplete}
                      onSkip={onSkip}
                    />
                  </div>
                )}
              </div>

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

      {phase === "safety" && <SafetyScreen backHref={backHref} onStart={begin} />}

      {phase === "playing" && !paused && askConsent && (
        <LocationConsentSheet
          onAccept={() => {
            setAskConsent(false);
            geo.start();
          }}
          onDecline={() => setAskConsent(false)}
        />
      )}

      {confirmArrival && target && (
        <ExplorationDialog labelledBy="explore-arrival-title">
          <p id="explore-arrival-title" className="font-display text-lg font-bold">{t("explore.step.confirmTitle", { spot: target.name })}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("explore.step.confirmBody")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirmArrival(false)}>{t("common.back")}</Button>
            <Button onClick={() => doArrive("manual")}>{t("explore.step.confirmYes")}</Button>
          </div>
        </ExplorationDialog>
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
