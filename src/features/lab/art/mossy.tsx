import { useId } from "react";
import { cn } from "@/lib/utils";

/*
 * Mossy — figurine originale ParkQuest (SVG, rendu « vinyle satiné »).
 * Volumes : dégradés radiaux décalés vers la lumière (haut gauche), ombre propre, occlusion douce
 * sous la mousse et sous la tête, reflet satiné, liseré de lumière, ombre portée au sol.
 * Animation par parties indépendantes (pas un simple déplacement d'image) :
 * respiration (corps), clignement (paupières), regard (pupilles + inclinaison de tête),
 * joie (saut écrasé, bras levés, oreilles-feuilles qui frétillent, bouche ouverte), toucher (écrasement).
 * Jeune : grosse tête, petit corps, pattes courtes. Adulte : silhouette plus haute, crinière de mousse,
 * oreilles-feuilles découpées, ramures, champignon, queue feuillue, amulette — même visage, même matière.
 */

export type MossyForm = "young" | "adult";
export type MossyMood = "rest" | "happy" | "surprised";

interface Pal {
  skinHi: string;
  skin: string;
  skinLo: string;
  skinDeep: string;
  moss: string;
  mossHi: string;
  mossLo: string;
  leaf: string;
  leafLo: string;
  eye: string;
  eyeHi: string;
  cheek: string;
  mouth: string;
  glow: string;
}

const DAY: Pal = {
  skinHi: "#fffaf0",
  skin: "#f0e2c0",
  skinLo: "#d8c095",
  skinDeep: "#b49a6c",
  moss: "#86ad55",
  mossHi: "#c3df8a",
  mossLo: "#557f36",
  leaf: "#9fca6c",
  leafLo: "#4f8238",
  eye: "#1a2a1c",
  eyeHi: "#4d7d45",
  cheek: "#f19c86",
  mouth: "#6a2f2a",
  glow: "#f6c76a",
};

const LUNAR: Pal = {
  skinHi: "#f4f6ff",
  skin: "#d3dbf3",
  skinLo: "#a6b3dc",
  skinDeep: "#7f8cbd",
  moss: "#4f6aa3",
  mossHi: "#8ea6dc",
  mossLo: "#33467a",
  leaf: "#7d95cf",
  leafLo: "#3c5089",
  eye: "#141a33",
  eyeHi: "#5a6bb0",
  cheek: "#c99ad8",
  mouth: "#4a2846",
  glow: "#ffd98a",
};

export interface MossyProps {
  form?: MossyForm;
  lunar?: boolean;
  /** Foulard de feuille (stade « explorateur ») */
  scarf?: boolean;
  mood?: MossyMood;
  eyesClosed?: boolean;
  /** Direction du regard : -1 (gauche) → 1 (droite) */
  look?: number;
  /** Vie au repos : respiration + clignements */
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

const LEAF = "M0 0 C 9 -10, 9 -26, 0 -36 C -9 -26, -9 -10, 0 0 Z";
const LEAF_EAR = "M0 0 C 14 -8, 16 -26, 2 -38 C -2 -40, -6 -38, -8 -34 C -16 -22, -12 -6, 0 0 Z";
const LEAF_NOTCHED = "M0 0 C 10 -8, 12 -18, 6 -24 C 12 -28, 10 -40, 0 -48 C -10 -40, -12 -28, -6 -24 C -12 -18, -10 -8, 0 0 Z";

function Eye({ cx, cy, rx, ry, p, g, closed, idle }: { cx: number; cy: number; rx: number; ry: number; p: Pal; g: string; closed?: boolean; idle?: boolean }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + 1.5} rx={rx + 1.6} ry={ry + 1.6} fill={p.skinDeep} opacity="0.35" filter={`url(#${g}-b1)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${g}-eye)`} />
      <ellipse cx={cx - rx * 0.36} cy={cy - ry * 0.42} rx={rx * 0.38} ry={ry * 0.36} fill="#fff" />
      <circle cx={cx + rx * 0.38} cy={cy + ry * 0.4} r={rx * 0.16} fill="#fff" opacity="0.85" />
      <circle cx={cx + rx * 0.05} cy={cy - ry * 0.62} r={rx * 0.08} fill="#fff" opacity="0.7" />
      {/* Paupière : couleur de peau, se ferme du haut vers le bas */}
      <g
        className={cn("mossy-lid", !closed && idle && "mossy-blink")}
        style={{ transformOrigin: `${cx}px ${cy - ry - 1}px`, transform: closed ? "scaleY(1)" : idle ? undefined : "scaleY(0)" }}
      >
        <ellipse cx={cx} cy={cy} rx={rx + 1.4} ry={ry + 1.4} fill={`url(#${g}-lid)`} />
        <path d={`M${cx - rx} ${cy + ry * 0.55} Q ${cx} ${cy + ry * 1.05} ${cx + rx} ${cy + ry * 0.55}`} stroke={p.eye} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

function Mouth({ mood, p, cy }: { mood: MossyMood; p: Pal; cy: number }) {
  if (mood === "happy")
    return (
      <g>
        <path d={`M89 ${cy - 2} Q100 ${cy + 16} 111 ${cy - 2} Q100 ${cy + 2} 89 ${cy - 2} Z`} fill={p.mouth} />
        <ellipse cx="100" cy={cy + 7} rx="5.5" ry="3.2" fill="#ec8c80" />
        <path d={`M95 ${cy - 1} l2 3 l2 -3 Z`} fill="#fff" />
      </g>
    );
  if (mood === "surprised") return <ellipse cx="100" cy={cy + 3} rx="4" ry="5" fill={p.mouth} />;
  return (
    <g>
      <path d={`M92 ${cy} Q96 ${cy + 5} 100 ${cy + 1} Q104 ${cy + 5} 108 ${cy}`} stroke={p.mouth} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M102.5 ${cy + 2} l1.6 2.6 l1.6 -2.2 Z`} fill="#fff" />
    </g>
  );
}

function MossBumps({ d, g, p }: { d: string; g: string; p: Pal }) {
  return (
    <g>
      <path d={d} fill={p.mossLo} transform="translate(0 3)" opacity="0.6" filter={`url(#${g}-b2)`} />
      <path d={d} fill={`url(#${g}-moss)`} />
    </g>
  );
}

export function MossyFigure({
  form = "young",
  lunar,
  scarf,
  mood = "rest",
  eyesClosed,
  look = 0,
  idle,
  hop = 0,
  squish = 0,
  socle,
  silhouette,
  viewBox = "0 0 200 200",
  className,
  title,
  frame,
}: MossyProps) {
  const g = useId().replace(/:/g, "");
  const p = lunar ? LUNAR : DAY;
  const adult = form === "adult";
  const happy = mood === "happy";

  // Géométrie propre à chaque forme (même visage, proportions différentes)
  const head = adult ? { cx: 100, cy: 90, rx: 50, ry: 44 } : { cx: 100, cy: 102, rx: 58, ry: 50 };
  const eyes = adult ? { y: 98, dx: 19, rx: 11, ry: 13 } : { y: 112, dx: 22, rx: 13, ry: 15.5 };
  const mouthY = adult ? 117 : 134;
  const cheekY = adult ? 112 : 130;

  return (
    <svg viewBox={viewBox} {...frame} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <radialGradient id={`${g}-skin`} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor={p.skinHi} />
          <stop offset="0.42" stopColor={p.skin} />
          <stop offset="0.82" stopColor={p.skinLo} />
          <stop offset="1" stopColor={p.skinDeep} />
        </radialGradient>
        <linearGradient id={`${g}-lid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skin} />
          <stop offset="1" stopColor={p.skinLo} />
        </linearGradient>
        <radialGradient id={`${g}-moss`} cx="38%" cy="22%" r="85%">
          <stop offset="0" stopColor={p.mossHi} />
          <stop offset="0.5" stopColor={p.moss} />
          <stop offset="1" stopColor={p.mossLo} />
        </radialGradient>
        <linearGradient id={`${g}-tuft`} gradientUnits="userSpaceOnUse" x1="0" y1={adult ? 70 : 82} x2="0" y2={adult ? 92 : 106}>
          <stop offset="0" stopColor={p.moss} />
          <stop offset="1" stopColor={p.mossLo} />
        </linearGradient>
        <linearGradient id={`${g}-leaf`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={p.leafLo} />
          <stop offset="1" stopColor={p.leaf} />
        </linearGradient>
        <radialGradient id={`${g}-eye`} cx="50%" cy="78%" r="75%">
          <stop offset="0" stopColor={p.eyeHi} />
          <stop offset="0.5" stopColor={p.eye} />
          <stop offset="1" stopColor="#05080a" />
        </radialGradient>
        <radialGradient id={`${g}-cheek`}>
          <stop offset="0" stopColor={p.cheek} stopOpacity="0.85" />
          <stop offset="1" stopColor={p.cheek} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${g}-amber`} cx="35%" cy="30%">
          <stop offset="0" stopColor="#fff2c4" />
          <stop offset="0.5" stopColor={p.glow} />
          <stop offset="1" stopColor="#b8741a" />
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
      </defs>

      {socle && (
        <g>
          <ellipse cx="100" cy="190" rx="70" ry="7" fill="#1d2a22" opacity="0.18" filter={`url(#${g}-b2)`} />
          <ellipse cx="100" cy="184" rx="62" ry="12" fill="#6b5236" />
          <ellipse cx="100" cy="178" rx="60" ry="10" fill={`url(#${g}-moss)`} />
          <ellipse cx="82" cy="175" rx="26" ry="3.5" fill="#fff" opacity="0.18" />
        </g>
      )}

      {/* Ombre portée au sol : se resserre quand Mossy saute (voir .mossy-hop-shadow) */}
      <ellipse
        key={`sh-${hop}`}
        cx="100"
        cy="183"
        rx={adult ? 52 : 42}
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
              {/* Queue feuillue (adulte) */}
              {adult && (
                <g>
                  <path d="M134 160 C 158 160, 170 140, 166 118" stroke={p.skinLo} strokeWidth="11" strokeLinecap="round" fill="none" />
                  <path d="M134 160 C 158 160, 170 140, 166 118" stroke={p.skin} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
                  <path d={LEAF_NOTCHED} transform="translate(166 122) rotate(18) scale(0.85)" fill={`url(#${g}-leaf)`} />
                </g>
              )}

              {/* Pattes */}
              {adult ? (
                <g>
                  {[78, 122].map((x) => (
                    <g key={x}>
                      <rect x={x - 11} y="156" width="22" height="26" rx="10" fill={`url(#${g}-skin)`} />
                      <ellipse cx={x} cy="179" rx="14" ry="7" fill={p.skinLo} />
                      <ellipse cx={x - 3} cy="177" rx="8" ry="3" fill={p.skinHi} opacity="0.55" />
                      {[-6, 0, 6].map((t) => (
                        <path key={t} d={`M${x + t} 181 v-4`} stroke={p.skinDeep} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                      ))}
                    </g>
                  ))}
                </g>
              ) : (
                <g>
                  {[82, 118].map((x) => (
                    <g key={x}>
                      <ellipse cx={x} cy="176" rx="13" ry="8.5" fill={`url(#${g}-skin)`} />
                      <ellipse cx={x - 3} cy="173" rx="6" ry="2.6" fill={p.skinHi} opacity="0.6" />
                      {[-5, 0, 5].map((t) => (
                        <path key={t} d={`M${x + t} 183 v-3.5`} stroke={p.skinDeep} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
                      ))}
                    </g>
                  ))}
                </g>
              )}

              {/* Corps */}
              <ellipse cx="100" cy={adult ? 146 : 158} rx={adult ? 44 : 32} ry={adult ? 34 : 24} fill={`url(#${g}-skin)`} />
              <ellipse cx="100" cy={adult ? 152 : 164} rx={adult ? 24 : 17} ry={adult ? 18 : 12} fill={p.skinHi} opacity="0.6" />
              {/* Occlusion sous la tête */}
              <ellipse cx="100" cy={adult ? 126 : 142} rx={adult ? 38 : 34} ry="8" fill={p.skinDeep} opacity="0.45" filter={`url(#${g}-b2)`} />

              {/* Bras : se lèvent dans la joie */}
              {[-1, 1].map((s) => (
                <g
                  key={s}
                  className="mossy-arm"
                  style={{
                    transformOrigin: `${100 + s * (adult ? 36 : 26)}px ${adult ? 136 : 150}px`,
                    transform: happy ? `rotate(${s * -55}deg)` : "rotate(0deg)",
                  }}
                >
                  <ellipse
                    cx={100 + s * (adult ? 42 : 31)}
                    cy={adult ? 148 : 158}
                    rx={adult ? 9 : 7.5}
                    ry={adult ? 14 : 10.5}
                    transform={`rotate(${s * -22} ${100 + s * (adult ? 42 : 31)} ${adult ? 148 : 158})`}
                    fill={`url(#${g}-skin)`}
                  />
                </g>
              ))}

              {/* Amulette d'ambre (adulte) ou foulard (explorateur) */}
              {adult && (
                <g>
                  <path d="M80 128 Q100 142 120 128" stroke={p.leafLo} strokeWidth="2.4" fill="none" />
                  <circle cx="100" cy="140" r="9" fill={p.glow} opacity="0.35" filter={`url(#${g}-b2)`} />
                  <path d="M100 131 L107 139 L100 149 L93 139 Z" fill={`url(#${g}-amber)`} />
                  <path d="M98 135 l2 -2 l2 2" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.8" />
                </g>
              )}
              {scarf && !adult && (
                <g>
                  <path d="M66 140 Q100 158 134 140 L130 150 Q100 164 70 150 Z" fill="#c9772f" />
                  <path d={LEAF} transform="translate(122 150) rotate(150) scale(0.55)" fill="#e09a45" />
                  <rect x="128" y="152" width="16" height="13" rx="4" fill="#a46d42" />
                </g>
              )}

              {/* Tête (s'incline vers où Mossy regarde) */}
              <g className="mossy-head" style={{ transformOrigin: `100px ${adult ? 128 : 146}px`, transform: `rotate(${look * 5}deg)` }}>
                {/* Oreilles-feuilles : frétillent dans la joie */}
                {[-1, 1].map((s) => (
                  <g key={s} className={happy ? "mossy-ear-wiggle" : undefined} style={{ transformOrigin: `${100 + s * (adult ? 38 : 44)}px ${adult ? 80 : 90}px`, animationDelay: s > 0 ? "0.12s" : "0s" }}>
                    <path
                      d={adult ? LEAF_NOTCHED : LEAF_EAR}
                      transform={`translate(${100 + s * (adult ? 38 : 44)} ${adult ? 80 : 90}) rotate(${s * (adult ? 38 : 34)}) scale(${adult ? 1.15 : 1.05}, ${adult ? 1.05 : 0.95})`}
                      fill={`url(#${g}-leaf)`}
                    />
                    <path
                      d="M0 -2 V -30"
                      transform={`translate(${100 + s * (adult ? 38 : 44)} ${adult ? 80 : 90}) rotate(${s * (adult ? 38 : 34)}) scale(${adult ? 1.15 : 1.05}, ${adult ? 1.05 : 0.95})`}
                      stroke={p.mossHi}
                      strokeWidth="1"
                      opacity="0.8"
                    />
                  </g>
                ))}

                {/* Ramures (adulte) */}
                {adult &&
                  [-1, 1].map((s) => (
                    <g key={s}>
                      <path d={`M${100 + s * 14} 54 C ${100 + s * 18} 36, ${100 + s * 30} 30, ${100 + s * 32} 18 M${100 + s * 24} 36 C ${100 + s * 32} 34, ${100 + s * 38} 30, ${100 + s * 42} 26`} stroke="#8a6446" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                      <path d={LEAF} transform={`translate(${100 + s * 32} 20) rotate(${s * 30}) scale(0.38)`} fill={`url(#${g}-leaf)`} />
                      <path d={LEAF} transform={`translate(${100 + s * 42} 27) rotate(${s * 70}) scale(0.32)`} fill={`url(#${g}-leaf)`} />
                    </g>
                  ))}

                {/* Crinière de mousse (adulte) derrière la tête */}
                {adult && (
                  <MossBumps
                    d="M44 96 C 34 112, 40 132, 54 138 C 56 128, 62 122, 62 116 L 138 116 C 138 122, 144 128, 146 138 C 160 132, 166 112, 156 96 Z"
                    g={g}
                    p={p}
                  />
                )}

                {/* Tête */}
                <ellipse cx={head.cx} cy={head.cy} rx={head.rx} ry={head.ry} fill={`url(#${g}-skin)`} />
                {/* Liseré de lumière (contre-jour) */}
                <path
                  d={`M${head.cx + head.rx * 0.55} ${head.cy + head.ry * 0.78} A ${head.rx} ${head.ry} 0 0 0 ${head.cx + head.rx * 0.98} ${head.cy + head.ry * 0.1}`}
                  stroke="#fff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.55"
                  filter={`url(#${g}-b1)`}
                />

                {/* Chapeau de mousse */}
                <MossBumps
                  d={
                    adult
                      ? "M52 84 C 46 58, 66 40, 86 44 C 94 32, 116 30, 124 42 C 144 40, 158 58, 150 84 C 142 76, 132 82, 126 74 C 118 84, 106 78, 100 84 C 92 76, 82 84, 74 76 C 66 84, 58 78, 52 84 Z"
                      : "M44 96 C 38 64, 62 42, 84 46 C 92 32, 116 30, 126 44 C 148 42, 164 62, 156 96 C 148 86, 138 92, 132 82 C 124 92, 112 86, 104 92 C 96 84, 84 92, 76 84 C 68 94, 54 86, 44 96 Z"
                  }
                  g={g}
                  p={p}
                />
                {/* Bord du chapeau : touffes serrées et irrégulières, fondues dans la mousse */}
                {(adult
                  ? [
                      [56, 80, 7],
                      [68, 83, 7.5],
                      [81, 80, 7],
                      [94, 84, 7.5],
                      [107, 81, 7],
                      [120, 84, 7.5],
                      [133, 80, 7],
                      [145, 82, 6.5],
                    ]
                  : [
                      [48, 92, 8],
                      [61, 95, 8.5],
                      [75, 92, 8],
                      [89, 96, 8.5],
                      [103, 93, 8],
                      [117, 96, 8.5],
                      [131, 92, 8],
                      [144, 95, 8],
                      [154, 90, 6.5],
                    ]
                ).map(([x, y, r]) => (
                  <circle key={`t-${x}`} cx={x} cy={y} r={r} fill={`url(#${g}-tuft)`} />
                ))}
                {/* Texture de mousse */}
                <g>
                  {(adult
                    ? [
                        [72, 58, 3, 1],
                        [96, 46, 2.6, 1],
                        [118, 52, 3.2, 1],
                        [136, 66, 2.4, 1],
                        [84, 70, 2, 0],
                        [110, 66, 2.2, 0],
                        [62, 72, 2, 0],
                      ]
                    : [
                        [66, 66, 3.4, 1],
                        [92, 52, 3, 1],
                        [118, 50, 3.4, 1],
                        [142, 70, 2.8, 1],
                        [80, 78, 2.2, 0],
                        [106, 70, 2.4, 0],
                        [130, 82, 2, 0],
                        [56, 84, 2, 0],
                      ]
                  ).map(([x, y, r, light]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={light ? p.mossHi : p.mossLo} opacity={light ? 0.9 : 0.55} />
                  ))}
                  <ellipse cx={adult ? 84 : 80} cy={adult ? 50 : 56} rx="16" ry="7" fill="#fff" opacity="0.28" filter={`url(#${g}-b2)`} />
                </g>
                {/* Occlusion douce sous la mousse */}
                <path
                  d={adult ? "M54 88 C 66 86, 80 88, 100 90 C 120 88, 134 86, 148 88" : "M46 100 C 62 97, 82 99, 104 100 C 124 99, 142 96, 154 100"}
                  stroke={p.skinDeep}
                  strokeWidth="6"
                  fill="none"
                  opacity="0.35"
                  filter={`url(#${g}-b2)`}
                />

                {/* Pousse (jeune) ou champignon (adulte) */}
                {adult ? (
                  <g transform="translate(140 58)">
                    <rect x="-3" y="-4" width="6" height="10" rx="2.5" fill="#f6eedb" />
                    <path d="M-11 -3 Q 0 -18 11 -3 Q 0 0 -11 -3 Z" fill="#d0643f" />
                    <circle cx="-4" cy="-8" r="1.6" fill="#fff" />
                    <circle cx="4" cy="-6" r="1.2" fill="#fff" />
                  </g>
                ) : (
                  <g className={idle ? "mossy-sprout" : undefined} style={{ transformOrigin: "110px 44px" }}>
                    <path d="M110 44 C 110 34, 112 28, 116 22" stroke={p.leafLo} strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d={LEAF} transform="translate(116 24) rotate(58) scale(0.42)" fill={`url(#${g}-leaf)`} />
                    <path d={LEAF} transform="translate(114 28) rotate(-46) scale(0.34)" fill={`url(#${g}-leaf)`} />
                  </g>
                )}
                <g transform={adult ? "translate(66 66)" : "translate(140 62)"}>
                  {[0, 72, 144, 216, 288].map((r) => (
                    <ellipse key={r} cx="0" cy="-3" rx="1.8" ry="3" fill="#fffaf0" transform={`rotate(${r})`} />
                  ))}
                  <circle r="1.6" fill="#f2c46b" />
                </g>

                {/* Reflet satiné sur la joue gauche */}
                <ellipse cx={head.cx - head.rx * 0.62} cy={head.cy + head.ry * 0.12} rx="7" ry="11" fill="#fff" opacity="0.4" filter={`url(#${g}-b2)`} />

                {/* Visage : le regard suit `look` */}
                <g className="mossy-eyes" style={{ transform: `translateX(${look * 4}px)` }}>
                  <Eye cx={100 - eyes.dx} cy={eyes.y} rx={eyes.rx} ry={eyes.ry} p={p} g={g} closed={eyesClosed} idle={idle} />
                  <Eye cx={100 + eyes.dx} cy={eyes.y} rx={eyes.rx} ry={eyes.ry} p={p} g={g} closed={eyesClosed} idle={idle} />
                </g>
                {/* Sourcils de mousse (adulte) */}
                {adult &&
                  [-1, 1].map((s) => (
                    <path key={s} d={`M${100 + s * 10} ${eyes.y - 17} Q ${100 + s * 19} ${eyes.y - 22} ${100 + s * 28} ${eyes.y - 18}`} stroke={p.mossLo} strokeWidth="3.4" strokeLinecap="round" fill="none" />
                  ))}
                <ellipse cx={100 - eyes.dx - 12} cy={cheekY} rx="11" ry="6.5" fill={`url(#${g}-cheek)`} />
                <ellipse cx={100 + eyes.dx + 12} cy={cheekY} rx="11" ry="6.5" fill={`url(#${g}-cheek)`} />
                <ellipse cx="100" cy={mouthY - 6} rx="2.6" ry="1.6" fill={p.skinDeep} opacity="0.7" />
                <Mouth mood={mood} p={p} cy={mouthY} />
              </g>

              {/* Lucioles (forme lunaire) */}
              {lunar && (
                <g fill={p.glow}>
                  {[
                    [40, 70],
                    [164, 60],
                    [170, 120],
                    [32, 130],
                  ].map(([x, y], i) => (
                    <g key={i} className="lab-glow" style={{ animationDelay: `${i * 0.6}s` }}>
                      <circle cx={x} cy={y} r="6" opacity="0.25" />
                      <circle cx={x} cy={y} r="2.2" />
                    </g>
                  ))}
                </g>
              )}
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
