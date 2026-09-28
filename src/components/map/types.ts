import type { LatLng } from "@/lib/domain/types";
import type { StepState } from "@/lib/game/trail-progress";

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
  /** Étape d'un parcours actif : numéro et état (✓ ● ◉ ○) ; absent pour les spots hors parcours */
  step?: { n: number; state: StepState; last?: boolean };
  /** Libellé lu par les lecteurs d'écran (par défaut : label) */
  ariaLabel?: string;
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

export interface MapNature {
  clearings: LatLng[];
  ponds: { center: LatLng; radiusM: number }[];
}

export interface MapHandle {
  flyTo(p: LatLng, zoom?: number): void;
  fitBounds(): void;
  resetNorth(): void;
}

export interface ParkMapProps {
  bounds: [LatLng, LatLng];
  /** Zone à cadrer à l'ouverture (lieux + parcours) ; par défaut, toute l'emprise */
  focus?: [LatLng, LatLng];
  markers: MapMarker[];
  paths?: MapPath[];
  user?: UserPosition | null;
  selectedId?: string | null;
  onSelect?(id: string | null): void;
  layer?: MapLayer;
  className?: string;
  /** Marge (px) à laisser pour les panneaux flottants (bas) */
  paddingBottom?: number;
  /** Position verticale (px sous la zone sûre) des crédits de carte, sous les en-têtes flottants */
  attributionTop?: number;
  /** Vue 3D : carte inclinée, bâtiments en relief, terrain (moteur MapLibre uniquement) */
  view3d?: boolean;
  /**
   * Décor nature : lieux à laisser dégagés (spots, services — liste stable, indépendante
   * des filtres) et étangs. Par défaut, déduit des marqueurs.
   */
  nature?: MapNature;
  /** Moteur réellement utilisé (MapLibre, ou carte simplifiée en repli) */
  onEngine?(engine: MapEngine): void;
  ref?: React.Ref<MapHandle>;
}
