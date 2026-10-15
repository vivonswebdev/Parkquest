"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CreatureImageView } from "../art/creature-image";
import { ASSETS, useVariants, VARIANTS, type VariantKey } from "../creature-assets";
import { NAMES } from "../creatures";
import { DemoNote, LAB, LabTopBar } from "../ui";

/*
 * Comparatifs A/B (Feuille, Eau) à taille identique. Aucune variante n'est supprimée ;
 * le choix est provisoire, local à ce navigateur, et ne transforme pas A/B en formes jeune / adulte.
 */

const ROWS: { family: "leaf" | "water"; label: string }[] = [
  { family: "leaf", label: "Feuille" },
  { family: "water", label: "Eau" },
];

export function VariantsScreen() {
  const { choice, set } = useVariants();
  return (
    <main className="flex min-h-full flex-col pb-10">
      <LabTopBar back={`${LAB}/familles`} title="Comparatifs A/B" />
      <div className="space-y-7 px-5">
        <p className="text-sm text-[var(--lab-ink-soft)]">
          Images affichées à la même taille. La variante choisie sert provisoirement partout dans le prototype ; ce choix n&apos;est pas définitif et ne fait pas de
          ces deux images une forme jeune et une forme adulte.
        </p>
        {ROWS.map(({ family, label }) => (
          <section key={family} aria-labelledby={`ab-${family}`}>
            <h2 id={`ab-${family}`} className="lab-serif text-2xl font-bold text-[var(--lab-forest-deep)]">
              {label} · {NAMES[family]}
            </h2>
            {(["original", "light", "night"] as const).map((view) => (
              <div key={view} className="mt-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--lab-ink-soft)]">
                  {view === "original" ? "Images d'origine" : view === "light" ? "Détourées, fond clair" : "Détourées, fond nuit"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["a", "b"] as VariantKey[]).map((v) => {
                    const asset = ASSETS[VARIANTS[family]![v]];
                    const active = (choice[family] ?? "a") === v;
                    return (
                      <figure
                        key={v}
                        className={cn("overflow-hidden rounded-[22px] border-2", active ? "border-[var(--lab-amber)]" : "border-transparent")}
                        style={{ background: view === "night" ? "radial-gradient(circle at 50% 35%, #2c4677 0%, #17294b 70%)" : view === "light" ? "#fffaf0" : "#f7f0e3" }}
                      >
                        <CreatureImageView id={family} asset={asset} framed={view === "original"} idle={view !== "original"} alt={`${label}, variante ${v.toUpperCase()}`} sizes="(max-width: 480px) 45vw, 240px" />
                        <figcaption className={cn("px-2 pb-2 text-center text-sm font-extrabold", view === "night" && "text-[#f8f2e4]")}>
                          Variante {v.toUpperCase()}
                          {active && <span className="ml-1 text-xs font-bold text-[var(--lab-amber-deep)]">(utilisée)</span>}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            ))}
            <div role="radiogroup" aria-label={`Variante ${label} utilisée provisoirement`} className="mt-3 grid grid-cols-2 gap-3">
              {(["a", "b"] as VariantKey[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={(choice[family] ?? "a") === v}
                  onClick={() => set(family, v)}
                  className={cn("lab-btn text-base", (choice[family] ?? "a") === v ? "lab-btn-primary" : "lab-btn-ghost")}
                >
                  Utiliser {v.toUpperCase()} (provisoire)
                </button>
              ))}
            </div>
          </section>
        ))}
        <div className="rounded-[22px] bg-[var(--lab-paper)] p-4 text-sm text-[var(--lab-ink-soft)]">
          <p className="font-bold text-[var(--lab-ink)]">Jeune / adulte ?</p>
          <p className="mt-1">
            A et B montrent le même âge apparent et le même socle : rien n&apos;indique pour l&apos;instant une évolution. Elles restent donc deux variantes du même
            stade, à départager.
          </p>
        </div>
        <Link href={`${LAB}/familles`} className="lab-btn lab-btn-ghost w-full">
          Retour à la planche des familles
        </Link>
        <DemoNote>Choix stocké uniquement dans ce navigateur, réversible à tout moment.</DemoNote>
      </div>
    </main>
  );
}
