"use client";

import { ArrowUp, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { LatLng } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { bearingDeg, distanceM, walkingMinutes } from "@/lib/geo";

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/**
 * Guidage simple vers un lieu : distance, temps, direction (nord en haut de la carte).
 * ParkQuest ne remplace pas une app de navigation : il oriente vers le prochain lieu.
 */
export function GuidePanel({ name, target, origin, onStop, children }: { name: string; target: LatLng; origin: LatLng; onStop(): void; children?: ReactNode }) {
  const t = useTranslations("geo");
  const locale = useLocale();
  const d = distanceM(origin, target);
  const b = bearingDeg(origin, target);
  const dir = DIRS[Math.round(b / 45) % 8];
  const close = d <= 40;
  return (
    <section aria-live="polite" className="glass-strong pointer-events-auto rounded-[var(--radius-sheet)] p-4 card-shadow">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground" aria-hidden>
          <ArrowUp className="size-7 transition-transform duration-500" style={{ transform: `rotate(${b}deg)` }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{close ? t("arrived") : t("direction", { dir: t(`dirs.${dir}`) })}</p>
          <h2 className="truncate font-display text-xl font-extrabold leading-tight">{t("guidingTo", { name })}</h2>
          <p className="text-sm font-semibold tabular-nums">
            {formatDistance(d, locale)} · {walkingMinutes(d)} min
          </p>
        </div>
        <button type="button" onClick={onStop} aria-label={t("stopGuiding")} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-inset">
          <X className="size-5" />
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("guideHint")}</p>
      {children && <div className="mt-3">{children}</div>}
    </section>
  );
}
