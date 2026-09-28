"use client";

import { useSyncExternalStore } from "react";
import { updateDemoProgress } from "./demo-progress";

/**
 * Photos de spots proposées en MODE DÉMO : conservées uniquement sur cet appareil
 * (localStorage), jamais envoyées. « En attente » jusqu'à la validation simulée
 * (panneau DÉMO → valider les photos), comme la modération réelle.
 */
export interface DemoSpotPhoto {
  id: string;
  spotId: string;
  dataUrl: string;
  width: number;
  height: number;
  alt?: string;
  status: "PENDING" | "APPROVED";
  createdAt: string;
}

const KEY = "parkquest.demo-spot-photos.v1";
/** Limite locale (quota du navigateur) : les plus anciennes sont retirées. */
const MAX_PHOTOS = 8;
const EMPTY: DemoSpotPhoto[] = [];
const listeners = new Set<() => void>();
let cache: DemoSpotPhoto[] | null = null;

function read(): DemoSpotPhoto[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as DemoSpotPhoto[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: DemoSpotPhoto[]) {
  let list = next;
  // Quota dépassé : on retire les plus anciennes jusqu'à ce que l'écriture passe.
  for (;;) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
      break;
    } catch {
      if (!list.length) break;
      list = list.slice(1);
    }
  }
  cache = list;
  listeners.forEach((l) => l());
}

export function addDemoSpotPhoto(p: Omit<DemoSpotPhoto, "id" | "status" | "createdAt">): void {
  const photo: DemoSpotPhoto = { ...p, id: crypto.randomUUID(), status: "PENDING", createdAt: new Date().toISOString() };
  write([...read(), photo].slice(-MAX_PHOTOS));
}

/** Validation simulée : +5 points par photo validée (comme en production). */
export function approveDemoSpotPhotos(): number {
  const list = read();
  const pending = list.filter((p) => p.status === "PENDING").length;
  if (!pending) return 0;
  write(list.map((p) => ({ ...p, status: "APPROVED" as const })));
  updateDemoProgress((q) => ({ ...q, photosApproved: q.photosApproved + pending, points: q.points + 5 * pending }));
  return pending;
}

export function clearDemoSpotPhotos(): void {
  write([]);
}

export function useDemoSpotPhotos(spotId: string): DemoSpotPhoto[] {
  const all = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
  return all.filter((p) => p.spotId === spotId);
}
