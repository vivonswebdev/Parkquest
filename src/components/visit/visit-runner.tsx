"use client";

import { ChevronDown, Flag, Loader2, MapPin, Navigation, Pause, Play, PartyPopper, Signpost, Timer, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ActionErrorMessage, ModeNotice, PointsBurst } from "@/components/game/feedback";
import { ChallengeCard } from "@/components/game/challenge-card";
import { DiscoverSpotCard } from "@/components/game/discover-spot-card";
import { QuizCard } from "@/components/game/quiz-card";
import { ParkMap } from "@/components/map/park-map";
import type { MapHandle, MapMarker, MapPath } from "@/components/map/types";
import { SPOT_KIND_COLOR } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Link, useRouter } from "@/i18n/navigation";
import type { ActionError, Challenge, LatLng, PublicQuiz, Trail } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { useDemoProgress } from "@/lib/game/demo-progress";
import { distanceM, pathLengthM, walkingMinutes } from "@/lib/geo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { completeVisitAction, startVisitAction, updateVisitAction } from "@/server/game-actions";

interface Props {
  park: { id: string; slug: string; name: string; bounds: [LatLng, LatLng] };
  trail: Trail;
  quizzesBySpot: Record<string, PublicQuiz[]>;
  challengesBySpot: Record<string, Challenge[]>;
  serverDiscovered: string[] | null;
  initialSpotSlug?: string;
}

/**
 * Mode « suivre le parcours » : carte immersive, prochain spot, consigne,
 * découverte (validation serveur), quiz et défi sans quitter l'écran.
 */
export function VisitRunner({ park, trail, quizzesBySpot, challengesBySpot, serverDiscovered, initialSpotSlug }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const geo = useGeolocation();
  const demo = useDemoProgress();

  const [visitId, setVisitId] = useState<string | null>(null);
  const [startError, setStartError] = useState<ActionError | null>(null);
  const [paused, setPaused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [sessionFound, setSessionFound] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [walked, setWalked] = useState(0);
  const [finish, setFinish] = useState<Awaited<ReturnType<typeof completeVisitAction>> | null>(null);
  const [finishing, startFinish] = useTransition();

  const discovered = useMemo(() => {
    const base = isSupabaseConfigured ? (serverDiscovered ?? []) : demo.discovered;
    return new Set([...base, ...sessionFound]);
  }, [serverDiscovered, demo.discovered, sessionFound]);

  const firstUndiscovered = trail.spots.findIndex((s) => !discovered.has(s.id));
  const initialIndex = initialSpotSlug ? trail.spots.findIndex((s) => s.slug === initialSpotSlug) : -1;
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : Math.max(0, firstUndiscovered));
  const current = trail.spots[index];
  const foundCount = trail.spots.filter((s) => discovered.has(s.id)).length;
  const allFound = foundCount === trail.spots.length;

  // Démarrage de la visite côté serveur (live) — la visite reste utilisable si non connecté.
  useEffect(() => {
    let cancelled = false;
    startVisitAction({ parkId: park.id, trailId: trail.id }).then((r) => {
      if (cancelled) return;
      if (r.ok) setVisitId(r.visitId);
      else setStartError(r.error);
    });
    return () => {
      cancelled = true;
    };
  }, [park.id, trail.id]);

  // Chronomètre (arrêté en pause)
  useEffect(() => {
    if (paused || finish) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [paused, finish]);

  // Distance parcourue estimée localement (jamais les coordonnées) — uniquement si précision correcte.
  const last = useRef<LatLng | null>(null);
  useEffect(() => {
    const p = geo.position;
    if (!p || paused || p.accuracy > 30) return;
    if (last.current) {
      const d = distanceM(last.current, p);
      if (d > 4 && d < 200) setWalked((w) => w + d);
    }
    last.current = { lat: p.lat, lng: p.lng };
  }, [geo.position, paused]);

  const segment = trail.segments.find((s) => s.toSpotId === current?.id);
  const fromPoint: LatLng = geo.position ?? (index === 0 ? trail.start : trail.spots[index - 1].location);
  const toCurrent = current ? distanceM(fromPoint, current.location) : 0;
  const segmentLen = segment ? pathLengthM(segment.path) : toCurrent;
  const shownDistance = geo.position ? toCurrent : segmentLen;

  const markers: MapMarker[] = useMemo(
    () => [
      { id: "start", type: "start", location: trail.start, color: "#F5FFFA", iconKey: "start", label: t("visit.start") },
      ...trail.spots.map((s, i) => ({
        id: s.id,
        type: "spot" as const,
        location: s.location,
        color: SPOT_KIND_COLOR[s.kind],
        iconKey: s.kind,
        label: `${i + 1}. ${s.name}`,
        discovered: discovered.has(s.id),
        highlighted: i === index,
      })),
    ],
    [trail, discovered, index, t],
  );

  const paths: MapPath[] = useMemo(
    () =>
      trail.segments.map((sg) => {
        const i = trail.spots.findIndex((s) => s.id === sg.toSpotId);
        return { id: sg.id, coordinates: sg.path, variant: i < index ? "done" : i === index ? "active" : "trail" };
      }),
    [trail, index],
  );

  // Cadrage sur le parcours (et non tout le parc), avec marge.
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

  const recenter = useCallback(() => {
    if (current) mapRef.current?.flyTo(geo.position ?? current.location, 17);
  }, [current, geo.position]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    if (next) geo.stop();
    if (visitId) void updateVisitAction({ visitId, status: next ? "PAUSED" : "IN_PROGRESS", distanceM: Math.round(walked) });
  };

  const quit = () => {
    geo.stop();
    if (visitId) void updateVisitAction({ visitId, status: "ABANDONED", distanceM: Math.round(walked) });
    router.push(`/parks/${park.slug}/trails/${trail.slug}`);
  };

  const onFound = (spotId: string) => {
    setSessionFound((s) => (s.includes(spotId) ? s : [...s, spotId]));
  };

  const goNext = () => {
    const next = trail.spots.findIndex((s, i) => i > index && !discovered.has(s.id));
    const any = next >= 0 ? next : trail.spots.findIndex((s) => !discovered.has(s.id));
    if (any >= 0) setIndex(any);
    setSheetOpen(false);
  };

  const complete = () =>
    startFinish(async () => {
      geo.stop();
      const r = await completeVisitAction({ visitId, trailId: trail.id, distanceM: Math.round(walked), spotsFound: foundCount });
      setFinish(r);
    });

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-30 bg-background">
      <ParkMap ref={mapRef} bounds={trailBounds} markers={markers} paths={paths} user={geo.position} selectedId={current?.id} onSelect={(id) => {
        const i = trail.spots.findIndex((s) => s.id === id);
        if (i >= 0) setIndex(i);
      }} paddingBottom={260} />

      {/* En-tête : parcours + progression */}
      <div className="absolute inset-x-0 top-0 z-20 p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="glass-strong mx-auto flex max-w-xl items-center gap-3 rounded-[22px] p-3 card-shadow">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{trail.name}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={foundCount} max={trail.spots.length} className="h-1.5" label={t("visit.progress", { current: foundCount, total: trail.spots.length })} />
              <span className="shrink-0 font-display text-sm font-bold text-primary">{t("visit.progress", { current: foundCount, total: trail.spots.length })}</span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 py-1.5 text-xs tabular-nums text-muted-foreground" aria-label={t("visit.elapsed")}>
            <Timer className="size-3.5" /> {mm}:{ss}
          </span>
          <button type="button" onClick={() => setConfirmQuit(true)} aria-label={t("visit.quit")} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-black/40 hover:bg-danger/20 hover:text-danger">
            <X className="size-5" />
          </button>
        </div>
        {startError === "AUTH_REQUIRED" && (
          <div className="mx-auto mt-2 max-w-xl"><ActionErrorMessage error="AUTH_REQUIRED" className="glass-strong" /></div>
        )}
        {!isSupabaseConfigured && (
          <p className="glass-strong mx-auto mt-2 w-fit max-w-xl rounded-full px-3 py-1.5 text-center text-[11px] text-gold">{t("common.demoModeNotice")}</p>
        )}
      </div>

      {/* Bouton recentrer */}
      <button type="button" onClick={recenter} aria-label={t("map.myPosition")} className="glass-strong absolute right-3 top-1/2 z-20 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full">
        <Navigation className="size-5" />
      </button>

      {/* Panneau bas */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-3 safe-bottom">
        <div className="mx-auto max-w-xl space-y-2">
          {(geo.status === "denied" || geo.status === "unavailable") && (
            <p role="status" className="glass-strong rounded-2xl px-4 py-3 text-sm">
              <span className="font-semibold text-gold">{t("gps.unavailable")}</span> <span className="text-muted-foreground">{t("gps.unavailableBody")}</span>
            </p>
          )}

          {finish ? (
            <FinishPanel finish={finish} foundCount={foundCount} total={trail.spots.length} parkSlug={park.slug} elapsed={`${mm}:${ss}`} walked={walked} />
          ) : paused ? (
            <div className="glass-strong rounded-[var(--radius-sheet)] p-5 text-center card-shadow">
              <p className="font-display text-xl font-bold">{t("visit.paused")}</p>
              <Button size="lg" block className="mt-4" onClick={togglePause}><Play className="fill-current" /> {t("visit.resume")}</Button>
            </div>
          ) : allFound ? (
            <div className="glass-strong rounded-[var(--radius-sheet)] p-5 card-shadow">
              <p className="flex items-center gap-2 font-display text-2xl font-extrabold text-primary"><PartyPopper className="size-7" /> {t("visit.trailComplete")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("visit.trailCompleteBody", { count: trail.spots.length })}</p>
              <Button size="lg" block className="mt-4" onClick={complete} disabled={finishing}>
                {finishing ? <Loader2 className="animate-spin" /> : <Flag />} {t("visit.finish")}
              </Button>
            </div>
          ) : current ? (
            <div className={cn("glass-strong rounded-[var(--radius-sheet)] card-shadow transition-all", sheetOpen ? "max-h-[78dvh] overflow-y-auto" : "")}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => setSheetOpen((o) => !o)} className="relative size-16 shrink-0 overflow-hidden rounded-2xl" aria-label={t("visit.seeSpot")}>
                    <Image src={current.coverImageUrl} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{t("visit.nextSpot")} · {t("visit.stepOf", { current: index + 1, total: trail.spots.length })}</p>
                    <h2 className="truncate font-display text-2xl font-extrabold leading-tight">{current.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {formatDistance(shownDistance, locale)} · {walkingMinutes(shownDistance)} min
                    </p>
                  </div>
                  {discovered.has(current.id) && <Pill size="sm">✓</Pill>}
                </div>

                {segment?.instruction && (
                  <p className="mt-3 flex gap-2.5 rounded-2xl bg-black/30 p-3 text-sm leading-relaxed">
                    <Signpost className="mt-0.5 size-4 shrink-0 text-primary" />
                    {segment.instruction}
                  </p>
                )}

                {geo.status === "idle" && !sheetOpen && (
                  <Button variant="outline" block className="mt-3" onClick={geo.start}>
                    <Navigation /> {t("gps.enable")}
                  </Button>
                )}

                <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
                  <Button onClick={() => setSheetOpen((o) => !o)} size="lg">
                    {sheetOpen ? <ChevronDown /> : <MapPin />} {t("visit.seeSpot")}
                  </Button>
                  <Button variant="secondary" size="lg" onClick={togglePause} aria-label={t("visit.pause")}><Pause /></Button>
                  <Button variant="secondary" size="lg" onClick={() => setConfirmQuit(true)} aria-label={t("visit.quit")}><X /></Button>
                </div>
              </div>

              {sheetOpen && (
                <div className="space-y-4 border-t border-border p-4">
                  {current.summary && <p className="text-muted-foreground">{current.summary}</p>}
                  <DiscoverSpotCard
                    key={current.id}
                    spotId={current.id}
                    spotLocation={current.location}
                    radiusM={35}
                    visitId={visitId}
                    inVisit
                    geo={geo}
                    serverDiscovered={serverDiscovered?.includes(current.id)}
                    onDiscovered={() => onFound(current.id)}
                  />
                  {(quizzesBySpot[current.id]?.length ?? 0) > 0 && (
                    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                      <QuizCard key={current.id} quizzes={quizzesBySpot[current.id]} visitId={visitId} />
                    </div>
                  )}
                  {(challengesBySpot[current.id] ?? []).map((c) => (
                    <div key={c.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                      <ChallengeCard challenge={c} parkId={park.id} visitId={visitId} />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="secondary" block asChild>
                      <Link href={`/parks/${park.slug}/spots/${current.slug}`}>{t("map.seeSpot")}</Link>
                    </Button>
                    {discovered.has(current.id) && (
                      <Button block onClick={goNext}>{t("visit.nextStop")}</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {confirmQuit && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="quit-title" className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center">
          <div className="glass-strong w-full max-w-sm rounded-[var(--radius-sheet)] p-5">
            <p id="quit-title" className="font-display text-lg font-bold">{t("visit.quitConfirm")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirmQuit(false)}>{t("common.back")}</Button>
              <Button variant="danger" onClick={quit}>{t("visit.quit")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FinishPanel({
  finish,
  foundCount,
  total,
  parkSlug,
  elapsed,
  walked,
}: {
  finish: Awaited<ReturnType<typeof completeVisitAction>>;
  foundCount: number;
  total: number;
  parkSlug: string;
  elapsed: string;
  walked: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  if (!finish.ok) return <ActionErrorMessage error={finish.error} className="glass-strong" />;
  return (
    <div className="glass-strong rounded-[var(--radius-sheet)] p-5 card-shadow" aria-live="polite">
      <p className="flex items-center gap-2 font-display text-2xl font-extrabold text-primary"><PartyPopper className="size-7" /> {t("visit.trailComplete")}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-black/30 p-3"><p className="font-display text-xl font-bold">{foundCount}/{total}</p><p className="text-[11px] text-muted-foreground">spots</p></div>
        <div className="rounded-2xl bg-black/30 p-3"><p className="font-display text-xl font-bold tabular-nums">{elapsed}</p><p className="text-[11px] text-muted-foreground">{t("visit.elapsed")}</p></div>
        <div className="rounded-2xl bg-black/30 p-3"><p className="font-display text-xl font-bold">{formatDistance(walked, locale)}</p><p className="text-[11px] text-muted-foreground">{t("trail.distance")}</p></div>
      </div>
      <div className="mt-3"><PointsBurst points={finish.pointsAwarded} badges={finish.newBadges} /></div>
      <div className="mt-2"><ModeNotice mode={finish.mode} /></div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button asChild variant="secondary"><Link href={`/parks/${parkSlug}`}>{t("visit.backToPark")}</Link></Button>
        <Button asChild><Link href="/challenges">{t("nav.challenges")}</Link></Button>
      </div>
    </div>
  );
}
