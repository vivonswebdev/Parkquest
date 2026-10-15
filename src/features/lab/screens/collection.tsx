"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreatureImage } from "../art/creature-image";
import { CREATURES, RARITY, type Creature } from "../creatures";
import { collected, TOTAL_CREATURES } from "../state";
import { DemoNote, LAB, LabNav, LabTopBar, ProgressBar, RarityBadge } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";

const FILTERS: { id: string; label: string; test(c: Creature): boolean }[] = [
  { id: "all", label: "Tous", test: () => true },
  { id: "plants", label: "Végétal", test: (c) => c.id === "leaf" || c.id === "flower" || c.id === "forest" },
  { id: "elements", label: "Eau et air", test: (c) => c.id === "water" || c.id === "air" },
  { id: "light", label: "Lumière", test: (c) => c.id === "lunar" || c.id === "solar" },
  { id: "rare", label: "Rares", test: (c) => c.rarity === "rare" || c.rarity === "legendary" },
];

export function CollectionScreen() {
  const hydrated = useHydrated();
  const { state } = useLabState();
  const owned = hydrated ? collected(state) : new Set<string>();
  const [filter, setFilter] = useState("all");
  const list = CREATURES.filter(FILTERS.find((f) => f.id === filter)!.test);
  return (
    <main className="flex min-h-full flex-col pb-28">
      <LabTopBar back={`${LAB}/home`} title="Collection" />
      <div className="px-5">
        <h1 className="lab-serif text-[1.9rem] leading-tight font-bold text-[var(--lab-forest-deep)]">Mes gardiens</h1>
        <div className="mt-3 rounded-[22px] bg-[var(--lab-paper)] p-4">
          <p className="font-extrabold">
            {owned.size} gardien{owned.size > 1 ? "s" : ""} sur {TOTAL_CREATURES} découvert{owned.size > 1 ? "s" : ""}
          </p>
          <div className="mt-2">
            <ProgressBar value={owned.size} max={TOTAL_CREATURES} label="Gardiens découverts" />
          </div>
          <p className="mt-2 text-xs text-[var(--lab-ink-soft)]">Sept familles : Feuille, Eau, Fleur, Air, Forêt, Lunaire, Solaire.</p>
        </div>
        <div role="group" aria-label="Filtrer la collection" className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("min-h-11 shrink-0 rounded-full px-4 text-sm font-bold", filter === f.id ? "bg-[var(--lab-forest)] text-[#fffaf0]" : "bg-[var(--lab-paper)] text-[var(--lab-ink)]")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {list.map((c) => {
            const has = owned.has(c.id);
            return (
              <li key={c.id} id={c.id}>
                <Link
                  href={`${LAB}/creature/${c.id}`}
                  className="flex h-full flex-col rounded-[24px] border-2 bg-[var(--lab-paper)] p-2.5 shadow-[0_1px_2px_rgba(31,61,42,.08)]"
                  style={{ borderColor: has ? RARITY[c.rarity].ring : "transparent" }}
                >
                  <span className="grid place-items-center rounded-[18px] px-1 pt-1" style={{ background: has ? c.tint : "#efe9dc" }}>
                    <CreatureImage id={c.id} silhouette={!has} className="w-[88%]" alt={has ? c.name : `Silhouette : gardien de la famille ${c.family} à découvrir`} sizes="(max-width: 480px) 45vw, 200px" />
                  </span>
                  <span className="mt-2 block px-1 font-extrabold">{has ? c.name : "Gardien à découvrir"}</span>
                  <span className="block px-1 text-xs font-semibold text-[var(--lab-ink-soft)]">Famille {c.family}</span>
                  {!has && <span className="mt-1 block px-1 text-xs text-[var(--lab-ink-soft)]">{c.unlock} (provisoire)</span>}
                  <span className="mt-2 px-1">
                    <RarityBadge rarity={c.rarity} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 space-y-2">
          <DemoNote>Chaque gardien se découvre par une action claire, jamais par hasard ni par achat. Conditions et raretés : propositions provisoires ; les familles sont des identités, pas des niveaux de rareté.</DemoNote>
          <Link href={`${LAB}/familles#regles`} className="block text-center text-sm font-bold text-[var(--lab-forest)] underline">
            Voir d&apos;où viennent ces conditions
          </Link>
        </div>
      </div>
      <LabNav />
    </main>
  );
}
