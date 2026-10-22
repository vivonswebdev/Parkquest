"use client";

import { ChevronDown, ChevronUp, EyeOff, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** États du panneau inférieur d'une carte. */
export type PanelMode = "expanded" | "collapsed" | "hidden";

const MOBILE = "(max-width: 767px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * État du panneau : réduit par défaut sur téléphone (la carte d'abord), ouvert sur grand écran.
 * Le choix de l'utilisateur prime ensuite.
 */
export function useDefaultPanelMode(chosen: PanelMode | null): PanelMode {
  const mobile = useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE).matches, () => false);
  return chosen ?? (mobile ? "collapsed" : "expanded");
}

/** Bouton « Réduire le panneau », à placer dans l'en-tête du panneau ouvert. */
export function PanelCollapseButton({ onClick }: { onClick(): void }) {
  const t = useTranslations("map");
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("panelCollapse")}
      title={t("panelCollapse")}
      className="-my-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-inset hover:bg-white/10"
    >
      <ChevronDown className="size-5" />
    </button>
  );
}

/**
 * Panneau réductible : ouvert (contenu fourni), réduit (petite barre : poignée, titre court,
 * nombre, ouvrir, masquer) ou masqué (carte maximale, seule une pastille permet de le rappeler).
 */
export function MapPanel({
  mode,
  onModeChange,
  title,
  count,
  children,
  className,
}: {
  mode: PanelMode;
  onModeChange(m: PanelMode): void;
  title: string;
  /** Texte court du nombre d'éléments (ex. « 12 lieux »). */
  count: string;
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations("map");
  if (mode === "expanded") return <>{children}</>;
  if (mode === "hidden") {
    return (
      <div className={cn("flex justify-start", className)}>
        <button
          type="button"
          onClick={() => onModeChange("collapsed")}
          className="glass-strong pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold card-shadow"
        >
          <List className="size-4" aria-hidden /> {t("panelShow", { title, count })}
        </button>
      </div>
    );
  }
  return (
    <section aria-label={title} className={cn("glass-strong pointer-events-auto rounded-[var(--radius-sheet)] px-3 pb-2 pt-1.5 card-shadow", className)}>
      <button type="button" onClick={() => onModeChange("expanded")} aria-label={t("panelExpand")} className="flex w-full justify-center py-1">
        <span aria-hidden className="h-1 w-10 rounded-full bg-foreground/25" />
      </button>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onModeChange("expanded")} className="min-w-0 flex-1 text-left">
          <span className="block truncate font-display text-base font-extrabold leading-tight">{title}</span>
          <span className="block text-xs text-muted-foreground">{count}</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("expanded")}
          aria-label={t("panelExpand")}
          title={t("panelExpand")}
          className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <ChevronUp className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => onModeChange("hidden")}
          aria-label={t("panelHide")}
          title={t("panelHide")}
          className="inline-flex size-10 items-center justify-center rounded-full bg-inset"
        >
          <EyeOff className="size-4" />
        </button>
      </div>
    </section>
  );
}
