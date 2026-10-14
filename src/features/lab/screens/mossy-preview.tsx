"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { HatchScene, isOpening } from "../art/hatch-scene";
import { MossyFigure, type MossyMood } from "../art/mossy";
import { DemoNote, LAB, LabTopBar } from "../ui";
import { useHatch } from "../use-hatch";

/* Planche de validation de Mossy : repos, jeune / adulte, réactions et éclosion. */

export function MossyPreviewScreen() {
  const [mood, setMood] = useState<MossyMood>("rest");
  const [look, setLook] = useState(0);
  const [closed, setClosed] = useState(false);
  const [hop, setHop] = useState(0);
  const [squish, setSquish] = useState(0);
  const [moodUntil, setMoodUntil] = useState(0);
  const hatch = useHatch("ready");

  // Retour à l'expression de repos après une réaction
  useEffect(() => {
    if (!moodUntil) return;
    const t = setTimeout(() => setMood("rest"), Math.max(0, moodUntil - Date.now()));
    return () => clearTimeout(t);
  }, [moodUntil]);

  const react = (m: MossyMood, ms: number) => {
    setMood(m);
    setMoodUntil(Date.now() + ms);
  };
  const blink = () => {
    setClosed(true);
    setTimeout(() => setClosed(false), 180);
  };
  const lookAround = () => {
    setLook(-1);
    setTimeout(() => setLook(1), 550);
    setTimeout(() => setLook(0), 1100);
  };
  const joy = () => {
    react("happy", 1300);
    setHop((n) => n + 1);
  };
  const touch = () => {
    react("happy", 900);
    setSquish((n) => n + 1);
  };

  const btn = "min-h-11 rounded-full bg-[var(--lab-paper)] px-4 text-sm font-bold shadow-[0_1px_2px_rgba(31,61,42,.1)]";

  return (
    <main className="flex min-h-full flex-col pb-10">
      <LabTopBar back={`${LAB}`} title="Mossy · planche de validation" />
      <div className="space-y-6 px-5">
        <section aria-labelledby="m-rest" className="lab-card overflow-hidden">
          <div className="bg-[radial-gradient(circle_at_50%_40%,#f6edd2,#efe6cc_60%,#e4dcc0)] pt-2">
            <button type="button" onClick={touch} aria-label="Toucher Mossy" className="mx-auto block">
              <MossyFigure idle mood={mood} look={look} eyesClosed={closed} hop={hop} squish={squish} className="mx-auto h-72 w-auto" title="Mossy, jeune gardien, au repos" />
            </button>
          </div>
          <div className="p-4">
            <h2 id="m-rest" className="text-lg font-extrabold">
              Au repos
            </h2>
            <p className="text-sm text-[var(--lab-ink-soft)]">Il respire et cligne des yeux tout seul. Touche-le pour le faire réagir.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={blink}>
                Cligner
              </button>
              <button type="button" className={btn} onClick={lookAround}>
                Regarder autour
              </button>
              <button type="button" className={btn} onClick={joy}>
                Joie
              </button>
              <button type="button" className={btn} onClick={touch}>
                Toucher
              </button>
              <button type="button" className={btn} onClick={() => react("surprised", 1200)}>
                Surpris
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="m-forms">
          <h2 id="m-forms" className="text-lg font-extrabold">
            Jeune et adulte
          </h2>
          <p className="text-sm text-[var(--lab-ink-soft)]">Même visage et même matière ; l&apos;adulte gagne en taille, en crinière et en détails.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { label: "Jeune gardien", form: "young" as const },
              { label: "Gardien de la forêt", form: "adult" as const },
            ].map((f) => (
              <figure key={f.form} className="rounded-[24px] bg-[var(--lab-paper)] p-2 text-center">
                <MossyFigure form={f.form} idle socle className="mx-auto aspect-square w-full" title={`Mossy, ${f.label.toLowerCase()}`} />
                <figcaption className="pb-1 text-sm font-bold">{f.label}</figcaption>
              </figure>
            ))}
            <figure className="rounded-[24px] bg-[var(--lab-paper)] p-2 text-center">
              <MossyFigure scarf idle socle className="mx-auto aspect-square w-full" title="Mossy, explorateur des sous-bois" />
              <figcaption className="pb-1 text-sm font-bold">Explorateur</figcaption>
            </figure>
            <figure className="rounded-[24px] bg-[linear-gradient(160deg,#17294b,#2c4677)] p-2 text-center text-[#f8f2e4]">
              <MossyFigure form="adult" lunar idle socle className="mx-auto aspect-square w-full" title="Mossy lunaire" />
              <figcaption className="pb-1 text-sm font-bold">Forme nocturne</figcaption>
            </figure>
          </div>
        </section>

        <section aria-labelledby="m-hatch" className="lab-card overflow-hidden">
          <div className="bg-[radial-gradient(circle_at_50%_40%,#fff1cc,#f6e3b8_45%,#f3ead2)] py-2">
            <HatchScene egg="forest" creature="mossy" phase={hatch.phase} reduced={hatch.reduced} className="mx-auto h-80 w-auto" title="Éclosion de l'Œuf de la forêt" />
          </div>
          <div className="p-4">
            <h2 id="m-hatch" className="text-lg font-extrabold">
              Éclosion (environ 6 secondes)
            </h2>
            <p className="text-sm text-[var(--lab-ink-soft)]">Balancement, secousses, fissures, lumière, coquille en morceaux, apparition, clignement, regard, joie.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isOpening(hatch.phase)}
                className={cn("lab-btn lab-btn-amber", isOpening(hatch.phase) && "opacity-60")}
                onClick={() => {
                  hatch.reset("ready");
                  setTimeout(() => hatch.open(), 300);
                }}
              >
                {hatch.phase === "ready" ? "Lancer l'éclosion" : "Rejouer l'éclosion"}
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--lab-ink-soft)]">Avec « Réduire les animations » activé sur le téléphone : fondu simple, sans secousses.</p>
          </div>
        </section>

        <Link href={`${LAB}/hatch?replay=1`} className="lab-btn lab-btn-primary w-full">
          Voir dans le parcours complet
        </Link>
        <DemoNote>Prototype de rendu : Mossy est dessiné en SVG (dégradés, reflets, ombres) et animé par parties. À valider avant de décliner Perline, Lumo et les autres gardiens.</DemoNote>
      </div>
    </main>
  );
}
