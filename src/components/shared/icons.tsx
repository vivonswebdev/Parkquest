import {
  Accessibility,
  Armchair,
  Award,
  Bike,
  Building2,
  Bus,
  Camera,
  Car,
  Coffee,
  Compass,
  DoorOpen,
  Droplets,
  Eye,
  Flag,
  Flower2,
  Footprints,
  Info,
  Landmark,
  Leaf,
  MapPin,
  Mountain,
  Route,
  Search,
  Sprout,
  Toilet,
  TreeDeciduous,
  TreePine,
  Warehouse,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { FacilityType, SpotKind } from "@/lib/domain/types";

/** Icônes nommées en base (catégories, badges) → composants lucide. */
const NAMED: Record<string, LucideIcon> = {
  "tree-deciduous": TreeDeciduous,
  "tree-pine": TreePine,
  "flower-2": Flower2,
  sprout: Sprout,
  landmark: Landmark,
  mountain: Mountain,
  waves: Waves,
  warehouse: Warehouse,
  footprints: Footprints,
  compass: Compass,
  search: Search,
  camera: Camera,
  route: Route,
  leaf: Leaf,
  flag: Flag,
  award: Award,
  "map-pin": MapPin,
};

export function iconByName(name: string): LucideIcon {
  return NAMED[name] ?? MapPin;
}

export const SPOT_KIND_ICON: Record<SpotKind, LucideIcon> = {
  TREE: TreeDeciduous,
  PLANT: Sprout,
  FLOWER: Flower2,
  GARDEN: Sprout,
  HISTORIC: Landmark,
  BUILDING: Building2,
  STATUE: Landmark,
  VIEWPOINT: Eye,
  WATER: Waves,
  OTHER: MapPin,
};

/** Couleurs de marqueurs (lisibles sur fond sombre). */
export const SPOT_KIND_COLOR: Record<SpotKind, string> = {
  TREE: "#19E6A2",
  PLANT: "#8AF4C9",
  FLOWER: "#F28DB2",
  GARDEN: "#8AF4C9",
  HISTORIC: "#F4C95D",
  BUILDING: "#C9A7FF",
  STATUE: "#F4C95D",
  VIEWPOINT: "#9DB8FF",
  WATER: "#5CC8FF",
  OTHER: "#A9C1B7",
};

export const FACILITY_ICON: Record<FacilityType, LucideIcon> = {
  ENTRANCE: DoorOpen,
  PARKING: Car,
  PARKING_PMR: Accessibility,
  BIKE_PARKING: Bike,
  TOILETS: Toilet,
  TOILETS_PMR: Accessibility,
  CAFE: Coffee,
  BENCH: Armchair,
  WATER: Droplets,
  VIEWPOINT: Eye,
  PLAYGROUND: Footprints,
  INFO_POINT: Info,
  PUBLIC_TRANSPORT: Bus,
};
