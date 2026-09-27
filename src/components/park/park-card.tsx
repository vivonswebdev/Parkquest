import { Languages, Route } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import type { ParkSummary } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export function ParkCard({ park, className }: { park: ParkSummary; className?: string }) {
  const t = useTranslations();
  const ready = park.trailCount > 0;
  return (
    <Link href={`/parks/${park.slug}`} className={cn("group block overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface card-shadow transition-colors hover:border-primary/40", className)}>
      <div className="relative aspect-[16/10]">
        <Image src={park.coverImageUrl} alt="" fill sizes="(max-width: 768px) 90vw, 360px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Pill tone="dark">{t(`parkType.${park.type}`)}</Pill>
          {park.isDemoData && <DemoBadge />}
        </div>
      </div>
      <div className="space-y-2 p-4 pt-1">
        <h3 className="text-lg font-bold leading-tight">{park.name}</h3>
        <p className="text-sm text-muted-foreground">
          {park.city} · {park.countryCode}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {ready ? (
            <Pill tone="mint" size="sm"><Route />{t("common.trails", { count: park.trailCount })}</Pill>
          ) : (
            <Pill tone="muted" size="sm">{t("common.comingSoon")}</Pill>
          )}
          <Pill tone="muted" size="sm"><Languages />{park.availableLocales.map((l) => l.toUpperCase()).join(" · ")}</Pill>
          {park.isFree !== undefined && <Pill tone="muted" size="sm">{park.isFree ? t("common.free") : t("common.paid")}</Pill>}
        </div>
      </div>
    </Link>
  );
}
