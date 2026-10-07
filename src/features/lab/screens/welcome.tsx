"use client";

import { Leaf } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ParkScene } from "../art/scenes";
import { RETURNING_DEMO } from "../state";
import { BottomActions, DemoNote, LAB, LabTools } from "../ui";
import { useLabState } from "../use-lab-state";

export function WelcomeScreen() {
  const [account, setAccount] = useState(false);
  const { replace } = useLabState();
  const router = useRouter();
  return (
    <main className="flex min-h-full flex-col">
      <div className="lab-safe-top flex items-center justify-between px-5">
        <p className="flex items-center gap-2 text-lg font-extrabold text-[var(--lab-forest)]">
          <span className="grid size-9 place-items-center rounded-2xl bg-[var(--lab-forest)] text-[#fffaf0]">
            <Leaf className="size-5" aria-hidden />
          </span>
          ParkQuest
        </p>
        <LabTools />
      </div>
      <div className="lab-fade-up px-5 pt-4">
        <div className="lab-card overflow-hidden">
          <ParkScene className="block h-auto w-full" withStart title="Un parc accueillant, un sentier et un point de départ" />
        </div>
        <h1 className="lab-serif mt-7 text-[2.15rem] leading-[1.08] font-bold text-[var(--lab-forest-deep)]">Ton prochain secret commence ici.</h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-[var(--lab-ink-soft)]">Explore les parcs, découvre leurs histoires et rencontre leurs gardiens.</p>
      </div>
      <BottomActions>
        <Link href={`${LAB}/onboarding/1`} className="lab-btn lab-btn-primary">
          Commencer
        </Link>
        <button type="button" className="lab-btn text-[var(--lab-forest)]" onClick={() => setAccount(true)}>
          J&apos;ai déjà un compte
        </button>
      </BottomActions>
      {account && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(23,41,75,0.35)] p-3" onClick={() => setAccount(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="lab-account-title" className="lab-card lab-fade-up lab-safe-bottom w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h2 id="lab-account-title" className="text-xl font-extrabold">Connexion de démonstration</h2>
            <p className="mt-2 text-[var(--lab-ink-soft)]">Dans cet aperçu, aucun compte n&apos;existe. Tu peux reprendre avec un profil d&apos;exemple pour voir l&apos;accueil d&apos;un explorateur déjà en route.</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                autoFocus
                className="lab-btn lab-btn-primary"
                onClick={() => {
                  replace(RETURNING_DEMO);
                  router.push(`${LAB}/home`);
                }}
              >
                Continuer avec le profil d&apos;exemple
              </button>
              <button type="button" className="lab-btn lab-btn-ghost" onClick={() => setAccount(false)}>
                Annuler
              </button>
            </div>
            <div className="mt-4">
              <DemoNote>Aucun identifiant n&apos;est demandé ni envoyé.</DemoNote>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
