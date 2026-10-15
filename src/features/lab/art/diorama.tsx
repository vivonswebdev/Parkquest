"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Carte « diorama » 2.5D, entièrement fictive : un sol SVG incliné en perspective CSS, et des éléments
 * debout (arbres, bâtiments, lampadaires, repères) contre-inclinés pour rester verticaux.
 * Aucune tuile, aucun GPS, aucun moteur 3D : une seule couche DOM légère (≈ 90 éléments).
 */

export type MapTheme = "day" | "night";
export const WORLD = 1000;
export const TILT = 52;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface DioMarker {
  id: string;
  x: number;
  y: number;
  kind: "start" | "adventure" | "egg" | "clue" | "player" | "friend";
  label: string;
}

export const MARKERS: DioMarker[] = [
  { id: "start", x: 220, y: 780, kind: "start", label: "Départ" },
  { id: "clue", x: 360, y: 612, kind: "clue", label: "Indice 1" },
  { id: "egg", x: 520, y: 520, kind: "egg", label: "Découverte" },
  { id: "adventure", x: 640, y: 392, kind: "adventure", label: "Le Secret du Séquoia" },
  { id: "friend", x: 452, y: 576, kind: "friend", label: "Lina" },
  { id: "player", x: 262, y: 742, kind: "player", label: "Toi" },
];

export const HOME_CAMERA: Camera = { x: 410, y: 610, zoom: 0.8 };

/* Générateur déterministe : le décor est identique à chaque rendu (serveur et client). */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const PATH_POINTS: [number, number][] = [];
const MAIN = "M120 940 C 200 820 250 690 380 610 S 560 520 640 400 S 780 250 900 180";
const BRANCH = "M380 610 C 450 690 520 770 560 900";
const LOOP = "M560 640 C 600 520 820 520 860 640 C 890 740 640 780 560 640";
const ADVENTURE = "M220 780 C 270 700 320 640 360 612 S 470 545 520 520 S 610 440 640 392";

// Points d'échantillonnage des sentiers (approximation) pour garder les arbres hors des chemins
for (let t = 0; t <= 1; t += 0.04) {
  PATH_POINTS.push([120 + 780 * t, 940 - 760 * t]);
  PATH_POINTS.push([380 + 180 * t, 610 + 290 * t]);
}
const LAKE = { x: 712, y: 640, rx: 120, ry: 78 };

interface Sprite {
  x: number;
  y: number;
  kind: "tree" | "conifer" | "sequoia" | "greenhouse" | "kiosk" | "lamp" | "bench" | "firefly";
  s: number;
  v: number;
}

const SPRITES: Sprite[] = (() => {
  const r = rng(7);
  const out: Sprite[] = [];
  const clusters = [
    { x: 200, y: 260, rad: 170, n: 22 },
    { x: 860, y: 900, rad: 120, n: 10 },
    { x: 120, y: 620, rad: 100, n: 9 },
    { x: 520, y: 210, rad: 120, n: 12 },
    { x: 900, y: 420, rad: 90, n: 7 },
    { x: 380, y: 860, rad: 110, n: 9 },
  ];
  for (const c of clusters) {
    let placed = 0;
    let tries = 0;
    while (placed < c.n && tries++ < 200) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * c.rad;
      const x = c.x + Math.cos(a) * d;
      const y = c.y + Math.sin(a) * d;
      if (x < 30 || x > 970 || y < 30 || y > 970) continue;
      if (PATH_POINTS.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < 46 ** 2)) continue;
      if (((x - LAKE.x) / (LAKE.rx + 30)) ** 2 + ((y - LAKE.y) / (LAKE.ry + 30)) ** 2 < 1) continue;
      if (MARKERS.some((m) => (m.x - x) ** 2 + (m.y - y) ** 2 < 60 ** 2)) continue;
      out.push({ x, y, kind: r() < 0.3 ? "conifer" : "tree", s: 0.8 + r() * 0.5, v: Math.floor(r() * 3) });
      placed++;
    }
  }
  out.push({ x: 676, y: 372, kind: "sequoia", s: 1, v: 0 });
  out.push({ x: 300, y: 420, kind: "greenhouse", s: 1, v: 0 });
  out.push({ x: 600, y: 790, kind: "kiosk", s: 1, v: 0 });
  for (const [x, y] of [
    [168, 860],
    [300, 664],
    [430, 580],
    [560, 470],
    [700, 320],
    [470, 760],
    [620, 600],
    [820, 560],
  ])
    out.push({ x, y, kind: "lamp", s: 1, v: 0 });
  for (const [x, y] of [
    [330, 560],
    [600, 690],
  ])
    out.push({ x, y, kind: "bench", s: 1, v: 0 });
  for (let i = 0; i < 12; i++) out.push({ x: 120 + r() * 760, y: 160 + r() * 760, kind: "firefly", s: 1, v: i });
  // Ordre de dessin : du fond vers l'avant
  return out.sort((a, b) => a.y - b.y);
})();

function Ground() {
  return (
    <svg viewBox={`0 0 ${WORLD} ${WORLD}`} width={WORLD} height={WORLD} className="absolute inset-0" aria-hidden>
      <defs>
        <radialGradient id="dio-lamp">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dio-adv">
          <stop offset="0" stopColor="#f4b54a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f4b54a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={WORLD} height={WORLD} rx="60" className="dio-base" />
      <rect x="14" y="14" width={WORLD - 28} height={WORLD - 28} rx="52" className="dio-grass" />
      {[
        [460, 300, 150, 90],
        [260, 720, 140, 90],
        [800, 260, 110, 80],
        [140, 440, 90, 70],
      ].map(([x, y, rx, ry]) => (
        <ellipse key={`${x}`} cx={x} cy={y} rx={rx} ry={ry} className="dio-meadow" />
      ))}
      <path d="M820 700 C 880 780 860 860 940 990" className="dio-stream" />
      <ellipse cx={LAKE.x} cy={LAKE.y} rx={LAKE.rx + 10} ry={LAKE.ry + 8} className="dio-lake-rim" />
      <ellipse cx={LAKE.x} cy={LAKE.y} rx={LAKE.rx} ry={LAKE.ry} className="dio-lake" />
      <ellipse cx={LAKE.x - 30} cy={LAKE.y - 20} rx="50" ry="14" className="dio-lake-shine" />
      {[MAIN, BRANCH, LOOP].map((d) => (
        <path key={d} d={d} className="dio-path-edge" />
      ))}
      {[MAIN, BRANCH, LOOP].map((d) => (
        <path key={`${d}-in`} d={d} className="dio-path" />
      ))}
      <path d={ADVENTURE} className="dio-adventure" />
      <circle cx="220" cy="780" r="34" className="dio-plaza" />
      {/* lumières au sol (nuit) */}
      <g className="dio-night-only">
        {SPRITES.filter((s) => s.kind === "lamp").map((s) => (
          <circle key={`${s.x}-${s.y}`} cx={s.x} cy={s.y} r="70" fill="url(#dio-lamp)" />
        ))}
        <circle cx="640" cy="392" r="120" fill="url(#dio-adv)" />
      </g>
      <circle cx="640" cy="392" r="90" fill="url(#dio-adv)" className="dio-day-only" opacity="0.45" />
    </svg>
  );
}

function SpriteArt({ s }: { s: Sprite }) {
  switch (s.kind) {
    case "tree":
      return (
        <svg width={56 * s.s} height={76 * s.s} viewBox="0 0 56 76" aria-hidden>
          <rect x="24" y="44" width="8" height="30" rx="3" className="dio-trunk" />
          <circle cx="28" cy="30" r="24" className={`dio-tree-${s.v}`} />
          <circle cx="18" cy="38" r="14" className={`dio-tree-${(s.v + 1) % 3}`} />
          <circle cx="36" cy="20" r="10" className="dio-tree-light" />
        </svg>
      );
    case "conifer":
      return (
        <svg width={40 * s.s} height={84 * s.s} viewBox="0 0 40 84" aria-hidden>
          <rect x="17" y="64" width="6" height="18" className="dio-trunk" />
          <path d="M20 2 L 36 38 H 28 L 39 66 H 1 L 12 38 H 4 Z" className="dio-conifer" />
          <path d="M20 2 L 36 38 H 28 L 31 46 L 20 44 Z" className="dio-tree-light" />
        </svg>
      );
    case "sequoia":
      return (
        <svg width="84" height="190" viewBox="0 0 84 190" aria-hidden>
          <rect x="34" y="120" width="16" height="68" rx="4" className="dio-sequoia-trunk" />
          <path d="M42 0 L 62 46 H 52 L 72 92 H 60 L 80 136 H 4 L 24 92 H 12 L 32 46 H 22 Z" className="dio-conifer" />
          <path d="M42 0 L 62 46 H 52 L 72 92 H 60 L 66 106 L 42 100 Z" className="dio-tree-light" />
        </svg>
      );
    case "greenhouse":
      return (
        <svg width="150" height="100" viewBox="0 0 150 100" aria-hidden>
          <rect x="6" y="54" width="138" height="44" rx="6" className="dio-wall" />
          <path d="M30 56 C 30 10, 120 10, 120 56 Z" className="dio-glass" />
          <path d="M75 14 V 56 M52 22 V 56 M98 22 V 56" className="dio-frame" />
          {[20, 44, 68, 92, 116].map((x) => (
            <rect key={x} x={x} y="66" width="14" height="18" rx="3" className="dio-window" />
          ))}
        </svg>
      );
    case "kiosk":
      return (
        <svg width="80" height="74" viewBox="0 0 80 74" aria-hidden>
          <rect x="12" y="34" width="56" height="38" rx="4" className="dio-wall" />
          <path d="M4 36 L 40 6 L 76 36 Z" className="dio-roof" />
          <rect x="22" y="44" width="14" height="14" rx="2" className="dio-window" />
          <rect x="44" y="44" width="14" height="14" rx="2" className="dio-window" />
        </svg>
      );
    case "lamp":
      return (
        <svg width="22" height="58" viewBox="0 0 22 58" aria-hidden>
          <circle cx="11" cy="10" r="10" className="dio-lamp-halo" />
          <rect x="9.5" y="12" width="3" height="44" rx="1.5" className="dio-lamp-post" />
          <rect x="5" y="4" width="12" height="10" rx="4" className="dio-lamp-light" />
        </svg>
      );
    case "bench":
      return (
        <svg width="34" height="18" viewBox="0 0 34 18" aria-hidden>
          <rect x="0" y="2" width="34" height="4" rx="2" className="dio-bench" />
          <rect x="0" y="8" width="34" height="4" rx="2" className="dio-bench" />
          <rect x="3" y="12" width="3" height="6" className="dio-bench" />
          <rect x="28" y="12" width="3" height="6" className="dio-bench" />
        </svg>
      );
    case "firefly":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="dio-night-only" aria-hidden>
          <circle cx="8" cy="8" r="7" fill="#ffd98a" opacity="0.25" />
          <circle cx="8" cy="8" r="2.4" fill="#ffe7b0" className="lab-glow" style={{ animationDelay: `${s.v * 0.3}s` }} />
        </svg>
      );
  }
}

/** Élément debout : pied en (x, y), contre-incliné pour faire face à la caméra. */
function Standing({ x, y, children, scale = 1, z = 0 }: { x: number; y: number; children: ReactNode; scale?: number; z?: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: 0, height: 0, transformStyle: "preserve-3d", transform: `rotateX(${-TILT}deg)`, transformOrigin: "0 0", zIndex: z }}>
      <div className="absolute bottom-0 left-0" style={{ transform: `translateX(-50%) scale(${scale})`, transformOrigin: "50% 100%" }}>
        {children}
      </div>
    </div>
  );
}

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 360, h: 640 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export interface DioramaProps {
  theme: MapTheme;
  camera: Camera;
  size: { w: number; h: number };
  /** Position verticale de l'ancre caméra (0 = haut, 1 = bas) */
  anchorY?: number;
  markers?: DioMarker[];
  renderMarker?(m: DioMarker, counterScale: number): ReactNode;
  animated?: boolean;
}

/** Scène : à placer dans un conteneur `relative overflow-hidden` dont on fournit la taille. */
export function Diorama({ theme, camera, size, anchorY = 0.56, markers = [], renderMarker, animated }: DioramaProps) {
  const counter = 1 / Math.sqrt(camera.zoom);
  return (
    <div className={cn("lab-map-scene absolute inset-0 overflow-hidden", theme === "night" ? "dio-night" : "dio-day")} style={{ perspective: 1100, perspectiveOrigin: `50% ${anchorY * 60}%` }}>
      <div className="dio-sky absolute inset-0" />
      <div
        className="absolute left-0 top-0"
        style={{
          width: WORLD,
          height: WORLD,
          transformOrigin: "0 0",
          transformStyle: "preserve-3d",
          transform: `translate3d(${size.w / 2}px, ${size.h * anchorY}px, 0) scale(${camera.zoom}) rotateX(${TILT}deg) translate(${-camera.x}px, ${-camera.y}px)`,
          transition: animated ? "transform .6s cubic-bezier(.2,.8,.2,1)" : undefined,
        }}
      >
        <Ground />
        {SPRITES.map((s, i) => (
          <Standing key={i} x={s.x} y={s.y} z={Math.round(s.y)}>
            <SpriteArt s={s} />
          </Standing>
        ))}
        {markers.map((m) => (
          <Standing key={m.id} x={m.x} y={m.y} z={2000 + Math.round(m.y)} scale={counter}>
            {renderMarker?.(m, counter)}
          </Standing>
        ))}
      </div>
    </div>
  );
}
