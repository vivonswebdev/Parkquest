"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FamilyId } from "./creatures";

/*
 * Visuels des sept familles (prototype uniquement).
 * Chaque image contient le personnage ET son socle (avec son ombre). Pour animer sans faire bouger
 * le socle, on découpe l'image en deux calques le long d'une ligne `cut` (coordonnées 0–1, de gauche
 * à droite) : au-dessus = personnage (animé), en dessous = socle (fixe). La ligne contourne les plantes
 * du socle et passe juste au-dessus du dessus du socle (mesuré sur l'image) : le bas des pieds reste fixe,
 * sans couture, car tous les mouvements sont ancrés sur cette ligne. `foot` = ligne d'ancrage.
 * Originaux : design-assets/lab-creatures/originals ; copies mobiles : public/lab/creatures.
 */

export type VariantKey = "a" | "b";

export interface CreatureAsset {
  key: string;
  /** Copie détourée (WebP avec transparence, 720 px de large) */
  src: string;
  /** Copie sur son fond d'origine (WebP, 720 px) */
  framed: string;
  /** Ligne de séparation personnage / socle, de gauche à droite */
  cut: [number, number][];
  foot: number;
  /** Centre horizontal du personnage (ancrage des mouvements) */
  cx: number;
  /** Le personnage ne touche pas son socle : il peut flotter (Air) */
  floats?: boolean;
  /** Lumières douces (Lunaire, Solaire) : position, rayon, couleur */
  glows?: { x: number; y: number; r: number; color: string }[];
  /** Cadrages carrés des détails de la fiche : coin x (fraction de la largeur), coin y (fraction de la hauteur), côté (fraction de la largeur) */
  details: { label: string; x: number; y: number; size: number }[];
}

const notch = (top: number, left: number, right: number, foot: number): [number, number][] => [
  [0, top],
  [left, top],
  [left, foot],
  [right, foot],
  [right, top],
  [1, top],
];

const P = "/lab/creatures/";

export const ASSETS: Record<string, CreatureAsset> = {
  "leaf-a": {
    key: "leaf-a",
    src: `${P}leaf-a.webp`,
    framed: `${P}leaf-a-framed.webp`,
    cut: notch(0.65, 0.35, 0.66, 0.76),
    foot: 0.76,
    cx: 0.5,
    details: [
      { label: "Visage", x: 0.3, y: 0.08, size: 0.42 },
      { label: "Collerette de feuilles", x: 0.18, y: 0.28, size: 0.6 },
      { label: "Socle en rondin", x: 0.2, y: 0.52, size: 0.58 },
    ],
  },
  "leaf-b": {
    key: "leaf-b",
    src: `${P}leaf-b.webp`,
    framed: `${P}leaf-b-framed.webp`,
    cut: notch(0.7, 0.36, 0.68, 0.74),
    foot: 0.74,
    cx: 0.52,
    details: [
      { label: "Visage", x: 0.32, y: 0.12, size: 0.42 },
      { label: "Feuillage", x: 0.12, y: 0.22, size: 0.62 },
      { label: "Socle en rondin", x: 0.2, y: 0.52, size: 0.58 },
    ],
  },
  "water-a": {
    key: "water-a",
    src: `${P}water-a.webp`,
    framed: `${P}water-a-framed.webp`,
    cut: [
      [0, 0.765],
      [1, 0.765],
    ],
    foot: 0.765,
    cx: 0.5,
    details: [
      { label: "Visage", x: 0.3, y: 0.24, size: 0.42 },
      { label: "Bulles", x: 0.2, y: 0.24, size: 0.62 },
      { label: "Galet et ondes", x: 0.18, y: 0.5, size: 0.62 },
    ],
  },
  "water-b": {
    key: "water-b",
    src: `${P}water-b.webp`,
    framed: `${P}water-b-framed.webp`,
    cut: [
      [0, 0.735],
      [1, 0.735],
    ],
    foot: 0.735,
    cx: 0.54,
    details: [
      { label: "Visage", x: 0.36, y: 0.3, size: 0.42 },
      { label: "Feuilles d'eau", x: 0.26, y: 0.02, size: 0.5 },
      { label: "Galet moussu", x: 0.18, y: 0.48, size: 0.62 },
    ],
  },
  flower: {
    key: "flower",
    src: `${P}flower.webp`,
    framed: `${P}flower-framed.webp`,
    cut: notch(0.68, 0.33, 0.67, 0.765),
    foot: 0.765,
    cx: 0.5,
    details: [
      { label: "Visage", x: 0.34, y: 0.1, size: 0.42 },
      { label: "Pétales", x: 0.12, y: 0.06, size: 0.66 },
      { label: "Terre et pétales tombés", x: 0.2, y: 0.54, size: 0.56 },
    ],
  },
  air: {
    key: "air",
    src: `${P}air.webp`,
    framed: `${P}air-framed.webp`,
    // Herbes de gauche entièrement dans le socle ; la vrille la plus basse touche presque la pierre
    cut: [
      [0, 0.68],
      [0.38, 0.68],
      [0.38, 0.792],
      [0.62, 0.792],
      [0.62, 0.72],
      [1, 0.72],
    ],
    foot: 0.792,
    cx: 0.52,
    floats: true,
    details: [
      { label: "Visage", x: 0.36, y: 0.38, size: 0.4 },
      { label: "Plumes", x: 0.28, y: 0.0, size: 0.52 },
      { label: "Spirale de vent", x: 0.0, y: 0.28, size: 0.52 },
    ],
  },
  forest: {
    key: "forest",
    src: `${P}forest.webp`,
    framed: `${P}forest-framed.webp`,
    cut: notch(0.705, 0.2, 0.8, 0.73),
    foot: 0.73,
    cx: 0.5,
    glows: [{ x: 0.78, y: 0.45, r: 0.12, color: "255,200,110" }],
    details: [
      { label: "Visage", x: 0.3, y: 0.32, size: 0.4 },
      { label: "Chapeau moussu", x: 0.1, y: 0.06, size: 0.66 },
      { label: "Champignons lumineux", x: 0.6, y: 0.32, size: 0.34 },
    ],
  },
  lunar: {
    key: "lunar",
    src: `${P}lunar.webp`,
    framed: `${P}lunar-framed.webp`,
    cut: notch(0.655, 0.38, 0.6, 0.745),
    foot: 0.745,
    cx: 0.52,
    glows: [
      { x: 0.31, y: 0.24, r: 0.09, color: "255,226,160" },
      { x: 0.46, y: 0.42, r: 0.06, color: "255,226,160" },
      { x: 0.73, y: 0.4, r: 0.06, color: "255,226,160" },
      { x: 0.8, y: 0.33, r: 0.05, color: "255,226,160" },
    ],
    details: [
      { label: "Visage", x: 0.38, y: 0.16, size: 0.4 },
      { label: "Cape étoilée", x: 0.2, y: 0.08, size: 0.62 },
      { label: "Orbes de lumière", x: 0.18, y: 0.14, size: 0.36 },
    ],
  },
  solar: {
    key: "solar",
    src: `${P}solar.webp`,
    framed: `${P}solar-framed.webp`,
    cut: notch(0.69, 0.4, 0.66, 0.765),
    foot: 0.765,
    cx: 0.52,
    glows: [
      { x: 0.58, y: 0.6, r: 0.13, color: "255,200,90" },
      { x: 0.22, y: 0.28, r: 0.05, color: "255,214,120" },
      { x: 0.88, y: 0.47, r: 0.04, color: "255,214,120" },
    ],
    details: [
      { label: "Visage", x: 0.34, y: 0.22, size: 0.42 },
      { label: "Cœur lumineux", x: 0.42, y: 0.46, size: 0.32 },
      { label: "Pétales de lumière", x: 0.04, y: 0.04, size: 0.62 },
    ],
  },
};

/** Variantes disponibles (comparatif A/B) ; les autres familles n'ont qu'une image. */
export const VARIANTS: Partial<Record<FamilyId, Record<VariantKey, string>>> = {
  leaf: { a: "leaf-a", b: "leaf-b" },
  water: { a: "water-a", b: "water-b" },
};

const SINGLE: Record<Exclude<FamilyId, "leaf" | "water">, string> = {
  flower: "flower",
  air: "air",
  forest: "forest",
  lunar: "lunar",
  solar: "solar",
};

/* Choix provisoire des variantes : uniquement dans ce navigateur, réversible. */
const KEY = "pq-lab:variants";
type Choice = Partial<Record<"leaf" | "water", VariantKey>>;
const listeners = new Set<() => void>();
let cache: { raw: string | null; v: Choice } = { raw: null, v: {} };
function read(): Choice {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cache.raw) {
    let v: Choice = {};
    try {
      const p = raw ? (JSON.parse(raw) as Choice) : {};
      v = { leaf: p.leaf === "b" ? "b" : "a", water: p.water === "b" ? "b" : "a" };
    } catch {
      v = {};
    }
    cache = { raw, v };
  }
  return cache.v;
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useVariants() {
  const choice = useSyncExternalStore(subscribe, read, () => cache.v);
  const set = useCallback((family: "leaf" | "water", v: VariantKey) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...read(), [family]: v }));
    } catch {
      // stockage indisponible : le choix n'est pas gardé
    }
    listeners.forEach((l) => l());
  }, []);
  return { choice, set };
}

/** Image utilisée pour une famille, selon la variante choisie (A par défaut, provisoirement). */
export function assetFor(id: FamilyId, choice: Choice = {}): CreatureAsset {
  if (id === "leaf" || id === "water") return ASSETS[VARIANTS[id]![choice[id] ?? "a"]];
  return ASSETS[SINGLE[id]];
}

export function useCreatureAsset(id: FamilyId) {
  const { choice } = useVariants();
  return assetFor(id, choice);
}
