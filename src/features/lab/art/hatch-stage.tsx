"use client";

import { useCreatureAsset } from "../creature-assets";
import type { EggId, FamilyId } from "../creatures";
import { CreatureImage, IMAGE_RATIO } from "./creature-image";
import { HatchScene, phaseAtLeast, type HatchPhase } from "./hatch-scene";

/*
 * Éclosion avec une créature en image : fond + morceaux de coquille (derrière), créature (au milieu),
 * coupe du bas + fissures (devant). Le sol de la scène s'efface quand le socle de l'image apparaît
 * (pas de seconde ombre). Le personnage surgit à l'emplacement de l'œuf, s'incline à gauche puis à
 * droite (« regarde autour ») et fait un petit rebond de joie — sans clignement ni expression simulés.
 */

/** Niveau du sol de la scène (base de l'œuf), en fraction de la hauteur */
const GROUND = 219 / 290;
const SCENE_RATIO = 240 / 290;
/** Largeur de l'image par rapport à la scène */
const SCALE = 1.04;

export function HatchStage({
  egg,
  creature,
  phase,
  reduced,
  joy = 0,
  touch = 0,
  className,
  title,
}: {
  egg: EggId;
  creature: FamilyId;
  phase: HatchPhase;
  reduced?: boolean;
  joy?: number;
  touch?: number;
  className?: string;
  title?: string;
}) {
  const asset = useCreatureAsset(creature);
  const born = phaseAtLeast(phase, "appear");
  const imgHeight = (SCALE * SCENE_RATIO) / IMAGE_RATIO; // hauteur de l'image / hauteur de la scène
  const top = (GROUND - asset.foot * imgHeight) * 100;
  const left = ((1 - SCALE) / 2 + (0.5 - asset.cx) * SCALE) * 100;
  const tilt = phase === "lookL" ? -1 : phase === "lookR" ? 1 : 0;
  return (
    <div className={className} role="img" aria-label={title} style={{ aspectRatio: `${SCENE_RATIO}`, position: "relative" }}>
      <HatchScene egg={egg} phase={phase} reduced={reduced} layer="back" imageGround className="absolute inset-0 size-full" />
      {born && (
        <CreatureImage
          id={creature}
          asset={asset}
          alt=""
          idle={phase === "done"}
          tilt={tilt}
          joy={(phase === "joy" ? 1 : 0) + joy}
          touch={touch}
          socleClassName={reduced ? "lab-fade-up" : "cimg-socle-in"}
          characterClassName={reduced ? "lab-fade-up" : "cimg-pop"}
          className="absolute"
          style={{ top: `${top}%`, left: `${left}%`, width: `${SCALE * 100}%` }}
          sizes="(max-width: 480px) 90vw, 400px"
          priority
        />
      )}
      <HatchScene egg={egg} phase={phase} reduced={reduced} layer="front" className="pointer-events-none absolute inset-0 size-full" />
    </div>
  );
}
