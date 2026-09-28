"use client";

import { ArrowLeft, Compass, Crosshair, LocateFixed, Maximize2, Minimize2, Navigation, Trees, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { GpsStatus } from "@/components/geo/gps-status";
import { LocationConsentSheet } from "@/components/geo/location-consent-sheet";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Button } from "@/components/ui/button";
import { useFullscreenMode } from "@/hooks/use-fullscreen-mode";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Link } from "@/i18n/navigation";
import type { LatLng } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { distanceM } from "@/lib/geo";
import { useLocationConsent } from "@/lib/location-consent";
import { cn } from "@/lib/utils";
import { MapPanel, PanelCollapseButton, useDefaultPanelMode, type PanelMode } from "./map-panel";
import { ParkMap } from "./park-map";
import type { MapEngine, MapHandle, MapMarker } from "./types";

export interface ParkPin {
  id: string;
  slug: string;
  name: string;
  city: string;
  location: LatLng;
  spotCount: number;
  trailCount: number;
  isDemoData: boolean;
}

const PARK_COLOR = "#5fb88f";
/** Zoom « région » : autour de l'utilisateur ou de la zone de démonstration. */
const REGION_ZOOM = 9;
const PARK_ZOOM = 12;

/**
 * Carte générale des parcs. Aucun parc n'est sélectionné à l'ouverture : la carte montre la zone de
 * l'utilisateur (ou tous les parcs), et un parc ne s'ouvre que par un geste explicite.
 */
export function ParksMapExplorer({ parks, demoZone }: { parks: ParkPin[]; demoZone: LatLng }) {
  const t = useTranslations();
  const locale = useLocale();
  const mapRef = useRef<MapHandle>(null);
  const geo = useGeolocation({ highAccuracy: false });
  const consent = useLocationConsent();
  const [askConsent, setAskConsent] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [engine, setEngine] = useState<MapEngine | null>(null);
  const [view3d, setView3d] = useState(false);
  const fullscreen = useFullscreenMode();
  const [chosenPanel, setPanel] = useState<PanelMode | null>(null);
  const panel = useDefaultPanelMode(chosenPanel);

  const startedOnce = useRef(false);
  useEffect(() => {
    if (consent === "granted" && !startedOnce.current) {
      startedOnce.current = true;
      geo.start();
    }
  }, [consent, geo]);

  // Position indisponible (refusée, impossible ou non souhaitée) : zone de démonstration, annoncée.
  const noPosition = geo.status === "denied" || geo.status === "unavailable" || (consent === "declined" && geo.status === "idle");
  const reference: LatLng | null = geo.position ?? (noPosition ? demoZone : null);

  // Cadrage automatique une seule fois : sur l'utilisateur, sinon sur la zone de démonstration.
  const centered = useRef(false);
  const wantNearest = useRef(false);
  useEffect(() => {
    if (centered.current) return;
    if (geo.position) {
      centered.current = true;
      mapRef.current?.flyTo(geo.position, REGION_ZOOM);
    } else if (noPosition) {
      centered.current = true;
      mapRef.current?.flyTo(demoZone, REGION_ZOOM);
    }
  }, [geo.position, noPosition, demoZone]);

  const ranked = useMemo(() => {
    const withD = parks.map((p) => ({ park: p, d: reference ? distanceM(reference, p.location) : null }));
    return reference ? withD.sort((a, b) => (a.d ?? 0) - (b.d ?? 0)) : withD.sort((a, b) => a.park.name.localeCompare(b.park.name, locale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parks, reference?.lat, reference?.lng, locale]);

  const select = (id: string) => {
    const p = parks.find((x) => x.id === id);
    if (!p) return;
    setSelectedId(id);
    mapRef.current?.flyTo(p.location, PARK_ZOOM);
  };

  // « Parc le plus proche » : geste explicite ; demande la position si besoin, puis sélectionne.
  const nearest = () => {
    if (ranked[0] && reference) return select(ranked[0].park.id);
    wantNearest.current = true;
    if (consent === "granted") geo.start();
    else setAskConsent(true);
  };
  useEffect(() => {
    if (wantNearest.current && reference && ranked[0]) {
      wantNearest.current = false;
      setSelectedId(ranked[0].park.id);
      mapRef.current?.flyTo(ranked[0].park.location, PARK_ZOOM);
    }
  }, [reference, ranked]);

  const locate = () => {
    if (geo.position) mapRef.current?.flyTo(geo.position, REGION_ZOOM);
    else if (consent !== "granted") setAskConsent(true);
    else geo.start();
  };

  const markers: MapMarker[] = useMemo(
    () =>
      parks.map((p) => ({
        id: p.id,
        type: "park" as const,
        location: p.location,
        color: PARK_COLOR,
        iconKey: "park",
        label: p.name,
        sublabel: p.city,
        highlighted: p.id === selectedId,
      })),
    [parks, selectedId],
  );

  // Vue d'ensemble : tous les parcs (+ marge).
  const bounds = useMemo<[LatLng, LatLng]>(() => {
    const lats = parks.map((p) => p.location.lat);
    const lngs = parks.map((p) => p.location.lng);
    const my = Math.max(0.5, (Math.max(...lats) - Math.min(...lats)) * 0.15);
    const mx = Math.max(0.5, (Math.max(...lngs) - Math.min(...lngs)) * 0.15);
    return [
      { lat: Math.min(...lats) - my, lng: Math.min(...lngs) - mx },
      { lat: Math.max(...lats) + my, lng: Math.max(...lngs) + mx },
    ];
  }, [parks]);

  const selected = parks.find((p) => p.id === selectedId);
  const selectedDistance = selected && geo.position ? distanceM(geo.position, selected.location) : null;
  const title = geo.position ? t("map.parksTitle") : t("map.chooseParkTitle");

  return (
    <div className={cn(fullscreen.active ? "fixed inset-0 z-[46] h-[100dvh] bg-background" : "fixed inset-0 z-0 md:static md:h-[calc(100dvh-4rem)]")}>
      <ParkMap
        ref={mapRef}
        bounds={bounds}
        markers={markers}
        user={geo.position}
        selectedId={selectedId}
        onSelect={(id) => (id ? select(id) : setSelectedId(null))}
        paddingBottom={220}
        view3d={view3d}
        decor={false}
        onEngine={setEngine}
      />

      {/* En-tête flottant : retour, titre de la carte générale (aucun parc sélectionné d'office) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 space-y-2 p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="flex items-start gap-2">
          <Link href="/" aria-label={t("common.back")} className="glass-strong pointer-events-auto inline-flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="glass-strong pointer-events-auto min-w-0 flex-1 rounded-2xl px-4 py-2.5">
            <p className="truncate font-display text-lg font-bold leading-tight">{t("map.generalTitle")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("map.parksCount", { count: parks.length })}</p>
          </div>
        </div>
        <GpsStatus status={geo.status} accuracy={geo.position?.accuracy} className="pointer-events-auto" />
      </div>

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
        <MapControl label={t("map.resetNorth")} onClick={() => mapRef.current?.resetNorth()}>
          <Compass />
        </MapControl>
        <MapControl label={t("map.generalTitle")} onClick={() => mapRef.current?.fitBounds()}>
          <Crosshair />
        </MapControl>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 z-20 space-y-2 px-3",
          fullscreen.active ? "bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]" : "bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] md:bottom-4",
        )}
      >
        {selected ? (
          <div role="dialog" aria-label={selected.name} className="glass-strong pointer-events-auto mx-auto max-w-xl rounded-[var(--radius-sheet)] p-4 card-shadow">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary" aria-hidden>
                <Trees className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-bold leading-tight">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selected.city}
                  {selectedDistance !== null && ` · ${formatDistance(selectedDistance, locale)}`}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {selected.spotCount > 0 ? t("map.parkStats", { spots: selected.spotCount, trails: selected.trailCount }) : t("map.comingSoon")}
                  {selected.isDemoData && <DemoBadge />}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label={t("common.close")} className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {selected.spotCount > 0 && (
                <Button asChild>
                  <Link href={`/parks/${selected.slug}/map`}>{t("map.openParkMap")}</Link>
                </Button>
              )}
              <Button asChild variant="secondary" className={cn(selected.spotCount === 0 && "col-span-2")}>
                <Link href={`/parks/${selected.slug}`}>{t("map.seePark")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <MapPanel mode={panel} onModeChange={setPanel} title={title} count={t("map.parksCount", { count: parks.length })} className="mx-auto max-w-xl">
            <section aria-labelledby="parks-title" className="glass-strong pointer-events-auto mx-auto max-w-xl rounded-[var(--radius-sheet)] p-3 card-shadow">
              <div className="flex items-center justify-between gap-2 px-1">
                <h2 id="parks-title" className="font-display text-lg font-extrabold">
                  {title}
                </h2>
                <PanelCollapseButton onClick={() => setPanel("collapsed")} />
              </div>
              <p className="px-1 text-xs text-muted-foreground" role="status">
                {geo.position ? t("map.fromYou") : noPosition ? t("map.demoZone") : t("map.enableToSort")}
              </p>
              <Button variant="outline" block className="mt-2" onClick={nearest}>
                <Navigation /> {t("map.nearestPark")}
              </Button>
              <ul className="mt-2 max-h-[22dvh] space-y-1 overflow-y-auto pr-1">
                {ranked.map(({ park: p, d }) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => select(p.id)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/5">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary" aria-hidden>
                        <Trees className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.city}
                          {/* Distance affichée seulement depuis une vraie position (pas depuis la zone de démonstration) */}
                          {d !== null && geo.position && ` · ${formatDistance(d, locale)}`}
                          {p.spotCount === 0 && ` · ${t("map.comingSoon")}`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </MapPanel>
        )}
      </div>

      {(askConsent || consent === "unset") && (
        <LocationConsentSheet
          onAccept={() => {
            setAskConsent(false);
            startedOnce.current = true;
            geo.start();
          }}
          onDecline={() => {
            setAskConsent(false);
            wantNearest.current = false;
          }}
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
      aria-pressed={active}
      onClick={onClick}
      className={cn("glass-strong inline-flex size-12 items-center justify-center rounded-full [&_svg]:size-5", active && "text-primary ring-1 ring-primary/40")}
    >
      {children}
    </button>
  );
}
