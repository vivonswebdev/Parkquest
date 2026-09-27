"use client";

import { ArrowLeft, Compass, Crosshair, Layers, LocateFixed, Navigation, SlidersHorizontal, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { FACILITY_ICON, SPOT_KIND_COLOR, SPOT_KIND_ICON } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Link } from "@/i18n/navigation";
import type { Facility, LatLng, Park, SpotCategory, SpotSummary, TrailSegment } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { useDemoProgress } from "@/lib/game/demo-progress";
import { distanceM, walkingMinutes } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { hasMapbox, ParkMap } from "./park-map";
import type { MapHandle, MapLayer, MapMarker } from "./types";

type Filter = "all" | "services" | "pmr" | "challenges" | string;

export function ParkMapExplorer({
  park,
  spots,
  facilities,
  categories,
  trailSegments,
  entrance,
  challengeSpotIds,
  serverDiscovered,
}: {
  park: Pick<Park, "slug" | "name" | "bounds" | "isDemoData">;
  spots: SpotSummary[];
  facilities: Facility[];
  categories: SpotCategory[];
  trailSegments: TrailSegment[];
  entrance: LatLng;
  challengeSpotIds: string[];
  serverDiscovered: string[] | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const mapRef = useRef<MapHandle>(null);
  const geo = useGeolocation();
  const demo = useDemoProgress();
  const discovered = new Set(serverDiscovered ?? demo.discovered);
  const [filter, setFilter] = useState<Filter>("all");
  const [layer, setLayer] = useState<MapLayer>("plan");
  const [selected, setSelected] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const origin: LatLng = geo.position ?? entrance;

  const visibleSpots = spots.filter((s) => {
    if (filter === "all") return true;
    if (filter === "services" || filter === "pmr") return false;
    if (filter === "challenges") return challengeSpotIds.includes(s.id);
    return s.categoryKeys.includes(filter);
  });
  const visibleFacilities = facilities.filter((f) =>
    filter === "services" ? true : filter === "pmr" ? f.isPmrAccessible : false,
  );

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

  const paths = useMemo(() => trailSegments.map((s) => ({ id: s.id, coordinates: s.path, variant: "trail" as const })), [trailSegments]);

  const selectedSpot = spots.find((s) => s.id === selected);
  const selectedFacility = facilities.find((f) => f.id === selected);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: t("map.all") },
    ...categories.filter((c) => spots.some((s) => s.categoryKeys.includes(c.key))).map((c) => ({ key: c.key, label: c.name })),
    { key: "challenges", label: t("map.challenges") },
    { key: "services", label: t("map.services") },
    { key: "pmr", label: t("map.pmr") },
  ];

  const locate = () => {
    if (geo.position) mapRef.current?.flyTo(geo.position, 17.5);
    else geo.start();
  };

  return (
    <div className="fixed inset-0 z-0 md:static md:h-[calc(100dvh-4rem)]">
      <ParkMap
        ref={mapRef}
        bounds={park.bounds}
        markers={markers}
        paths={paths}
        user={geo.position}
        selectedId={selected}
        onSelect={setSelected}
        layer={layer}
        paddingBottom={180}
      />

      {/* En-tête flottant */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 space-y-2 p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="flex items-start gap-2">
          <Link href={`/parks/${park.slug}`} aria-label={t("common.back")} className="glass-strong pointer-events-auto inline-flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="glass-strong pointer-events-auto min-w-0 flex-1 rounded-2xl px-4 py-2.5">
            <p className="truncate font-display text-lg font-bold leading-tight">{park.name}</p>
            <p className="text-xs text-muted-foreground">{t("map.spotsCount", { count: spots.length })}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-label={t("map.filters")}
            className={cn("glass-strong pointer-events-auto inline-flex size-12 shrink-0 items-center justify-center rounded-2xl", showFilters && "text-primary")}
          >
            <SlidersHorizontal className="size-5" />
          </button>
        </div>
        {showFilters && (
          <div className="no-scrollbar pointer-events-auto -mx-3 flex gap-2 overflow-x-auto px-3" role="toolbar" aria-label={t("map.filters")}>
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={filter === c.key}
                onClick={() => {
                  setFilter(c.key);
                  setSelected(null);
                }}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                  filter === c.key ? "bg-primary text-primary-foreground" : "glass-strong text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
        <MapControl label={t("map.myPosition")} onClick={locate} active={geo.status === "active"}>
          {geo.status === "active" ? <LocateFixed /> : <Navigation />}
        </MapControl>
        <MapControl label={t("map.layers")} onClick={() => setLayer((l) => (l === "plan" ? "satellite" : "plan"))} active={layer === "satellite"}>
          <Layers />
        </MapControl>
        <MapControl label={t("map.orientation")} onClick={() => mapRef.current?.resetNorth()}>
          <Compass />
        </MapControl>
        <MapControl label={t("map.trail")} onClick={() => mapRef.current?.fitBounds()}>
          <Crosshair />
        </MapControl>
      </div>

      {/* États GPS / carte de repli */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-20 space-y-2 px-3 md:bottom-4">
        {(geo.status === "denied" || geo.status === "unavailable") && (
          <p role="status" className="glass-strong pointer-events-auto rounded-2xl px-4 py-3 text-sm">
            <span className="font-semibold text-gold">{geo.status === "denied" ? t("gps.denied") : t("gps.unavailable")}</span>{" "}
            <span className="text-muted-foreground">{geo.status === "denied" ? t("gps.deniedBody") : t("gps.unavailableBody")}</span>
          </p>
        )}
        {geo.status === "locating" && <p className="glass-strong w-fit rounded-full px-4 py-2 text-sm">{t("map.locating")}</p>}
        {geo.status === "active" && geo.position && geo.position.accuracy > 25 && (
          <p className="glass-strong w-fit rounded-full px-4 py-2 text-sm text-gold">{t("gps.lowAccuracy", { count: geo.position.accuracy })}</p>
        )}

        {selectedSpot ? (
          <SpotSheet spot={selectedSpot} parkSlug={park.slug} origin={origin} fromUser={Boolean(geo.position)} onClose={() => setSelected(null)} discovered={discovered.has(selectedSpot.id)} />
        ) : selectedFacility ? (
          <FacilitySheet facility={selectedFacility} origin={origin} onClose={() => setSelected(null)} />
        ) : (
          <>
            {!hasMapbox && <p className="glass-strong pointer-events-auto w-fit max-w-full rounded-full px-3 py-1.5 text-[11px] text-muted-foreground">{t("map.fallbackNotice")}</p>}
            <div className="no-scrollbar pointer-events-auto -mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1">
              {visibleSpots.map((s) => {
                const Icon = SPOT_KIND_ICON[s.kind];
                const d = distanceM(origin, s.location);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelected(s.id);
                      mapRef.current?.flyTo(s.location);
                    }}
                    className="glass-strong flex w-44 shrink-0 flex-col gap-2 rounded-[20px] p-3 text-left"
                  >
                    <span className="flex items-center justify-between">
                      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-inset" style={{ color: SPOT_KIND_COLOR[s.kind] }}>
                        <Icon className="size-[18px]" />
                      </span>
                      {discovered.has(s.id) && <Pill size="sm">✓</Pill>}
                    </span>
                    <span className="truncate text-sm font-semibold">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistance(d, locale)} · {walkingMinutes(d)} min
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
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

function SpotSheet({ spot, parkSlug, origin, fromUser, onClose, discovered }: { spot: SpotSummary; parkSlug: string; origin: LatLng; fromUser: boolean; onClose(): void; discovered: boolean }) {
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
      <Button asChild block className="mt-3">
        <Link href={`/parks/${parkSlug}/spots/${spot.slug}`}>{t("map.seeSpot")}</Link>
      </Button>
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
