"use client";

import { Check, Clock, Footprints, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDistance } from "@/lib/format";
import { STEP_SYMBOL, type StepState, type TrailRemaining } from "@/lib/game/trail-progress";
import { cn } from "@/lib/utils";

/**
 * Progression d'un parcours : ✓ 1 · ✓ 2 · ◉ 3 · ○ 4 …, étape, restant (distance, durée, points).
 * Réutilisable : suivi de visite, fiche parcours, futur Mode Exploration.
 */
export function TrailProgress({
  trailName,
  states,
  stepIndex,
  remaining,
  compact,
  className,
}: {
  trailName: string;
  states: StepState[];
  /** Étape affichée « Étape X sur N » (0-based) */
  stepIndex: number;
  remaining: TrailRemaining;
  /** Version en-tête (visite) : pastilles + étape seulement */
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("visit");
  const locale = useLocale();
  const total = states.length;
  const allDone = remaining.found === total;

  return (
    <div className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1" aria-label={t("progressTitle")}>
        {states.map((s, i) => (
          <li
            key={i}
            aria-label={`${t("stepOf", { current: i + 1, total })} · ${t(`stepStates.${s}`)}`}
            className={cn(
              "flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full px-1.5 text-xs font-bold tabular-nums transition-colors",
              s === "done" && "bg-primary/15 text-primary",
              s === "current" && "bg-foreground text-background",
              s === "next" && "bg-primary text-primary-foreground shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_30%,transparent)]",
              s === "future" && "border border-dashed border-border text-muted-foreground",
            )}
          >
            <span aria-hidden className="text-[10px] leading-none">
              {s === "done" ? <Check className="size-3" strokeWidth={3} /> : STEP_SYMBOL[s]}
            </span>
            <span aria-hidden>{i + 1}</span>
          </li>
        ))}
      </ol>

      {compact && !allDone && (
        <p className="mt-1 flex flex-wrap gap-x-2.5 text-[11px] text-muted-foreground">
          <span>{t("remainingDistance", { distance: formatDistance(remaining.distanceM, locale) })}</span>
          <span>{t("remainingTime", { minutes: remaining.minutes })}</span>
          <span className="font-semibold text-gold">{t("pointsLeft", { points: remaining.points })}</span>
        </p>
      )}

      {!compact && (
        <>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            {allDone ? t("trailComplete") : t("stepOf", { current: stepIndex + 1, total })}
          </p>
          <p className="truncate font-semibold">{trailName}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-inset" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={remaining.percent} aria-label={t("progressTitle")}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${remaining.percent}%` }} />
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1">
              <Check className="size-3.5 text-primary" /> {t("discoveredCount", { count: remaining.found, total })}
            </li>
            {!allDone && (
              <>
                <li className="inline-flex items-center gap-1">
                  <Footprints className="size-3.5" /> {t("remainingDistance", { distance: formatDistance(remaining.distanceM, locale) })}
                </li>
                <li className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> {t("remainingTime", { minutes: remaining.minutes })}
                </li>
                <li className="inline-flex items-center gap-1 font-semibold text-gold">
                  <Sparkles className="size-3.5" /> {t("pointsLeft", { points: remaining.points })}
                </li>
              </>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
