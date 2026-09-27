import { FACILITY_ICON, SPOT_KIND_ICON } from "@/components/shared/icons";
import type { FacilityType, SpotKind } from "@/lib/domain/types";
import { Flag } from "lucide-react";

export function MarkerIcon({ type, iconKey, className }: { type: "spot" | "facility" | "start"; iconKey: string; className?: string }) {
  const Icon =
    type === "start" ? Flag : type === "spot" ? SPOT_KIND_ICON[iconKey as SpotKind] : FACILITY_ICON[iconKey as FacilityType];
  return Icon ? <Icon className={className} /> : null;
}
