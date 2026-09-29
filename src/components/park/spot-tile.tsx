import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SPOT_KIND_COLOR, SPOT_KIND_ICON } from "@/components/shared/icons";
import { Link } from "@/i18n/navigation";
import type { SpotSummary } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/** Tuile de spot avec image plein cadre (style « lieu du jour »). */
export function SpotTile({ spot, parkSlug, meta, className }: { spot: SpotSummary; parkSlug: string; meta?: string; className?: string }) {
  const Icon = SPOT_KIND_ICON[spot.kind];
  const t = useTranslations("photos");
  const photo = spot.speciesPhoto;
  return (
    <Link
      href={`/parks/${parkSlug}/spots/${spot.slug}`}
      className={cn("group relative block overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface card-shadow", className)}
    >
      {photo ? (
        // Photo libre de l'espèce (iNaturalist, GBIF, Wikimedia), créditée ci-dessous
        // eslint-disable-next-line @next/next/no-img-element -- origine externe, licence libre
        <img src={photo.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.04]" />
      ) : (
        <Image src={spot.coverImageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 280px" className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.04]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
      <div className="relative flex h-full flex-col justify-between p-3.5">
        <div className="flex items-start justify-between">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-black/50 backdrop-blur" style={{ color: SPOT_KIND_COLOR[spot.kind] }}>
            <Icon className="size-5" />
          </span>
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur">
            <ChevronRight className="size-4" />
          </span>
        </div>
        <div>
          <p className="font-display text-[15px] font-bold leading-tight">{spot.name}</p>
          {(meta ?? spot.label) && <p className="mt-0.5 text-xs text-muted-foreground">{meta ?? spot.label}</p>}
          {photo && (
            <p className="mt-1 truncate text-[10px] text-muted-foreground">
              {t("heroCredit")} · © {photo.author} · {photo.license}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
