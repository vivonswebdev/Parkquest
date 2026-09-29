"use client";

import { Check, Flag } from "lucide-react";
import { useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LatLng } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { MarkerIcon } from "./marker-icon";
import { makeGroves, pondRing, scatterTrees } from "@/lib/map/nature";
import { PATH_COLORS } from "./path-colors";
import type { MapMarker, MapNature, ParkMapProps } from "./types";

/**
 * Carte de repli intégrée (sans Mapbox) : projection locale équirectangulaire
 * de l'emprise du parc, fond stylisé, chemins et marqueurs accessibles.
 * Déplacement au doigt / souris, zoom molette et pincement.
 */

const VIEW_W = 1000;

/** Décor par défaut : dégager les marqueurs, un étang par spot « eau ». */
export function defaultNature(markers: MapMarker[]): MapNature {
  return {
    clearings: markers.map((m) => m.location),
    ponds: markers.filter((m) => m.type === "spot" && m.iconKey === "WATER").map((m) => ({ center: m.location, radiusM: 55 })),
  };
}

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function blob(cx: number, cy: number, r: number, rand: () => number): string {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.7 + rand() * 0.5);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8];
  });
  let d = `M${((pts[0][0] + pts[n - 1][0]) / 2).toFixed(1)} ${((pts[0][1] + pts[n - 1][1]) / 2).toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${((p[0] + q[0]) / 2).toFixed(1)} ${((p[1] + q[1]) / 2).toFixed(1)}`;
  }
  return d + "Z";
}

export function FallbackMap({ bounds, markers, paths = [], user, selectedId, onSelect, layer = "plan", className, paddingBottom = 0, nature, focus, decor: withDecor = true, boundary, ref }: ParkMapProps) {
  const [sw, ne] = bounds;
  const midLat = (sw.lat + ne.lat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const spanX = (ne.lng - sw.lng) * kx;
  const spanY = ne.lat - sw.lat;
  const VIEW_H = (VIEW_W * spanY) / spanX;

  const project = useCallback(
    (p: LatLng) => ({ x: (((p.lng - sw.lng) * kx) / spanX) * VIEW_W, y: ((ne.lat - p.lat) / spanY) * VIEW_H }),
    [sw.lng, ne.lat, kx, spanX, spanY, VIEW_H],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  // Cadrage initial sur la zone utile (lieux + parcours), centrée au-dessus des panneaux.
  const fa = project(focus ? focus[0] : sw);
  const fb = project(focus ? focus[1] : ne);
  const focusW = Math.max(1, Math.abs(fb.x - fa.x));
  const focusH = Math.max(1, Math.abs(fb.y - fa.y));
  const fc = { x: (fa.x + fb.x) / 2, y: (fa.y + fb.y) / 2 };
  const baseScale = size.w && size.h ? Math.min((size.w - 32) / focusW, (size.h - paddingBottom - 150) / focusH) : 1;
  const originX = (s: number) => size.w / 2 - fc.x * s + view.tx;
  const originY = (s: number) => (size.h - paddingBottom + 60) / 2 - fc.y * s + view.ty;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Coordonnées écran = (vue * baseScale * scale) + translation, centrées.
  const toScreen = useCallback(
    (p: { x: number; y: number }) => {
      const s = baseScale * view.scale;
      return { x: originX(s) + p.x * s, y: originY(s) + p.y * s };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- originX/Y dérivent de ces valeurs
    [baseScale, view, size, paddingBottom, fc.x, fc.y],
  );

  const centerOn = useCallback(
    (p: LatLng, scale?: number) => {
      const target = project(p);
      setView((v) => {
        const sc = scale ?? v.scale;
        const s = baseScale * sc;
        return { scale: sc, tx: -(target.x - fc.x) * s, ty: -(target.y - fc.y) * s };
      });
    },
    [project, baseScale, fc.x, fc.y],
  );

  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom) => centerOn(p, zoom ? Math.min(4, Math.max(1, 2 ** (zoom - 16.6))) : undefined),
    fitBounds: () => setView({ scale: 1, tx: 0, ty: 0 }),
    resetNorth: () => setView({ scale: 1, tx: 0, ty: 0 }),
    getCenter: () => {
      if (!size.w) return null;
      const sc = baseScale * view.scale;
      const x = (size.w / 2 - originX(sc)) / sc;
      const y = (size.h / 2 - originY(sc)) / sc;
      return { lat: ne.lat - (y / VIEW_H) * spanY, lng: sw.lng + ((x / VIEW_W) * spanX) / kx };
    },
  }));

  // --- Gestes (pan + pinch + molette) ---
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; scale: number } | null>(null);
  const moved = useRef(false);

  const clampScale = (s: number) => Math.min(5, Math.max(0.8, s));

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const g = gesture.current;
      setView((v) => ({ ...v, scale: clampScale((g.scale * d) / g.dist) }));
      moved.current = true;
      return;
    }
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
    setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    setView((v) => {
      const next = clampScale(v.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
      const k = next / v.scale;
      return { scale: next, tx: v.tx * k, ty: v.ty * k };
    });
  };

  // --- Décor déterministe : pelouses, bois, étangs, arbres illustrés ---
  const natureSpec = nature ?? defaultNature(markers);
  const natureKey = JSON.stringify(natureSpec);
  const trailPaths = paths.filter((p) => p.variant !== "active");
  const trailKey = JSON.stringify(trailPaths.map((p) => p.coordinates));
  const decor = useMemo(() => {
    const rand = seeded(`${sw.lat}${sw.lng}`);
    // Carte à grande échelle (tous les parcs) : pas de décor de parc.
    if (!withDecor) return { woods: [], lawns: [], ponds: [], trees: [], mPerUnit: 1, topo: [] };
    const spec: MapNature = JSON.parse(natureKey);
    const groves = makeGroves([sw, ne], `groves${sw.lat}${sw.lng}`);
    const unitsPerM = VIEW_H / (spanY * 111_320);
    const woods = groves.map((g) => {
      const c = project(g.center);
      return blob(c.x, c.y, g.radiusM * unitsPerM * 0.95, rand);
    });
    const lawns = Array.from({ length: 6 }, () => blob(rand() * VIEW_W, rand() * VIEW_H, 50 + rand() * 80, rand));
    const toD = (ring: [number, number][]) =>
      ring
        .map(([lng, lat], i) => {
          const q = project({ lat, lng });
          return `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        })
        .join(" ") + "Z";
    const trees = scatterTrees({
      bounds: [sw, ne],
      excludeAreas: spec.ponds.map((p, i) => pondRing(p.center, p.radiusM + 6, `pond${i}`)),
      paths: JSON.parse(trailKey),
      points: spec.clearings,
      groves,
      spacingM: 17,
      maxTrees: 1600,
    }).map((t) => ({ ...t, ...project(t) }));
    const topo = Array.from({ length: 7 }, (_, i) => {
      const y = (VIEW_H / 7) * i + 30;
      return `M-20 ${y} C ${VIEW_W * 0.25} ${y - 40 + rand() * 80}, ${VIEW_W * 0.6} ${y - 40 + rand() * 80}, ${VIEW_W + 20} ${y + rand() * 30}`;
    });
    return {
      woods,
      lawns,
      ponds: spec.ponds.map((p, i) => toD(pondRing(p.center, p.radiusM, `pond${i}`))),
      trees,
      mPerUnit: (spanY * 111_320) / VIEW_H,
      topo,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dépendances sérialisées (natureKey, trailKey)
  }, [natureKey, trailKey, project, VIEW_H, spanY, withDecor]);

  const sat = layer === "satellite";
  // Couche nature mémorisée : les arbres ne sont pas re-rendus pendant les déplacements.
  const natureLayer = useMemo(
    () => (
      <g>
        {decor.lawns.map((d, i) => (
          <path key={`l${i}`} d={d} fill={sat ? "#2f5e33" : "var(--map-lawn)"} opacity={0.9} />
        ))}
        {decor.woods.map((d, i) => (
          <path key={`w${i}`} d={d} fill={sat ? "#173d22" : "var(--map-wood)"} opacity={0.8} />
        ))}
        {decor.ponds.map((d, i) => (
          <g key={`p${i}`}>
            <path d={d} fill="none" stroke="var(--map-water-rim)" strokeWidth={7} strokeLinejoin="round" />
            <path d={d} fill={sat ? "#2c5f6e" : "var(--map-water)"} />
            <path d={d} fill="none" stroke="var(--map-water-light)" strokeWidth={2.5} strokeDasharray="30 22" opacity={0.7} transform="translate(-3 -3)" />
          </g>
        ))}
        {decor.trees.map((t, i) => {
          // Couronnes légèrement exagérées : lecture « carte illustrée » à l'échelle du parc.
          const r = (t.radiusM * 1.5) / decor.mPerUnit;
          const fill = t.kind === "conifer" ? "var(--map-conifer)" : `var(--map-tree-${t.shade + 1})`;
          return (
            <g key={`t${i}`}>
              <ellipse cx={t.x + r * 0.35} cy={t.y + r * 0.45} rx={r} ry={r * 0.75} fill="var(--map-tree-shadow)" />
              <circle cx={t.x} cy={t.y} r={r} fill={fill} />
              <circle cx={t.x - r * 0.3} cy={t.y - r * 0.32} r={r * 0.5} fill="var(--map-tree-light)" opacity={t.kind === "conifer" ? 0.35 : 0.55} />
            </g>
          );
        })}
      </g>
    ),
    [decor, sat],
  );
  const s = baseScale * view.scale;
  const ox = originX(s);
  const oy = originY(s);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full touch-none select-none overflow-hidden", sat ? "bg-[#0d2a1c]" : "bg-[var(--map-bg)]", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onClick={() => !moved.current && onSelect?.(null)}
    >
      {size.w > 0 && (
        <svg className="absolute left-0 top-0" width={size.w} height={size.h} aria-hidden>
          <g transform={`translate(${ox} ${oy}) scale(${s})`}>
            <rect x={-400} y={-400} width={VIEW_W + 800} height={VIEW_H + 800} fill={sat ? "#123b26" : "var(--map-base)"} />
            {natureLayer}
            {!sat &&
              decor.topo.map((d, i) => <path key={`c${i}`} d={d} fill="none" stroke="var(--map-topo)" strokeWidth={1.5 / s} />)}
            {boundary && boundary.length > 2 && (
              <path
                d={boundary.map(([lng, lat], i) => {
                  const q = project({ lat, lng });
                  return `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
                }).join(" ")}
                fill="none"
                stroke="var(--map-boundary, #f4c95d)"
                strokeOpacity={0.85}
                strokeWidth={2.5 / s}
                strokeDasharray={`${8 / s} ${8 / s}`}
                strokeLinejoin="round"
              />
            )}
            {paths.map((p) => {
              const pts = p.coordinates.map(([lng, lat]) => project({ lat, lng }));
              const d = pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
              return (
                <g key={p.id}>
                  {p.variant === "active" && (
                    <path d={d} fill="none" stroke={PATH_COLORS.active} strokeOpacity={0.3} strokeWidth={16 / s} strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke="#000"
                    strokeOpacity={p.variant === "done" ? 0.18 : p.variant === "active" ? 0.45 : 0.3}
                    strokeWidth={(p.variant === "active" ? 10 : 7) / s}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke={PATH_COLORS[p.variant]}
                    strokeOpacity={p.variant === "done" ? 0.75 : 1}
                    strokeWidth={(p.variant === "active" ? 6 : 3.5) / s}
                    strokeDasharray={p.variant === "trail" ? `${6 / s} ${6 / s}` : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* Marqueurs HTML (accessibles au clavier) */}
      {size.w > 0 &&
        markers.map((m) => {
          const p = toScreen(project(m.location));
          const selected = m.id === selectedId;
          const isFacility = m.type === "facility";
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.ariaLabel ?? m.label}
              aria-pressed={selected}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(m.id);
              }}
              className={cn("absolute -translate-x-1/2 -translate-y-full", m.step?.state === "next" ? "z-[13]" : m.step?.state === "current" ? "z-[12]" : "z-10")}
              style={{ left: p.x, top: p.y }}
            >
              <MarkerPin marker={m} selected={selected} small={isFacility} />
            </button>
          );
        })}

      {user && size.w > 0 && (() => {
        const p = toScreen(project(user));
        const accPx = Math.min(200, (user.accuracy / ((spanY * 111320) / VIEW_H)) * s);
        return (
          <div className="pointer-events-none absolute z-20" style={{ left: p.x, top: p.y }} aria-hidden>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/15 ring-1 ring-sky-400/30" style={{ width: accPx * 2, height: accPx * 2 }} />
            <div className="animate-pulse-ring absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/40" />
            <div className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-sky-500 shadow-lg" />
          </div>
        );
      })()}
    </div>
  );
}

export function MarkerPin({ marker: m, selected, small }: { marker: ParkMapProps["markers"][number]; selected?: boolean; small?: boolean }) {
  if (m.step) return <StepMarkerPin marker={m} step={m.step} selected={selected} />;
  return (
    <span className="relative flex flex-col items-center">
      {(selected || m.highlighted) && !small && (
        <span className="glass-strong mb-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg">
          {m.label}
          {m.sublabel && <span className="font-normal text-muted-foreground"> · {m.sublabel}</span>}
        </span>
      )}
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full border-2 bg-[#031711] shadow-[0_6px_18px_-4px_rgba(0,0,0,0.8)] transition-transform",
          small ? "size-8" : "size-11",
          selected && "scale-110",
          m.highlighted && "glow-mint",
        )}
        style={{ borderColor: m.discovered ? "#19E6A2" : m.color, color: m.color }}
      >
        <MarkerIcon type={m.type} iconKey={m.iconKey} className={small ? "size-4" : "size-5"} />
        {m.discovered && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={cn("-mt-0.5 w-0.5 bg-white/80", small ? "h-1.5" : "h-2.5")} />
      <span className="size-1.5 rounded-full bg-white shadow" />
    </span>
  );
}

/**
 * Marqueur d'étape de parcours : numéro + icône de catégorie + état.
 * L'état ne dépend jamais de la couleur seule : forme (coche, pointillés, anneau, pulsation),
 * taille et libellé accessible.
 */
function StepMarkerPin({ marker: m, step, selected }: { marker: ParkMapProps["markers"][number]; step: NonNullable<ParkMapProps["markers"][number]["step"]>; selected?: boolean }) {
  const { n, state, last } = step;
  const isNext = state === "next";
  // Un seul libellé à la fois (le prochain objectif) : évite les chevauchements.
  const showChip = isNext || (selected && state !== "current");
  return (
    <span className={cn("relative flex flex-col items-center", state === "future" && "opacity-70", state === "done" && "opacity-85")}>
      {showChip && (
        <span className={cn("mb-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg", isNext ? "bg-[#19E6A2] text-[#031711]" : "glass-strong text-foreground")}>
          {m.label}
        </span>
      )}
      <span className="relative">
        {isNext && <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-full bg-[#19E6A2]/45" />}
        <span
          className={cn(
            "relative flex items-center justify-center rounded-full font-display font-extrabold tabular-nums shadow-[0_6px_18px_-4px_rgba(0,0,0,0.8)] transition-transform",
            state === "next" && "size-12 border-[3px] border-[#19E6A2] bg-[#031711] text-lg text-white glow-mint",
            state === "current" && "size-11 border-[3px] border-white bg-[#0b3a2a] text-base text-white",
            state === "done" && "size-9 border-2 border-[#19E6A2]/70 bg-[#0d2b21] text-sm text-[#bff5de]",
            state === "future" && "size-9 border-2 border-dashed border-white/60 bg-[#031711]/85 text-sm text-white/80",
            selected && "scale-110",
          )}
        >
          {n}
        </span>
        {/* Icône de catégorie */}
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 bg-[#031711]"
          style={{ borderColor: m.color, color: m.color }}
        >
          <MarkerIcon type={m.type} iconKey={m.iconKey} className="size-3" />
        </span>
        {/* État : coche (terminé), point plein (en cours) */}
        {state === "done" && (
          <span aria-hidden className="absolute -left-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#19E6A2] text-[#031711]">
            <Check className="size-3" strokeWidth={3} />
          </span>
        )}
        {state === "current" && <span aria-hidden className="absolute -left-0.5 -top-0.5 size-3 rounded-full border-2 border-[#031711] bg-white" />}
        {/* Fin du parcours : drapeau sobre */}
        {last && (
          <span aria-hidden className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#f4c95d] text-[#031711]">
            <Flag className="size-3" strokeWidth={2.5} />
          </span>
        )}
      </span>
      <span className={cn("-mt-0.5 w-0.5 bg-white/80", isNext ? "h-3" : "h-2")} />
      <span className="size-1.5 rounded-full bg-white shadow" />
    </span>
  );
}
