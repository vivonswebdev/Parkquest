"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { EggArt } from "../art/egg";
import { BarkClue } from "../art/scenes";
import { eggById } from "../creatures";
import { BottomActions, LAB, LabTopBar, ProgressBar } from "../ui";
import { useLabState } from "../use-lab-state";

export function FirstDiscoveryScreen() {
  const { state, update } = useLabState();
  const [found, setFound] = useState(false);
  const result = useRef<HTMLHeadingElement>(null);
  const egg = eggById(state.egg);

  const observe = () => {
    setFound(true);
    update({ discoveries: Math.max(1, state.discoveries) });
    try {
      navigator.vibrate?.(25); // signal discret, si l'appareil le permet
    } catch {}
    requestAnimationFrame(() => result.current?.focus({ preventScroll: false }));
  };

  return (
    <main className="flex min-h-full flex-col">
      <LabTopBar back={`${LAB}/first-adventure`} title="Le Secret du Séquoia · étape 2 sur 4" />
      <div className="lab-fade-up space-y-5 px-5 pt-1">
        <div className="lab-card p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--lab-amber-deep)]">Indice 1</p>
          <p className="lab-serif mt-1 text-xl leading-snug font-bold">Cherche une écorce rousse et fibreuse, douce comme du feutre. Quelque chose s&apos;y cache.</p>
        </div>
        {/* Après la découverte, le visuel se replie pour laisser voir la récompense sans défiler */}
        <div className={`relative overflow-hidden rounded-[28px] transition-[height] duration-500 ${found ? "h-36" : "h-[34vh]"}`}>
          <BarkClue revealed={found} className="block size-full" />
          {!found && <p className="absolute inset-x-0 bottom-3 text-center text-sm font-semibold text-[#fff3cf]">Regarde attentivement…</p>}
        </div>
        {!found ? (
          <button type="button" onClick={observe} className="lab-btn lab-btn-amber w-full">
            <Eye className="size-5" aria-hidden /> Observer
          </button>
        ) : (
          <section aria-labelledby="lab-found" className="lab-fade-up space-y-3">
            <h1 id="lab-found" ref={result} tabIndex={-1} className="lab-serif text-[1.75rem] leading-tight font-bold text-[var(--lab-forest-deep)] outline-none">
              Tu as trouvé ton premier indice.
            </h1>
            <p className="text-[var(--lab-ink-soft)]">Une petite plume d&apos;oiseau, coincée dans l&apos;écorce. Elle rejoint ta collection.</p>
            <div className="flex items-center gap-3 rounded-[22px] bg-[var(--lab-paper)] p-3">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#f3ead2]">
                <svg viewBox="-20 -20 40 40" className="size-10" aria-hidden>
                  <g transform="rotate(30)">
                    <path d="M0 -16 C 8 -8, 8 6, 0 16 C -8 6, -8 -8, 0 -16 Z" fill="#e9dcc0" stroke="#b86f12" strokeWidth="1" />
                    <path d="M0 -14 V 18" stroke="#b86f12" strokeWidth="1.4" />
                  </g>
                </svg>
              </span>
              <span className="flex-1">
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--lab-ink-soft)]">Nouvelle trouvaille</span>
                <span className="block font-bold">Plume d&apos;écorce</span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-[22px] bg-[var(--lab-paper)] p-3">
              <EggArt egg={state.egg} state="reactive" nest={false} className="h-16 w-14 shrink-0" />
              <span className="flex-1 space-y-1.5">
                <span className="block font-bold">{egg.label}</span>
                <ProgressBar value={1} max={1} label={`${egg.label} : 1 découverte sur 1`} tone="amber" />
                <span className="block text-sm text-[var(--lab-ink-soft)]">1 découverte sur 1</span>
              </span>
            </div>
          </section>
        )}
      </div>
      <BottomActions>
        {found ? (
          <Link href={`${LAB}/hatch`} className="lab-btn lab-btn-primary">
            Voir mon œuf
          </Link>
        ) : (
          <p className="pb-2 text-center text-sm text-[var(--lab-ink-soft)]">Arrête-toi, observe, puis touche « Observer ».</p>
        )}
      </BottomActions>
    </main>
  );
}
