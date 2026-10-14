import { useId } from "react";
import { KitFace, KitFrame, type FaceColors, type FigureProps } from "./figure-kit";

/*
 * Perline — esprit de goutte d'eau (figurine originale ParkQuest).
 * Identité « eau » : corps-goutte translucide d'un seul tenant (pas de tête séparée), pointe qui
 * s'enroule en petite vague, branchies-frondes souples sur les côtés, nageoires-bras,
 * bulles qui montent dans le corps, reflets du ciel et lignes de lumière (caustiques).
 * Adulte « gardienne de la rivière » : silhouette plus haute et ondulante, crête de vagues dans
 * le dos, branchies plumeuses, nageoire caudale, nénuphar sur la tête, collier de galets.
 */

interface Pal {
  hi: string;
  mid: string;
  lo: string;
  deep: string;
  core: string;
  frond: string;
  frondTip: string;
  lily: string;
  face: FaceColors;
}

const DAY: Pal = {
  hi: "#f3fcff",
  mid: "#9fd8ec",
  lo: "#4fa6c8",
  deep: "#2a729a",
  core: "#e3f6fc",
  frond: "#6cc3dc",
  frondTip: "#f3a7b6",
  lily: "#f6b9c8",
  face: { lidTop: "#b8e4f2", lidBottom: "#86c8e0", shade: "#2a729a", eye: "#0f2236", iris: "#3d8fc2", cheek: "#f59aa6", mouth: "#5a2234" },
};

const LUNAR: Pal = {
  hi: "#eef0ff",
  mid: "#8f9ee0",
  lo: "#5262a8",
  deep: "#2c3672",
  core: "#d9def8",
  frond: "#7a86d0",
  frondTip: "#ffd98a",
  lily: "#ffe2a6",
  face: { lidTop: "#aab5ea", lidBottom: "#7d8bd0", shade: "#2c3672", eye: "#0e1430", iris: "#6c7fd8", cheek: "#c99ad8", mouth: "#40224a" },
};

const BUBBLES = [
  [86, 156, 3.2, 0],
  [118, 150, 2.4, 0.8],
  [104, 166, 2, 1.6],
  [126, 138, 1.8, 2.2],
];

export function PerlineFigure(props: FigureProps) {
  const { form = "young", lunar, mood = "rest", eyesClosed, look = 0, idle } = props;
  const g = useId().replace(/:/g, "");
  const p = lunar ? LUNAR : DAY;
  const adult = form === "adult";
  const happy = mood === "happy";

  // Corps-goutte : une seule forme ; l'adulte est plus haute et plus ondulante
  const body = adult
    ? "M100 30 C 116 52, 154 80, 156 122 C 158 160, 132 182, 100 182 C 68 182, 42 160, 44 122 C 46 80, 84 52, 100 30 Z"
    : "M100 40 C 112 58, 152 84, 152 124 C 152 160, 128 180, 100 180 C 72 180, 48 160, 48 124 C 48 84, 88 58, 100 40 Z";
  const eyeY = adult ? 108 : 118;

  const socle = (
    <g>
      <ellipse cx="100" cy="190" rx="70" ry="7" fill="#1d2a22" opacity="0.16" filter={`url(#${g}-b2)`} />
      <ellipse cx="100" cy="184" rx="64" ry="13" fill="#8b9a9c" />
      <ellipse cx="100" cy="179" rx="58" ry="10" fill={lunar ? "#3a4a8a" : "#7cc1da"} />
      <ellipse cx="100" cy="179" rx="40" ry="6" fill="none" stroke="#e8f7fb" strokeWidth="1.4" opacity="0.7" className={props.idle ? "comp-ripple" : undefined} style={{ transformOrigin: "100px 179px" }} />
      <ellipse cx="62" cy="181" rx="9" ry="4" fill="#c8d3d2" />
      <ellipse cx="140" cy="182" rx="7" ry="3.2" fill="#c8d3d2" />
    </g>
  );

  const defs = (
    <>
      <radialGradient id={`${g}-water`} cx="34%" cy="30%" r="80%">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="0.35" stopColor={p.mid} />
        <stop offset="0.8" stopColor={p.lo} />
        <stop offset="1" stopColor={p.deep} />
      </radialGradient>
      <linearGradient id={`${g}-frond`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor={p.frond} />
        <stop offset="1" stopColor={p.frondTip} />
      </linearGradient>
      <linearGradient id={`${g}-fin`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={p.mid} stopOpacity="0.95" />
        <stop offset="1" stopColor={p.lo} stopOpacity="0.75" />
      </linearGradient>
      <clipPath id={`${g}-clip`}>
        <path d={body} />
      </clipPath>
    </>
  );

  /** Branchie-fronde : tige souple + petites barbes */
  const frond = (x: number, y: number, rot: number, len: number, key: string) => (
    <g key={key} transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 0 C 2 ${-len * 0.4}, -2 ${-len * 0.7}, 2 ${-len}`} stroke={`url(#${g}-frond)`} strokeWidth="5" strokeLinecap="round" fill="none" />
      {[0.35, 0.6, 0.85].map((t) => (
        <g key={t}>
          <ellipse cx={-4} cy={-len * t} rx="4" ry="2" fill={p.frondTip} opacity="0.85" transform={`rotate(-30 -4 ${-len * t})`} />
          <ellipse cx={5} cy={-len * t + 2} rx="4" ry="2" fill={p.frondTip} opacity="0.85" transform={`rotate(30 5 ${-len * t + 2})`} />
        </g>
      ))}
    </g>
  );

  return (
    <KitFrame g={g} c={p.face} defs={defs} socle={socle} shadowRx={adult ? 50 : 44} props={props}>
      {/* Nageoire caudale (adulte) */}
      {adult && (
        <g className={idle ? "comp-sway" : undefined} style={{ transformOrigin: "140px 168px" }}>
          <path d="M138 168 C 160 166, 176 150, 184 132 C 176 138, 168 138, 164 132 C 162 146, 152 158, 138 160 Z" fill={`url(#${g}-fin)`} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M142 ${164 - i * 3} C ${156 + i * 3} ${158 - i * 6}, ${166 + i * 3} ${148 - i * 6}, ${174 + i * 2} ${138 - i * 2}`} stroke="#fff" strokeWidth="1" opacity="0.5" fill="none" />
          ))}
        </g>
      )}

      {/* Petits pieds-gouttes */}
      {[84, 116].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="178" rx="12" ry="6.5" fill={p.lo} />
          <ellipse cx={x - 3} cy="176" rx="6" ry="2.2" fill={p.hi} opacity="0.6" />
        </g>
      ))}

      {/* Branchies-frondes : frétillent dans la joie */}
      {[-1, 1].map((s) => (
        <g key={s} className={happy ? "mossy-ear-wiggle" : idle ? "comp-sway" : undefined} style={{ transformOrigin: `${100 + s * 40}px ${eyeY - 12}px`, animationDelay: s > 0 ? "0.4s" : "0s" }}>
          {(adult ? [-14, 8, 30] : [-6, 22]).map((a, i) =>
            frond(100 + s * (adult ? 44 : 40), eyeY - (adult ? 6 : 8) + i * 4, s * (52 + a), adult ? 34 - i * 4 : 24 - i * 4, `${s}-${i}`),
          )}
        </g>
      ))}

      {/* Corps-goutte translucide */}
      <path d={body} fill={`url(#${g}-water)`} />
      <g clipPath={`url(#${g}-clip)`}>
        {/* Profondeur : cœur plus clair, ombre propre en bas à droite */}
        <ellipse cx="96" cy={adult ? 140 : 142} rx="36" ry="30" fill={p.core} opacity="0.45" filter={`url(#${g}-b4)`} />
        <ellipse cx="136" cy="168" rx="40" ry="26" fill={p.deep} opacity="0.35" filter={`url(#${g}-b4)`} />
        {/* Caustiques : lignes de lumière ondulées */}
        {[150, 160, 170].map((y, i) => (
          <path key={y} d={`M${56 + i * 6} ${y} C 74 ${y - 6}, 90 ${y + 6}, 108 ${y} S 136 ${y - 6}, ${146 - i * 4} ${y + 2}`} stroke="#fff" strokeWidth="1.3" fill="none" opacity="0.35" />
        ))}
        {/* Bulles qui montent */}
        {BUBBLES.map(([x, y, r, d]) => (
          <circle key={`${x}`} cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeWidth="1" opacity="0.8" className={idle || happy ? "comp-bubble" : undefined} style={{ animationDelay: `${d}s` }} />
        ))}
        {/* Crête de vagues dans le dos (adulte) */}
        {adult &&
          [0, 1, 2].map((i) => (
            <path key={i} d={`M${60 + i * 26} ${56 + i * 4} c 6 -10, 18 -8, 18 2 c -6 -4, -12 -2, -12 4`} stroke={p.hi} strokeWidth="3" fill="none" opacity="0.7" />
          ))}
      </g>
      {/* Reflet du ciel (fenêtre) + liseré */}
      <path d={adult ? "M70 70 C 60 86, 56 104, 58 120" : "M74 78 C 64 92, 60 108, 62 124"} stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.65" filter={`url(#${g}-b1)`} />
      <circle cx={adult ? 80 : 84} cy={adult ? 64 : 72} r="3.2" fill="#fff" opacity="0.85" />
      <path d={adult ? "M146 108 C 152 124, 150 146, 140 160" : "M142 112 C 148 128, 146 146, 138 158"} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.5" filter={`url(#${g}-b1)`} />

      {/* Pointe qui s'enroule en petite vague */}
      <path
        d={adult ? "M100 30 C 94 18, 104 8, 114 12 C 122 16, 118 28, 108 26" : "M100 40 C 94 28, 104 18, 113 22 C 120 26, 116 36, 108 34"}
        stroke={p.mid}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path d={adult ? "M100 30 C 94 18, 104 8, 114 12" : "M100 40 C 94 28, 104 18, 113 22"} stroke={p.hi} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.8" />

      {/* Nénuphar (adulte) */}
      {adult && (
        <g transform="translate(76 52) rotate(-14)">
          <ellipse cx="0" cy="4" rx="16" ry="5" fill="#6faa5a" />
          <path d="M0 4 L 14 2 L 10 7 Z" fill={p.deep} opacity="0.4" />
          {[-50, -20, 10, 40].map((r) => (
            <ellipse key={r} cx="0" cy="-4" rx="3.6" ry="8" fill={p.lily} transform={`rotate(${r} 0 2)`} />
          ))}
          <circle cx="0" cy="-1" r="2.6" fill="#f6d36a" />
        </g>
      )}

      {/* Nageoires-bras : se lèvent dans la joie */}
      {[-1, 1].map((s) => (
        <g
          key={s}
          className="mossy-arm"
          style={{ transformOrigin: `${100 + s * 40}px ${adult ? 140 : 146}px`, transform: happy ? `rotate(${s * -60}deg)` : "rotate(0deg)" }}
        >
          <path
            d={`M${100 + s * 40} ${adult ? 136 : 142} C ${100 + s * 58} ${adult ? 138 : 144}, ${100 + s * 62} ${adult ? 154 : 160}, ${100 + s * 52} ${adult ? 162 : 166} C ${100 + s * 48} ${adult ? 154 : 158}, ${100 + s * 44} ${adult ? 150 : 154}, ${100 + s * 40} ${adult ? 150 : 156} Z`}
            fill={`url(#${g}-fin)`}
          />
        </g>
      ))}

      {/* Collier de galets (adulte) */}
      {adult && (
        <g>
          <path d="M74 140 Q100 154 126 140" stroke="#5f6f72" strokeWidth="1.6" fill="none" />
          {[
            [84, 146, "#c8d3d2"],
            [100, 150, "#e6d9c2"],
            [116, 146, "#b9c6c5"],
          ].map(([x, y, f]) => (
            <g key={`${x}`}>
              <ellipse cx={x as number} cy={y as number} rx="5.5" ry="4" fill={f as string} />
              <ellipse cx={(x as number) - 1.5} cy={(y as number) - 1.4} rx="2" ry="1" fill="#fff" opacity="0.7" />
            </g>
          ))}
        </g>
      )}

      <g className="mossy-head" style={{ transformOrigin: `100px ${adult ? 160 : 166}px`, transform: `rotate(${look * 4}deg)` }}>
        <KitFace
          g={g}
          c={p.face}
          eyeY={eyeY}
          dx={adult ? 19 : 21}
          rx={adult ? 11 : 12.5}
          ry={adult ? 13.5 : 15}
          mouthY={adult ? 128 : 140}
          cheekY={adult ? 124 : 135}
          mood={mood}
          look={look}
          closed={eyesClosed}
          idle={idle}
        />
      </g>

      {/* Reflets d'étoiles (forme nocturne) */}
      {lunar &&
        [
          [70, 150],
          [128, 128],
          [112, 160],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill="#ffe2a6" className="lab-glow" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
    </KitFrame>
  );
}
