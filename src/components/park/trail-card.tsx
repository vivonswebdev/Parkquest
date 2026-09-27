import { ChevronRight, Clock, MapPin, Route } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import type { TrailSummary } from "@/lib/domain/types";
import { formatDistance, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TrailCard({ trail, parkSlug, className, priority }: { trail: TrailSummary; parkSlug: string; className?: string; priority?: boolean }) {
  const t = useTranslations("trail");
  const locale = useLocale();
  return (
    <Link
      href={`/parks/${parkSlug}/trails/${trail.slug}`}
      className={cn("group relative block overflow-hidden rounded-[var(--radius-card)] border border-border card-shadow", className)}
    >
      <div className="relative aspect-[16/10]">
        <Image src={trail.coverImageUrl} alt="" fill sizes="(max-width: 768px) 90vw, 400px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" priority={priority} />
        <div className="image-scrim absolute inset-0" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Pill tone="dark">{t(`difficulty.${trail.difficulty}`)}</Pill>
          {trail.isDemoData && <DemoBadge />}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-lg font-bold leading-tight text-white">{trail.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/80">
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{formatDuration(trail.durationMin)}</span>
            <span className="inline-flex items-center gap-1"><Route className="size-3.5" />{formatDistance(trail.distanceM, locale)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{trail.spotCount} spots</span>
          </div>
        </div>
        <span className="absolute bottom-4 right-4 inline-flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur group-hover:bg-primary group-hover:text-primary-foreground">
          <ChevronRight className="size-5" />
        </span>
      </div>
    </Link>
  );
}
