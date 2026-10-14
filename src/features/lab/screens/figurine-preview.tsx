"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { HatchScene, isOpening } from "../art/hatch-scene";
import { CompanionFigure, type CompanionId } from "../art/companion";
import type { FigureMood } from "../art/figure-kit";
import { EGGS, LINEAGE } from "../creatures";
import { DemoNote, LAB, LabTopBar } from "../ui";
import { useHatch } from "../use-hatch";

/* Planche de validation d'un compagnon : repos, jeune / adulte, réactions et éclosion. */

const INTRO: Record<CompanionId, string> = {
  mossy: "Mousse, feuilles et forêt.",
  perline: "Eau, gouttes et rivière : un corps-goutte translucide, des branchies-frondes et des bulles.",
  lumo: "Lumière douce et crépuscule : duvet bleu soir, ailes de voile, antennes et lanterne qui brillent.",
};

const ORDER: CompanionId[] = ["mossy", "perline", "lumo"];

export function FigurinePreviewScreen({ id }: { id: CompanionId }) {
  const names = LINEAGE[id];
  const egg = EGGS.find((e) => e.hatches === id)!;
  const short = names.young.split(",")[0];
  const [mood, setMood] = useState<FigureMood>("rest");
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

  const react = (m: FigureMood, ms: number) => {
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
      <LabTopBar back={`${LAB}`} title={`${short} · planche de validation`} />
      <nav aria-label="Compagnons" className="mb-3 flex justify-center gap-2 px-5">
        {ORDER.map((c) => (
          <Link
            key={c}
            href={`${LAB}/${c}`}
            aria-current={c === id ? "page" : undefined}
            className={cn("min-h-11 rounded-full px-4 py-2.5 text-sm font-bold", c === id ? "bg-[var(--lab-forest)] text-[#fffaf0]" : "bg-[var(--lab-paper)]")}
          >
            {LINEAGE[c].young.split(",")[0]}
          </Link>
        ))}
      </nav>
      <div className="space-y-6 px-5">
        <section aria-labelledby="m-rest" className="lab-card overflow-hidden">
          <div className="bg-[radial-gradient(circle_at_50%_40%,#f6edd2,#efe6cc_60%,#e4dcc0)] pt-2">
            <button type="button" onClick={touch} aria-label={`Toucher ${short}`} className="mx-auto block">
              <CompanionFigure id={id} idle mood={mood} look={look} eyesClosed={closed} hop={hop} squish={squish} className="mx-auto h-72 w-auto" title={`${names.young}, au repos`} />
            </button>
          </div>
          <div className="p-4">
            <h2 id="m-rest" className="text-lg font-extrabold">
              Au repos
            </h2>
            <p className="text-sm text-[var(--lab-ink-soft)]">{INTRO[id]} Respire et cligne des yeux tout seul ; touche pour le faire réagir.</p>
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
          <p className="text-sm text-[var(--lab-ink-soft)]">Même visage et même matière ; l&apos;adulte change de silhouette et gagne des détails.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { label: "Jeune", form: "young" as const, name: names.young },
              { label: "Adulte", form: "adult" as const, name: names.guardian },
            ].map((f) => (
              <figure key={f.form} className="rounded-[24px] bg-[var(--lab-paper)] p-2 text-center">
                <CompanionFigure id={id} form={f.form} idle socle className="mx-auto aspect-square w-full" title={f.name} />
                <figcaption className="pb-1 text-sm font-bold">{f.label}</figcaption>
              </figure>
            ))}
            <figure className="rounded-[24px] bg-[var(--lab-paper)] p-2 text-center">
              <CompanionFigure id={id} mood="happy" hop={1} socle className="mx-auto aspect-square w-full" title={`${short}, réaction joyeuse`} />
              <figcaption className="pb-1 text-sm font-bold">Joie</figcaption>
            </figure>
            <figure className="rounded-[24px] bg-[linear-gradient(160deg,#17294b,#2c4677)] p-2 text-center text-[#f8f2e4]">
              <CompanionFigure id={id} form="adult" lunar idle socle className="mx-auto aspect-square w-full" title={names.lunar} />
              <figcaption className="pb-1 text-sm font-bold">Forme nocturne</figcaption>
            </figure>
          </div>
        </section>

        <section aria-labelledby="m-hatch" className="lab-card overflow-hidden">
          <div className="bg-[radial-gradient(circle_at_50%_40%,#fff1cc,#f6e3b8_45%,#f3ead2)] py-2">
            <HatchScene egg={egg.id} creature={id} phase={hatch.phase} reduced={hatch.reduced} className="mx-auto h-80 w-auto" title={`Éclosion : ${egg.label}`} />
          </div>
          <div className="p-4">
            <h2 id="m-hatch" className="text-lg font-extrabold">
              {egg.label} : éclosion (environ 6 secondes)
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
        <DemoNote>Prototype de rendu : figurine dessinée en SVG (dégradés, reflets, ombres) et animée par parties. Les autres gardiens attendent la validation.</DemoNote>
      </div>
    </main>
  );
}
