import { FACILITY_ICON, SPOT_KIND_ICON } from "@/components/shared/icons";
import type { FacilityType, SpotKind } from "@/lib/domain/types";
import { Flag, Star, Trees } from "lucide-react";
import type { MarkerType } from "./types";

export function MarkerIcon({ type, iconKey, className }: { type: MarkerType; iconKey: string; className?: string }) {
  const Icon =
    type === "park" ? Trees : type === "favorite" ? Star : type === "start" ? Flag : type === "spot" ? SPOT_KIND_ICON[iconKey as SpotKind] : FACILITY_ICON[iconKey as FacilityType];
  return Icon ? <Icon className={className} /> : null;
}
