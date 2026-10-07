"use client";

import { ChevronRight, Clock, Map as MapIcon, Moon, Route } from "lucide-react";
import Link from "next/link";
import { Diorama, MARKERS, useElementSize } from "../art/diorama";
import { EggArt } from "../art/egg";
import { GuardianFigure } from "../art/guardians";
import { eggById, LINEAGE, STAGE_LABEL } from "../creatures";
import { collected, companionOf, nextEvolution, stageOf, TOTAL_CREATURES } from "../state";
import { DemoNote, LAB, LabNav, LabTools, ProgressBar } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";
import { MarkerPin } from "./map-markers";

const FINDS = [
  { label: "Plume d'écorce", fill: "#e9dcc0", stroke: "#b86f12" },
  { label: "Pomme de pin", fill: "#a3784e", stroke: "#6c4a33" },
  { label: "Feuille dorée", fill: "#e9a23b", stroke: "#b86f12" },
  { label: "Galet lisse", fill: "#b9c6c5", stroke: "#7e8f92" },
  { label: "Gland", fill: "#c9a27c", stroke: "#7a5233" },
];

export function HomeScreen() {
  const hydrated = useHydrated();
  const { state } = useLabState();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const stage = hydrated ? stageOf(state) : "egg";
  const companion = companionOf(state);
  const next = nextEvolution(state);
  const owned = hydrated ? collected(state).size : 0;
  const finds = FINDS.slice(0, Math.min(FINDS.length, hydrated ? state.discoveries : 0));
  const title = stage === "egg" ? eggById(state.egg).label : LINEAGE[companion][stage];
  return (
    <main className="flex min-h-full flex-col pb-28">
      <header className="lab-safe-top flex items-start justify-between px-5">
        <div>
          <p className="text-sm font-semibold text-[var(--lab-ink-soft)]">Prêt pour une balade ?</p>
          <h1 className="lab-serif text-[1.7rem] leading-tight font-bold text-[var(--lab-forest-deep)]">Bonjour, {hydrated ? state.name : "Explorateur"} !</h1>
        </div>
        <LabTools />
      </header>

      <div className="space-y-4 px-5 pt-4">
        <Link href={`${LAB}/companion`} className="lab-card flex items-center gap-3 p-3">
          <span className="grid size-20 shrink-0 place-items-center rounded-[20px] bg-[#e4ecd2]">
            {stage === "egg" ? (
              <EggArt egg={state.egg} nest={false} className="h-20 w-auto" />
            ) : (
              <GuardianFigure id={companion} stage={stage} halo={false} className="h-20 w-auto" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-extrabold">{title}</span>
            <span className="block text-sm text-[var(--lab-moss)]">{STAGE_LABEL[stage]}</span>
            {next && (
              <span className="mt-2 block space-y-1">
                <ProgressBar value={next.current} max={next.target} label={`Prochaine évolution : ${next.label}`} />
                <span className="block text-xs text-[var(--lab-ink-soft)]">
                  Prochaine évolution : {next.label.toLowerCase()} ({Math.min(next.current, next.target)}/{next.target})
                </span>
              </span>
            )}
          </span>
          <ChevronRight className="size-5 shrink-0 text-[var(--lab-ink-soft)]" aria-hidden />
        </Link>

        <section aria-labelledby="lab-suggested" className="lab-card overflow-hidden">
          <div ref={ref} className="relative aspect-[5/2]">
            <Diorama theme="day" size={size} camera={{ x: 470, y: 560, zoom: 0.6 }} anchorY={0.6} markers={MARKERS.filter((m) => ["start", "adventure", "egg"].includes(m.id))} renderMarker={(m) => <MarkerPin m={m} compact />} />
          </div>
          <div className="p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--lab-amber-deep)]">Aventure proposée</p>
            <h2 id="lab-suggested" className="lab-serif mt-1 text-2xl font-bold">
              Le Secret du Séquoia
            </h2>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-[var(--lab-ink-soft)]">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden /> 35 à 45 min
              </span>
              <span className="inline-flex items-center gap-1">
                <Route className="size-4" aria-hidden /> 4 étapes
              </span>
              <span>Parc fictif</span>
            </p>
            <Link href={`${LAB}/map?theme=day`} className="lab-btn lab-btn-amber mt-3 w-full">
              Explorer un parc
            </Link>
          </div>
        </section>

        <section aria-labelledby="lab-finds">
          <div className="flex items-baseline justify-between">
            <h2 id="lab-finds" className="text-lg font-extrabold">
              Découvertes récentes
            </h2>
            <span className="text-sm text-[var(--lab-ink-soft)]">{finds.length}</span>
          </div>
          {finds.length ? (
            <ul className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
              {finds.map((f) => (
                <li key={f.label} className="w-24 shrink-0 rounded-[20px] bg-[var(--lab-paper)] p-2 text-center">
                  <svg viewBox="-20 -20 40 40" className="mx-auto size-14" aria-hidden>
                    <path d="M0 -16 C 10 -8, 10 6, 0 16 C -10 6, -10 -8, 0 -16 Z" fill={f.fill} stroke={f.stroke} strokeWidth="1.5" />
                  </svg>
                  <span className="mt-1 block text-[11px] leading-tight font-bold">{f.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 rounded-[20px] bg-[var(--lab-paper)] p-4 text-sm text-[var(--lab-ink-soft)]">Tes trouvailles apparaîtront ici après ta première aventure.</p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link href={`${LAB}/collection`} className="rounded-[22px] bg-[var(--lab-paper)] p-4">
            <span className="block text-sm font-semibold text-[var(--lab-ink-soft)]">Collection</span>
            <span className="mt-1 block text-xl font-extrabold">
              {owned} sur {TOTAL_CREATURES}
            </span>
            <span className="mt-2 block">
              <ProgressBar value={owned} max={TOTAL_CREATURES} label="Gardiens découverts" />
            </span>
          </Link>
          <Link href={`${LAB}/map?theme=night`} className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#17294b,#2c4677)] p-4 text-[#f8f2e4]">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <MapIcon className="size-4" aria-hidden /> Carte
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-lg font-extrabold">
              <Moon className="size-4 text-[#f3c86e]" aria-hidden /> Ambiance du soir
            </span>
            <span className="absolute -bottom-3 -right-3 size-16 rounded-full bg-[#f3c86e]/30 blur-xl" aria-hidden />
          </Link>
        </div>
        <DemoNote>Prototype de design : aucune donnée réelle, aucun compte créé, aucune position partagée.</DemoNote>
      </div>
      <LabNav />
    </main>
  );
}
