"use client";

import { useCallback, useSyncExternalStore } from "react";
import { applyAction, INITIAL_STATE, LAB_STORAGE_KEY, parseState, type LabAction, type LabState } from "./state";

const listeners = new Set<() => void>();
let cache: { raw: string | null; state: LabState } = { raw: null, state: INITIAL_STATE };

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(LAB_STORAGE_KEY);
  } catch {
    return memory;
  }
}

/** Repli en mémoire (navigation privée stricte) : l'état vit le temps de l'onglet. */
let memory: string | null = null;

function snapshot(): LabState {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, state: parseState(raw) };
  return cache.state;
}

function write(next: LabState | null) {
  const raw = next ? JSON.stringify(next) : null;
  memory = raw;
  try {
    if (raw) window.localStorage.setItem(LAB_STORAGE_KEY, raw);
    else window.localStorage.removeItem(LAB_STORAGE_KEY);
  } catch {
    // stockage indisponible : on garde le repli en mémoire
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === LAB_STORAGE_KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** État de démonstration (état initial au rendu serveur, puis celui du navigateur). */
export function useLabState() {
  const state = useSyncExternalStore(subscribe, snapshot, () => INITIAL_STATE);
  const update = useCallback((patch: Partial<LabState>) => write({ ...snapshot(), ...patch }), []);
  const act = useCallback((a: LabAction) => write(applyAction(snapshot(), a)), []);
  const replace = useCallback((s: LabState) => write(s), []);
  const reset = useCallback(() => write(null), []);
  return { state, update, act, replace, reset };
}

const noop = () => () => {};
/** Vrai après l'hydratation : permet d'initialiser un formulaire avec l'état local du navigateur. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
