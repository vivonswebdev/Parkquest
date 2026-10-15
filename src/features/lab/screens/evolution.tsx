"use client";

import { cn } from "@/lib/utils";
import { EggArt } from "../art/egg";
import { CreatureImage } from "../art/creature-image";
import { eggById, LINEAGE, STAGE_CONDITION, STAGE_LABEL, STAGE_ORDER } from "../creatures";
import { companionOf, stageOf } from "../state";
import { DemoNote, LAB, LabNav, LabTopBar } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";

export function EvolutionScreen() {
  const hydrated = useHydrated();
  const { state } = useLabState();
  const companion = companionOf(state);
  const current = STAGE_ORDER.indexOf(hydrated ? stageOf(state) : "egg");
  return (
    <main className="flex min-h-full flex-col pb-28">
      <LabTopBar back={`${LAB}/companion`} title="Arbre d'évolution" />
      <div className="px-5">
        <h1 className="lab-serif text-[1.9rem] leading-tight font-bold text-[var(--lab-forest-deep)]">La lignée de ton gardien</h1>
        <p className="mt-1 text-[var(--lab-ink-soft)]">Chaque forme se débloque par une action d&apos;exploration écrite à l&apos;avance.</p>
        <ol className="mt-5">
          {STAGE_ORDER.map((st, i) => {
            const status = i < current ? "Obtenu" : i === current ? "Actuel" : "À découvrir";
            const known = i <= current;
            const name = st === "egg" ? eggById(state.egg).label : LINEAGE[companion][st];
            return (
              <li key={st}>
                {i > 0 && (
                  <p className="ml-10 flex items-center gap-2 border-l-2 border-dashed border-[#d9b36a] py-2 pl-6 text-sm font-semibold text-[var(--lab-amber-deep)]">
                    <span aria-hidden>↓</span> {STAGE_CONDITION[st]}
                  </p>
                )}
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-[22px] p-3",
                    i === current ? "bg-[var(--lab-paper)] ring-2 ring-[var(--lab-amber)]" : "bg-[var(--lab-paper)]",
                    st === "lunar" && "bg-[linear-gradient(135deg,#1a2b52,#2c4677)] text-[#f8f2e4]",
                  )}
                >
                  <span className={cn("grid size-20 shrink-0 place-items-center rounded-[18px]", st === "lunar" ? "bg-white/10" : "bg-[#f3ead2]")}>
                    {st === "egg" ? (
                      <EggArt egg={state.egg} nest={false} halo={false} className="h-16 w-auto" />
                    ) : (
                      st === "young" ? (
                        <CreatureImage id={companion} silhouette={!known} className="h-[4.75rem]" alt="" sizes="80px" />
                      ) : (
                        // Une seule image par créature : les formes suivantes restent à dessiner
                        <span className={cn("grid size-16 place-items-center rounded-full border-2 border-dashed text-center text-[10px] leading-tight font-bold", st === "lunar" ? "border-white/40" : "border-[rgba(31,90,61,0.3)] text-[var(--lab-ink-soft)]")}>
                          Visuel
                          <br />à créer
                        </span>
                      )
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{known ? name : `${STAGE_LABEL[st]} — forme à découvrir`}</span>
                    <span className={cn("block text-sm", st === "lunar" ? "text-white/75" : "text-[var(--lab-ink-soft)]")}>Condition : {STAGE_CONDITION[st]}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border-2 px-2 py-0.5 text-xs font-bold",
                      status === "Actuel" ? "border-[var(--lab-amber)] bg-[var(--lab-amber)] text-[#2a1a00]" : status === "Obtenu" ? "border-[var(--lab-moss)] text-[var(--lab-forest)]" : "border-current opacity-70",
                    )}
                  >
                    {status}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-5">
          <DemoNote>Aucun compte à rebours, aucune connexion quotidienne obligatoire : seulement des explorations.</DemoNote>
        </div>
      </div>
      <LabNav />
    </main>
  );
}
