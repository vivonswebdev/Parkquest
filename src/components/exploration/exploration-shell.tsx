"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Enveloppe plein écran d'une expérience carte immersive (suivi de visite, futur Mode Exploration).
 *
 * Pseudo-plein-écran CSS (fonctionne sur iPhone, où l'API Fullscreen n'est pas disponible pour
 * une page web) : `position: fixed` sur toute la zone visible, zones sûres de l'encoche gérées par
 * les emplacements, navigation du site recouverte (z-index au-dessus de la barre du bas / de
 * l'en-tête), défilement de la page bloqué pendant l'expérience (pas de rebond élastique).
 *
 * Emplacements : la carte en premier (plein cadre), puis ExplorationTopBar, ExplorationControls,
 * ExplorationBottomPanel et ExplorationDialog.
 */
export function ExplorationShell({ children, className }: { children: ReactNode; className?: string }) {
  useImmersiveDocument();
  return <div className={cn("fixed inset-0 z-[44] bg-background", className)}>{children}</div>;
}

/** Barre supérieure flottante (sous l'encoche). */
export function ExplorationTopBar({ children }: { children: ReactNode }) {
  return <div className="absolute inset-x-0 top-0 z-20 p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">{children}</div>;
}

/** Colonne de contrôles flottants à droite, centrée verticalement. */
export function ExplorationControls({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2", className)}>{children}</div>;
}

/** Bouton rond de contrôle de carte (recentrer, 2D/3D, orientation…). */
export function ExplorationControlButton({ label, onClick, active, children }: { label: string; onClick(): void; active?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn("glass-strong inline-flex size-12 items-center justify-center rounded-full", active && "text-primary ring-1 ring-primary/40")}
    >
      {children}
    </button>
  );
}

/** Panneau inférieur (au-dessus de la barre d'accueil iPhone). */
export function ExplorationBottomPanel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 p-3 safe-bottom">
      <div className="mx-auto max-w-xl space-y-2">{children}</div>
    </div>
  );
}

/** Boîte de dialogue au-dessus de la carte (confirmation de sortie…). */
export function ExplorationDialog({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby={labelledBy} className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center">
      <div className="glass-strong w-full max-w-sm rounded-[var(--radius-sheet)] p-5">{children}</div>
    </div>
  );
}

/**
 * Bloque le défilement du document pendant l'expérience immersive (évite le rebond élastique
 * d'iOS et le défilement de la page derrière la carte) ; restauré à la sortie.
 */
function useImmersiveDocument() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("pq-immersive");
    return () => root.classList.remove("pq-immersive");
  }, []);
}
