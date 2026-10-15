"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isHatched, isOpening, type HatchPhase } from "../art/hatch-scene";
import { HatchStage } from "../art/hatch-stage";
import { eggById, FAMILY_LABEL, LINEAGE, type EggId } from "../creatures";
import { companionOf } from "../state";
import { BottomActions, DemoNote, LAB, LabTopBar, ProgressBar } from "../ui";
import { useHatch } from "../use-hatch";
import { useHydrated, useLabState } from "../use-lab-state";

/*
 * Éclosion : endormi → réactif → prêt → séquence (balancement, secousses, fissures, lumière,
 * coquille en morceaux, apparition, clignement, regard, joie) → nom + bouton.
 * Condition écrite (1 découverte), aucun hasard. Interruptible ; version simplifiée si animations réduites.
 */

const STEPS: { label: string; done(p: HatchPhase): boolean }[] = [
  { label: "Endormi", done: () => true },
  { label: "Réactif", done: (p) => p !== "dormant" },
  { label: "Prêt", done: (p) => p !== "dormant" && p !== "reactive" },
  { label: "Éclosion", done: (p) => isOpening(p) || p === "done" },
  { label: "Révélation", done: (p) => p === "done" },
];

function headline(p: HatchPhase, name: string) {
  if (p === "dormant") return "Un secret sommeille ici.";
  if (p === "reactive") return "L'œuf réagit à tes découvertes.";
  if (p === "ready") return "Ton œuf est prêt à éclore.";
  if (p === "done") return name;
  if (isHatched(p)) return "Bonjour, petit gardien…";
  return "La coquille s'ouvre doucement…";
}

export function HatchScreen({ replay, egg }: { replay: boolean; egg?: EggId }) {
  const hydrated = useHydrated();
  return hydrated ? <Hatch replay={replay} eggParam={egg} /> : <main className="min-h-full" />;
}

function Hatch({ replay, eggParam }: { replay: boolean; eggParam?: EggId }) {
  const { state, update } = useLabState();
  // Lien direct vers l'éclosion d'un œuf précis (démonstration) : l'œuf choisi devient celui de l'état local
  useEffect(() => {
    if (eggParam && eggParam !== state.egg) update({ egg: eggParam, hatched: false });
  }, [eggParam, state.egg, update]);
  const router = useRouter();
  const { phase, setPhase, reduced, open, skip, reset } = useHatch(state.hatched && !replay ? "done" : "dormant");
  const [hop, setHop] = useState(0);
  const [squish, setSquish] = useState(0);
  const egg = eggById(state.egg);
  const companion = companionOf(state);
  const name = LINEAGE[companion].young;
  const hasDiscovery = state.discoveries >= 1;
  const opening = isOpening(phase);
  const done = phase === "done";

  // L'œuf réagit un instant à la découverte, puis se déclare prêt
  useEffect(() => {
    if (phase !== "reactive") return;
    const t = setTimeout(() => setPhase((p) => (p === "reactive" ? "ready" : p)), 1800);
    return () => clearTimeout(t);
  }, [phase, setPhase]);

  const markHatched = () => update({ hatched: true, discoveries: Math.max(1, state.discoveries) });

  const wake = () => {
    if (!hasDiscovery) update({ discoveries: 1 });
    setPhase("reactive");
  };

  // Rejouer : toute la séquence d'ouverture, directement depuis l'œuf prêt
  const restart = () => {
    reset("ready");
    router.replace(`${LAB}/hatch?replay=1`, { scroll: false });
    setTimeout(() => open(markHatched), 700);
  };

  return (
    <main
      className={cn(
        "flex min-h-full flex-col transition-[background] duration-700",
        opening || done ? "bg-[radial-gradient(circle_at_50%_38%,#fff1cc_0%,#f6e3b8_35%,#f8f2e4_75%)]" : "bg-[radial-gradient(circle_at_50%_38%,#f3ecd6_0%,#f8f2e4_70%)]",
      )}
    >
      <LabTopBar back={`${LAB}/first-discovery`} title={egg.label} />
      <div className="flex flex-1 flex-col items-center px-5">
        <ol className="mt-1 flex gap-1.5" aria-label="Étapes de l'éclosion">
          {STEPS.map((s) => (
            <li key={s.label} className={cn("h-1.5 w-8 rounded-full transition-colors", s.done(phase) ? "bg-[var(--lab-amber)]" : "bg-[rgba(31,90,61,0.15)]")}>
              <span className="sr-only">
                {s.label}
                {s.done(phase) ? " (atteint)" : ""}
              </span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          disabled={!done}
          onClick={() => {
            setSquish((n) => n + 1);
            setHop((n) => n + 1);
          }}
          aria-label={done ? `Saluer ${name}` : undefined}
          className="relative mt-1 grid h-[min(40vh,21rem)] w-full place-items-center rounded-[28px] disabled:cursor-default"
        >
          <HatchStage egg={state.egg} creature={companion} phase={phase} reduced={reduced} joy={hop} touch={squish} className="h-full" title={`${egg.label} — ${headline(phase, name)}`} />
        </button>

        <div className="min-h-[5.5rem] w-full max-w-md text-center" aria-live="polite">
          <h1 key={done ? "done" : "x"} className={cn("lab-serif text-[1.85rem] leading-tight font-bold text-[var(--lab-forest-deep)]", done && "lab-fade-up")}>
            {headline(phase, name)}
          </h1>
          {done && (
            <p className="lab-fade-up mt-1 text-[var(--lab-ink-soft)]">
              Famille {FAMILY_LABEL[companion]} · né de tes découvertes. Touche-le pour le saluer.
            </p>
          )}
        </div>

        {(phase === "dormant" || phase === "reactive" || phase === "ready") && (
          <div className="mt-2 w-full max-w-md space-y-2 rounded-[22px] bg-[rgba(255,250,240,0.85)] p-4">
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
          <button type="button" className="lab-btn lab-btn-primary" onClick={() => setPhase("ready")}>
            Continuer
          </button>
        )}
        {phase === "ready" && (
          <>
            <button type="button" className="lab-btn lab-btn-amber" onClick={() => open(markHatched)}>
              Ouvrir l&apos;œuf
            </button>
            <p className="text-center text-xs text-[var(--lab-ink-soft)]">Installe-toi à l&apos;arrêt pour ce moment.</p>
          </>
        )}
        {opening && (
          <button
            type="button"
            className="lab-btn lab-btn-ghost"
            onClick={() => {
              skip();
              markHatched();
            }}
          >
            Passer l&apos;animation
          </button>
        )}
        {done && (
          <>
            <Link href={`${LAB}/companion`} className="lab-btn lab-btn-primary lab-fade-up">
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
