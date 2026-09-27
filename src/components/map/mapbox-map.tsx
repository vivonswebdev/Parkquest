"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import type { FeatureCollection } from "geojson";
import mapboxgl from "mapbox-gl";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { mapboxToken } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { MarkerPin } from "./fallback-map";
import type { MapMarker, ParkMapProps } from "./types";

const STYLES = {
  planDark: "mapbox://styles/mapbox/dark-v11",
  planLight: "mapbox://styles/mapbox/light-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

/** Thème résolu courant (posé sur <html> par le script de thème). */
function useResolvedTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
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

const styleFor = (layer: "plan" | "satellite", theme: "dark" | "light") =>
  layer === "satellite" ? STYLES.satellite : theme === "light" ? STYLES.planLight : STYLES.planDark;

/** Carte Mapbox GL (activée si NEXT_PUBLIC_MAPBOX_TOKEN est défini). */
export function MapboxMap({ bounds, markers, paths = [], user, selectedId, onSelect, layer = "plan", className, paddingBottom = 0, ref }: ParkMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef(new Map<string, { marker: mapboxgl.Marker; root: Root }>());
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const theme = useResolvedTheme();
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const lngLatBounds = (): mapboxgl.LngLatBoundsLike => [
    [bounds[0].lng, bounds[0].lat],
    [bounds[1].lng, bounds[1].lat],
  ];

  useEffect(() => {
    if (!container.current) return;
    mapboxgl.accessToken = mapboxToken;
    const m = new mapboxgl.Map({
      container: container.current,
      style: styleFor(layer, document.documentElement.dataset.theme === "light" ? "light" : "dark"),
      bounds: lngLatBounds(),
      fitBoundsOptions: { padding: { top: 60, left: 20, right: 20, bottom: paddingBottom + 20 } },
      attributionControl: true,
      pitchWithRotate: false,
    });
    m.on("load", () => setReady(true));
    m.on("click", () => onSelectRef.current?.(null));
    map.current = m;
    const entries = markerRefs.current;
    return () => {
      entries.forEach(({ marker, root }) => {
        marker.remove();
        queueMicrotask(() => root.unmount());
      });
      entries.clear();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carte créée une seule fois
  }, []);

  // Changement de calque ou de thème
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    m.setStyle(styleFor(layer, theme));
  }, [layer, theme, ready]);

  // Chemins (source GeoJSON, réinstallée après changement de style)
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const install = () => {
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: paths.map((p) => ({
          type: "Feature",
          properties: { variant: p.variant },
          geometry: { type: "LineString", coordinates: p.coordinates },
        })),
      };
      const src = m.getSource("pq-paths") as mapboxgl.GeoJSONSource | undefined;
      if (src) {
        src.setData(data);
        return;
      }
      m.addSource("pq-paths", { type: "geojson", data });
      m.addLayer({ id: "pq-paths-casing", type: "line", source: "pq-paths", paint: { "line-color": "#000", "line-opacity": 0.4, "line-width": 8 }, layout: { "line-cap": "round", "line-join": "round" } });
      m.addLayer({
        id: "pq-paths",
        type: "line",
        source: "pq-paths",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "variant"], "done", "#128C63", "active", "#19E6A2", "#CDB88A"],
          "line-width": ["match", ["get", "variant"], "active", 5, 4],
          "line-dasharray": ["match", ["get", "variant"], "trail", ["literal", [2, 1.5]], ["literal", [1, 0]]],
        },
      });
    };
    if (m.isStyleLoaded()) install();
    m.on("style.load", install);
    return () => {
      m.off("style.load", install);
    };
  }, [paths, ready]);

  // Marqueurs React rendus dans des éléments Mapbox
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
        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([mk.location.lng, mk.location.lat]).addTo(m);
        entry = { marker, root };
        markerRefs.current.set(mk.id, entry);
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

  // Position utilisateur (jamais envoyée au serveur par ce composant)
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
      el.className = "size-4 rounded-full border-[3px] border-white bg-sky-500 shadow-lg";
      userMarker.current = new mapboxgl.Marker({ element: el }).setLngLat([user.lng, user.lat]).addTo(m);
    } else {
      userMarker.current.setLngLat([user.lng, user.lat]);
    }
  }, [user]);

  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom) => map.current?.flyTo({ center: [p.lng, p.lat], zoom: zoom ?? Math.max(map.current.getZoom(), 17), essential: true }),
    fitBounds: () => map.current?.fitBounds(lngLatBounds(), { padding: { top: 60, left: 20, right: 20, bottom: paddingBottom + 20 } }),
    resetNorth: () => map.current?.resetNorth(),
  }));

  return <div ref={container} className={cn("h-full w-full", className)} />;
}
