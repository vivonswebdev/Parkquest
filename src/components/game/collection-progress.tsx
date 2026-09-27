"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { useDemoProgress } from "@/features/demo/demo-progress";
import { cn } from "@/lib/utils";

/**
 * Progression de collection d'un parc.
 * `serverDiscovered` fourni (utilisateur connecté) → source serveur ; sinon progression démo locale.
 */
export function CollectionProgress({
  parkName,
  spotIds,
  serverDiscovered,
  className,
  compact,
}: {
  parkName: string;
  spotIds: string[];
  serverDiscovered?: string[] | null;
  className?: string;
  compact?: boolean;
}) {
  const t = useTranslations("challenges");
  const demo = useDemoProgress();
  const found = (serverDiscovered ?? demo.discovered).filter((id) => spotIds.includes(id)).length;
  const total = spotIds.length;
  const pct = total ? Math.round((found / total) * 100) : 0;
  return (
    <div className={cn("space-y-2", className)}>
      {!compact && <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("collection", { park: parkName })}</p>}
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-display text-2xl font-extrabold text-foreground">{found}</span> / {total} {t("discoveredLabel")}
        </p>
        <span className="font-display text-lg font-bold text-primary">{pct} %</span>
      </div>
      <Progress value={found} max={total} label={t("discoveredOf", { discovered: found, total })} />
    </div>
  );
}
