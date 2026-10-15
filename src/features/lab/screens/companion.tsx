"use client";

import { Footprints, GitBranch, Moon, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { EggArt } from "../art/egg";
import { CreatureImage } from "../art/creature-image";
import { creatureById, eggById, LINEAGE, STAGE_LABEL } from "../creatures";
import { applyAction, collected, companionOf, nextEvolution, stageOf, STEPS_PER_ADVENTURE, type LabAction } from "../state";
import { DemoNote, LAB, LabNav, LabTopBar, ProgressBar, useToast } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";

const MURMURS = ["On continue un peu ?", "J'aime quand on prend le temps.", "Écoute… un oiseau !", "Regarde autour de toi !"];

export function CompanionScreen() {
  const hydrated = useHydrated();
  return hydrated ? <Companion /> : <main className="min-h-full" />;
}

function Companion() {
  const { state, act, reset } = useLabState();
  const [toast, say] = useToast();
  const [poke, setPoke] = useState(0);
  const lastStage = useRef(stageOf(state));
  const stage = stageOf(state);
  const companion = companionOf(state);
  const creature = creatureById(companion)!;
  const next = nextEvolution(state);
  const title = stage === "egg" ? eggById(state.egg).label : LINEAGE[companion][stage];

  const run = (a: LabAction, msg: string) => {
    const after = applyAction(state, a);
    act(a);
    // Retour immédiat : nouvelle forme, nouveau gardien, sinon simple confirmation
    const st = stageOf(after);
    if (st !== lastStage.current && st !== "egg") say(`${creature.name} évolue : ${STAGE_LABEL[st].toLowerCase()} !`);
    else if (collected(after).size > collected(state).size) say("Un nouveau gardien rejoint ta collection.");
    else say(msg);
    lastStage.current = st;
  };

  const actions: { a: LabAction; label: string; Icon: typeof Search; msg: string }[] = [
    { a: "discovery", label: "Ajouter une découverte", Icon: Search, msg: "+1 découverte" },
    { a: "step", label: "Terminer une étape", Icon: Footprints, msg: `+1 étape (aventure terminée toutes les ${STEPS_PER_ADVENTURE} étapes)` },
    { a: "dusk", label: "Explorer au crépuscule", Icon: Moon, msg: "Une aventure au crépuscule, en douceur." },
  ];

  return (
    <main className="flex min-h-full flex-col pb-28">
      {toast}
      <LabTopBar back={`${LAB}/home`} title="Mon compagnon" />
      <div className="px-5">
        <div
          className="lab-card relative overflow-hidden px-4 pb-5 pt-4 text-center"
        >
          {stage === "egg" ? (
            <EggArt egg={state.egg} state="dormant" className="mx-auto h-64 w-auto" title={title} />
          ) : (
            <button type="button" onClick={() => setPoke((n) => n + 1)} aria-label={`Saluer ${creature.name}`} className="relative mx-auto block rounded-full">
              {/* Image fournie : respiration discrète, petite réaction au toucher et rebond de joie (socle fixe) */}
              <span key={stage} className="lab-reveal block">
                <CreatureImage id={companion} idle joy={poke} touch={poke} className="mx-auto h-72" alt={title} priority />
              </span>
              {poke > 0 && (
                <span key={poke} role="status" className="lab-fade-up absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--lab-ink)] shadow">
                  {MURMURS[poke % MURMURS.length]}
                </span>
              )}
            </button>
          )}
          <h1 className="lab-serif mt-2 text-[1.75rem] leading-tight font-bold">{title}</h1>
          <p className="mt-1 text-sm font-bold text-[var(--lab-moss)]">{STAGE_LABEL[stage]}</p>
          <p className="mt-3 italic text-[var(--lab-ink-soft)]">« {creature.lore} »</p>
          {stage !== "egg" && stage !== "young" && (
            <p className="mx-auto mt-3 max-w-xs rounded-2xl border-2 border-dashed border-[rgba(31,90,61,0.25)] px-3 py-2 text-xs text-[var(--lab-ink-soft)]">
              Visuel de la forme « {STAGE_LABEL[stage]} » à créer : l&apos;image affichée reste celle du jeune gardien.
            </p>
          )}
        </div>

        <section aria-labelledby="lab-next" className="mt-4 rounded-[22px] bg-[var(--lab-paper)] p-4">
          <h2 id="lab-next" className="text-sm font-bold uppercase tracking-wider text-[var(--lab-ink-soft)]">
            Prochaine évolution
          </h2>
          {next ? (
            <>
              <p className="mt-1 text-lg font-extrabold">{next.label}</p>
              <div className="mt-2">
                <ProgressBar value={next.current} max={next.target} label={`${next.label} : ${next.current} sur ${next.target}`} />
              </div>
              <p className="mt-1.5 text-sm text-[var(--lab-ink-soft)]">
                {Math.min(next.current, next.target)} {next.unit}
                {next.target > 1 && next.unit !== "parc" ? "s" : ""} sur {next.target}
              </p>
            </>
          ) : (
            <p className="mt-1 font-bold">Forme nocturne atteinte : toute la lignée est révélée.</p>
          )}
          <p className="mt-3 text-xs text-[var(--lab-ink-soft)]">Ton compagnon grandit avec tes explorations, jamais avec le nombre de jours de connexion.</p>
        </section>

        <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            ["Découvertes", state.discoveries],
            ["Étapes", state.steps],
            ["Aventures", state.adventures],
            ["Parcs", state.parks],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[18px] bg-[var(--lab-paper)] py-2">
              <dt className="text-[11px] font-semibold text-[var(--lab-ink-soft)]">{k}</dt>
              <dd className="text-xl font-extrabold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="lab-actions" className="mt-5">
          <h2 id="lab-actions" className="text-sm font-bold uppercase tracking-wider text-[var(--lab-ink-soft)]">
            Simuler une exploration (démo)
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {actions.map(({ a, label, Icon, msg }) => (
              <button
                key={a}
                type="button"
                disabled={!state.hatched}
                onClick={() => run(a, msg)}
                className="flex min-h-16 items-center gap-2 rounded-[18px] bg-[var(--lab-paper)] px-3 text-left text-sm font-bold shadow-[0_1px_2px_rgba(31,61,42,.08)] disabled:opacity-45"
              >
                <Icon className="size-5 shrink-0 text-[var(--lab-forest)]" aria-hidden />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                reset();
                lastStage.current = "egg";
                say("Prototype réinitialisé.");
              }}
              className="flex min-h-16 items-center gap-2 rounded-[18px] border-2 border-dashed border-[rgba(154,59,38,0.35)] px-3 text-left text-sm font-bold text-[#9a3b26]"
            >
              <RotateCcw className="size-5 shrink-0" aria-hidden />
              Réinitialiser le prototype
            </button>
          </div>
          {!state.hatched && (
            <p className="mt-2 text-sm text-[var(--lab-ink-soft)]">
              Ton œuf n&apos;a pas encore éclos.{" "}
              <Link href={`${LAB}/hatch`} className="font-bold text-[var(--lab-forest)] underline">
                Aller à l&apos;éclosion
              </Link>
            </p>
          )}
        </section>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href={`${LAB}/companion/evolution`} className="lab-btn lab-btn-ghost text-base">
            <GitBranch className="size-5" aria-hidden /> Évolution
          </Link>
          <Link href={`${LAB}/collection`} className="lab-btn lab-btn-ghost text-base">
            Collection
          </Link>
        </div>
        <div className="mt-4">
          <DemoNote>Prototype de design : aucune donnée réelle, aucun compte créé, aucune position partagée.</DemoNote>
        </div>
      </div>
      <LabNav />
    </main>
  );
}
