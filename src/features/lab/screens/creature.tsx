"use client";

import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreatureImage } from "../art/creature-image";
import { useCreatureAsset } from "../creature-assets";
import { STAGE_LABEL, type Creature } from "../creatures";
import { collected, companionOf } from "../state";
import { DemoNote, LAB, LabTopBar, RarityBadge } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";

export type Backdrop = "light" | "night";

export function CreatureScreen({ c, initialBackdrop = "light" }: { c: Creature; initialBackdrop?: Backdrop }) {
  const hydrated = useHydrated();
  const { state } = useLabState();
  const asset = useCreatureAsset(c.id);
  const [backdrop, setBackdrop] = useState<Backdrop>(initialBackdrop);
  const [touch, setTouch] = useState(0);
  const has = hydrated && collected(state).has(c.id);
  const isCompanion = has && companionOf(state) === c.id;
  const night = backdrop === "night";

  return (
    <main
      className={cn("flex min-h-full flex-col pb-8 transition-colors duration-500", night ? "text-[#f8f2e4]" : "")}
      style={{
        background: night ? "radial-gradient(circle at 50% 28%, #2c4677 0%, #1a2b52 45%, #121d3a 100%)" : `linear-gradient(180deg, ${c.tint} 0%, #f8f2e4 62%)`,
      }}
    >
      <LabTopBar back={`${LAB}/collection`} title={has ? c.name : "Gardien à découvrir"} dark={night} />
      <div className="px-5">
        <div role="radiogroup" aria-label="Fond de la fiche" className={cn("mx-auto flex w-fit rounded-full p-1", night ? "bg-white/10" : "bg-[rgba(255,250,240,0.85)]")}>
          {(
            [
              ["light", "Fond clair", Sun],
              ["night", "Fond nuit", Moon],
            ] as const
          ).map(([b, label, Icon]) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={backdrop === b}
              onClick={() => setBackdrop(b)}
              className={cn(
                "flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold",
                backdrop === b ? (b === "night" ? "bg-[#f3c86e] text-[#1a2140]" : "bg-[var(--lab-forest)] text-[#fffaf0]") : night ? "text-white/80" : "text-[var(--lab-ink-soft)]",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setTouch((n) => n + 1)} aria-label={has ? `Toucher ${c.name}` : "Silhouette d'un gardien à découvrir"} className="mx-auto mt-2 block w-[78%] max-w-xs">
          <CreatureImage id={c.id} idle={has} touch={touch} silhouette={!has} alt={has ? `${c.name}, famille ${c.family}` : ""} priority />
        </button>

        <div className={cn("lab-card mt-2 p-5", night && "bg-[rgba(255,250,240,0.96)] text-[var(--lab-ink)]")}>
          <div className="flex flex-wrap items-center gap-2">
            <RarityBadge rarity={c.rarity} />
            <span className="rounded-full bg-[rgba(31,90,61,0.08)] px-2 py-0.5 text-xs font-bold text-[var(--lab-forest)]">Famille {c.family}</span>
            {isCompanion && <span className="rounded-full bg-[var(--lab-amber)] px-2 py-0.5 text-xs font-bold text-[#2a1a00]">Ton compagnon</span>}
          </div>
          <h1 className="lab-serif mt-3 text-[2rem] leading-tight font-bold text-[var(--lab-forest-deep)]">{c.name}</h1>
          <p className="font-semibold text-[var(--lab-ink-soft)]">
            {c.title} <span className="text-xs font-normal">(nom provisoire)</span>
          </p>
          <p className="mt-3 italic">« {c.lore} »</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-[#f3ead2] p-3">
              <dt className="text-xs font-semibold text-[var(--lab-ink-soft)]">Habitat</dt>
              <dd className="font-bold">{c.habitat}</dd>
            </div>
            <div className="rounded-2xl bg-[#f3ead2] p-3">
              <dt className="text-xs font-semibold text-[var(--lab-ink-soft)]">{has ? "Découverte" : "Condition (provisoire)"}</dt>
              <dd className="font-bold">{has ? "Le Secret du Séquoia (démo)" : c.unlock}</dd>
            </div>
          </dl>

          {has && (
            <>
              <h2 className="mt-5 text-sm font-bold uppercase tracking-wider text-[var(--lab-ink-soft)]">Détails</h2>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {asset.details.map((d) => (
                  <li key={d.label} className="rounded-2xl bg-[#f3ead2] p-1.5 text-center">
                    <span className="relative block aspect-square overflow-hidden rounded-xl bg-[var(--lab-paper)]">
                      {/* Recadrage de l'image d'origine (aucun redessin) */}
                      <Image
                        src={asset.framed}
                        alt=""
                        width={720}
                        height={900}
                        unoptimized
                        className="absolute max-w-none"
                        style={{ width: `${100 / d.size}%`, height: "auto", left: `${(-d.x / d.size) * 100}%`, top: `${((-d.y * (1402 / 1122)) / d.size) * 100}%` }}
                      />
                    </span>
                    <span className="mt-1 block text-[11px] leading-tight font-bold">{d.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wider text-[var(--lab-ink-soft)]">Formes</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <strong>{STAGE_LABEL.young}</strong> : visuel disponible (image actuelle).
            </li>
            <li>
              <strong>
                {STAGE_LABEL.explorer}, {STAGE_LABEL.guardian}, {STAGE_LABEL.lunar}
              </strong>{" "}
              : visuels à créer (aucune image agrandie ne les remplace).
            </li>
          </ul>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Link href={`${LAB}/collection#${c.id}`} className="lab-btn lab-btn-primary">
            Voir dans ma collection
          </Link>
          <Link href={`${LAB}/hatch?replay=1`} className={cn("lab-btn lab-btn-ghost", night && "bg-white/10 text-[#f8f2e4]")}>
            Rejouer l&apos;éclosion
          </Link>
          <DemoNote dark={night}>Visuel fourni pour le prototype : provenance et droits à confirmer, aucune publication officielle.</DemoNote>
        </div>
      </div>
    </main>
  );
}
