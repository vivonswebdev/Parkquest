"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Diorama, HOME_CAMERA, MARKERS, useElementSize } from "../art/diorama";
import { EggArt } from "../art/egg";
import { CreatureImage } from "../art/creature-image";
import { ParkScene, ShowcaseScene } from "../art/scenes";
import { STAGE_LABEL, type StageId } from "../creatures";
import { BottomActions, LAB, LabTopBar, StepIndicator } from "../ui";
import { MarkerPin } from "./map-markers";

/* Tutoriel en 5 étapes : une idée par écran, aucune avance automatique, clavier (← →) et balayage. */

const STEPS: { title: string; text: string; visual: () => ReactNode }[] = [
  { title: "Choisis un parc.", text: "Des aventures t'attendent près de chez toi.", visual: () => <ParkScene withStart className="block h-auto w-full" /> },
  { title: "Suis les indices.", text: "Observe, avance à ton rythme et découvre les secrets du lieu.", visual: () => <MiniDiorama /> },
  { title: "Garde tes découvertes.", text: "Chaque aventure enrichit ta collection.", visual: () => <Showcase /> },
  { title: "Réveille ton œuf.", text: "Tes découvertes donnent de l'énergie à ton futur compagnon.", visual: () => <TouchEgg /> },
  { title: "Grandis avec ton gardien.", text: "Il évolue avec les parcs et histoires que tu explores.", visual: () => <EvolutionPath /> },
];

/** Direction de la dernière navigation (pour l'entrée douce, gauche ou droite). */
let lastStep = 0;

export function OnboardingScreen({ step }: { step: number }) {
  const router = useRouter();
  const [dir] = useState(() => (step >= lastStep ? "next" : "prev"));
  const heading = useRef<HTMLHeadingElement>(null);
  const touch = useRef<number | null>(null);
  const s = STEPS[step - 1];
  const last = step === STEPS.length;
  const nextHref = last ? `${LAB}/choose-egg` : `${LAB}/onboarding/${step + 1}`;
  const prevHref = step > 1 ? `${LAB}/onboarding/${step - 1}` : undefined;

  useEffect(() => {
    lastStep = step;
    heading.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") router.push(nextHref);
      if (e.key === "ArrowLeft" && prevHref) router.push(prevHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, nextHref, prevHref, router]);

  return (
    <main
      className="flex min-h-full flex-col"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (dx < -70) router.push(nextHref);
        else if (dx > 70 && prevHref) router.push(prevHref);
      }}
    >
      <LabTopBar back={prevHref} title="Découvrir ParkQuest" />
      <div className="flex items-center justify-between px-5 pt-1">
        <StepIndicator step={step} />
        {!last && (
          <Link href={`${LAB}/choose-egg`} className="flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--lab-ink-soft)] underline-offset-4 hover:underline">
            Passer
          </Link>
        )}
      </div>
      <div key={step} className={cn("flex flex-1 flex-col px-5 pt-4", dir === "next" ? "lab-enter-next" : "lab-enter-prev")}>
        <div className="lab-card overflow-hidden">{s.visual()}</div>
        <h1 ref={heading} tabIndex={-1} className="lab-serif mt-7 text-[2rem] leading-tight font-bold text-[var(--lab-forest-deep)] outline-none">
          {s.title}
        </h1>
        <p className="mt-2 text-[1.0625rem] leading-relaxed text-[var(--lab-ink-soft)]">{s.text}</p>
      </div>
      <BottomActions>
        <Link href={nextHref} className={cn("lab-btn", last ? "lab-btn-amber" : "lab-btn-primary")}>
          {last ? "Choisir mon œuf" : "Suivant"}
        </Link>
      </BottomActions>
    </main>
  );
}

function MiniDiorama() {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const markers = MARKERS.filter((m) => ["start", "clue", "adventure", "player"].includes(m.id));
  return (
    <div ref={ref} className="relative aspect-[6/5] w-full">
      <Diorama theme="day" size={size} camera={{ ...HOME_CAMERA, x: 420, y: 600, zoom: 0.62 }} anchorY={0.62} markers={markers} renderMarker={(m) => <MarkerPin m={m} compact />} />
      <p className="absolute left-3 top-3 rounded-full bg-[rgba(255,250,240,.92)] px-3 py-1 text-xs font-bold text-[var(--lab-forest)] shadow">Indice 1 · Une écorce rousse</p>
    </div>
  );
}

function TouchEgg() {
  const [n, setN] = useState(0);
  return (
    <div className="relative grid place-items-center bg-[radial-gradient(circle_at_50%_55%,#fbefd0,transparent_70%)] py-4">
      <button type="button" onClick={() => setN((x) => x + 1)} aria-label="Toucher l'œuf" className="rounded-full">
        <span key={n} className={cn("block", n > 0 && "lab-wiggle")}>
          <EggArt egg="forest" state="reactive" className="h-60 w-auto" />
        </span>
      </button>
      <p className="pb-1 text-xs font-semibold text-[var(--lab-ink-soft)]">Touche l&apos;œuf</p>
    </div>
  );
}

const PATH_NODES: { stage: StageId; x: number; y: number }[] = [
  { stage: "egg", x: 4, y: 64 },
  { stage: "young", x: 52, y: 52 },
  { stage: "explorer", x: 14, y: 29 },
  { stage: "guardian", x: 62, y: 16 },
  { stage: "lunar", x: 30, y: 2 },
];
/* Centre d'un nœud (largeur 30 %, pastille 78 % de cette largeur, conteneur carré) */
const center = (n: { x: number; y: number }) => `${n.x + 15} ${n.y + 11.7}`;

/** Silhouette neutre d'une forme future (visuel à créer) : ne préfigure aucun dessin. */
function FutureSilhouette({ night }: { night?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="h-[62%] w-auto" aria-hidden>
      <ellipse cx="20" cy="35" rx="13" ry="3" fill={night ? "#fff" : "#1d2a22"} opacity="0.18" />
      <path d="M20 6 C 29 6, 32 14, 31 21 C 30 29, 26 33, 20 33 C 14 33, 10 29, 9 21 C 8 14, 11 6, 20 6 Z" fill={night ? "#fff" : "#1d2a22"} opacity="0.16" />
      <text x="20" y="25" textAnchor="middle" fontSize="12" fontWeight="700" fill={night ? "#fff" : "#1d2a22"} opacity="0.45">
        ?
      </text>
    </svg>
  );
}

/** Collection : étagères de trouvailles, le compagnon (nouvelle image) sur la place du milieu. */
function Showcase() {
  return (
    <div className="relative">
      <ShowcaseScene className="block h-auto w-full" />
      <CreatureImage id="leaf" className="absolute left-1/2 top-[23%] h-[24%] -translate-x-1/2" alt="" sizes="100px" />
    </div>
  );
}

/** Mini-arbre d'évolution : compagnon disponible, formes futures en silhouettes « Visuel à créer ». */
export function EvolutionPath({ known = 2 }: { known?: number }) {
  return (
    <div className="relative aspect-square w-full bg-[linear-gradient(180deg,#e7e4f3_0%,#f6efdc_45%,#f8f2e4_100%)]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <path d={`M${PATH_NODES.map(center).join(" L")}`} stroke="#d9b36a" strokeWidth="0.9" strokeDasharray="1.5 2.5" strokeLinejoin="round" fill="none" />
      </svg>
      <ol className="absolute inset-0" aria-label="Évolution du compagnon">
        {PATH_NODES.map((n, i) => (
          <li key={n.stage} className="absolute flex w-[30%] flex-col items-center" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <span className={cn("grid aspect-square w-[78%] place-items-center rounded-full", n.stage === "lunar" ? "bg-[#2c4677]" : "bg-[rgba(255,250,240,.85)]", "shadow-[0_6px_16px_-8px_rgba(23,41,75,.5)]")}>
              {n.stage === "egg" ? (
                <EggArt egg="forest" nest={false} halo={false} className="h-[80%] w-auto" />
              ) : n.stage === "young" ? (
                // Compagnon disponible : nouvelle image de Mossy
                <CreatureImage id="leaf" className="h-[94%]" alt="" sizes="120px" />
              ) : (
                // Formes futures : aucune image n'existe encore, silhouette neutre (pas d'ancienne forme SVG)
                <FutureSilhouette night={n.stage === "lunar"} />
              )}
            </span>
            <span className="mt-1 rounded-full bg-[rgba(255,250,240,.9)] px-2 text-center text-[10px] leading-tight font-bold text-[var(--lab-ink)]">
              {STAGE_LABEL[n.stage]}
              {i >= known && <span className="block font-semibold text-[var(--lab-ink-soft)]">Visuel à créer</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
