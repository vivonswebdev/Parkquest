import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Ossature commune des compagnons « figurine » (référence de qualité : Mossy).
 * Même finition des yeux (iris en dégradé, trois reflets, paupière qui se ferme du haut),
 * même bouche expressive, même ombre portée et mêmes animations par parties :
 * respiration, clignement, regard, saut de joie, écrasement au toucher.
 */

export type FigureForm = "young" | "adult";
export type FigureMood = "rest" | "happy" | "surprised";

export interface FigureProps {
  form?: FigureForm;
  lunar?: boolean;
  mood?: FigureMood;
  eyesClosed?: boolean;
  /** Direction du regard : -1 (gauche) → 1 (droite) */
  look?: number;
  /** Vie au repos : respiration + clignements + petits mouvements propres */
  idle?: boolean;
  /** Changer la valeur rejoue le saut de joie */
  hop?: number;
  /** Changer la valeur rejoue la réaction au toucher */
  squish?: number;
  socle?: boolean;
  silhouette?: boolean;
  viewBox?: string;
  className?: string;
  title?: string;
  /** Position dans un SVG parent (scène d'éclosion) */
  frame?: { x: number; y: number; width: number; height: number };
}

export interface FaceColors {
  /** Couleur de la peau autour des yeux (paupière) */
  lidTop: string;
  lidBottom: string;
  shade: string;
  eye: string;
  iris: string;
  cheek: string;
  mouth: string;
}

/** Dégradés et flous partagés (identifiants préfixés par `g`). */
export function KitDefs({ g, c }: { g: string; c: FaceColors }) {
  return (
    <>
      <linearGradient id={`${g}-lid`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c.lidTop} />
        <stop offset="1" stopColor={c.lidBottom} />
      </linearGradient>
      <radialGradient id={`${g}-eye`} cx="50%" cy="78%" r="75%">
        <stop offset="0" stopColor={c.iris} />
        <stop offset="0.5" stopColor={c.eye} />
        <stop offset="1" stopColor="#05080a" />
      </radialGradient>
      <radialGradient id={`${g}-cheek`}>
        <stop offset="0" stopColor={c.cheek} stopOpacity="0.85" />
        <stop offset="1" stopColor={c.cheek} stopOpacity="0" />
      </radialGradient>
      <filter id={`${g}-b1`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
      <filter id={`${g}-b2`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
      <filter id={`${g}-b4`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </>
  );
}

export function KitEye({ cx, cy, rx, ry, g, c, closed, idle, delay = 0 }: { cx: number; cy: number; rx: number; ry: number; g: string; c: FaceColors; closed?: boolean; idle?: boolean; delay?: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + 1.5} rx={rx + 1.6} ry={ry + 1.6} fill={c.shade} opacity="0.35" filter={`url(#${g}-b1)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${g}-eye)`} />
      <ellipse cx={cx - rx * 0.36} cy={cy - ry * 0.42} rx={rx * 0.38} ry={ry * 0.36} fill="#fff" />
      <circle cx={cx + rx * 0.38} cy={cy + ry * 0.4} r={rx * 0.16} fill="#fff" opacity="0.85" />
      <circle cx={cx + rx * 0.05} cy={cy - ry * 0.62} r={rx * 0.08} fill="#fff" opacity="0.7" />
      <g
        className={cn("mossy-lid", !closed && idle && "mossy-blink")}
        style={{
          transformOrigin: `${cx}px ${cy - ry - 1}px`,
          transform: closed ? "scaleY(1)" : idle ? undefined : "scaleY(0)",
          animationDelay: `${delay}s`,
        }}
      >
        <ellipse cx={cx} cy={cy} rx={rx + 1.4} ry={ry + 1.4} fill={`url(#${g}-lid)`} />
        <path d={`M${cx - rx} ${cy + ry * 0.55} Q ${cx} ${cy + ry * 1.05} ${cx + rx} ${cy + ry * 0.55}`} stroke={c.eye} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

export function KitMouth({ mood, c, cy, x = 100 }: { mood: FigureMood; c: FaceColors; cy: number; x?: number }) {
  if (mood === "happy")
    return (
      <g>
        <path d={`M${x - 11} ${cy - 2} Q${x} ${cy + 16} ${x + 11} ${cy - 2} Q${x} ${cy + 2} ${x - 11} ${cy - 2} Z`} fill={c.mouth} />
        <ellipse cx={x} cy={cy + 7} rx="5.5" ry="3.2" fill="#ec8c80" />
      </g>
    );
  if (mood === "surprised") return <ellipse cx={x} cy={cy + 3} rx="4" ry="5" fill={c.mouth} />;
  return <path d={`M${x - 7} ${cy} Q${x} ${cy + 7} ${x + 7} ${cy}`} stroke={c.mouth} strokeWidth="2.6" strokeLinecap="round" fill="none" />;
}

/** Visage complet : yeux (qui suivent `look`), joues, bouche. */
export function KitFace({
  g,
  c,
  eyeY,
  dx,
  rx,
  ry,
  mouthY,
  cheekY,
  mood,
  look,
  closed,
  idle,
}: {
  g: string;
  c: FaceColors;
  eyeY: number;
  dx: number;
  rx: number;
  ry: number;
  mouthY: number;
  cheekY: number;
  mood: FigureMood;
  look: number;
  closed?: boolean;
  idle?: boolean;
}) {
  return (
    <g>
      <g className="mossy-eyes" style={{ transform: `translateX(${look * 4}px)` }}>
        <KitEye cx={100 - dx} cy={eyeY} rx={rx} ry={ry} g={g} c={c} closed={closed} idle={idle} />
        <KitEye cx={100 + dx} cy={eyeY} rx={rx} ry={ry} g={g} c={c} closed={closed} idle={idle} />
      </g>
      <ellipse cx={100 - dx - 12} cy={cheekY} rx="11" ry="6.5" fill={`url(#${g}-cheek)`} />
      <ellipse cx={100 + dx + 12} cy={cheekY} rx="11" ry="6.5" fill={`url(#${g}-cheek)`} />
      <KitMouth mood={mood} c={c} cy={mouthY} />
    </g>
  );
}

/**
 * Cadre commun : SVG, ombre portée (qui se resserre pendant le saut), silhouette,
 * puis empilement saut → écrasement → respiration autour du personnage.
 */
export function KitFrame({
  g,
  c,
  defs,
  socle,
  shadowRx,
  props,
  children,
}: {
  g: string;
  c: FaceColors;
  defs?: ReactNode;
  socle?: ReactNode;
  shadowRx: number;
  props: FigureProps;
  children: ReactNode;
}) {
  const { hop = 0, squish = 0, idle, silhouette, lunar, viewBox = "0 0 200 200", className, title, frame } = props;
  return (
    <svg viewBox={viewBox} {...frame} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <KitDefs g={g} c={c} />
        {defs}
      </defs>
      {props.socle && socle}
      <ellipse
        key={`sh-${hop}`}
        cx="100"
        cy="183"
        rx={shadowRx}
        ry="6.5"
        fill="#2b2a1e"
        opacity={silhouette ? 0.12 : 0.3}
        filter={`url(#${g}-b2)`}
        className={hop ? "mossy-hop-shadow" : undefined}
        style={{ transformOrigin: "100px 183px" }}
      />
      <g style={silhouette ? { filter: lunar ? "brightness(0) invert(1)" : "brightness(0)", opacity: lunar ? 0.3 : 0.2 } : undefined}>
        <g key={`hop-${hop}`} className={hop ? "mossy-hop" : undefined} style={{ transformOrigin: "100px 182px" }}>
          <g key={`sq-${squish}`} className={squish ? "mossy-squish" : undefined} style={{ transformOrigin: "100px 182px" }}>
            <g className={idle ? "mossy-breathe" : undefined} style={{ transformOrigin: "100px 182px" }}>
              {children}
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
