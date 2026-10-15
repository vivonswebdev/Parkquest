import { useId } from "react";
import { KitFace, KitFrame, type FaceColors, type FigureProps } from "./figure-kit";

/*
 * Lumo — luciole gardienne (figurine originale ParkQuest).
 * Identité « lumière et crépuscule » : boule duveteuse bleu crépuscule, collerette de duvet crème
 * dorée, ailes de voile translucides qui battent doucement, antennes plumeuses aux bouts lumineux,
 * lanterne chaude au bas du dos qui « respire » sa lumière, yeux couleur miel.
 * Adulte « gardien des lueurs » : grandes ailes ornées de croissants, antennes en plumes,
 * couronne de trois lueurs, étoile au front, lanterne en deux segments, collerette plus ample.
 */

interface Pal {
  hi: string;
  mid: string;
  lo: string;
  deep: string;
  ruff: string;
  ruffLo: string;
  wing: string;
  wingEdge: string;
  glow: string;
  glowCore: string;
  face: FaceColors;
}

const DAY: Pal = {
  hi: "#b9b8ef",
  mid: "#7f80cc",
  lo: "#555aa3",
  deep: "#363b78",
  ruff: "#fbefd2",
  ruffLo: "#e2c98f",
  wing: "#e9e6ff",
  wingEdge: "#f6c76a",
  glow: "#f6b54a",
  glowCore: "#fff3cf",
  face: { lidTop: "#8f90d8", lidBottom: "#6e72bd", shade: "#363b78", eye: "#1b1420", iris: "#d9922c", cheek: "#f3a0c0", mouth: "#4a1f3a" },
};

const LUNAR: Pal = {
  hi: "#8f9de0",
  mid: "#5664b0",
  lo: "#38418a",
  deep: "#1f2558",
  ruff: "#f4ead8",
  ruffLo: "#c9b88f",
  wing: "#c9d1ff",
  wingEdge: "#ffd98a",
  glow: "#ffcf6a",
  glowCore: "#fff7dc",
  face: { lidTop: "#6b78c4", lidBottom: "#4f5aa6", shade: "#1f2558", eye: "#140f1c", iris: "#f2b24c", cheek: "#d89ad8", mouth: "#3a1a34" },
};

export function LumoFigure(props: FigureProps) {
  const { form = "young", lunar, mood = "rest", eyesClosed, look = 0, idle } = props;
  const g = useId().replace(/:/g, "");
  const p = lunar ? LUNAR : DAY;
  const adult = form === "adult";
  const happy = mood === "happy";
  const cy = adult ? 112 : 118;
  const rx = adult ? 46 : 50;
  const ry = adult ? 44 : 46;
  const eyeY = adult ? 102 : 110;

  const socle = (
    <g>
      <ellipse cx="100" cy="191" rx="68" ry="7" fill="#1d2a22" opacity="0.18" filter={`url(#${g}-b2)`} />
      <rect x="86" y="178" width="28" height="14" rx="6" fill="#efe3c8" />
      <ellipse cx="100" cy="180" rx="62" ry="11" fill="#b4563c" />
      <ellipse cx="100" cy="176" rx="58" ry="7" fill="#cf6d4f" />
      {[66, 92, 118, 138].map((x, i) => (
        <circle key={x} cx={x} cy={176 + (i % 2)} r="3.2" fill="#f8ead0" />
      ))}
    </g>
  );

  const defs = (
    <>
      <radialGradient id={`${g}-fur`} cx="36%" cy="28%" r="80%">
        <stop offset="0" stopColor={p.hi} />
        <stop offset="0.45" stopColor={p.mid} />
        <stop offset="0.85" stopColor={p.lo} />
        <stop offset="1" stopColor={p.deep} />
      </radialGradient>
      {/* Même lumière pour les mèches que pour le corps (dégradé dans l'espace de la figure) */}
      <radialGradient id={`${g}-furU`} gradientUnits="userSpaceOnUse" cx={100 - rx * 0.28} cy={cy - ry * 0.44} r={rx * 1.55}>
        <stop offset="0" stopColor={p.hi} />
        <stop offset="0.45" stopColor={p.mid} />
        <stop offset="0.85" stopColor={p.lo} />
        <stop offset="1" stopColor={p.deep} />
      </radialGradient>
      <radialGradient id={`${g}-ruff`} cx="40%" cy="30%" r="80%">
        <stop offset="0" stopColor="#fffdf6" />
        <stop offset="0.6" stopColor={p.ruff} />
        <stop offset="1" stopColor={p.ruffLo} />
      </radialGradient>
      <radialGradient id={`${g}-glow`}>
        <stop offset="0" stopColor={p.glowCore} />
        <stop offset="0.45" stopColor={p.glow} />
        <stop offset="1" stopColor={p.glow} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${g}-lantern`} cx="40%" cy="35%">
        <stop offset="0" stopColor={p.glowCore} />
        <stop offset="0.55" stopColor={p.glow} />
        <stop offset="1" stopColor="#c27a1c" />
      </radialGradient>
      <linearGradient id={`${g}-wing`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={p.wing} stopOpacity="0.85" />
        <stop offset="0.75" stopColor={p.wing} stopOpacity="0.45" />
        <stop offset="1" stopColor={p.wingEdge} stopOpacity="0.7" />
      </linearGradient>
    </>
  );

  const wing = (s: number) => {
    const w = adult ? 1.35 : 1;
    return (
      <g
        key={s}
        className={happy ? "comp-wing-fast" : idle ? "comp-wing" : undefined}
        style={{ transformOrigin: `${100 + s * 26}px ${cy - 18}px`, animationDelay: s > 0 ? "0.05s" : "0s" }}
      >
        <path
          d={`M${100 + s * 26} ${cy - 18} C ${100 + s * 70 * w} ${cy - 70 * w}, ${100 + s * 96 * w} ${cy - 30 * w}, ${100 + s * 74 * w} ${cy + 4} C ${100 + s * 58 * w} ${cy + 16}, ${100 + s * 38} ${cy}, ${100 + s * 26} ${cy - 18} Z`}
          fill={`url(#${g}-wing)`}
          stroke="#fff"
          strokeOpacity="0.6"
          strokeWidth="1"
        />
        {[0.35, 0.6].map((t) => (
          <path key={t} d={`M${100 + s * 28} ${cy - 16} Q ${100 + s * 60 * w * (0.6 + t)} ${cy - 40 * w * t}, ${100 + s * 80 * w * (0.4 + t)} ${cy - 10 * w}`} stroke="#fff" strokeOpacity="0.5" strokeWidth="0.9" fill="none" />
        ))}
        {adult && (
          // Croissant de lune sur l'aile
          <path d={`M${100 + s * 74} ${cy - 40} a 9 9 0 1 0 ${s * 6} 14 a 7 7 0 1 1 ${-s * 6} -14 Z`} fill={p.wingEdge} opacity="0.85" />
        )}
      </g>
    );
  };

  const antenna = (s: number) => {
    const tipX = 100 + s * (adult ? 40 : 34);
    const tipY = adult ? 30 : 46;
    return (
      <g key={s} className={happy ? "mossy-ear-wiggle" : idle ? "comp-sway" : undefined} style={{ transformOrigin: `${100 + s * 12}px ${cy - ry + 6}px`, animationDelay: s > 0 ? "0.3s" : "0s" }}>
        <path d={`M${100 + s * 12} ${cy - ry + 6} C ${100 + s * 14} ${tipY + 20}, ${tipX - s * 10} ${tipY + 8}, ${tipX} ${tipY}`} stroke={p.deep} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        {adult &&
          [0.3, 0.5, 0.7].map((t) => {
            const x = 100 + s * 12 + (tipX - 100 - s * 12) * t;
            const y = cy - ry + 6 + (tipY - (cy - ry + 6)) * t;
            return <path key={t} d={`M${x} ${y} l ${s * 7} -4 M${x} ${y} l ${-s * 3} -7`} stroke={p.mid} strokeWidth="1.6" strokeLinecap="round" />;
          })}
        <circle cx={tipX} cy={tipY} r={adult ? 13 : 11} fill={`url(#${g}-glow)`} className="comp-glow" style={{ animationDelay: s > 0 ? "0.6s" : "0s" }} />
        <circle cx={tipX} cy={tipY} r={adult ? 4.2 : 3.6} fill={p.glowCore} />
      </g>
    );
  };

  return (
    <KitFrame g={g} c={p.face} defs={defs} socle={socle} shadowRx={adult ? 52 : 44} props={props}>
      {/* Halo de la lanterne sur le sol (lumière portée) */}
      <ellipse cx="100" cy="180" rx="40" ry="8" fill={p.glow} opacity="0.25" filter={`url(#${g}-b4)`} className="comp-glow" />

      {/* Ailes de voile */}
      {wing(-1)}
      {wing(1)}

      {/* Lanterne au bas du dos */}
      <g>
        <circle cx="100" cy={adult ? 166 : 164} r={adult ? 30 : 24} fill={`url(#${g}-glow)`} className="comp-glow" />
        <ellipse cx="100" cy={adult ? 164 : 162} rx={adult ? 22 : 18} ry={adult ? 14 : 12} fill={`url(#${g}-lantern)`} />
        {adult && <ellipse cx="100" cy="176" rx="14" ry="8" fill={`url(#${g}-lantern)`} />}
        <path d={`M${adult ? 82 : 86} ${adult ? 160 : 158} q 18 6 36 0`} stroke="#c27a1c" strokeWidth="1.2" fill="none" opacity="0.6" />
      </g>

      {/* Pattes fines */}
      {[88, 112].map((x) => (
        <g key={x}>
          <path d={`M${x} 160 L ${x + (x < 100 ? -2 : 2)} 178`} stroke={p.deep} strokeWidth="5" strokeLinecap="round" />
          <ellipse cx={x + (x < 100 ? -3 : 3)} cy="179" rx="6" ry="3.4" fill={p.lo} />
        </g>
      ))}

      {/* Antennes plumeuses (derrière la tête) */}
      {antenna(-1)}
      {antenna(1)}

      {/* Corps-boule duveteux */}
      <ellipse cx="100" cy={cy} rx={rx} ry={ry} fill={`url(#${g}-fur)`} />
      {/* Duvet : mèches douces fondues dans le contour */}
      {Array.from({ length: 22 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 22 - Math.PI / 2;
        const x = 100 + Math.cos(a) * rx * 0.97;
        const y = cy + Math.sin(a) * ry * 0.97;
        return <ellipse key={i} cx={x} cy={y} rx="6.5" ry="5" transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`} fill={`url(#${g}-furU)`} />;
      })}
      <ellipse cx="100" cy={cy} rx={rx - 1} ry={ry - 1} fill={`url(#${g}-furU)`} />
      <ellipse cx={100 - rx * 0.42} cy={cy - ry * 0.45} rx="14" ry="9" fill="#fff" opacity="0.28" filter={`url(#${g}-b2)`} />
      <path d={`M${100 + rx * 0.6} ${cy + ry * 0.6} A ${rx} ${ry} 0 0 0 ${100 + rx * 0.98} ${cy}`} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.45" filter={`url(#${g}-b1)`} />
      {/* Petites étoiles dans le duvet */}
      {[
        [72, cy - 30],
        [132, cy - 26],
        [140, cy + 6],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.4" fill={p.glowCore} opacity="0.85" className={idle ? "lab-glow" : undefined} style={{ animationDelay: `${i * 0.7}s` }} />
      ))}

      {/* Collerette de duvet doré */}
      <g>
        {Array.from({ length: adult ? 9 : 7 }, (_, i) => {
          const t = i / (adult ? 8 : 6);
          const x = 100 - (adult ? 40 : 34) + t * (adult ? 80 : 68);
          const y = cy + (adult ? 26 : 24) + Math.sin(t * Math.PI) * 8;
          return <ellipse key={i} cx={x} cy={y} rx={adult ? 8.5 : 7.5} ry={adult ? 8 : 7} fill={`url(#${g}-ruff)`} />;
        })}
        <ellipse cx="100" cy={cy + (adult ? 31 : 29)} rx={adult ? 22 : 18} ry="7" fill={`url(#${g}-ruff)`} />
      </g>

      {/* Petites pattes avant */}
      {[-1, 1].map((s) => (
        <g key={s} className="mossy-arm" style={{ transformOrigin: `${100 + s * 30}px ${cy + 22}px`, transform: happy ? `rotate(${s * -60}deg)` : "rotate(0deg)" }}>
          <ellipse cx={100 + s * 34} cy={cy + 30} rx="7" ry="9" fill={`url(#${g}-ruff)`} transform={`rotate(${s * -20} ${100 + s * 34} ${cy + 30})`} />
        </g>
      ))}

      {/* Couronne de lueurs et étoile au front (adulte) */}
      {adult && (
        <g>
          {[-1, 0, 1].map((s) => (
            <g key={s}>
              <circle cx={100 + s * 16} cy={cy - ry - 4 + Math.abs(s) * 6} r="7" fill={`url(#${g}-glow)`} className="comp-glow" style={{ animationDelay: `${s * 0.3 + 0.3}s` }} />
              <circle cx={100 + s * 16} cy={cy - ry - 4 + Math.abs(s) * 6} r="2.2" fill={p.glowCore} />
            </g>
          ))}
          <path d={`M100 ${eyeY - 26} l2.4 5 5.4 0.6 -4 3.6 1.2 5.4 -5 -2.8 -5 2.8 1.2 -5.4 -4 -3.6 5.4 -0.6 Z`} fill={p.glowCore} opacity="0.9" />
        </g>
      )}

      <g className="mossy-head" style={{ transformOrigin: `100px ${cy + 30}px`, transform: `rotate(${look * 4}deg)` }}>
        <KitFace
          g={g}
          c={p.face}
          eyeY={eyeY}
          dx={adult ? 18 : 20}
          rx={adult ? 11 : 12.5}
          ry={adult ? 13 : 14.5}
          mouthY={adult ? 122 : 130}
          cheekY={adult ? 118 : 126}
          mood={mood}
          look={look}
          closed={eyesClosed}
          idle={idle}
        />
      </g>
    </KitFrame>
  );
}
