import { useId, type ReactNode } from "react";
import { RARITY, creatureById, type CreatureId, type StageId } from "../creatures";

/*
 * Figurines de gardiens (SVG originaux, rendu « vinyle mat » : dégradés doux, reflet satiné, socle naturel).
 * Tout est dessiné ici : aucun asset externe. viewBox 200 × 200, socle en bas.
 */

interface Palette {
  body: string;
  shade: string;
  belly: string;
  accent: string;
  accent2: string;
  eye: string;
  cheek: string;
}

const PALETTES: Record<CreatureId, Palette> = {
  mossy: { body: "#f1e6cb", shade: "#d4c29c", belly: "#fbf5e6", accent: "#7fa257", accent2: "#b4cf86", eye: "#28362c", cheek: "#e9a98c" },
  fougerin: { body: "#a7c784", shade: "#7aa25a", belly: "#e6efcf", accent: "#4f8a3e", accent2: "#cfe3a8", eye: "#24331f", cheek: "#e8a98a" },
  galene: { body: "#b9c6c5", shade: "#8fa1a3", belly: "#dfe6e3", accent: "#6f9a4f", accent2: "#a9c77f", eye: "#26323a", cheek: "#e6a993" },
  perline: { body: "#bfe4f2", shade: "#5ea8c9", belly: "#effafd", accent: "#2f7fa3", accent2: "#ffffff", eye: "#1b3346", cheek: "#f0a9a4" },
  lumo: { body: "#56679b", shade: "#3c4a78", belly: "#f3e3bb", accent: "#f2b24c", accent2: "#ffe3a3", eye: "#1a2140", cheek: "#e9a4a0" },
  ecorcelle: { body: "#94694a", shade: "#6c4a33", belly: "#c9a27c", accent: "#6f9a4f", accent2: "#e9a23b", eye: "#f6cf78", cheek: "#d98c70" },
  selenis: { body: "#4f7d50", shade: "#365c3b", belly: "#a2593a", accent: "#e9a23b", accent2: "#f8d48a", eye: "#2a1c12", cheek: "#e09c80" },
};

const LUNAR: Palette = { body: "#c9d3ef", shade: "#8796c9", belly: "#eef1fb", accent: "#46589a", accent2: "#f3c86e", eye: "#1a2140", cheek: "#c7a3d8" };

type Socle = "moss" | "leaves" | "pebble" | "water" | "mushroom" | "stump" | "stone";
const SOCLE: Record<CreatureId, Socle> = {
  mossy: "moss",
  fougerin: "leaves",
  galene: "pebble",
  perline: "water",
  lumo: "mushroom",
  ecorcelle: "stump",
  selenis: "stone",
};

const STAGE_SCALE: Record<StageId, number> = { egg: 0.8, young: 0.86, explorer: 0.95, guardian: 1.04, lunar: 1.04 };

function Face({ p, y = 122, dx = 14 }: { p: Palette; y?: number; dx?: number }) {
  return (
    <g>
      <ellipse cx={100 - dx} cy={y} rx="5.5" ry="7" fill={p.eye} />
      <ellipse cx={100 + dx} cy={y} rx="5.5" ry="7" fill={p.eye} />
      <circle cx={100 - dx + 1.8} cy={y - 2.6} r="1.9" fill="#fff" />
      <circle cx={100 + dx + 1.8} cy={y - 2.6} r="1.9" fill="#fff" />
      <ellipse cx={100 - dx - 10} cy={y + 11} rx="7" ry="4" fill={p.cheek} opacity="0.55" />
      <ellipse cx={100 + dx + 10} cy={y + 11} rx="7" ry="4" fill={p.cheek} opacity="0.55" />
      <path d={`M${96} ${y + 13} q4 4 8 0`} stroke={p.eye} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Leaf({ x, y, r = 0, s = 1, fill }: { x: number; y: number; r?: number; s?: number; fill: string }) {
  return (
    <path
      d="M0 0 C 6 -8, 6 -18, 0 -26 C -6 -18, -6 -8, 0 0 Z"
      transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
      fill={fill}
    />
  );
}

function Body({ id, p, g }: { id: CreatureId; p: Palette; g: string }) {
  switch (id) {
    case "mossy":
      return (
        <g>
          <ellipse cx="83" cy="153" rx="11" ry="6" fill={p.shade} />
          <ellipse cx="117" cy="153" rx="11" ry="6" fill={p.shade} />
          <ellipse cx="57" cy="128" rx="8" ry="11" fill={p.shade} transform="rotate(20 57 128)" />
          <ellipse cx="143" cy="128" rx="8" ry="11" fill={p.shade} transform="rotate(-20 143 128)" />
          <ellipse cx="100" cy="118" rx="46" ry="40" fill={`url(#${g}-body)`} />
          <ellipse cx="100" cy="134" rx="26" ry="18" fill={p.belly} opacity="0.7" />
          <g fill={p.accent}>
            <circle cx="64" cy="102" r="14" />
            <circle cx="82" cy="89" r="17" />
            <circle cx="103" cy="84" r="18" />
            <circle cx="123" cy="90" r="16" />
            <circle cx="138" cy="104" r="12" />
            <rect x="60" y="92" width="80" height="16" rx="8" />
          </g>
          <g fill={p.accent2}>
            <circle cx="80" cy="84" r="3" />
            <circle cx="104" cy="77" r="2.5" />
            <circle cx="125" cy="86" r="2.5" />
            <circle cx="92" cy="94" r="2" />
            <circle cx="68" cy="98" r="2" />
          </g>
          <path d="M104 70 C 104 62, 106 58, 108 54" stroke={p.accent} strokeWidth="3" strokeLinecap="round" fill="none" />
          <Leaf x={108} y={56} r={50} s={0.55} fill={p.accent2} />
          <Leaf x={106} y={60} r={-40} s={0.45} fill={p.accent} />
          <Face p={p} y={124} />
        </g>
      );
    case "fougerin":
      return (
        <g>
          <ellipse cx="86" cy="154" rx="9" ry="5" fill={p.shade} />
          <ellipse cx="114" cy="154" rx="9" ry="5" fill={p.shade} />
          <Leaf x={58} y={136} r={-110} s={0.9} fill={p.accent} />
          <Leaf x={142} y={136} r={110} s={0.9} fill={p.accent} />
          <path d="M100 76 C 136 76, 142 120, 138 136 C 134 152, 66 152, 62 136 C 58 120, 64 76, 100 76 Z" fill={`url(#${g}-body)`} />
          <ellipse cx="100" cy="136" rx="22" ry="12" fill={p.belly} opacity="0.7" />
          <path
            d="M100 80 C 100 54, 124 36, 142 46 C 158 56, 152 78, 136 76 C 124 74, 126 60, 136 62"
            stroke={p.accent}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {[
            [104, 64, -60],
            [112, 50, -30],
            [126, 42, 0],
            [146, 52, 50],
            [150, 68, 100],
          ].map(([x, y, r]) => (
            <Leaf key={`${x}-${y}`} x={x} y={y} r={r} s={0.42} fill={p.accent2} />
          ))}
          <Face p={p} y={114} dx={13} />
        </g>
      );
    case "galene":
      return (
        <g>
          <ellipse cx="100" cy="140" rx="46" ry="22" fill={p.shade} />
          <ellipse cx="100" cy="136" rx="44" ry="20" fill={`url(#${g}-body)`} />
          <ellipse cx="100" cy="108" rx="36" ry="22" fill={p.body} />
          <ellipse cx="100" cy="104" rx="34" ry="19" fill={p.belly} opacity="0.6" />
          <ellipse cx="102" cy="78" rx="24" ry="14" fill={p.shade} />
          <ellipse cx="102" cy="76" rx="22" ry="12" fill={p.body} />
          <Leaf x={98} y={66} r={-30} s={0.5} fill={p.accent} />
          <Leaf x={104} y={66} r={10} s={0.55} fill={p.accent2} />
          <Leaf x={110} y={67} r={45} s={0.45} fill={p.accent} />
          <ellipse cx="76" cy="132" rx="6" ry="3" fill="#fff" opacity="0.35" />
          <Face p={p} y={106} dx={12} />
        </g>
      );
    case "perline":
      return (
        <g>
          <path d="M100 50 C 122 84, 148 104, 148 128 A48 48 0 0 1 52 128 C 52 104, 78 84, 100 50 Z" fill={`url(#${g}-body)`} opacity="0.95" />
          <path d="M70 120 C 70 100, 84 86, 94 74" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />
          <ellipse cx="100" cy="150" rx="30" ry="9" fill={p.belly} opacity="0.5" />
          <circle cx="126" cy="104" r="4" fill="#fff" opacity="0.7" />
          <Face p={p} y={128} dx={13} />
        </g>
      );
    case "lumo":
      return (
        <g>
          <ellipse cx="70" cy="104" rx="26" ry="14" fill="#eef4ff" opacity="0.55" transform="rotate(-30 70 104)" />
          <ellipse cx="130" cy="104" rx="26" ry="14" fill="#eef4ff" opacity="0.55" transform="rotate(30 130 104)" />
          <circle cx="100" cy="150" r="24" fill={p.accent} opacity="0.25" className="lab-glow" />
          <ellipse cx="100" cy="148" rx="20" ry="12" fill={p.accent2} />
          <ellipse cx="100" cy="124" rx="36" ry="32" fill={`url(#${g}-body)`} />
          <ellipse cx="100" cy="136" rx="20" ry="14" fill={p.belly} opacity="0.85" />
          <path d="M90 94 C 86 84, 80 78, 74 76" stroke={p.shade} strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="73" cy="75" r="3.5" fill={p.accent2} />
          <path d="M106 94 C 116 76, 134 64, 146 66" stroke={p.shade} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="150" cy="68" r="20" fill={p.accent} opacity="0.28" className="lab-glow" />
          <circle cx="150" cy="68" r="10" fill={`url(#${g}-glow)`} />
          <Face p={{ ...p, eye: "#1a2140" }} y={120} dx={13} />
        </g>
      );
    case "ecorcelle":
      return (
        <g>
          <rect x="72" y="140" width="16" height="16" rx="6" fill={p.shade} />
          <rect x="112" y="140" width="16" height="16" rx="6" fill={p.shade} />
          <rect x="66" y="70" width="68" height="82" rx="30" fill={`url(#${g}-body)`} />
          {[80, 92, 108, 120].map((x) => (
            <path key={x} d={`M${x} 78 C ${x - 3} 100, ${x + 3} 120, ${x} 146`} stroke={p.shade} strokeWidth="2.4" fill="none" opacity="0.7" />
          ))}
          <ellipse cx="100" cy="108" rx="24" ry="20" fill={p.belly} />
          <path d="M64 130 C 80 118, 104 126, 118 134" stroke={p.shade} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M136 130 C 120 118, 96 126, 82 134" stroke={p.body} strokeWidth="9" strokeLinecap="round" fill="none" />
          <Leaf x={78} y={74} r={-40} s={0.8} fill={p.accent} />
          <Leaf x={92} y={68} r={-12} s={0.9} fill={p.accent2} />
          <Leaf x={108} y={68} r={12} s={0.9} fill={p.accent} />
          <Leaf x={122} y={74} r={40} s={0.8} fill={p.accent2} />
          <ellipse cx="90" cy="106" rx="4.5" ry="6" fill={p.eye} />
          <ellipse cx="110" cy="106" rx="4.5" ry="6" fill={p.eye} />
          <circle cx="91.5" cy="104" r="1.5" fill="#fff" />
          <circle cx="111.5" cy="104" r="1.5" fill="#fff" />
          <path d="M96 116 q4 3 8 0" stroke="#5a3a24" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      );
    case "selenis":
      return (
        <g>
          <rect x="88" y="128" width="24" height="28" rx="6" fill={p.belly} />
          <path d="M100 32 C 114 50, 126 62, 134 78 Q 100 86 66 78 C 74 62, 86 50, 100 32 Z" fill={p.body} />
          <path d="M100 56 C 118 76, 136 90, 146 108 Q 100 120 54 108 C 64 90, 82 76, 100 56 Z" fill={`url(#${g}-body)`} />
          <path d="M100 84 C 122 104, 144 118, 156 136 Q 100 150 44 136 C 56 118, 78 104, 100 84 Z" fill={p.shade} />
          <path d="M100 84 C 122 104, 144 118, 156 136 Q 100 146 44 136 C 56 118, 78 104, 100 84 Z" fill={p.body} opacity="0.55" />
          {[
            [70, 116],
            [132, 118],
            [86, 94],
            [118, 96],
          ].map(([x, y]) => (
            <ellipse key={`${x}`} cx={x} cy={y} rx="4" ry="6" fill={p.accent} />
          ))}
          <ellipse cx="91" cy="124" rx="4.5" ry="6" fill={p.eye} />
          <ellipse cx="109" cy="124" rx="4.5" ry="6" fill={p.eye} />
          <circle cx="92.5" cy="122" r="1.5" fill="#fff" />
          <circle cx="110.5" cy="122" r="1.5" fill="#fff" />
          <circle cx="100" cy="30" r="5" fill={p.accent2} />
        </g>
      );
  }
}

function SocleShape({ kind, night }: { kind: Socle; night?: boolean }) {
  const shadow = <ellipse cx="100" cy="188" rx="70" ry="7" fill="#1d2a22" opacity={night ? 0.35 : 0.16} />;
  switch (kind) {
    case "moss":
      return (
        <g>
          {shadow}
          <ellipse cx="100" cy="174" rx="62" ry="14" fill="#6b5236" />
          <ellipse cx="100" cy="166" rx="60" ry="12" fill="#7fa257" />
          <ellipse cx="86" cy="163" rx="30" ry="5" fill="#a9c77f" opacity="0.6" />
          <circle cx="58" cy="166" r="3" fill="#f3e3a8" />
          <circle cx="140" cy="164" r="2.5" fill="#f3e3a8" />
        </g>
      );
    case "leaves":
      return (
        <g>
          {shadow}
          <ellipse cx="100" cy="172" rx="62" ry="13" fill="#7a5a3a" />
          {[
            [60, 166, -70, "#c97a36"],
            [86, 162, -20, "#e0a043"],
            [114, 163, 30, "#9c6a3a"],
            [140, 167, 80, "#c97a36"],
            [100, 170, 90, "#7fa257"],
          ].map(([x, y, r, f]) => (
            <Leaf key={`${x}`} x={x as number} y={y as number} r={r as number} s={0.9} fill={f as string} />
          ))}
        </g>
      );
    case "pebble":
      return (
        <g>
          {shadow}
          <ellipse cx="100" cy="172" rx="60" ry="14" fill="#7e8f92" />
          <ellipse cx="100" cy="166" rx="58" ry="11" fill="#a9b8ba" />
          <ellipse cx="70" cy="168" rx="12" ry="5" fill="#c8d3d2" />
          <ellipse cx="132" cy="167" rx="10" ry="4" fill="#c8d3d2" />
        </g>
      );
    case "water":
      return (
        <g>
          {shadow}
          <ellipse cx="100" cy="172" rx="62" ry="14" fill="#8b9a9c" />
          <ellipse cx="100" cy="166" rx="56" ry="11" fill="#7cc1da" />
          <ellipse cx="100" cy="166" rx="38" ry="7" fill="none" stroke="#e8f7fb" strokeWidth="1.6" opacity="0.8" />
          <ellipse cx="100" cy="166" rx="20" ry="3.5" fill="none" stroke="#e8f7fb" strokeWidth="1.4" opacity="0.6" />
        </g>
      );
    case "mushroom":
      return (
        <g>
          {shadow}
          <rect x="84" y="164" width="32" height="20" rx="8" fill="#efe3c8" />
          <ellipse cx="100" cy="166" rx="62" ry="12" fill="#b4563c" />
          <ellipse cx="100" cy="162" rx="58" ry="8" fill="#cf6d4f" />
          {[66, 92, 118, 138].map((x, i) => (
            <circle key={x} cx={x} cy={162 + (i % 2)} r="3.5" fill="#f8ead0" />
          ))}
          <circle cx="44" cy="150" r="2.5" fill="#f2c46b" className="lab-glow" />
          <circle cx="158" cy="146" r="2" fill="#f2c46b" className="lab-glow" />
        </g>
      );
    case "stump":
      return (
        <g>
          {shadow}
          <path d="M44 162 L 46 180 Q 100 192 154 180 L 156 162 Z" fill="#7a5233" />
          <ellipse cx="100" cy="162" rx="56" ry="11" fill="#c9a27c" />
          <ellipse cx="100" cy="162" rx="40" ry="7.5" fill="none" stroke="#a37d58" strokeWidth="1.6" />
          <ellipse cx="100" cy="162" rx="22" ry="4" fill="none" stroke="#a37d58" strokeWidth="1.4" />
        </g>
      );
    case "stone":
      return (
        <g>
          {shadow}
          <ellipse cx="100" cy="174" rx="64" ry="14" fill="#6c6a62" />
          <ellipse cx="100" cy="166" rx="62" ry="12" fill="#9a978b" />
          <ellipse cx="100" cy="166" rx="48" ry="8" fill="none" stroke="#e9a23b" strokeWidth="1.6" opacity="0.8" />
          {[-1, 1].map((s) => (
            <ellipse key={s} cx={100 + s * 40} cy="164" rx="5" ry="3.5" fill="#a2593a" />
          ))}
        </g>
      );
  }
}

/** Attributs d'évolution, posés sur la figurine de base. */
function StageExtras({ stage, p }: { stage: StageId; p: Palette }): ReactNode {
  if (stage === "explorer")
    return (
      <g>
        <path d="M76 98 C 92 120, 112 132, 130 140" stroke="#7a5233" strokeWidth="3" fill="none" />
        <rect x="122" y="132" width="20" height="16" rx="5" fill="#a46d42" />
        <rect x="122" y="132" width="20" height="6" rx="3" fill="#7a5233" />
        <path d="M70 146 C 90 156, 110 156, 130 146 L 126 156 C 108 162, 92 162, 74 156 Z" fill="#c9772f" opacity="0.9" />
      </g>
    );
  if (stage === "guardian" || stage === "lunar") {
    const night = stage === "lunar";
    return (
      <g>
        {[-2, -1, 0, 1, 2].map((i) => (
          <Leaf key={i} x={100 + i * 12} y={72 - (2 - Math.abs(i)) * 4} r={i * 18} s={0.75} fill={night ? (i % 2 ? "#f3c86e" : "#8796c9") : i % 2 ? "#b4cf86" : "#4f7d50"} />
        ))}
        <circle cx="100" cy="148" r="6" fill={night ? "#f3c86e" : "#e9a23b"} />
        <circle cx="100" cy="148" r="2.5" fill={p.belly} />
        {night && (
          <g fill="#f3c86e">
            <circle cx="52" cy="88" r="2.4" className="lab-glow" />
            <circle cx="150" cy="80" r="2" className="lab-glow" />
            <circle cx="160" cy="124" r="1.8" className="lab-glow" />
            <path d="M44 120 a8 8 0 1 0 10 -10 a6 6 0 1 1 -10 10 Z" opacity="0.9" />
          </g>
        )}
      </g>
    );
  }
  return null;
}

export interface GuardianFigureProps {
  id: CreatureId;
  stage?: StageId;
  /** Gardien non découvert : silhouette élégante */
  silhouette?: boolean;
  /** Halo de vitrine selon la rareté */
  halo?: boolean;
  socle?: boolean;
  viewBox?: string;
  className?: string;
  /** Texte alternatif ; absent → décoratif */
  title?: string;
}

export function GuardianFigure({ id, stage = "young", silhouette, halo = true, socle = true, viewBox = "0 0 200 200", className, title }: GuardianFigureProps) {
  const g = useId().replace(/:/g, "");
  const c = creatureById(id);
  const lunar = stage === "lunar";
  const p = lunar ? LUNAR : PALETTES[id];
  const ring = c ? RARITY[c.rarity].ring : "#e9a23b";
  const s = STAGE_SCALE[stage];
  return (
    <svg viewBox={viewBox} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <radialGradient id={`${g}-body`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={p.belly} />
          <stop offset="0.45" stopColor={p.body} />
          <stop offset="1" stopColor={p.shade} />
        </radialGradient>
        <radialGradient id={`${g}-halo`}>
          <stop offset="0" stopColor={lunar ? "#f3c86e" : ring} stopOpacity={silhouette ? 0.12 : 0.45} />
          <stop offset="1" stopColor={ring} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${g}-glow`}>
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="0.6" stopColor={p.accent2} />
          <stop offset="1" stopColor={p.accent} />
        </radialGradient>
      </defs>
      {halo && <circle cx="100" cy="112" r="86" fill={`url(#${g}-halo)`} />}
      {socle && <SocleShape kind={SOCLE[id]} night={lunar} />}
      <g
        transform={`translate(100 158) scale(${s}) translate(-100 -158)`}
        style={silhouette ? { filter: lunar ? "brightness(0) invert(1)" : "brightness(0)", opacity: lunar ? 0.3 : 0.2 } : undefined}
      >
        <Body id={id} p={p} g={g} />
        {!silhouette && <StageExtras stage={stage} p={p} />}
      </g>
    </svg>
  );
}
