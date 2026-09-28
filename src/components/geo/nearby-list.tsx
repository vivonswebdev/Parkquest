"use client";

import { Accessibility, Check, ChevronRight, Map as MapIcon, Navigation } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { FACILITY_ICON, SPOT_KIND_COLOR, SPOT_KIND_ICON } from "@/components/shared/icons";
import { Chip } from "@/components/ui/chip";
import { Link } from "@/i18n/navigation";
import type { Facility, LatLng, SpotKind, SpotSummary } from "@/lib/domain/types";
import { formatDistance } from "@/lib/format";
import { quantize, rankNearby } from "@/lib/nearby";
import { cn } from "@/lib/utils";

export type NearbyFilter = "all" | "trees" | "plants" | "history" | "photo" | "challenges" | "services" | "pmr";
const FILTERS: NearbyFilter[] = ["all", "trees", "plants", "history", "photo", "challenges", "services", "pmr"];

const KIND_GROUP: Record<SpotKind, NearbyFilter> = {
  TREE: "trees",
  PLANT: "plants",
  FLOWER: "plants",
  GARDEN: "plants",
  HISTORIC: "history",
  BUILDING: "history",
  STATUE: "history",
  VIEWPOINT: "photo",
  WATER: "photo",
  OTHER: "all",
};

type Row =
  | { kind: "spot"; id: string; location: LatLng; spot: SpotSummary }
  | { kind: "facility"; id: string; location: LatLng; facility: Facility };

/**
 * « Autour de vous » : lieux triés par distance, recalculés seulement après
 * un déplacement significatif (batterie / réseau). Jamais d'autres visiteurs.
 */
export function NearbyList({
  parkSlug,
  spots,
  facilities,
  origin,
  originIsUser,
  startPoints,
  onChooseStart,
  discovered,
  challengeSpotIds,
  photoSpotIds,
  onShowOnMap,
  onGuide,
  className,
}: {
  parkSlug: string;
  spots: SpotSummary[];
  facilities: Facility[];
  origin: LatLng;
  originIsUser: boolean;
  startPoints: Facility[];
  onChooseStart(id: string): void;
  discovered: Set<string>;
  challengeSpotIds: string[];
  photoSpotIds: string[];
  onShowOnMap(id: string): void;
  onGuide(id: string): void;
  className?: string;
}) {
  const t = useTranslations("geo");
  const tf = useTranslations("facility");
  const locale = useLocale();
  const [filter, setFilter] = useState<NearbyFilter>("all");

  // Origine arrondie (~15 m) : la liste n'est recalculée qu'après un vrai déplacement.
  const q = quantize(origin);
  const o = useMemo<LatLng>(() => ({ lat: q.lat, lng: q.lng }), [q.lat, q.lng]);

  const rows = useMemo(() => {
    const items: Row[] = [
      ...spots.map((s) => ({ kind: "spot" as const, id: s.id, location: s.location, spot: s })),
      ...facilities.filter((f) => f.type !== "ENTRANCE").map((f) => ({ kind: "facility" as const, id: f.id, location: f.location, facility: f })),
    ].filter((r) => {
      if (filter === "all") return true;
      if (filter === "services") return r.kind === "facility";
      if (filter === "pmr") return r.kind === "facility" && Boolean(r.facility.isPmrAccessible);
      if (r.kind !== "spot") return false;
      if (filter === "challenges") return challengeSpotIds.includes(r.id);
      if (filter === "photo") return photoSpotIds.includes(r.id) || KIND_GROUP[r.spot.kind] === "photo";
      return KIND_GROUP[r.spot.kind] === filter;
    });
    return rankNearby(items, o);
  }, [spots, facilities, filter, o, challengeSpotIds, photoSpotIds]);

  return (
    <section aria-labelledby="nearby-title" className={cn("glass-strong pointer-events-auto rounded-[var(--radius-sheet)] p-3 card-shadow", className)}>
      <div aria-hidden className="mx-auto mb-2 h-1 w-10 rounded-full bg-foreground/20" />
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 id="nearby-title" className="font-display text-lg font-extrabold">
          {t("nearbyTitle")}
        </h2>
        {originIsUser ? (
          <span className="truncate text-xs text-muted-foreground">{t("from", { place: t("yourPosition") })}</span>
        ) : (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t("startPoint")}</span>
            <select
              className="max-w-36 rounded-full border border-border bg-surface px-2 py-1 text-xs text-foreground"
              onChange={(e) => onChooseStart(e.target.value)}
              defaultValue={startPoints[0]?.id}
            >
              {startPoints.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="no-scrollbar -mx-3 mt-2 flex gap-2 overflow-x-auto px-3 pb-1" role="toolbar" aria-label={t("nearbyTitle")}>
        {FILTERS.map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)} className="h-8 px-3 text-xs">
            {t(`filters.${f}`)}
          </Chip>
        ))}
      </div>

      <ul className="mt-2 max-h-[34dvh] space-y-1 overflow-y-auto pr-1">
        {rows.length === 0 && <li className="px-2 py-4 text-center text-sm text-muted-foreground">{t("noResult")}</li>}
        {rows.map(({ item, distanceM: d, minutes }) => {
          const isSpot = item.kind === "spot";
          const Icon = isSpot ? SPOT_KIND_ICON[item.spot.kind] : FACILITY_ICON[item.facility.type];
          const color = isSpot ? SPOT_KIND_COLOR[item.spot.kind] : "var(--muted-foreground)";
          const name = isSpot ? item.spot.name : item.facility.name;
          const sub = isSpot ? item.spot.label : item.facility.isPmrAccessible ? t("accessible") : tf(item.facility.type);
          return (
            <li key={item.id} className="flex items-center gap-2.5 rounded-2xl px-2 py-2 hover:bg-inset">
              <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-inset" style={{ color }}>
                <Icon className="size-5" />
                {isSpot && discovered.has(item.id) && (
                  <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{name}</span>
                <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatDistance(d, locale)} · {minutes} min
                  </span>
                  {sub && <span className="truncate">· {sub}</span>}
                  {!isSpot && item.facility.isPmrAccessible && <Accessibility className="size-3" aria-hidden />}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => onShowOnMap(item.id)} aria-label={`${t("seeOnMap")} · ${name}`} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-primary-soft">
                  <MapIcon className="size-4" />
                </button>
                <button type="button" onClick={() => onGuide(item.id)} aria-label={`${t("guideMe")} · ${name}`} className="inline-flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Navigation className="size-4" />
                </button>
                {isSpot && (
                  <Link href={`/parks/${parkSlug}/spots/${item.spot.slug}`} aria-label={`${t("seeCard")} · ${name}`} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-primary-soft">
                    <ChevronRight className="size-4" />
                  </Link>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
