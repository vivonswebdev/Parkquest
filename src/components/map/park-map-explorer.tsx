"use client";

import { ArrowLeft, Compass, Crosshair, Layers, LocateFixed, Maximize2, Minimize2, Navigation, X } from "lucide-react";
import { GpsStatus } from "@/components/geo/gps-status";
import { GuidePanel } from "@/components/geo/guide-panel";
import { LocationConsentSheet } from "@/components/geo/location-consent-sheet";
import { facilityMatchesFilter, NearbyList, spotMatchesFilter, type NearbyFilter } from "@/components/geo/nearby-list";
import { DiscoverSpotCard } from "@/components/game/discover-spot-card";
import { useLocationConsent } from "@/lib/location-consent";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { FACILITY_ICON, SPOT_KIND_COLOR } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useFullscreenMode } from "@/hooks/use-fullscreen-mode";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Link } from "@/i18n/navigation";
import type { Facility, LatLng, Park, SpotSummary, TrailSegment } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { useDemoProgress } from "@/features/demo/demo-progress";
import { distanceM, walkingMinutes } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { satelliteTilesUrl } from "@/lib/map/config";
import { MapPanel, PanelCollapseButton, useDefaultPanelMode, type PanelMode } from "./map-panel";
import { ParkMap } from "./park-map";
import type { MapEngine, MapHandle, MapLayer, MapMarker, MapNature } from "./types";

export function ParkMapExplorer({
  park,
  spots,
  facilities,
  trailSegments,
  entrance,
  challengeSpotIds,
  photoSpotIds,
  serverDiscovered,
  initialGuideSlug,
}: {
  park: Pick<Park, "slug" | "name" | "bounds" | "isDemoData">;
  spots: SpotSummary[];
  facilities: Facility[];
  trailSegments: TrailSegment[];
  entrance: LatLng;
  challengeSpotIds: string[];
  photoSpotIds: string[];
  serverDiscovered: string[] | null;
  initialGuideSlug?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const mapRef = useRef<MapHandle>(null);
  const geo = useGeolocation();
  const demo = useDemoProgress();
  const discovered = new Set(serverDiscovered ?? demo.discovered);
  // Un seul jeu de filtres : il pilote à la fois la liste « Autour de vous » et les marqueurs.
  const [filter, setFilter] = useState<NearbyFilter>("all");
  const [layer, setLayer] = useState<MapLayer>("plan");
  const [selected, setSelected] = useState<string | null>(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [engine, setEngine] = useState<MapEngine | null>(null);
  const [view3d, setView3d] = useState(false);
  const simplified = engine === "fallback";
  const consent = useLocationConsent();
  const [askConsent, setAskConsent] = useState(false);
  const startPoints = useMemo(() => facilities.filter((f) => ["ENTRANCE", "PARKING", "PUBLIC_TRANSPORT", "CAFE"].includes(f.type)), [facilities]);
  const [startId, setStartId] = useState<string | null>(null);
  const [guideId, setGuideId] = useState<string | null>(() => spots.find((s) => s.slug === initialGuideSlug)?.id ?? null);
  const fullscreen = useFullscreenMode();
  // Panneau « Autour de vous » : ouvert, réduit (petite barre) ou masqué (carte maximale).
  const [chosenPanel, setPanel] = useState<PanelMode | null>(null);
  const panel = useDefaultPanelMode(chosenPanel);

  // Dès l'entrée dans la carte : écran d'explication si aucun choix, sinon position si acceptée.
  const startedOnce = useRef(false);
  useEffect(() => {
    if (consent === "granted" && !startedOnce.current) {
      startedOnce.current = true;
      geo.start();
    }
  }, [consent, geo]);
  const showConsent = askConsent || consent === "unset";

  // Pas de recentrage automatique : la carte s'ouvre sur tout le parc (vue d'ensemble),
  // le point bleu indique la position ; « Ma position » recentre à la demande.

  const startPoint = startPoints.find((f) => f.id === startId)?.location;
  const origin: LatLng = geo.position ?? startPoint ?? entrance;
  const guideTarget = spots.find((s) => s.id === guideId) ?? facilities.find((f) => f.id === guideId);

  const visibleSpots = spots.filter((s) => spotMatchesFilter(s, filter, challengeSpotIds, photoSpotIds));
  const visibleFacilities = facilities.filter((f) => facilityMatchesFilter(f, filter));

  const markers: MapMarker[] = useMemo(
    () => [
      ...visibleSpots.map((s) => ({
        id: s.id,
        type: "spot" as const,
        location: s.location,
        color: SPOT_KIND_COLOR[s.kind],
        iconKey: s.kind,
        label: s.name,
        sublabel: formatDistance(distanceM(origin, s.location), locale),
        discovered: discovered.has(s.id),
      })),
      ...visibleFacilities.map((f) => ({
        id: f.id,
        type: "facility" as const,
        location: f.location,
        color: f.isPmrAccessible && filter === "pmr" ? "#9DB8FF" : "#A9C1B7",
        iconKey: f.type,
        label: f.name,
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, origin.lat, origin.lng, locale, spots, facilities, serverDiscovered, demo.discovered],
  );

  // Décor stable (indépendant des filtres) : tous les lieux restent dégagés, étangs aux spots « eau ».
  const nature = useMemo<MapNature>(
    () => ({
      clearings: [...spots.map((s) => s.location), ...facilities.map((f) => f.location)],
      ponds: spots.filter((s) => s.kind === "WATER").map((s) => ({ center: s.location, radiusM: 55 })),
    }),
    [spots, facilities],
  );

  // Cadrage d'ouverture : lieux + parcours (+ marge), plutôt que toute l'emprise du parc.
  const focus = useMemo<[LatLng, LatLng]>(() => {
    const pts = [...spots.map((s) => s.location), ...trailSegments.flatMap((g) => g.path.map(([lng, lat]) => ({ lat, lng })))];
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const [s0, n0, w0, e0] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    const my = (n0 - s0) * 0.12;
    const mx = (e0 - w0) * 0.12;
    return [
      { lat: s0 - my, lng: w0 - mx },
      { lat: n0 + my, lng: e0 + mx },
    ];
  }, [spots, trailSegments]);

  const paths = useMemo(() => {
    const base = trailSegments.map((s) => ({ id: s.id, coordinates: s.path, variant: "trail" as const }));
    if (!guideTarget) return base;
    // Guidage : ligne directe vers la cible (le parc n'est pas une app de navigation routière).
    const line: [number, number][] = [
      [origin.lng, origin.lat],
      [guideTarget.location.lng, guideTarget.location.lat],
    ];
    return [...base, { id: "guide", coordinates: line, variant: "active" as const }];
  }, [trailSegments, guideTarget, origin.lat, origin.lng]);

  const selectedSpot = spots.find((s) => s.id === selected);
  const selectedFacility = facilities.find((f) => f.id === selected);

  const locate = () => {
    if (geo.position) mapRef.current?.flyTo(geo.position, 17.5);
    else if (consent !== "granted") setAskConsent(true);
    else geo.start();
  };

  const guide = (id: string) => {
    setSelected(null);
    setGuideId(id);
    const target = spots.find((s) => s.id === id) ?? facilities.find((f) => f.id === id);
    if (target) mapRef.current?.flyTo(target.location);
    if (consent === "unset") setAskConsent(true);
  };

  return (
    <div
      className={cn(
        fullscreen.active ? "fixed inset-0 z-[46] h-[100dvh] bg-background" : "fixed inset-0 z-0 md:static md:h-[calc(100dvh-4rem)]",
      )}
    >
      <ParkMap
        ref={mapRef}
        bounds={park.bounds}
        markers={markers}
        paths={paths}
        user={geo.position}
        selectedId={selected}
        onSelect={setSelected}
        layer={layer}
        paddingBottom={290}
        view3d={view3d}
        nature={nature}
        focus={spots.length > 1 ? focus : undefined}
        onEngine={setEngine}
      />

      {/* En-tête flottant */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 space-y-2 p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="flex items-start gap-2">
          <Link href={`/parks/${park.slug}`} aria-label={t("common.back")} className="glass-strong pointer-events-auto inline-flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="glass-strong pointer-events-auto min-w-0 flex-1 rounded-2xl px-4 py-2.5">
            <p className="truncate font-display text-lg font-bold leading-tight">{park.name}</p>
            <p className="truncate text-xs text-muted-foreground" title={simplified ? t("map.fallbackNotice") : undefined}>
              {t("map.spotsCount", { count: spots.length })}
              {simplified && ` · ${t("map.simplified")}`}
            </p>
          </div>
        </div>
        <GpsStatus status={geo.status} accuracy={geo.position?.accuracy} className="pointer-events-auto" />
      </div>

      {/* Contrôles : sous l'en-tête, jamais masqués par la liste */}
      <div className="absolute right-3 top-[calc(max(env(safe-area-inset-top),0.75rem)+4.25rem)] z-20 flex flex-col gap-2">
        <MapControl label={fullscreen.active ? t("map.fullscreenExit") : t("map.fullscreenEnter")} onClick={fullscreen.toggle} active={fullscreen.active}>
          {fullscreen.active ? <Minimize2 /> : <Maximize2 />}
        </MapControl>
        <MapControl label={t("map.myPosition")} onClick={locate} active={geo.status === "active"}>
          {geo.status === "active" ? <LocateFixed /> : <Navigation />}
        </MapControl>
        {engine === "maplibre" && (
          <MapControl label={view3d ? t("map.view2d") : t("map.view3d")} onClick={() => setView3d((v) => !v)} active={view3d}>
            <span className="text-xs font-extrabold tracking-tight">{view3d ? "2D" : "3D"}</span>
          </MapControl>
        )}
        {engine === "maplibre" && satelliteTilesUrl && (
          <MapControl label={t("map.layers")} onClick={() => setLayer((l) => (l === "plan" ? "satellite" : "plan"))} active={layer === "satellite"}>
            <Layers />
          </MapControl>
        )}
        <MapControl label={t("map.orientation")} onClick={() => mapRef.current?.resetNorth()}>
          <Compass />
        </MapControl>
        <MapControl label={t("map.trail")} onClick={() => mapRef.current?.fitBounds()}>
          <Crosshair />
        </MapControl>
      </div>

      {/* États GPS / carte de repli */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 z-20 space-y-2 px-3",
          // Plein écran : la navigation du site est recouverte, le panneau descend au bord (zone sûre).
          fullscreen.active ? "bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]" : "bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] md:bottom-4",
        )}
      >
        {/* Message détaillé seulement panneau ouvert : l'étiquette GPS en haut suffit sinon (carte maximale) */}
        {(geo.status === "denied" || geo.status === "unavailable") && panel === "expanded" && !guideTarget && !selected && (
          <p role="status" className="glass-strong pointer-events-auto rounded-2xl px-4 py-3 text-sm">
            <span className="font-semibold text-gold">{geo.status === "denied" ? t("gps.denied") : t("gps.unavailable")}</span>{" "}
            <span className="text-muted-foreground">{geo.status === "denied" ? t("gps.deniedBody") : t("gps.unavailableBody")}</span>
          </p>
        )}
        {consent === "declined" && geo.status === "idle" && !guideTarget && panel === "expanded" && (
          <p className="glass-strong pointer-events-auto rounded-2xl px-4 py-2.5 text-xs text-muted-foreground">{t("geo.declinedNotice")}</p>
        )}

        {guideTarget ? (
          <GuidePanel name={guideTarget.name} target={guideTarget.location} origin={origin} onStop={() => setGuideId(null)}>
            {"slug" in guideTarget && distanceM(origin, guideTarget.location) <= 60 && (
              <DiscoverSpotCard spotId={guideTarget.id} spotName={guideTarget.name} spotLocation={guideTarget.location} radiusM={35} geo={geo} serverDiscovered={discovered.has(guideTarget.id)} />
            )}
            {"slug" in guideTarget && (
              <Button asChild variant="secondary" block className="mt-2">
                <Link href={`/parks/${park.slug}/spots/${guideTarget.slug}`}>{t("map.seeSpot")}</Link>
              </Button>
            )}
          </GuidePanel>
        ) : selectedSpot ? (
          <SpotSheet spot={selectedSpot} parkSlug={park.slug} origin={origin} fromUser={Boolean(geo.position)} onClose={() => setSelected(null)} onGuide={() => guide(selectedSpot.id)} discovered={discovered.has(selectedSpot.id)} />
        ) : selectedFacility ? (
          <FacilitySheet facility={selectedFacility} origin={origin} onClose={() => setSelected(null)} />
        ) : (
          <MapPanel
            mode={panel}
            onModeChange={setPanel}
            title={t("map.nearbyShort")}
            count={t("map.placesCount", { count: visibleSpots.length + visibleFacilities.length })}
          >
            <NearbyList
              headerAction={<PanelCollapseButton onClick={() => setPanel("collapsed")} />}
              filter={filter}
              onFilterChange={(f) => {
                setFilter(f);
                setSelected(null);
              }}
              expanded={listExpanded}
              onExpandedChange={setListExpanded}
              parkSlug={park.slug}
              spots={spots}
              facilities={facilities}
              origin={origin}
              originIsUser={Boolean(geo.position)}
              startPoints={startPoints}
              onChooseStart={setStartId}
              discovered={discovered}
              challengeSpotIds={challengeSpotIds}
              photoSpotIds={photoSpotIds}
              onShowOnMap={(id) => {
                setSelected(id);
                const loc = spots.find((x) => x.id === id)?.location ?? facilities.find((x) => x.id === id)?.location;
                if (loc) mapRef.current?.flyTo(loc);
              }}
              onGuide={guide}
            />
          </MapPanel>
        )}
      </div>

      {showConsent && (
        <LocationConsentSheet
          onAccept={() => {
            setAskConsent(false);
            startedOnce.current = true;
            geo.start();
          }}
          onDecline={() => setAskConsent(false)}
        />
      )}
    </div>
  );
}

function MapControl({ label, onClick, active, children }: { label: string; onClick(): void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("glass-strong inline-flex size-12 items-center justify-center rounded-full [&_svg]:size-5", active && "text-primary ring-1 ring-primary/40")}
    >
      {children}
    </button>
  );
}

function SpotSheet({ spot, parkSlug, origin, fromUser, onClose, onGuide, discovered }: { spot: SpotSummary; parkSlug: string; origin: LatLng; fromUser: boolean; onClose(): void; onGuide(): void; discovered: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const d = distanceM(origin, spot.location);
  return (
    <div role="dialog" aria-label={spot.name} className="glass-strong pointer-events-auto rounded-[var(--radius-sheet)] p-3 card-shadow">
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20" />
      <div className="flex gap-3">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl">
          <Image src={spot.coverImageUrl} alt="" fill sizes="96px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-xl font-bold leading-tight">{spot.name}</h2>
            <button type="button" onClick={onClose} aria-label={t("common.close")} className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatDistance(d, locale)} · {walkingMinutes(d)} min {!fromUser && <span className="text-xs">({t("spot.fromEntrance")})</span>}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {spot.label && <Pill size="sm">{spot.label}</Pill>}
            {discovered && <Pill size="sm" tone="gold">{t("visit.alreadyDiscovered")}</Pill>}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={onGuide}>
          <Navigation /> {t("geo.guideMe")}
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/parks/${parkSlug}/spots/${spot.slug}`}>{t("map.seeSpot")}</Link>
        </Button>
      </div>
    </div>
  );
}

function FacilitySheet({ facility, origin, onClose }: { facility: Facility; origin: LatLng; onClose(): void }) {
  const t = useTranslations();
  const locale = useLocale();
  const Icon = FACILITY_ICON[facility.type];
  const d = distanceM(origin, facility.location);
  return (
    <div role="dialog" aria-label={facility.name} className="glass-strong pointer-events-auto flex items-center gap-3 rounded-[var(--radius-sheet)] p-4 card-shadow">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="size-6" />
      </span>
      <div className="flex-1">
        <p className="font-semibold">{facility.name}</p>
        <p className="text-sm text-muted-foreground">
          {t(`facility.${facility.type}`)} · {formatDistance(d, locale)}
          {facility.isPmrAccessible && ` · ${t("common.pmr")}`}
        </p>
      </div>
      <button type="button" onClick={onClose} aria-label={t("common.close")} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-white/10">
        <X className="size-4" />
      </button>
    </div>
  );
}
