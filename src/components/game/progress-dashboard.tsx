"use client";

import { Camera, Check, Footprints, Lock, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { iconByName } from "@/components/shared/icons";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { Badge, Challenge, UserStats } from "@/lib/domain/types";
import { useDemoProgress } from "@/lib/game/demo-progress";
import { cn } from "@/lib/utils";

export interface LiveProgress {
  stats: UserStats;
  discoveredSpotIds: string[];
  badgeKeys: string[];
  username: string;
}

/** Statistiques unifiées : serveur si connecté, sinon progression démo locale. */
export function useUnifiedProgress(live: LiveProgress | null) {
  const demo = useDemoProgress();
  if (live) return { mode: "live" as const, ...live };
  const quizzesPassed = Object.values(demo.quizAttempts).filter(Boolean).length;
  const stats: UserStats = {
    totalPoints: demo.points,
    visits: demo.visits,
    spotsDiscovered: demo.discovered.length,
    distanceM: demo.distanceM,
    photosApproved: 0,
    badges: 0,
    quizzesPassed,
  };
  return { mode: "demo" as const, stats, discoveredSpotIds: demo.discovered, badgeKeys: [] as string[], username: "", challenges: demo.challenges };
}

export function badgeUnlocked(b: Badge, s: UserStats, trailsDone = 0): boolean {
  const v =
    b.criteria === "SPOTS_DISCOVERED"
      ? s.spotsDiscovered
      : b.criteria === "QUIZZES_PASSED"
        ? s.quizzesPassed
        : b.criteria === "PHOTOS_APPROVED"
          ? s.photosApproved
          : b.criteria === "DISTANCE_M"
            ? s.distanceM
            : b.criteria === "TRAILS_COMPLETED"
              ? trailsDone
              : 0;
  return v >= b.threshold;
}

export function BadgeGrid({ badges, live }: { badges: Badge[]; live: LiveProgress | null }) {
  const t = useTranslations("challenges");
  const p = useUnifiedProgress(live);
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
      {badges.map((b) => {
        const on = p.mode === "live" ? p.badgeKeys.includes(b.key) : badgeUnlocked(b, p.stats);
        const Icon = iconByName(b.icon);
        return (
          <div key={b.id} className={cn("flex flex-col items-center gap-2 rounded-[20px] border p-3 text-center", on ? "border-primary/40 bg-primary-soft" : "border-border bg-surface")}>
            <span className={cn("relative inline-flex size-14 items-center justify-center rounded-full", on ? "bg-gradient-to-br from-mint to-green text-primary-foreground glow-mint" : "bg-muted text-muted-foreground")}>
              <Icon className="size-6" />
              {!on && <Lock className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-background p-0.5" />}
            </span>
            <span className="text-xs font-semibold leading-tight">{b.name}</span>
            <span className="text-[10px] text-muted-foreground">{on ? t("unlocked") : b.description ?? t("locked")}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ChallengeList({ challenges, live }: { challenges: Challenge[]; live: LiveProgress | null }) {
  const p = useUnifiedProgress(live);
  const demoCh = p.mode === "demo" ? p.challenges : {};
  return (
    <Card className="divide-y divide-border">
      {challenges.map((c) => {
        const status = demoCh[c.id];
        const target = c.targetValue;
        const progress =
          c.type === "QUIZ_STREAK" ? p.stats.quizzesPassed : c.type === "WALK" ? Math.round(p.stats.distanceM) : undefined;
        const done = status === "APPROVED" || (target !== undefined && progress !== undefined && progress >= target);
        const Icon = c.type === "PHOTO" ? Camera : c.type === "WALK" ? Footprints : Sparkles;
        return (
          <div key={c.id} className="flex items-center gap-3 p-4">
            <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-2xl", done ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary")}>
              {done ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("font-medium leading-snug", done && "text-muted-foreground line-through")}>{c.title}</p>
              {target !== undefined && progress !== undefined && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (progress / target) * 100)}%` }} />
                </div>
              )}
              {status === "PENDING" && <p className="mt-0.5 text-xs text-gold">⏳</p>}
            </div>
            <Pill tone="gold" size="sm">+{c.pointsValue}</Pill>
          </div>
        );
      })}
    </Card>
  );
}

export function PointsHeadline({ live }: { live: LiveProgress | null }) {
  const p = useUnifiedProgress(live);
  return <span className="font-display text-5xl font-extrabold text-primary">+{p.stats.totalPoints}</span>;
}

export function StatsGrid({ live, labels }: { live: LiveProgress | null; labels: { visits: string; spots: string; distance: string; photos: string; badges: string } }) {
  const p = useUnifiedProgress(live);
  const locale = useLocale();
  const items = [
    { v: p.stats.visits, l: labels.visits },
    { v: p.stats.spotsDiscovered, l: labels.spots },
    { v: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(p.stats.distanceM / 1000), l: labels.distance },
    { v: p.stats.photosApproved, l: labels.photos },
    { v: p.stats.badges, l: labels.badges },
  ];
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {items.map((i) => (
        <div key={i.l} className="rounded-2xl bg-black/25 px-1 py-3 text-center">
          <p className="font-display text-xl font-extrabold leading-none">{i.v}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">{i.l}</p>
        </div>
      ))}
    </div>
  );
}

export function LevelLine({ live }: { live: LiveProgress | null }) {
  const t = useTranslations("profile");
  const p = useUnifiedProgress(live);
  // Niveau simple : 1 niveau tous les 50 points (règle MVP, ajustable).
  const level = 1 + Math.floor(p.stats.totalPoints / 50);
  return <>{t("level", { level })}</>;
}
