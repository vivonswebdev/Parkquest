"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { type CreatureAsset, useCreatureAsset } from "../creature-assets";
import type { FamilyId } from "../creatures";

/*
 * Créature en image (figurine fournie) : deux calques découpés le long de la ligne personnage / socle.
 * Seul le personnage bouge (respiration, toucher, joie, flottement, inclinaison) ; le socle et son ombre
 * restent fixes. Aucune ombre ajoutée : l'image porte déjà la sienne. Aucun clignement ni expression
 * simulés (il faudrait des images dédiées).
 */

export const IMAGE_RATIO = 1122 / 1402;

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function polygons(a: CreatureAsset) {
  const pts = a.cut.map(([x, y]) => `${pct(x)} ${pct(y + 0.002)}`);
  const ptsUp = a.cut.map(([x, y]) => `${pct(x)} ${pct(y - 0.002)}`);
  const character = `polygon(0% 0%, 100% 0%, ${[...pts].reverse().join(", ")})`;
  const socle = `polygon(${ptsUp.join(", ")}, 100% 100%, 0% 100%)`;
  return { character, socle };
}

export interface CreatureImageProps {
  id: FamilyId;
  /** Forcer une image précise (comparatif A/B) */
  asset?: CreatureAsset;
  /** Vie au repos : respiration (et flottement pour l'Air), lumière douce */
  idle?: boolean;
  /** Changer la valeur rejoue la joie */
  joy?: number;
  /** Changer la valeur rejoue la réaction au toucher */
  touch?: number;
  /** Inclinaison du corps (-1 gauche → 1 droite), pour « regarder autour » */
  tilt?: number;
  silhouette?: boolean;
  /** Image sur son fond d'origine, sans découpe (comparatif) */
  framed?: boolean;
  /** Classes du calque socle (ex. fondu à l'éclosion) */
  socleClassName?: string;
  /** Classes du calque personnage (ex. apparition à l'éclosion) */
  characterClassName?: string;
  className?: string;
  /** Positionnement dans une scène (ex. éclosion) */
  style?: React.CSSProperties;
  alt: string;
  priority?: boolean;
  sizes?: string;
}

export function CreatureImage(props: CreatureImageProps) {
  const fromStore = useCreatureAsset(props.id);
  return <CreatureImageView {...props} asset={props.asset ?? fromStore} />;
}

export function CreatureImageView({
  asset: a,
  idle,
  joy = 0,
  touch = 0,
  tilt = 0,
  silhouette,
  framed,
  socleClassName,
  characterClassName,
  className,
  style,
  alt,
  priority,
  sizes = "(max-width: 480px) 90vw, 420px",
}: CreatureImageProps & { asset: CreatureAsset }) {
  const origin = `${pct(a.cx)} ${pct(a.foot)}`;
  const img = (src: string, extra?: string) => (
    <Image src={src} alt="" fill unoptimized priority={priority} sizes={sizes} draggable={false} className={cn("pointer-events-none select-none object-contain", extra)} />
  );
  if (framed)
    return (
      <div role="img" aria-label={alt} className={cn("relative", className)} style={{ aspectRatio: `${IMAGE_RATIO}`, ...style }}>
        {img(a.framed)}
      </div>
    );
  const { character, socle } = polygons(a);
  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn("relative", className)}
      style={{ aspectRatio: `${IMAGE_RATIO}`, ...(silhouette ? { filter: "brightness(0)", opacity: 0.22 } : null), ...style }}
    >
      {/* Socle (fixe) */}
      <div className={cn("absolute inset-0", socleClassName)} style={{ clipPath: socle }}>
        {img(a.src)}
      </div>
      {/* Personnage (animé par couches : joie > toucher > respiration/flottement > inclinaison) */}
      <div className={cn("absolute inset-0", characterClassName)} style={{ transformOrigin: origin }}>
        <div key={`j-${joy}`} className={cn("absolute inset-0", joy ? "cimg-joy" : undefined)} style={{ transformOrigin: origin }}>
          <div key={`t-${touch}`} className={cn("absolute inset-0", touch ? "cimg-touch" : undefined)} style={{ transformOrigin: origin }}>
            <div className={cn("absolute inset-0", idle && (a.floats ? "cimg-float" : "cimg-breathe"))} style={{ transformOrigin: origin }}>
              <div className="cimg-tilt absolute inset-0" style={{ transformOrigin: origin, transform: `rotate(${tilt * 2}deg)` }}>
                <div className="absolute inset-0" style={{ clipPath: character }}>
                  {img(a.src)}
                </div>
                {!silhouette &&
                  a.glows?.map((g, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className={cn("pointer-events-none absolute rounded-full mix-blend-screen", idle ? "cimg-glow" : "opacity-60")}
                      style={{
                        left: pct(g.x - g.r),
                        top: pct(g.y - g.r * IMAGE_RATIO),
                        width: pct(g.r * 2),
                        aspectRatio: "1",
                        background: `radial-gradient(circle, rgba(${g.color},0.75) 0%, rgba(${g.color},0.25) 45%, rgba(${g.color},0) 70%)`,
                        animationDelay: `${i * 0.7}s`,
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
