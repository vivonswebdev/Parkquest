"use client";

import { Clock, MapPin, Route } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import type { TrailSummary } from "@/lib/domain/types";
import { formatDistance, formatDuration } from "@/lib/format";

/** Version compacte (client) de la carte parcours. */
export function TrailCardClient({ trail, parkSlug }: { trail: TrailSummary; parkSlug: string }) {
  const t = useTranslations("trail");
  const locale = useLocale();
  return (
    <Link href={`/parks/${parkSlug}/trails/${trail.slug}`} className="flex gap-3 rounded-2xl bg-background/60 p-2 hover:bg-background/80">
      <span className="relative size-20 shrink-0 overflow-hidden rounded-xl">
        <Image src={trail.coverImageUrl} alt="" fill sizes="80px" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1 py-1">
        <span className="block font-bold leading-tight">{trail.name}</span>
        <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{formatDuration(trail.durationMin)}</span>
          <span className="inline-flex items-center gap-1"><Route className="size-3.5" />{formatDistance(trail.distanceM, locale)}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{trail.spotCount}</span>
        </span>
        <Pill size="sm" className="mt-1.5">{t(`difficulty.${trail.difficulty}`)}</Pill>
      </span>
    </Link>
  );
}
