"use client";

import { MapPinned, ShieldCheck, TreePine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { LocationChoice } from "../state";
import { BottomActions, ChoiceCard, LAB, LabTopBar } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";

/** Choix de localisation : jamais de permission système, jamais de vraie position. */
export function LocationChoiceScreen() {
  const hydrated = useHydrated();
  return hydrated ? <LocationChoiceForm /> : <main className="min-h-full" />;
}

function LocationChoiceForm() {
  const { state, update } = useLabState();
  const [choice, setChoice] = useState<LocationChoice | null>(state.location);
  const icon = (I: typeof MapPinned) => (
    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[rgba(31,90,61,0.09)] text-[var(--lab-forest)]">
      <I className="size-6" aria-hidden />
    </span>
  );
  return (
    <main className="flex min-h-full flex-col">
      <LabTopBar back={`${LAB}/choose-egg`} title="Explorer à ta façon" />
      <div className="lab-fade-up space-y-5 px-5 pt-2">
        <h1 className="lab-serif text-[2rem] leading-tight font-bold text-[var(--lab-forest-deep)]">Comment souhaites-tu explorer ?</h1>
        <fieldset className="grid gap-2.5">
          <legend className="sr-only">Mode d&apos;exploration</legend>
          <ChoiceCard
            name="loc"
            value="nearby-demo"
            checked={choice === "nearby-demo"}
            onChange={(v) => setChoice(v as LocationChoice)}
            label="Voir des parcs près de moi"
            hint="Démonstration uniquement : aucune position réelle ne sera demandée."
            visual={icon(MapPinned)}
          />
          <ChoiceCard
            name="loc"
            value="manual"
            checked={choice === "manual"}
            onChange={(v) => setChoice(v as LocationChoice)}
            label="Choisir un parc manuellement"
            hint="Parcourir les parcs par nom, sans partager ta position."
            visual={icon(TreePine)}
          />
        </fieldset>
        {choice === "nearby-demo" && (
          <p className="lab-fade-up rounded-2xl bg-[rgba(47,127,163,0.1)] px-4 py-3 text-sm text-[#1f4d63]" role="status">
            Exemple simulé : 3 parcs fictifs « à proximité ». Dans la vraie application, ParkQuest demanderait d&apos;abord ton accord.
          </p>
        )}
        <div className="flex gap-3 rounded-[22px] bg-[var(--lab-paper)] p-4">
          <ShieldCheck className="mt-0.5 size-6 shrink-0 text-[var(--lab-forest)]" aria-hidden />
          <p className="text-[0.95rem] leading-relaxed text-[var(--lab-ink-soft)]">
            <strong className="text-[var(--lab-ink)]">Tu peux explorer ParkQuest sans partager ta position.</strong> Tu pourras modifier ce choix plus tard.
          </p>
        </div>
      </div>
      <BottomActions>
        <Link
          href={`${LAB}/first-adventure`}
          aria-disabled={!choice}
          onClick={(e) => (choice ? update({ location: choice }) : e.preventDefault())}
          className={choice ? "lab-btn lab-btn-primary" : "lab-btn lab-btn-primary pointer-events-auto opacity-45"}
        >
          Continuer
        </Link>
        {!choice && <p className="text-center text-xs text-[var(--lab-ink-soft)]">Choisis l&apos;une des deux options pour continuer.</p>}
      </BottomActions>
    </main>
  );
}
