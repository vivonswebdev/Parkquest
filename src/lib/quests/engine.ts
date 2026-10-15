/**
 * Moteur de quête — logique PURE, sans navigateur ni serveur, testée.
 *
 * Une quête est une suite d'étapes. Chaque étape se passe à un spot : on y arrive (GPS, QR code
 * ou confirmation manuelle — jamais de validation automatique simplement parce qu'on est proche),
 * puis on réalise l'activité (énigme, quiz, observation, indice audio, photo, récompense).
 * Les étapes facultatives peuvent être passées sans s'y rendre (accessibilité, parcours courts).
 * Aucune règle ne dépend de la vitesse ni du temps.
 */

export type DiscoveredVia = "gps" | "qr" | "manual";
export type ActivityKind = "riddle" | "quiz" | "observe" | "audioHint" | "photo" | "reward";

/** Identifiants d'étapes (clés de traduction explore.quests.<quête>.steps.<id>). */
export type QuestStepId = "s1" | "s2" | "s3" | "s4" | "s5" | "s6";

export interface QuestStepDef {
  id: QuestStepId;
  spotSlug: string;
  activity: ActivityKind;
  /** Étape facultative (ex. photo) : peut être passée, n'empêche jamais de terminer. */
  optional?: boolean;
}

/** Récompense de démonstration : aucun tirage, non échangeable, non vendable. */
export interface QuestReward {
  type: "special_demo_egg";
  source: string;
  status: "demo";
  tradable: false;
  sellable: false;
}

export interface QuestDef {
  slug: string;
  steps: readonly QuestStepDef[];
  reward: QuestReward;
}

export interface QuestState {
  /** Arrivées confirmées : étape → moyen de découverte. */
  arrived: Record<string, DiscoveredVia>;
  completed: string[];
  skipped: string[];
}

export const EMPTY_QUEST_STATE: QuestState = { arrived: {}, completed: [], skipped: [] };

export type StepPhase = "done" | "skipped" | "activity" | "arrive" | "locked";

export type QuestError = "UNKNOWN_STEP" | "NOT_CURRENT" | "NOT_ARRIVED" | "NOT_OPTIONAL" | "FINISHED";
export type QuestResult = { ok: true; state: QuestState } | { ok: false; error: QuestError };

const settled = (s: QuestState, id: string) => s.completed.includes(id) || s.skipped.includes(id);

/** Index de l'étape en cours (première non terminée ni passée), -1 si la quête est terminée. */
export function currentStepIndex(def: QuestDef, state: QuestState): number {
  return def.steps.findIndex((st) => !settled(state, st.id));
}

export function isQuestComplete(def: QuestDef, state: QuestState): boolean {
  return currentStepIndex(def, state) === -1;
}

export function stepPhase(def: QuestDef, state: QuestState, index: number): StepPhase {
  const step = def.steps[index];
  if (state.completed.includes(step.id)) return "done";
  if (state.skipped.includes(step.id)) return "skipped";
  if (index !== currentStepIndex(def, state)) return "locked";
  return state.arrived[step.id] ? "activity" : "arrive";
}

function guardCurrent(def: QuestDef, state: QuestState, stepId: string): QuestError | null {
  const i = def.steps.findIndex((s) => s.id === stepId);
  if (i < 0) return "UNKNOWN_STEP";
  const cur = currentStepIndex(def, state);
  if (cur === -1) return "FINISHED";
  if (cur !== i) return "NOT_CURRENT";
  return null;
}

/** Arrivée au spot de l'étape en cours (geste explicite de l'utilisateur). */
export function arrive(def: QuestDef, state: QuestState, stepId: string, via: DiscoveredVia): QuestResult {
  const err = guardCurrent(def, state, stepId);
  if (err) return { ok: false, error: err };
  if (state.arrived[stepId]) return { ok: true, state };
  return { ok: true, state: { ...state, arrived: { ...state.arrived, [stepId]: via } } };
}

/** Activité de l'étape en cours réalisée (il faut d'abord y être arrivé). */
export function completeStep(def: QuestDef, state: QuestState, stepId: string): QuestResult {
  const err = guardCurrent(def, state, stepId);
  if (err) return { ok: false, error: err };
  if (!state.arrived[stepId]) return { ok: false, error: "NOT_ARRIVED" };
  return { ok: true, state: { ...state, completed: [...state.completed, stepId] } };
}

/** Passer une étape facultative (sans avoir à s'y rendre). */
export function skipStep(def: QuestDef, state: QuestState, stepId: string): QuestResult {
  const err = guardCurrent(def, state, stepId);
  if (err) return { ok: false, error: err };
  if (!def.steps.find((s) => s.id === stepId)?.optional) return { ok: false, error: "NOT_OPTIONAL" };
  return { ok: true, state: { ...state, skipped: [...state.skipped, stepId] } };
}

export interface QuestProgress {
  /** Étapes terminées ou passées. */
  settled: number;
  total: number;
  percent: number;
  complete: boolean;
}

export function questProgress(def: QuestDef, state: QuestState): QuestProgress {
  const n = def.steps.filter((s) => settled(state, s.id)).length;
  return { settled: n, total: def.steps.length, percent: Math.round((n / def.steps.length) * 100), complete: n === def.steps.length };
}

/** Récompense obtenue : uniquement quand toutes les étapes obligatoires sont faites. */
export function earnedReward(def: QuestDef, state: QuestState): QuestReward | null {
  return isQuestComplete(def, state) ? def.reward : null;
}
