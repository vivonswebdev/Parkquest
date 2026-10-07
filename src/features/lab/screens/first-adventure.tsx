"use client";

import { Clock, Footprints, Info, Route, Sparkles } from "lucide-react";
import Link from "next/link";
import { Diorama, MARKERS, useElementSize } from "../art/diorama";
import { BottomActions, DemoNote, LAB, LabTopBar } from "../ui";
import { MarkerPin } from "./map-markers";

export const ADVENTURE_STEPS = [
  { title: "Le point de départ", text: "Repère le drapeau près de la petite place." },
  { title: "L'écorce rousse", text: "Premier indice : une écorce douce comme du feutre." },
  { title: "Le banc des écureuils", text: "Écoute : qui grignote là-haut ?" },
  { title: "Le grand séquoia", text: "Lève les yeux et compte ses étages de branches." },
];

export function FirstAdventureScreen() {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const markers = MARKERS.filter((m) => ["start", "clue", "adventure"].includes(m.id));
  const facts = [
    { Icon: Clock, label: "35 à 45 min" },
    { Icon: Route, label: "4 étapes" },
    { Icon: Footprints, label: "Balade tranquille" },
    { Icon: Sparkles, label: "1 découverte pour réveiller l'œuf" },
  ];
  return (
    <main className="flex min-h-full flex-col">
      <LabTopBar back={`${LAB}/location-choice`} title="Ta première aventure" />
      <div className="lab-fade-up space-y-5 px-5 pt-1">
        <div ref={ref} className="lab-card relative aspect-[4/3] overflow-hidden">
          <Diorama theme="day" size={size} camera={{ x: 450, y: 560, zoom: 0.68 }} anchorY={0.6} markers={markers} renderMarker={(m) => <MarkerPin m={m} />} />
          <span className="absolute left-3 top-3 rounded-full bg-[var(--lab-amber)] px-3 py-1 text-xs font-extrabold text-[#2a1a00]">Aventure proposée</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--lab-ink-soft)]">Parc des Quatre Vents · lieu fictif</p>
          <h1 className="lab-serif mt-1 text-[2rem] leading-tight font-bold text-[var(--lab-forest-deep)]">Le Secret du Séquoia</h1>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {facts.map(({ Icon, label }) => (
            <li key={label} className="flex min-h-14 items-center gap-2 rounded-[18px] bg-[var(--lab-paper)] px-3 text-sm font-semibold">
              <Icon className="size-5 shrink-0 text-[var(--lab-forest)]" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
        <section aria-labelledby="lab-steps">
          <h2 id="lab-steps" className="text-lg font-extrabold">
            Les étapes
          </h2>
          <ol className="mt-2 space-y-2">
            {ADVENTURE_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3 rounded-[18px] bg-[var(--lab-paper)] p-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--lab-forest)] text-sm font-extrabold text-white">{i + 1}</span>
                <span>
                  <span className="block font-bold">{s.title}</span>
                  <span className="block text-sm text-[var(--lab-ink-soft)]">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <div className="flex gap-3 rounded-[22px] border-2 border-dashed border-[rgba(31,90,61,0.2)] p-4 text-sm text-[var(--lab-ink-soft)]">
          <Info className="mt-0.5 size-5 shrink-0 text-[var(--lab-forest)]" aria-hidden />
          <p>
            <strong className="text-[var(--lab-ink)]">Préparation :</strong> chaussures confortables, un peu d&apos;eau. Reste sur les sentiers et arrête-toi avant de regarder ton écran.
          </p>
        </div>
        <DemoNote>Démonstration : le lieu, la durée et les étapes sont fictifs.</DemoNote>
      </div>
      <BottomActions>
        <Link href={`${LAB}/first-discovery`} className="lab-btn lab-btn-primary">
          Commencer la démonstration
        </Link>
      </BottomActions>
    </main>
  );
}
