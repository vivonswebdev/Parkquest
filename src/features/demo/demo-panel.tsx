"use client";

import { Award, FlaskConical, LocateFixed, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { pickTranslation } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";
import { demoData, demoUser } from "./demo-data";
import { DEMO_GEO_MODES, setDemoGeoMode, useDemoGeoMode } from "./demo-geo";
import { approvePendingDemoPhotos, onDemoBadgesUnlocked, resetDemoProgress, useDemoProgress } from "./demo-progress";

/**
 * Panneau du MODE DÉMO (affiché uniquement quand isDemoMode est vrai) :
 * position simulée, progression simulée, modération simulée, réinitialisation.
 */
export function DemoPanel() {
  const t = useTranslations("demo");
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const mode = useDemoGeoMode(true);
  const p = useDemoProgress();

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 2500);
    return () => window.clearTimeout(id);
  }, [flash]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        aria-expanded={open}
        data-testid="demo-panel-button"
        className="fixed left-0 top-[58%] z-[45] flex items-center gap-1 rounded-r-xl border border-l-0 border-gold/40 bg-background/80 px-1 py-2.5 text-gold backdrop-blur-md [writing-mode:vertical-rl] md:top-1/2"
      >
        <FlaskConical className="size-3.5 rotate-90" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Démo</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm md:items-center" onClick={() => setOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-panel-title"
            onClick={(e) => e.stopPropagation()}
            className="glass-strong max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[var(--radius-sheet)] p-5 card-shadow safe-bottom"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 id="demo-panel-title" className="flex items-center gap-2 font-display text-xl font-extrabold">
                  <FlaskConical className="size-5 text-gold" /> {t("title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("profile", { name: `${demoUser.displayName} (@${demoUser.username})` })}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="×" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-inset">
                <X className="size-5" />
              </button>
            </header>

            <fieldset className="mt-5">
              <legend className="mb-2 flex items-center gap-2 text-sm font-bold">
                <LocateFixed className="size-4 text-primary" /> {t("gps")}
              </legend>
              <div className="grid gap-1.5">
                {DEMO_GEO_MODES.map((m) => (
                  <label
                    key={m}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2 text-sm",
                      mode === m ? "border-primary bg-primary-soft font-semibold" : "border-border hover:border-primary/40",
                    )}
                  >
                    <input type="radio" name="demo-geo" value={m} checked={mode === m} onChange={() => setDemoGeoMode(m)} className="accent-[var(--primary)]" />
                    {t(`modes.${m}`)}
                  </label>
                ))}
              </div>
              {mode === "real" && <p className="mt-2 text-xs text-gold">{t("realHint")}</p>}
            </fieldset>

            <div className="mt-5">
              <p className="mb-2 text-sm font-bold">{t("progress")}</p>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { v: p.points, l: t("points") },
                  { v: p.discovered.length, l: t("spots") },
                  { v: p.badges.length, l: t("badges") },
                  { v: p.visits, l: t("visits") },
                ].map((x) => (
                  <div key={x.l} className="rounded-2xl bg-inset px-1 py-2.5">
                    <p className="font-display text-lg font-extrabold tabular-nums">{x.v}</p>
                    <p className="text-[10.5px] text-muted-foreground">{x.l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => {
                  const n = approvePendingDemoPhotos();
                  setFlash(n ? t("approved", { count: n }) : t("noPending"));
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold hover:bg-primary-soft"
              >
                <ShieldCheck className="size-4 text-primary" /> {t("approvePhotos")}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoProgress();
                  setFlash(t("resetDone"));
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-danger/40 text-sm font-semibold text-danger hover:bg-danger/10"
              >
                <RotateCcw className="size-4" /> {t("reset")}
              </button>
              {flash && (
                <p role="status" className="text-center text-sm font-medium text-primary">
                  {flash}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

/** Notification « Badge débloqué » (mode démo). */
export function DemoBadgeToaster() {
  const t = useTranslations("demo");
  const locale = useLocale();
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => onDemoBadgesUnlocked((keys) => setQueue((q) => [...q, ...keys])), []);
  useEffect(() => {
    if (!queue.length) return;
    const id = window.setTimeout(() => setQueue((q) => q.slice(1)), 3800);
    return () => window.clearTimeout(id);
  }, [queue]);

  const key = queue[0];
  if (!key) return null;
  const badge = demoData.badges.find((b) => b.key === key);
  const name = badge ? (pickTranslation(badge.translations, locale)?.value.name ?? key) : key;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <div className="glass-strong glow-mint flex items-center gap-3 rounded-full py-2 pl-2 pr-5 animate-in fade-in slide-in-from-top-4 duration-300">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-mint to-green text-primary-foreground">
          <Award className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">{t("badgeUnlocked")}</span>
          <span className="block font-display font-bold">{name}</span>
        </span>
      </div>
    </div>
  );
}
