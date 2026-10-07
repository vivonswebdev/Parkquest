"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { GuardianFigure } from "../art/guardians";
import { BIOME_LABEL, type Creature } from "../creatures";
import { collected, companionOf, stageOf } from "../state";
import { DemoNote, LAB, LabTopBar, RarityBadge } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";

const BG = {
  forest: "bg-[linear-gradient(180deg,#e4ecd2_0%,#f8f2e4_60%)]",
  water: "bg-[linear-gradient(180deg,#d6edf3_0%,#f8f2e4_60%)]",
  night: "bg-[linear-gradient(180deg,#17294b_0%,#2c4677_55%,#f8f2e4_55.1%)]",
};

export function CreatureScreen({ c }: { c: Creature }) {
  const hydrated = useHydrated();
  const { state } = useLabState();
  const has = hydrated && collected(state).has(c.id);
  const isCompanion = has && companionOf(state) === c.id;
  const stage = isCompanion ? stageOf(state) : "young";
  const night = has && c.biome === "night";
  return (
    <main className={cn("flex min-h-full flex-col pb-8", BG[has ? c.biome : "forest"])}>
      <LabTopBar back={`${LAB}/collection`} title={has ? c.name : "Gardien à découvrir"} dark={night} />
      <div className="px-5">
        <div className="grid place-items-center">
          <GuardianFigure id={c.id} stage={stage === "egg" ? "young" : stage} silhouette={!has} className="h-72 w-auto" title={has ? c.name : "Silhouette d'un gardien à découvrir"} />
        </div>
        <div className="lab-card mt-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <RarityBadge rarity={c.rarity} />
            <span className="rounded-full bg-[rgba(31,90,61,0.08)] px-2 py-0.5 text-xs font-bold text-[var(--lab-forest)]">{BIOME_LABEL[c.biome]}</span>
            {isCompanion && <span className="rounded-full bg-[var(--lab-amber)] px-2 py-0.5 text-xs font-bold text-[#2a1a00]">Ton compagnon</span>}
          </div>
          <h1 className="lab-serif mt-3 text-[2rem] leading-tight font-bold text-[var(--lab-forest-deep)]">{c.name}</h1>
          <p className="font-semibold text-[var(--lab-ink-soft)]">{c.title}</p>
          <p className="mt-3 italic">« {c.lore} »</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-[#f3ead2] p-3">
              <dt className="text-xs font-semibold text-[var(--lab-ink-soft)]">Habitat</dt>
              <dd className="font-bold">{c.habitat}</dd>
            </div>
            <div className="rounded-2xl bg-[#f3ead2] p-3">
              <dt className="text-xs font-semibold text-[var(--lab-ink-soft)]">{has ? "Découverte" : "Condition"}</dt>
              <dd className="font-bold">{has ? "Le Secret du Séquoia (démo)" : c.unlock}</dd>
            </div>
          </dl>
          {has && (
            <>
              <h2 className="mt-5 text-sm font-bold uppercase tracking-wider text-[var(--lab-ink-soft)]">Détails</h2>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {c.details.map((d) => (
                  <li key={d.label} className="rounded-2xl bg-[#f3ead2] p-1.5 text-center">
                    <GuardianFigure id={c.id} stage={stage === "egg" ? "young" : stage} halo={false} viewBox={d.box} className="aspect-square w-full rounded-xl bg-[var(--lab-paper)]" />
                    <span className="mt-1 block text-[11px] leading-tight font-bold">{d.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Link href={`${LAB}/collection#${c.id}`} className="lab-btn lab-btn-primary">
            Voir dans ma collection
          </Link>
          <Link href={`${LAB}/hatch?replay=1`} className="lab-btn lab-btn-ghost">
            Rejouer l&apos;éclosion
          </Link>
          <DemoNote>Gardien fictif du prototype : nom, histoire et conditions sont à valider.</DemoNote>
        </div>
      </div>
    </main>
  );
}
