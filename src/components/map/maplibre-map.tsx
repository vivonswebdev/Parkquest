"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import { AttributionControl, Map as MapLibreMap, Marker, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike } from "maplibre-gl";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { maplibreWorkerUrl, mapStyleUrl, satelliteAttribution, satelliteTilesUrl, terrainTilesUrl } from "@/lib/map/config";
import { makeGroves, pondRing, scatterTrees, TREE_PALETTES, treeExtrusions, treePoints, type LngLat, type Ring, type Tree } from "@/lib/map/nature";
import { findBuildingSource, firstSymbolLayerId, MAP_PALETTES, themePaintChanges, type MapTheme, type StyleLayerLike } from "@/lib/map/theme";
import { cn } from "@/lib/utils";
import { MarkerPin } from "./fallback-map";
import { defaultNature } from "./fallback-map";
import type { MapMarker, MapNature, ParkMapProps } from "./types";

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

/** Anneaux extérieurs des polygones d'une couche vectorielle (géométries découpées par tuile). */
function outerRings(features: { geometry: GeoJSON.Geometry }[]): Ring[] {
  const rings: Ring[] = [];
  for (const f of features) {
    const g = f.geometry;
    if (g.type === "Polygon") rings.push(g.coordinates[0] as Ring);
    else if (g.type === "MultiPolygon") g.coordinates.forEach((poly) => rings.push(poly[0] as Ring));
  }
  return rings;
}

/** Pixels par mètre au zoom 20 (tuiles 512 px), pour dimensionner les ombres au sol. */
const pxPerMeterZ20 = (lat: number) => (512 * 2 ** 20) / (40_075_016.686 * Math.cos((lat * Math.PI) / 180));

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
  focus,
  nature,
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

  const frame = focus ?? bounds;
  const lngLatBounds = (): LngLatBoundsLike => [
    [frame[0].lng, frame[0].lat],
    [frame[1].lng, frame[1].lat],
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

  // Nature : arbres 3D (tronc + couronne), ombres au sol, étangs si le fond n'a pas d'eau.
  const natureSpec = nature ?? defaultNature(markers);
  const natureKey = JSON.stringify(natureSpec);
  const trailKey = JSON.stringify(paths.filter((pth) => pth.variant !== "active").map((pth) => pth.coordinates));
  const treesRef = useRef<Tree[] | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const spec: MapNature = JSON.parse(natureKey);
    const layers = (m.getStyle().layers ?? []) as StyleLayerLike[];
    const beforeId = firstSymbolLayerId(layers);
    const pal = TREE_PALETTES[theme];
    let cancelled = false;

    const install = () => {
      if (cancelled) return;
      if (!treesRef.current) {
        // Fond OpenStreetMap : on ne sème que dans les zones vertes réelles, jamais dans l'eau ni sur les bâtiments.
        const vector = findBuildingSource(layers);
        let areas: Ring[] = [];
        let water: Ring[] = [];
        let buildings: Ring[] = [];
        if (vector) {
          try {
            areas = outerRings([
              ...m.querySourceFeatures(vector, { sourceLayer: "park" }),
              ...m.querySourceFeatures(vector, { sourceLayer: "landcover", filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "forest", "park", "garden", "meadow"]]] }),
            ]);
            water = outerRings(m.querySourceFeatures(vector, { sourceLayer: "water" }));
            buildings = outerRings(m.querySourceFeatures(vector, { sourceLayer: "building" }));
          } catch {
            /* style sans ces couches : décor sur toute l'emprise */
          }
        }
        const drawPonds = water.length === 0;
        const ponds = drawPonds ? spec.ponds.map((pd, i) => pondRing(pd.center, pd.radiusM, `pond${i}`)) : [];
        treesRef.current = scatterTrees({
          bounds,
          areas,
          excludeAreas: [...water, ...buildings, ...spec.ponds.map((pd, i) => pondRing(pd.center, pd.radiusM + 6, `pond${i}`))],
          paths: JSON.parse(trailKey) as LngLat[][],
          points: spec.clearings,
          groves: makeGroves(bounds, `groves${bounds[0].lat}${bounds[0].lng}`),
          spacingM: 14,
          maxTrees: 2600,
          // Couronnes légèrement exagérées : lisibles en vue 2D à l'échelle du parc.
        }).map((t) => ({ ...t, radiusM: t.radiusM * 1.35 }));
        if (ponds.length && !m.getSource("pq-ponds")) {
          m.addSource("pq-ponds", {
            type: "geojson",
            data: { type: "FeatureCollection", features: ponds.map((r) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [r] } })) },
          });
          m.addLayer({ id: "pq-ponds-rim", type: "line", source: "pq-ponds", paint: { "line-color": MAP_PALETTES[theme].water, "line-width": 6, "line-opacity": 0.5, "line-blur": 2 } }, beforeId);
          m.addLayer({ id: "pq-ponds", type: "fill", source: "pq-ponds", paint: { "fill-color": MAP_PALETTES[theme].water } }, beforeId);
        }
      }
      const trees = treesRef.current;
      const k = pxPerMeterZ20((bounds[0].lat + bounds[1].lat) / 2);
      const extrusions = treeExtrusions(trees, pal);
      const pts = treePoints(trees);
      const ext = m.getSource("pq-trees") as GeoJSONSource | undefined;
      if (ext) {
        ext.setData(extrusions);
      } else {
        m.addSource("pq-trees", { type: "geojson", data: extrusions });
        m.addSource("pq-tree-points", { type: "geojson", data: pts });
        const pathsLayer = m.getLayer("pq-paths-casing") ? "pq-paths-casing" : beforeId;
        m.addLayer(
          {
            id: "pq-tree-shadows",
            type: "circle",
            source: "pq-tree-points",
            minzoom: 14,
            paint: {
              "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 14, ["*", ["get", "r"], k / 64], 20, ["*", ["get", "r"], k]],
              "circle-color": "#0b1f14",
              "circle-opacity": theme === "dark" ? 0.45 : 0.18,
              "circle-blur": 0.4,
              "circle-translate": [3, 4],
              "circle-pitch-alignment": "map",
            },
          },
          pathsLayer,
        );
        m.addLayer(
          {
            id: "pq-trees-3d",
            type: "fill-extrusion",
            source: "pq-trees",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": ["get", "color"],
              "fill-extrusion-base": ["get", "base"],
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-opacity": 1,
              "fill-extrusion-vertical-gradient": true,
            },
          },
          beforeId,
        );
      }
      if (m.getLayer("pq-tree-shadows")) m.setPaintProperty("pq-tree-shadows", "circle-opacity", theme === "dark" ? 0.45 : 0.18);
      if (m.getLayer("pq-ponds")) {
        m.setPaintProperty("pq-ponds", "fill-color", MAP_PALETTES[theme].water);
        m.setPaintProperty("pq-ponds-rim", "line-color", MAP_PALETTES[theme].water);
      }
    };

    // Les zones vertes OSM ne sont interrogeables qu'une fois les tuiles chargées.
    if (treesRef.current || m.areTilesLoaded()) install();
    else m.once("idle", install);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dépendances sérialisées (natureKey, trailKey)
  }, [ready, theme, natureKey, trailKey]);

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
