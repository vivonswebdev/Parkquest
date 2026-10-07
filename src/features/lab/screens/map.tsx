"use client";

import { ArrowLeft, ChevronDown, ChevronUp, LocateFixed, MapPinOff, Minus, Moon, Plus, Send, Sun, SunMoon, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { cn } from "@/lib/utils";
import { Diorama, HOME_CAMERA, MARKERS, TILT, WORLD, useElementSize, type Camera, type MapTheme } from "../art/diorama";
import { EggArt } from "../art/egg";
import { eggById } from "../creatures";
import { LAB, ProgressBar } from "../ui";
import { useLabState } from "../use-lab-state";
import { MarkerPin } from "./map-markers";

type ThemeMode = MapTheme | "auto";

const SUGGESTIONS = ["Je suis près du séquoia.", "Je viens de trouver un indice !", "On se retrouve au point de départ ?"];
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 2.2;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const autoTheme = (): MapTheme => {
  const h = new Date().getHours();
  return h >= 7 && h < 20 ? "day" : "night";
};

const INFO: Record<string, string> = {
  start: "Point de départ de l'aventure, sur la petite place.",
  clue: "Indice 1 : une écorce rousse et fibreuse.",
  egg: "Une découverte t'attend ici : elle donnera de l'énergie à ton œuf.",
  adventure: "Le Secret du Séquoia · étape finale.",
  player: "Ta position simulée (aucun GPS utilisé).",
};

export function MapScreen({ initialTheme }: { initialTheme: MapTheme }) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [mode, setMode] = useState<ThemeMode>(initialTheme);
  const [auto, setAuto] = useState<MapTheme>(initialTheme);
  const theme: MapTheme = mode === "auto" ? auto : mode;
  const [cam, setCam] = useState<Camera>(HOME_CAMERA);
  const [animated, setAnimated] = useState(false);
  const [panel, setPanel] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [lina, setLina] = useState(false);
  const [toast, setToast] = useState(false);
  const { state } = useLabState();
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; zoom: number } | null>(null);
  const moved = useRef(0);

  // Exemple de notification contextuelle (simulée, une seule fois)
  useEffect(() => {
    const t = setTimeout(() => setToast(true), 3500);
    return () => clearTimeout(t);
  }, []);

  const chooseMode = (m: ThemeMode) => {
    if (m === "auto") setAuto(autoTheme());
    setMode(m);
    // Thème reflété dans l'adresse sans recharger la page : la position de la carte est conservée
    const t = m === "auto" ? autoTheme() : m;
    window.history.replaceState(window.history.state, "", `?theme=${t}${m === "auto" ? "&auto=1" : ""}`);
  };

  const flyTo = (x: number, y: number, zoom = cam.zoom) => {
    setAnimated(true);
    setCam({ x, y, zoom });
    setTimeout(() => setAnimated(false), 650);
  };

  const zoomBy = (f: number) => {
    setAnimated(true);
    setCam((c) => ({ ...c, zoom: clamp(c.zoom * f, MIN_ZOOM, MAX_ZOOM) }));
    setTimeout(() => setAnimated(false), 650);
  };

  const pan = (dx: number, dy: number) =>
    setCam((c) => ({
      ...c,
      x: clamp(c.x - dx / c.zoom, 60, WORLD - 60),
      y: clamp(c.y - dy / (c.zoom * Math.cos((TILT * Math.PI) / 180)), 60, WORLD - 60),
    }));

  const onDown = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest("button,a")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: cam.zoom };
    }
  };
  const onMove = (e: RPointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setCam((c) => ({ ...c, zoom: clamp((pinch.current!.zoom * d) / pinch.current!.d, MIN_ZOOM, MAX_ZOOM) }));
    } else {
      moved.current += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y);
      pan(cur.x - prev.x, cur.y - prev.y);
    }
  };
  const onUp = (e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const select = (id: string) => {
    if (id === "friend") {
      setLina(true);
      return;
    }
    setSelected(id);
    setPanel(true);
  };

  const night = theme === "night";
  const egg = eggById(state.egg);
  const selectedMarker = MARKERS.find((m) => m.id === selected);

  return (
    <main className={cn("relative h-full overflow-hidden", night ? "bg-[#0f1b38]" : "bg-[#f3ead2]")}>
      <div
        ref={ref}
        className="absolute inset-0 touch-none select-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => setCam((c) => ({ ...c, zoom: clamp(c.zoom * (e.deltaY < 0 ? 1.08 : 0.93), MIN_ZOOM, MAX_ZOOM) }))}
        role="application"
        aria-label={`Carte de démonstration, ${night ? "ambiance de nuit" : "ambiance de jour"}. Glisser pour déplacer, pincer pour zoomer.`}
      >
        <Diorama
          anchorY={0.42}
          theme={theme}
          size={size}
          camera={cam}
          animated={animated}
          markers={MARKERS}
          renderMarker={(m) => <MarkerPin m={m} selected={selected === m.id} onSelect={select} />}
        />
      </div>

      {/* En-tête */}
      <div className="lab-safe-top pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 px-3">
        <Link href={`${LAB}/home`} aria-label="Retour à l'accueil" className="pointer-events-auto grid size-11 place-items-center rounded-full bg-[rgba(255,250,240,0.92)] text-[var(--lab-ink)] shadow">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div className="pointer-events-auto min-w-0 flex-1 rounded-full bg-[rgba(255,250,240,0.92)] px-3 py-1.5 text-center shadow">
          <p className="truncate text-sm font-extrabold text-[var(--lab-ink)]">Parc des Quatre Vents</p>
          <p className="text-[11px] text-[var(--lab-ink-soft)]">Lieu fictif · démo</p>
        </div>
        <div role="radiogroup" aria-label="Ambiance de la carte" className="pointer-events-auto flex rounded-full bg-[rgba(255,250,240,0.92)] p-1 shadow">
          {(
            [
              ["day", "Jour", Sun],
              ["night", "Nuit", Moon],
              ["auto", "Automatique", SunMoon],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              aria-label={label}
              title={label}
              onClick={() => chooseMode(m)}
              className={cn("grid size-9 place-items-center rounded-full transition-colors", mode === m ? (m === "night" ? "bg-[#17294b] text-[#f3c86e]" : "bg-[var(--lab-amber)] text-[#2a1a00]") : "text-[var(--lab-ink-soft)]")}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      {/* Notification simulée */}
      {toast && (
        <div role="status" className="lab-fade-up absolute inset-x-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+3.75rem)] flex items-center gap-3 rounded-[20px] bg-[rgba(255,250,240,0.96)] p-3 text-[var(--lab-ink)] shadow-lg">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#a48ad6] font-extrabold text-white">L</span>
          <p className="flex-1 text-sm">
            <strong>Lina</strong> a découvert une trace près du séquoia.
            <button
              type="button"
              className="ml-1 font-bold text-[var(--lab-forest)] underline"
              onClick={() => {
                setToast(false);
                flyTo(500, 500, 1.3);
              }}
            >
              Voir sur la carte
            </button>
          </p>
          <button type="button" aria-label="Fermer la notification" onClick={() => setToast(false)} className="grid size-11 place-items-center rounded-full">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {/* Contrôles */}
      <div className="absolute right-3 top-[30%] flex flex-col gap-2">
        {[
          { label: "Zoomer", Icon: Plus, fn: () => zoomBy(1.25) },
          { label: "Dézoomer", Icon: Minus, fn: () => zoomBy(0.8) },
          { label: "Recentrer sur ma position simulée", Icon: LocateFixed, fn: () => flyTo(HOME_CAMERA.x, HOME_CAMERA.y, 1) },
        ].map(({ label, Icon, fn }) => (
          <button key={label} type="button" aria-label={label} onClick={fn} className="grid size-11 place-items-center rounded-full bg-[rgba(255,250,240,0.92)] text-[var(--lab-ink)] shadow">
            <Icon className="size-5" aria-hidden />
          </button>
        ))}
      </div>

      {/* Panneau bas translucide, réductible */}
      <section
        aria-label="Aventure en cours"
        className={cn(
          "lab-safe-bottom absolute inset-x-0 bottom-0 rounded-t-[28px] px-4 pt-2 backdrop-blur-md transition-colors",
          night ? "bg-[rgba(23,41,75,0.82)] text-[#f8f2e4]" : "bg-[rgba(255,250,240,0.86)] text-[var(--lab-ink)]",
        )}
      >
        <button type="button" onClick={() => setPanel((p) => !p)} aria-expanded={panel} className="mx-auto flex min-h-11 w-full items-center justify-center gap-1 text-sm font-bold">
          <span className={cn("h-1.5 w-10 rounded-full", night ? "bg-white/30" : "bg-black/15")} aria-hidden />
          {panel ? <ChevronDown className="size-4" aria-hidden /> : <ChevronUp className="size-4" aria-hidden />}
          <span className="sr-only">{panel ? "Réduire le panneau" : "Afficher le panneau"}</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-[#f6c66b] to-[#d98a1c] text-lg text-white" aria-hidden>
            ★
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold">Le Secret du Séquoia</p>
            <p className={cn("text-sm", night ? "text-white/75" : "text-[var(--lab-ink-soft)]")}>Étape 2 sur 4 · Indice : l&apos;écorce rousse</p>
          </div>
        </div>
        {panel && (
          <div className="lab-fade-up mt-3 space-y-3 pb-1">
            {selectedMarker && INFO[selectedMarker.id] && (
              <p className={cn("rounded-2xl px-3 py-2 text-sm", night ? "bg-white/10" : "bg-[rgba(31,90,61,0.07)]")} role="status">
                <strong>{selectedMarker.label} :</strong> {INFO[selectedMarker.id]}
              </p>
            )}
            <div className="flex items-center gap-3">
              <EggArt egg={state.egg} state="reactive" nest={false} halo={false} className="h-12 w-10 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold">{egg.label}</p>
                <ProgressBar value={Math.min(state.discoveries, 3)} max={3} label="Énergie de l'œuf" tone="amber" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLina(true)} className={cn("flex min-h-11 flex-1 items-center gap-2 rounded-2xl px-3 text-left text-sm", night ? "bg-white/10" : "bg-[rgba(31,90,61,0.07)]")}>
                <span className="grid size-8 place-items-center rounded-full bg-[#a48ad6] text-xs font-extrabold text-white">L</span>
                <span>
                  <strong>Lina</strong> · étape 2/4
                </span>
              </button>
              <span className={cn("inline-flex min-h-11 items-center gap-1 rounded-2xl px-3 text-xs font-bold", night ? "bg-white/10" : "bg-[rgba(31,90,61,0.07)]")}>
                <MapPinOff className="size-4" aria-hidden /> Position non partagée
              </span>
            </div>
          </div>
        )}
      </section>

      {lina && <LinaSheet onClose={() => setLina(false)} onShow={() => (setLina(false), flyTo(452, 576, 1.3))} />}
    </main>
  );
}

function LinaSheet({ onClose, onShow }: { onClose(): void; onShow(): void }) {
  const [view, setView] = useState<"menu" | "message" | "share" | "progress" | "join">("menu");
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const row = "flex min-h-12 w-full items-center rounded-2xl bg-[rgba(31,90,61,0.07)] px-4 text-left font-bold";
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-[rgba(23,41,75,0.35)]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="lab-lina" onClick={(e) => e.stopPropagation()} className="lab-card lab-fade-up lab-safe-bottom w-full rounded-b-none p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-[#a48ad6] text-lg font-extrabold text-white">L</span>
          <div className="flex-1">
            <h2 id="lab-lina" className="text-lg font-extrabold">
              Lina
            </h2>
            <p className="text-sm text-[var(--lab-ink-soft)]">En exploration · Étape 2 sur 4</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose} className="grid size-11 place-items-center rounded-full">
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {view === "menu" && (
          <div className="mt-4 grid gap-2">
            <button type="button" autoFocus className={row} onClick={() => setView("progress")}>
              Voir sa progression
            </button>
            <button type="button" className={row} onClick={() => setView("message")}>
              Envoyer un message
            </button>
            <button type="button" className={row} onClick={() => setView("share")}>
              Partager ma position
            </button>
            <button type="button" className={row} onClick={() => setView("join")}>
              Rejoindre l&apos;aventure
            </button>
          </div>
        )}

        {view === "progress" && (
          <div className="mt-4 space-y-3">
            <ProgressBar value={2} max={4} label="Progression de Lina : 2 étapes sur 4" />
            <p className="text-sm">Lina a trouvé 2 indices sur 4 du Secret du Séquoia.</p>
            <button type="button" className="lab-btn lab-btn-ghost w-full" onClick={onShow}>
              Voir sur la carte
            </button>
          </div>
        )}

        {view === "message" && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              setSent((s) => [...s, text.trim()]);
              setText("");
            }}
          >
            {sent.length > 0 && (
              <ul className="space-y-1.5" aria-label="Messages de démonstration">
                {sent.map((m, i) => (
                  <li key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[var(--lab-forest)] px-3 py-2 text-sm text-white">
                    {m}
                    <span className="block text-[10px] opacity-75">Non envoyé · démonstration locale</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setText(s)} className="min-h-10 rounded-full bg-[rgba(31,90,61,0.08)] px-3 text-sm font-semibold">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <label htmlFor="lab-msg" className="sr-only">
                Message pour Lina
              </label>
              <input id="lab-msg" value={text} onChange={(e) => setText(e.target.value)} maxLength={140} placeholder="Écrire à Lina…" className="h-12 flex-1 rounded-2xl border-2 border-[rgba(31,90,61,0.18)] bg-white px-3" />
              <button type="submit" aria-label="Envoyer (démonstration)" className="grid size-12 place-items-center rounded-2xl bg-[var(--lab-forest)] text-white">
                <Send className="size-5" aria-hidden />
              </button>
            </div>
            <p className="text-xs text-[var(--lab-ink-soft)]">Démonstration : aucun message n&apos;est réellement envoyé.</p>
          </form>
        )}

        {view === "share" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">
              Par défaut, ta position n&apos;est jamais partagée. Si tu l&apos;actives, seule Lina la verrait, pendant cette aventure uniquement.
            </p>
            <label className="flex min-h-12 items-center justify-between rounded-2xl bg-[rgba(31,90,61,0.07)] px-4 font-bold">
              Partager avec Lina (démo)
              <input type="checkbox" checked={sharing} onChange={(e) => setSharing(e.target.checked)} className="size-6 accent-[var(--lab-forest)]" />
            </label>
            <p role="status" className="text-sm font-semibold">
              {sharing ? "Démonstration : partage simulé, rien n'est envoyé ni enregistré." : "Position non partagée"}
            </p>
          </div>
        )}

        {view === "join" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">Vous suivriez le même parcours, chacun à son rythme. Chaque découverte reste dans ta propre collection.</p>
            <button type="button" className="lab-btn lab-btn-primary w-full" onClick={onClose}>
              Rejoindre (démo)
            </button>
          </div>
        )}

        {view !== "menu" && (
          <button type="button" onClick={() => setView("menu")} className="mt-3 min-h-11 w-full text-sm font-bold text-[var(--lab-forest)]">
            Retour
          </button>
        )}
      </div>
    </div>
  );
}
