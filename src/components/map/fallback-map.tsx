"use client";

import { Check } from "lucide-react";
import { useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LatLng } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { MarkerIcon } from "./marker-icon";
import type { ParkMapProps } from "./types";

/**
 * Carte de repli intégrée (sans Mapbox) : projection locale équirectangulaire
 * de l'emprise du parc, fond stylisé, chemins et marqueurs accessibles.
 * Déplacement au doigt / souris, zoom molette et pincement.
 */

const VIEW_W = 1000;

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

export function FallbackMap({ bounds, markers, paths = [], user, selectedId, onSelect, layer = "plan", className, paddingBottom = 0, ref }: ParkMapProps) {
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
  const baseScale = size.w && size.h ? Math.min(size.w / VIEW_W, (size.h - paddingBottom - 120) / VIEW_H) * 1.08 : 1;

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
      const ox = (size.w - VIEW_W * s) / 2 + view.tx;
      const oy = (size.h - paddingBottom - VIEW_H * s) / 2 + view.ty;
      return { x: ox + p.x * s, y: oy + p.y * s };
    },
    [baseScale, view, size, paddingBottom, VIEW_H],
  );

  const centerOn = useCallback(
    (p: LatLng, scale?: number) => {
      const target = project(p);
      setView((v) => {
        const sc = scale ?? v.scale;
        const s = baseScale * sc;
        return { scale: sc, tx: -(target.x - VIEW_W / 2) * s, ty: -(target.y - VIEW_H / 2) * s };
      });
    },
    [project, baseScale, VIEW_H],
  );

  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom) => centerOn(p, zoom ? Math.min(4, Math.max(1, zoom - 14.6)) : undefined),
    fitBounds: () => setView({ scale: 1, tx: 0, ty: 0 }),
    resetNorth: () => setView({ scale: 1, tx: 0, ty: 0 }),
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

  // --- Décor déterministe ---
  const decor = useMemo(() => {
    const rand = seeded(`${sw.lat}${sw.lng}`);
    const woods = Array.from({ length: 9 }, () => blob(rand() * VIEW_W, rand() * VIEW_H, 60 + rand() * 110, rand));
    const lawns = Array.from({ length: 6 }, () => blob(rand() * VIEW_W, rand() * VIEW_H, 50 + rand() * 80, rand));
    const trees = Array.from({ length: 140 }, () => ({ x: rand() * VIEW_W, y: rand() * VIEW_H, r: 3 + rand() * 6 }));
    const topo = Array.from({ length: 7 }, (_, i) => {
      const y = (VIEW_H / 7) * i + 30;
      return `M-20 ${y} C ${VIEW_W * 0.25} ${y - 40 + rand() * 80}, ${VIEW_W * 0.6} ${y - 40 + rand() * 80}, ${VIEW_W + 20} ${y + rand() * 30}`;
    });
    return { woods, lawns, trees, topo };
  }, [sw.lat, sw.lng, VIEW_H]);

  const water = markers.filter((m) => m.type === "spot" && m.iconKey === "WATER").map((m) => project(m.location));
  const s = baseScale * view.scale;
  const ox = (size.w - VIEW_W * s) / 2 + view.tx;
  const oy = (size.h - paddingBottom - VIEW_H * s) / 2 + view.ty;
  const sat = layer === "satellite";

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
            {decor.lawns.map((d, i) => (
              <path key={`l${i}`} d={d} fill={sat ? "#2f5e33" : "var(--map-lawn)"} opacity={0.9} />
            ))}
            {decor.woods.map((d, i) => (
              <path key={`w${i}`} d={d} fill={sat ? "#173d22" : "var(--map-wood)"} />
            ))}
            {decor.trees.map((t, i) => (
              <circle key={`t${i}`} cx={t.x} cy={t.y} r={t.r} fill={sat ? "#1f5a2f" : "var(--map-tree)"} opacity={0.9} />
            ))}
            {water.map((p, i) => (
              <path key={`p${i}`} d={blob(p.x, p.y, 45, seeded(`w${i}`))} fill={sat ? "#2c5f6e" : "var(--map-water)"} stroke="#5CC8FF" strokeOpacity={0.35} />
            ))}
            {!sat &&
              decor.topo.map((d, i) => <path key={`c${i}`} d={d} fill="none" stroke="var(--map-topo)" strokeWidth={1.5 / s} />)}
            {paths.map((p) => {
              const pts = p.coordinates.map(([lng, lat]) => project({ lat, lng }));
              const d = pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
              return (
                <g key={p.id}>
                  <path d={d} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={9 / s} strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d={d}
                    fill="none"
                    stroke={p.variant === "done" ? "#128C63" : p.variant === "active" ? "#19E6A2" : "#CDB88A"}
                    strokeOpacity={p.variant === "trail" ? 0.7 : 1}
                    strokeWidth={(p.variant === "active" ? 5 : 4) / s}
                    strokeDasharray={p.variant === "trail" ? `${8 / s} ${7 / s}` : undefined}
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
              aria-label={m.label}
              aria-pressed={selected}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(m.id);
              }}
              className="absolute z-10 -translate-x-1/2 -translate-y-full"
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
