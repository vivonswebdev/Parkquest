import type { LatLng } from "@/lib/domain/types";

export interface MapMarker {
  id: string;
  type: "spot" | "facility" | "start";
  location: LatLng;
  color: string;
  /** Clé d'icône : SpotKind ou FacilityType */
  iconKey: string;
  label: string;
  sublabel?: string;
  discovered?: boolean;
  /** Mise en avant (prochain spot du parcours) */
  highlighted?: boolean;
}

export interface MapPath {
  id: string;
  coordinates: [number, number][]; // [lng, lat]
  variant: "trail" | "done" | "active";
}

export interface UserPosition extends LatLng {
  accuracy: number;
}

export type MapLayer = "plan" | "satellite";

export type MapEngine = "maplibre" | "fallback";

export interface MapHandle {
  flyTo(p: LatLng, zoom?: number): void;
  fitBounds(): void;
  resetNorth(): void;
}

export interface ParkMapProps {
  bounds: [LatLng, LatLng];
  markers: MapMarker[];
  paths?: MapPath[];
  user?: UserPosition | null;
  selectedId?: string | null;
  onSelect?(id: string | null): void;
  layer?: MapLayer;
  className?: string;
  /** Marge (px) à laisser pour les panneaux flottants (bas) */
  paddingBottom?: number;
  /** Vue 3D : carte inclinée, bâtiments en relief, terrain (moteur MapLibre uniquement) */
  view3d?: boolean;
  /** Moteur réellement utilisé (MapLibre, ou carte simplifiée en repli) */
  onEngine?(engine: MapEngine): void;
  ref?: React.Ref<MapHandle>;
}
