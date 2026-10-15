"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreatureImageView } from "../art/creature-image";
import { assetFor, useVariants } from "../creature-assets";
import { CREATURES, RULE_ORIGIN } from "../creatures";
import { DemoNote, LAB, LabTopBar, RarityBadge } from "../ui";

/* Planche des sept familles : même taille pour toutes, avec un contrôle du détourage (original / clair / nuit). */

type View = "original" | "light" | "night";

const BG: Record<View, string> = {
  original: "#f7f0e3",
  light: "#fffaf0",
  night: "radial-gradient(circle at 50% 35%, #2c4677 0%, #17294b 70%)",
};

export function FamiliesScreen() {
  const [view, setView] = useState<View>("light");
  const [joy, setJoy] = useState(0);
  const { choice } = useVariants();
  return (
    <main className="flex min-h-full flex-col pb-10">
      <LabTopBar back={LAB} title="Les sept familles" />
      <div className="space-y-6 px-5">
        <section aria-labelledby="f-board">
          <h1 id="f-board" className="lab-serif text-[1.9rem] leading-tight font-bold text-[var(--lab-forest-deep)]">
            Planche des sept familles
          </h1>
          <p className="mt-1 text-sm text-[var(--lab-ink-soft)]">Mêmes dimensions pour chaque créature. Noms provisoires. Feuille et Eau : variante choisie provisoirement (voir les comparatifs).</p>
          <div role="radiogroup" aria-label="Fond de la planche" className="mt-3 flex w-fit rounded-full bg-[var(--lab-paper)] p-1">
            {(
              [
                ["original", "Image d'origine"],
                ["light", "Détouré, fond clair"],
                ["night", "Détouré, fond nuit"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={cn("min-h-10 rounded-full px-3 text-xs font-bold", view === v ? "bg-[var(--lab-forest)] text-[#fffaf0]" : "text-[var(--lab-ink-soft)]")}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CREATURES.map((c) => (
              <li key={c.id} className="overflow-hidden rounded-[22px]" style={{ background: BG[view] }}>
                <button type="button" onClick={() => setJoy((n) => n + 1)} aria-label={`Faire réagir ${c.name}`} className="block w-full px-2 pt-2">
                  <CreatureImageView id={c.id} asset={assetFor(c.id, choice)} framed={view === "original"} idle={view !== "original"} joy={joy} alt={`${c.name}, famille ${c.family}`} sizes="(max-width: 480px) 45vw, 220px" />
                </button>
                <div className={cn("px-3 pb-3 text-center", view === "night" ? "text-[#f8f2e4]" : "")}>
                  <p className="font-extrabold">{c.name}</p>
                  <p className={cn("text-xs font-semibold", view === "night" ? "text-white/70" : "text-[var(--lab-ink-soft)]")}>Famille {c.family}</p>
                </div>
              </li>
            ))}
            <li className="grid place-items-center rounded-[22px] border-2 border-dashed border-[rgba(31,90,61,0.2)] p-3 text-center text-xs text-[var(--lab-ink-soft)]">
              Touche une créature pour voir la réaction de joie (toutes en même temps).
            </li>
          </ul>
          <p className="mt-2 text-xs text-[var(--lab-ink-soft)]">
            Détourage automatique et prudent : seul le fond crème relié aux bords est retiré ; les ombres deviennent translucides. Sur fond nuit, quelques bords
            clairs ou l&apos;intérieur des bulles peuvent rester visibles.
          </p>
        </section>

        <section aria-labelledby="f-lineup">
          <h2 id="f-lineup" className="text-lg font-extrabold">
            Planche d&apos;origine fournie
          </h2>
          <div className="mt-2 overflow-hidden rounded-[22px] bg-[#f4ebe0]">
            <Image src="/lab/creatures/families-lineup.webp" alt="Planche d'origine : les sept créatures côte à côte sur leurs socles" width={1200} height={800} unoptimized className="h-auto w-full" />
          </div>
          <p className="mt-1 text-xs text-[var(--lab-ink-soft)]">Conservée telle quelle, pour référence (les créatures intégrées viennent des images individuelles).</p>
        </section>

        <section aria-labelledby="regles" id="regles" className="rounded-[22px] bg-[var(--lab-paper)] p-4">
          <h2 id="f-rules" className="text-lg font-extrabold">
            Conditions et raretés : propositions provisoires
          </h2>
          <p className="mt-1 text-sm text-[var(--lab-ink-soft)]">
            Proposition à valider : les sept conditions de l&apos;ancien prototype sont reprises telles quelles et réparties sur les sept familles. Ce
            transfert n&apos;est pas une validation. Les familles sont des identités, pas des niveaux de rareté : la rareté indiquée est une proposition
            attachée à chaque gardien.
          </p>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-[var(--lab-ink-soft)]">
                <th className="py-1 pr-2 font-semibold">Famille</th>
                <th className="py-1 pr-2 font-semibold">Condition</th>
                <th className="py-1 font-semibold">Reprise de</th>
              </tr>
            </thead>
            <tbody>
              {CREATURES.map((c) => (
                <tr key={c.id} className="border-t border-[rgba(31,90,61,0.1)] align-top">
                  <td className="py-2 pr-2">
                    <span className="block font-bold">{c.name}</span>
                    <RarityBadge rarity={c.rarity} className="mt-1" />
                  </td>
                  <td className="py-2 pr-2">{c.unlock}</td>
                  <td className="py-2 text-xs text-[var(--lab-ink-soft)]">{RULE_ORIGIN[c.id].previous}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-[var(--lab-ink-soft)]">Évolution du compagnon inchangée : première découverte, 2 aventures, 4 parcs, 1 aventure au crépuscule.</p>
        </section>

        <section aria-labelledby="f-rights" className="rounded-[22px] border-2 border-dashed border-[rgba(154,59,38,0.35)] p-4 text-sm">
          <h2 id="f-rights" className="font-extrabold text-[#9a3b26]">
            Provenance et droits
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--lab-ink-soft)]">
            <li>Images fournies par la personne porteuse du projet le 14 octobre 2026, présentées comme ses créations.</li>
            <li>Licence, outil de création et droits d&apos;usage commercial : à confirmer.</li>
            <li>La règle « pas de créatures générées par IA dans l&apos;application publique » reste en vigueur jusqu&apos;à décision explicite.</li>
            <li>Usage limité à ce prototype ; aucune publication officielle. Originaux conservés intacts (empreintes dans le dépôt).</li>
          </ul>
        </section>

        <div className="flex flex-col gap-2">
          <Link href={`${LAB}/variantes`} className="lab-btn lab-btn-primary">
            Comparer Feuille A/B et Eau A/B
          </Link>
          <Link href={`${LAB}/collection`} className="lab-btn lab-btn-ghost">
            Voir la collection
          </Link>
        </div>
        <DemoNote>Prototype de design : visuels non publiés, conditions et noms provisoires.</DemoNote>
      </div>
    </main>
  );
}
