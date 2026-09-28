"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import { AttributionControl, Map as MapLibreMap, Marker, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike } from "maplibre-gl";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { maplibreWorkerUrl, mapStyleUrl, satelliteAttribution, satelliteTilesUrl, terrainTilesUrl } from "@/lib/map/config";
import { findBuildingSource, firstSymbolLayerId, MAP_PALETTES, themePaintChanges, type MapTheme, type StyleLayerLike } from "@/lib/map/theme";
import { cn } from "@/lib/utils";
import { MarkerPin } from "./fallback-map";
import type { MapMarker, ParkMapProps } from "./types";

setWorkerUrl(maplibreWorkerUrl);

/** Délai max pour charger le fond : au-delà, repli sur la carte simplifiée. */
const LOAD_TIMEOUT_MS = 12_000;
const PITCH_3D = 60;

/** Thème résolu courant (posé sur <html> par le script de thème). */
function useResolvedTheme(): MapTheme {
  const [theme, setTheme] = useState<MapTheme>("dark");
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setTheme(el.dataset.theme === "light" ? "light" : "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return theme;
}

/**
 * Carte MapLibre GL : fond OpenStreetMap habillé ParkQuest, parcours, marqueurs,
 * vue 3D (bâtiments + relief) et satellite optionnel.
 * `onFail` est appelé si le fond ne peut pas être chargé (hors ligne, réseau filtré).
 */
export function MapLibreParkMap({
  bounds,
  markers,
  paths = [],
  user,
  selectedId,
  onSelect,
  layer = "plan",
  className,
  paddingBottom = 0,
  view3d = false,
  onFail,
  ref,
}: ParkMapProps & { onFail(): void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef(new Map<string, { marker: Marker; root: Root }>());
  const userMarker = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const theme = useResolvedTheme();
  const onSelectRef = useRef(onSelect);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onFailRef.current = onFail;
  }, [onSelect, onFail]);

  const lngLatBounds = (): LngLatBoundsLike => [
    [bounds[0].lng, bounds[0].lat],
    [bounds[1].lng, bounds[1].lat],
  ];
  const padding = { top: 90, left: 24, right: 72, bottom: paddingBottom + 24 };

  // Création unique de la carte
  useEffect(() => {
    if (!container.current) return;
    const m = new MapLibreMap({
      container: container.current,
      style: mapStyleUrl,
      bounds: lngLatBounds(),
      fitBoundsOptions: { padding },
      attributionControl: false,
      maxPitch: 75,
      canvasContextAttributes: { antialias: true },
    });
    m.addControl(new AttributionControl({ compact: true }), "bottom-left");
    // Style (fond) inaccessible ou trop lent → repli. Une fois le style reçu, la carte
    // s'affiche progressivement : une tuile, icône ou police manquante ne déclenche rien.
    let styleReceived = false;
    m.once("styledata", () => {
      styleReceived = true;
    });
    const timer = window.setTimeout(() => {
      if (!styleReceived) onFailRef.current();
    }, LOAD_TIMEOUT_MS);
    m.on("load", () => {
      window.clearTimeout(timer);
      setReady(true);
    });
    m.on("error", (e) => {
      if (!styleReceived) {
        console.warn("[ParkQuest] fond de carte indisponible, repli sur la carte simplifiée", e.error?.message);
        window.clearTimeout(timer);
        onFailRef.current();
      }
    });
    m.on("click", () => onSelectRef.current?.(null));
    map.current = m;
    const entries = markerRefs.current;
    return () => {
      window.clearTimeout(timer);
      entries.forEach(({ marker, root }) => {
        marker.remove();
        queueMicrotask(() => root.unmount());
      });
      entries.clear();
      userMarker.current?.remove();
      userMarker.current = null;
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carte créée une seule fois
  }, []);

  // Habillage du fond selon le thème + couches ParkQuest (satellite, bâtiments 3D, ciel)
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const layers = (m.getStyle().layers ?? []) as StyleLayerLike[];
    for (const c of themePaintChanges(layers, theme)) {
      try {
        m.setPaintProperty(c.layerId, c.property as Parameters<MapLibreMap["setPaintProperty"]>[1], c.value);
      } catch {
        /* propriété non applicable à cette couche : ignorée */
      }
    }
    const p = MAP_PALETTES[theme];
    const beforeId = firstSymbolLayerId(layers);

    if (satelliteTilesUrl && !m.getSource("pq-satellite")) {
      m.addSource("pq-satellite", { type: "raster", tiles: [satelliteTilesUrl], tileSize: 256, attribution: satelliteAttribution, maxzoom: 19 });
      m.addLayer({ id: "pq-satellite", type: "raster", source: "pq-satellite", layout: { visibility: "none" } }, beforeId);
    }

    const buildingSource = findBuildingSource(layers);
    if (buildingSource && !m.getLayer("pq-buildings-3d")) {
      m.addLayer(
        {
          id: "pq-buildings-3d",
          type: "fill-extrusion",
          source: buildingSource,
          "source-layer": "building",
          minzoom: 14,
          layout: { visibility: "none" },
          paint: {
            "fill-extrusion-color": p.building3d,
            "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 8],
            "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
            "fill-extrusion-opacity": 0.85,
          },
        },
        beforeId,
      );
    } else if (m.getLayer("pq-buildings-3d")) {
      m.setPaintProperty("pq-buildings-3d", "fill-extrusion-color", p.building3d);
    }

    if (!m.getSource("pq-terrain")) {
      m.addSource("pq-terrain", { type: "raster-dem", tiles: [terrainTilesUrl], encoding: "terrarium", tileSize: 256, maxzoom: 14 });
    }
    m.setSky({ "sky-color": p.sky, "horizon-color": p.horizon, "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.5, "fog-color": p.background });
  }, [theme, ready]);

  // Satellite / plan
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.getLayer("pq-satellite")) return;
    m.setLayoutProperty("pq-satellite", "visibility", layer === "satellite" ? "visible" : "none");
  }, [layer, ready]);

  // Vue 3D : inclinaison, bâtiments en relief, terrain
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    if (m.getLayer("pq-buildings-3d")) m.setLayoutProperty("pq-buildings-3d", "visibility", view3d ? "visible" : "none");
    m.setTerrain(view3d && m.getSource("pq-terrain") ? { source: "pq-terrain", exaggeration: 1.4 } : null);
    // En 3D, la caméra se rapproche (l'inclinaison éloigne visuellement le parc).
    const zoomDelta = view3d === m.getPitch() > 0 ? 0 : view3d ? 1 : -1;
    m.easeTo({ pitch: view3d ? PITCH_3D : 0, bearing: view3d ? -20 : 0, zoom: m.getZoom() + zoomDelta, duration: 900 });
  }, [view3d, ready]);

  // Parcours (source GeoJSON sous les libellés)
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const data: FeatureCollection = {
      type: "FeatureCollection",
      features: paths.map((pth) => ({
        type: "Feature",
        properties: { variant: pth.variant },
        geometry: { type: "LineString", coordinates: pth.coordinates },
      })),
    };
    const src = m.getSource("pq-paths") as GeoJSONSource | undefined;
    if (src) {
      src.setData(data);
      return;
    }
    const beforeId = firstSymbolLayerId((m.getStyle().layers ?? []) as StyleLayerLike[]);
    m.addSource("pq-paths", { type: "geojson", data });
    m.addLayer(
      { id: "pq-paths-casing", type: "line", source: "pq-paths", paint: { "line-color": "#04110c", "line-opacity": 0.35, "line-width": 8 }, layout: { "line-cap": "round", "line-join": "round" } },
      beforeId,
    );
    m.addLayer(
      {
        id: "pq-paths",
        type: "line",
        source: "pq-paths",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "variant"], "done", "#128C63", "active", "#19E6A2", "#CDB88A"],
          "line-width": ["match", ["get", "variant"], "active", 5, 4],
          "line-dasharray": ["match", ["get", "variant"], "trail", ["literal", [2, 1.5]], ["literal", [1, 0]]],
        },
      },
      beforeId,
    );
  }, [paths, ready]);

  // Marqueurs React rendus dans des éléments MapLibre
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const seen = new Set<string>();
    markers.forEach((mk: MapMarker) => {
      seen.add(mk.id);
      let entry = markerRefs.current.get(mk.id);
      if (!entry) {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", mk.label);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current?.(mk.id);
        });
        const root = createRoot(el);
        const marker = new Marker({ element: el, anchor: "bottom" }).setLngLat([mk.location.lng, mk.location.lat]).addTo(m);
        entry = { marker, root };
        markerRefs.current.set(mk.id, entry);
      } else {
        entry.marker.setLngLat([mk.location.lng, mk.location.lat]);
      }
      entry.root.render(<MarkerPin marker={mk} selected={mk.id === selectedId} small={mk.type === "facility"} />);
    });
    markerRefs.current.forEach((entry, id) => {
      if (!seen.has(id)) {
        entry.marker.remove();
        queueMicrotask(() => entry.root.unmount());
        markerRefs.current.delete(id);
      }
    });
  }, [markers, selectedId]);

  // Position de l'utilisateur (reste sur l'appareil)
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!user) {
      userMarker.current?.remove();
      userMarker.current = null;
      return;
    }
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className = "size-4 rounded-full border-[3px] border-white bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.25)]";
      userMarker.current = new Marker({ element: el }).setLngLat([user.lng, user.lat]).addTo(m);
    } else {
      userMarker.current.setLngLat([user.lng, user.lat]);
    }
  }, [user]);

  useImperativeHandle(ref, () => ({
    flyTo: (pt, zoom) => map.current?.flyTo({ center: [pt.lng, pt.lat], zoom: zoom ?? Math.max(map.current.getZoom(), 17), essential: true }),
    fitBounds: () => map.current?.fitBounds(lngLatBounds(), { padding }),
    resetNorth: () => map.current?.easeTo({ bearing: 0, pitch: view3d ? PITCH_3D : 0 }),
  }));

  return <div ref={container} className={cn("pq-maplibre h-full w-full", className)} />;
}
