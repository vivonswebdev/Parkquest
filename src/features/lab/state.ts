/*
 * État de démonstration du laboratoire : uniquement dans ce navigateur (localStorage « pq-lab:state »).
 * Aucun compte, aucun appel réseau, aucune position. Réinitialisable à tout moment.
 * Le compagnon évolue seulement avec des actions d'exploration (jamais avec une connexion quotidienne).
 */
import { CREATURES, eggById, type CreatureId, type EggId, type StageId } from "./creatures";

export type ExplorerStyle = "nature" | "secrets" | "family" | "calm";
export type LocationChoice = "nearby-demo" | "manual";

export interface LabState {
  name: string;
  style: ExplorerStyle | null;
  egg: EggId;
  location: LocationChoice | null;
  /** Découvertes (indices observés) */
  discoveries: number;
  /** Étapes d'aventure terminées ; toutes les 4 étapes, une aventure se termine dans un nouveau parc fictif */
  steps: number;
  adventures: number;
  parks: number;
  /** Une aventure a été vécue au crépuscule */
  dusk: boolean;
  hatched: boolean;
}

export const LAB_STORAGE_KEY = "pq-lab:state";
export const DEFAULT_NAME = "Explorateur";
export const STEPS_PER_ADVENTURE = 4;

export const INITIAL_STATE: LabState = {
  name: DEFAULT_NAME,
  style: null,
  egg: "forest",
  location: null,
  discoveries: 0,
  steps: 0,
  adventures: 0,
  parks: 0,
  dusk: false,
  hatched: false,
};

export const STYLES: { id: ExplorerStyle; label: string; hint: string }[] = [
  { id: "nature", label: "Curieux de nature", hint: "Plantes, oiseaux, petites bêtes" },
  { id: "secrets", label: "Chercheur de secrets", hint: "Indices, énigmes, histoires cachées" },
  { id: "family", label: "Aventurier en famille", hint: "À plusieurs, à hauteur d'enfant" },
  { id: "calm", label: "Promeneur tranquille", hint: "Sans se presser, en flânant" },
];

export function sanitizeName(raw: string): string {
  return raw.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
}

const clampCount = (n: unknown) => Math.max(0, Math.min(99, Math.floor(Number(n) || 0)));

export function parseState(raw: string | null): LabState {
  if (!raw) return INITIAL_STATE;
  try {
    const p = JSON.parse(raw) as Partial<LabState>;
    return {
      name: (typeof p.name === "string" && sanitizeName(p.name)) || DEFAULT_NAME,
      style: (["nature", "secrets", "family", "calm"] as const).find((s) => s === p.style) ?? null,
      egg: (["forest", "river", "dusk"] as const).find((e) => e === p.egg) ?? "forest",
      location: (["nearby-demo", "manual"] as const).find((l) => l === p.location) ?? null,
      discoveries: clampCount(p.discoveries),
      steps: clampCount(p.steps),
      adventures: clampCount(p.adventures),
      parks: clampCount(p.parks),
      dusk: p.dusk === true,
      hatched: p.hatched === true,
    };
  } catch {
    return INITIAL_STATE;
  }
}

/** Compagnon issu de l'œuf choisi */
export const companionOf = (s: Pick<LabState, "egg">) => eggById(s.egg).hatches as "mossy" | "perline" | "lumo";

/** Stade d'évolution : conditions transparentes, dans l'ordre. */
export function stageOf(s: LabState): StageId {
  if (!s.hatched) return "egg";
  if (s.adventures < 2) return "young";
  if (s.parks < 4) return "explorer";
  if (!s.dusk) return "guardian";
  return "lunar";
}

/** Prochaine évolution : libellé et progression chiffrée (null au dernier stade). */
export function nextEvolution(s: LabState): { label: string; current: number; target: number; unit: string } | null {
  switch (stageOf(s)) {
    case "egg":
      return s.discoveries < 1
        ? { label: "Trouver une première découverte", current: 0, target: 1, unit: "découverte" }
        : { label: "Faire éclore l'œuf", current: 1, target: 1, unit: "découverte" };
    case "young":
      return { label: "Terminer 2 aventures", current: s.adventures, target: 2, unit: "aventure" };
    case "explorer":
      return { label: "Découvrir 4 parcs", current: s.parks, target: 4, unit: "parc" };
    case "guardian":
      return { label: "Vivre 1 aventure au crépuscule", current: 0, target: 1, unit: "aventure au crépuscule" };
    default:
      return null;
  }
}

/** Gardiens découverts : chacun a une condition écrite, aucun hasard. */
export function collected(s: LabState): Set<CreatureId> {
  const set = new Set<CreatureId>();
  if (s.hatched) set.add(companionOf(s));
  if (s.steps >= 3) set.add("fougerin");
  if (s.parks >= 2) set.add("galene");
  if (s.discoveries >= 3) set.add("perline");
  if (s.dusk) set.add("lumo");
  if (s.adventures >= 2) set.add("ecorcelle");
  if (s.adventures >= 4 && s.parks >= 4) set.add("selenis");
  return set;
}

export const TOTAL_CREATURES = CREATURES.length;

export type LabAction = "discovery" | "step" | "dusk";

/** Actions de démonstration (boutons du compagnon). */
export function applyAction(s: LabState, action: LabAction): LabState {
  switch (action) {
    case "discovery":
      return { ...s, discoveries: s.discoveries + 1 };
    case "step": {
      const steps = s.steps + 1;
      const done = steps % STEPS_PER_ADVENTURE === 0;
      return { ...s, steps, adventures: s.adventures + (done ? 1 : 0), parks: s.parks + (done ? 1 : 0) };
    }
    case "dusk":
      return { ...s, dusk: true, adventures: s.adventures + 1, steps: s.steps + (STEPS_PER_ADVENTURE - (s.steps % STEPS_PER_ADVENTURE)) };
  }
}

/** Profil de démonstration complet (« J'ai déjà un compte » → aucune vraie connexion). */
export const RETURNING_DEMO: LabState = {
  ...INITIAL_STATE,
  name: "Lina",
  style: "family",
  egg: "forest",
  location: "manual",
  discoveries: 4,
  steps: 5,
  adventures: 1,
  parks: 2,
  hatched: true,
};
