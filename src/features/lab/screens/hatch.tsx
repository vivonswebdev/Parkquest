"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EggArt } from "../art/egg";
import { GuardianFigure } from "../art/guardians";
import { eggById, LINEAGE } from "../creatures";
import { companionOf } from "../state";
import { BottomActions, DemoNote, LAB, LabTopBar, ProgressBar } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";

/*
 * Éclosion en cinq états : endormi → réactif → prêt → éclosion → révélation.
 * Condition écrite (1 découverte), aucun hasard. Animation courte, interruptible (« Passer l'animation »),
 * remplacée par un fondu si prefers-reduced-motion.
 */

type Phase = "dormant" | "reactive" | "ready" | "hatching" | "reveal";

const TEXT: Record<Phase, string> = {
  dormant: "Un secret sommeille ici.",
  reactive: "L'œuf réagit à tes découvertes.",
  ready: "Ton œuf est prêt à éclore.",
  hatching: "La coquille s'ouvre doucement…",
  reveal: "Un jeune gardien est né de tes découvertes.",
};

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function HatchScreen({ replay }: { replay: boolean }) {
  const hydrated = useHydrated();
  return hydrated ? <Hatch replay={replay} /> : <main className="min-h-full" />;
}

function Hatch({ replay }: { replay: boolean }) {
  const { state, update } = useLabState();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(() => (state.hatched && !replay ? "reveal" : "dormant"));
  const [eggOpen, setEggOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const egg = eggById(state.egg);
  const companion = companionOf(state);
  const name = LINEAGE[companion].young;
  const hasDiscovery = state.discoveries >= 1;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, reducedMotion() ? 0 : ms));

  const wake = () => {
    if (!hasDiscovery) update({ discoveries: 1 });
    setPhase("reactive");
    later(1800, () => setPhase((p) => (p === "reactive" ? "ready" : p)));
  };

  const finish = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    update({ hatched: true, discoveries: Math.max(1, state.discoveries) });
    setPhase("reveal");
  };

  const open = () => {
    setPhase("hatching");
    later(1700, () => setEggOpen(true));
    later(2800, finish);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setEggOpen(false);
    setPhase("dormant");
    router.replace(`${LAB}/hatch?replay=1`, { scroll: false });
  };

  const night = phase === "hatching" || phase === "reveal";

  return (
    <main
      className={cn(
        "flex min-h-full flex-col transition-[background] duration-700",
        night ? "bg-[radial-gradient(circle_at_50%_38%,#fff1cc_0%,#f6e3b8_35%,#f8f2e4_75%)]" : "bg-[radial-gradient(circle_at_50%_38%,#f3ecd6_0%,#f8f2e4_70%)]",
      )}
    >
      <LabTopBar back={`${LAB}/first-discovery`} title={egg.label} />
      <div className="flex flex-1 flex-col items-center px-5">
        <ol className="mt-1 flex gap-1.5" aria-label="Étapes de l'éclosion">
          {(["dormant", "reactive", "ready", "hatching", "reveal"] as Phase[]).map((p, i, all) => (
            <li
              key={p}
              aria-current={p === phase ? "step" : undefined}
              className={cn("h-1.5 w-8 rounded-full", all.indexOf(phase) >= i ? "bg-[var(--lab-amber)]" : "bg-[rgba(31,90,61,0.15)]")}
            >
              <span className="sr-only">{TEXT[p]}</span>
            </li>
          ))}
        </ol>

        <div className="relative mt-2 grid h-[min(34vh,18rem)] w-full place-items-center">
          {phase !== "reveal" ? (
            <EggArt egg={state.egg} state={eggOpen ? "open" : phase === "hatching" ? "hatching" : phase === "ready" ? "ready" : phase === "reactive" ? "reactive" : "dormant"} className="h-full w-auto" title={`${egg.label} : ${TEXT[phase]}`} />
          ) : (
            <div className="lab-reveal grid size-full place-items-center">
              <GuardianFigure id={companion} stage="young" className="h-full w-auto" title={name} />
            </div>
          )}
        </div>

        <div className="w-full max-w-md text-center" aria-live="polite">
          <h1 className="lab-serif text-[1.85rem] leading-tight font-bold text-[var(--lab-forest-deep)]">{phase === "reveal" ? name : TEXT[phase]}</h1>
          {phase === "reveal" && <p className="mt-2 text-[var(--lab-ink-soft)]">{TEXT.reveal}</p>}
        </div>

        {phase !== "reveal" && (
          <div className="mt-5 w-full max-w-md space-y-2 rounded-[22px] bg-[rgba(255,250,240,0.85)] p-4">
            <p className="text-sm font-semibold">Condition d&apos;éclosion : 1 découverte</p>
            <ProgressBar value={hasDiscovery || phase !== "dormant" ? 1 : 0} max={1} label="Énergie de l'œuf" tone="amber" />
            <p className="text-sm text-[var(--lab-ink-soft)]">{hasDiscovery || phase !== "dormant" ? "1 découverte sur 1 — l'œuf a assez d'énergie." : "0 découverte sur 1"}</p>
          </div>
        )}
      </div>

      <BottomActions>
        {phase === "dormant" &&
          (hasDiscovery ? (
            <button type="button" className="lab-btn lab-btn-primary" onClick={wake}>
              Lui confier ma découverte
            </button>
          ) : (
            <>
              <Link href={`${LAB}/first-discovery`} className="lab-btn lab-btn-primary">
                Faire ma première découverte
              </Link>
              <button type="button" className="lab-btn lab-btn-ghost" onClick={wake}>
                Simuler une découverte (démo)
              </button>
            </>
          ))}
        {phase === "reactive" && (
          <button type="button" className="lab-btn lab-btn-ghost" onClick={() => setPhase("ready")}>
            Continuer
          </button>
        )}
        {phase === "ready" && (
          <>
            <button type="button" className="lab-btn lab-btn-amber" onClick={open}>
              Ouvrir l&apos;œuf
            </button>
            <p className="text-center text-xs text-[var(--lab-ink-soft)]">Installe-toi à l&apos;arrêt pour ce moment.</p>
          </>
        )}
        {phase === "hatching" && (
          <button type="button" className="lab-btn lab-btn-ghost" onClick={finish}>
            Passer l&apos;animation
          </button>
        )}
        {phase === "reveal" && (
          <>
            <Link href={`${LAB}/companion`} className="lab-btn lab-btn-primary">
              Rencontrer mon gardien
            </Link>
            <button type="button" className="lab-btn text-[var(--lab-forest)]" onClick={restart}>
              Rejouer l&apos;éclosion
            </button>
          </>
        )}
        <DemoNote>Démonstration locale : l&apos;éclosion dépend d&apos;une condition écrite, jamais du hasard ni d&apos;un achat.</DemoNote>
      </BottomActions>
    </main>
  );
}
