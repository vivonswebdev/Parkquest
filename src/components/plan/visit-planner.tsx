"use client";

import { Check, Play, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { TrailCardClient } from "./trail-card-client";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { TrailAudience, TrailSummary, TrailTheme } from "@/lib/domain/types";
import { formatDuration } from "@/lib/format";
import { recommendTrail } from "@/lib/plan";
import { cn } from "@/lib/utils";

const TIMES = [30, 60, 120, 240, 480] as const;
const WITH = ["SOLO", "FAMILY", "KIDS", "SCHOOL", "SENIORS"] as const satisfies readonly TrailAudience[];
const INTERESTS: TrailTheme[] = ["ESSENTIALS", "TREES", "FLOWERS", "HISTORY", "PHOTO", "CALM", "PMR"];

export function VisitPlanner({ trails, parkSlug }: { trails: TrailSummary[]; parkSlug: string }) {
  const t = useTranslations();
  const [minutes, setMinutes] = useState<number>(60);
  const [audience, setAudience] = useState<TrailAudience>("FAMILY");
  const [interests, setInterests] = useState<TrailTheme[]>(["ESSENTIALS"]);
  const [show, setShow] = useState(false);
  const rec = useMemo(() => recommendTrail(trails, { minutes, audience, interests }), [trails, minutes, audience, interests]);

  const Chip = ({ active, onClick, children }: { active: boolean; onClick(): void; children: React.ReactNode }) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        onClick();
        setShow(false);
      }}
      className={cn("inline-flex h-12 items-center gap-1.5 rounded-2xl px-4 text-sm font-semibold transition-colors", active ? "bg-primary text-primary-foreground" : "glass hover:border-primary/40")}
    >
      {active && <Check className="size-4" />}
      {children}
    </button>
  );

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold">1. {t("plan.timeQuestion")}</legend>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((m) => <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>{t(`plan.time.${m}`)}</Chip>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold">2. {t("plan.withQuestion")}</legend>
        <div className="flex flex-wrap gap-2">
          {WITH.map((a) => <Chip key={a} active={audience === a} onClick={() => setAudience(a)}>{t(`plan.with.${a}`)}</Chip>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold">3. {t("plan.interestQuestion")}</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <Chip key={i} active={interests.includes(i)} onClick={() => setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))}>
              {t(`plan.interest.${i}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      {!show ? (
        <Button size="lg" block onClick={() => setShow(true)} disabled={!trails.length}>
          <Sparkles /> {t("plan.recommend")}
        </Button>
      ) : rec ? (
        <section aria-live="polite" className="space-y-4 rounded-[var(--radius-card)] border border-primary/30 bg-primary-soft p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{t("plan.recommended")}</p>
          <TrailCardClient trail={rec.trail} parkSlug={parkSlug} />
          <div>
            <p className="font-semibold">{t("plan.why")}</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>• {rec.fitsTime ? t("plan.reasonTime", { duration: formatDuration(rec.trail.durationMin) }) : t("plan.reasonTimeLong", { duration: formatDuration(rec.trail.durationMin) })}</li>
              {rec.audienceMatch && <li>• {t("plan.reasonAudience", { audience: rec.trail.audiences.map((a) => t(`trail.audience.${a}`)).join(", ") })}</li>}
              {rec.themeMatches.length > 0 && <li>• {t("plan.reasonTheme", { themes: rec.themeMatches.map((x) => t(`plan.interest.${x}`)).join(", ") })}</li>}
              {interests.includes("PMR") && rec.trail.pmrPartial && <li className="text-gold">• {t("plan.reasonPmr")}</li>}
            </ul>
          </div>
          <Button asChild size="lg" block>
            <Link href={`/parks/${parkSlug}/trails/${rec.trail.slug}/visit`}><Play className="fill-current" /> {t("plan.startTrail")}</Link>
          </Button>
        </section>
      ) : (
        <p className="text-muted-foreground">{t("plan.noTrail")}</p>
      )}
    </div>
  );
}
