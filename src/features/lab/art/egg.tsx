import { useId } from "react";
import { cn } from "@/lib/utils";
import type { EggId } from "../creatures";

/*
 * Œufs ParkQuest (SVG originaux) : coquille légèrement 3D (reflet + ombre propre), motifs du biome,
 * nid naturel, halo doux. États : endormi, réactif, prêt (fissures lumineuses), éclosion, ouvert.
 */

export type EggState = "dormant" | "reactive" | "ready" | "hatching" | "open";

const SHELL = "M100 22 C 142 22, 166 92, 166 132 C 166 176, 136 198, 100 198 C 64 198, 34 176, 34 132 C 34 92, 58 22, 100 22 Z";
const CRACK = "M34 122 L50 112 L62 124 L78 106 L92 120 L106 102 L120 118 L134 104 L148 118 L166 110";
/** Moitiés de coquille découpées le long de la fissure */
const TOP_CLIP = `M0 0 H200 V110 L166 110 L148 118 L134 104 L120 118 L106 102 L92 120 L78 106 L62 124 L50 112 L34 122 L0 122 Z`;
const BOTTOM_CLIP = `M0 240 H200 V110 L166 110 L148 118 L134 104 L120 118 L106 102 L92 120 L78 106 L62 124 L50 112 L34 122 L0 122 Z`;

const COLORS: Record<EggId, { top: string; bottom: string; motif: string; motif2: string; halo: string }> = {
  forest: { top: "#f6eedb", bottom: "#a9bf86", motif: "#6f9a4f", motif2: "#9a7a55", halo: "#cfe3a8" },
  river: { top: "#eef8fa", bottom: "#86c3d8", motif: "#2f7fa3", motif2: "#b9c6c5", halo: "#bfe4f2" },
  dusk: { top: "#e4ddf3", bottom: "#4d5294", motif: "#f3c86e", motif2: "#8f86c9", halo: "#c9bff0" },
};

function Motifs({ egg }: { egg: EggId }) {
  const c = COLORS[egg];
  if (egg === "forest")
    return (
      <g>
        <path d="M44 150 C 70 140, 90 160, 120 146 S 160 150, 170 140" stroke={c.motif2} strokeWidth="2" fill="none" opacity="0.35" />
        <path d="M40 168 C 72 160, 96 178, 128 166 S 162 168, 170 160" stroke={c.motif2} strokeWidth="1.6" fill="none" opacity="0.3" />
        {[
          [70, 84, -30, 1],
          [128, 70, 35, 0.8],
          [112, 150, 20, 1.1],
          [62, 132, -60, 0.9],
          [146, 122, 60, 0.9],
        ].map(([x, y, r, s]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
            <path d="M0 0 C 7 -8, 7 -20, 0 -28 C -7 -20, -7 -8, 0 0 Z" fill={c.motif} opacity="0.75" />
            <path d="M0 -2 V -24" stroke="#f6eedb" strokeWidth="1" opacity="0.6" />
          </g>
        ))}
        {[
          [94, 60, 5],
          [84, 112, 4],
          [136, 96, 3.5],
          [98, 176, 4.5],
          [56, 104, 3],
        ].map(([x, y, r]) => (
          <circle key={`${x}`} cx={x} cy={y} r={r} fill="#c9d49a" opacity="0.9" />
        ))}
      </g>
    );
  if (egg === "river")
    return (
      <g>
        {[
          [72, 80],
          [126, 66],
          [140, 120],
          [60, 140],
          [104, 158],
        ].map(([x, y]) => (
          <path key={`${x}`} d={`M${x} ${y - 10} C ${x + 6} ${y - 2}, ${x + 7} ${y + 4}, ${x} ${y + 6} C ${x - 7} ${y + 4}, ${x - 6} ${y - 2}, ${x} ${y - 10} Z`} fill={c.motif} opacity="0.55" />
        ))}
        {[
          [90, 120, 12, 7],
          [120, 178, 14, 7],
          [70, 176, 10, 6],
          [146, 158, 9, 5],
        ].map(([x, y, rx, ry]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill={c.motif2} opacity="0.8" />
        ))}
        <path d="M40 104 C 70 96, 90 110, 120 100 S 156 100, 164 96" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
      </g>
    );
  return (
    <g>
      {[
        [76, 70, 5],
        [128, 84, 4],
        [104, 50, 3],
        [62, 118, 3],
        [144, 140, 3.5],
        [92, 104, 2.5],
      ].map(([x, y, r]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y - r * 2} L${x + r * 0.6} ${y - r * 0.6} L${x + r * 2} ${y} L${x + r * 0.6} ${y + r * 0.6} L${x} ${y + r * 2} L${x - r * 0.6} ${y + r * 0.6} L${x - r * 2} ${y} L${x - r * 0.6} ${y - r * 0.6} Z`} fill={c.motif} />
      ))}
      {[
        [64, 186, -20],
        [136, 186, 20],
      ].map(([x, y, r]) => (
        <g key={`${x}`} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 0 C 0 -20, 6 -36, 14 -48" stroke={c.motif2} strokeWidth="2.4" fill="none" />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={4 + i * 2.2} cy={-8 - i * 9} rx="7" ry="2.6" fill={c.motif2} transform={`rotate(-30 ${4 + i * 2.2} ${-8 - i * 9})`} />
          ))}
        </g>
      ))}
      <circle cx="110" cy="150" r="3" fill={c.motif} className="lab-glow" />
      <circle cx="80" cy="160" r="2" fill={c.motif} className="lab-glow" />
    </g>
  );
}

export function EggArt({
  egg,
  state = "dormant",
  nest = true,
  halo = true,
  className,
  title,
}: {
  egg: EggId;
  state?: EggState;
  nest?: boolean;
  halo?: boolean;
  className?: string;
  title?: string;
}) {
  const g = useId().replace(/:/g, "");
  const c = COLORS[egg];
  const cracked = state === "ready" || state === "hatching" || state === "open";
  const split = state === "open";
  const shell = (
    <g clipPath={`url(#${g}-shell)`}>
      <path d={SHELL} fill={`url(#${g}-base)`} />
      <Motifs egg={egg} />
      <path d={SHELL} fill={`url(#${g}-shade)`} />
      <ellipse cx="74" cy="78" rx="16" ry="28" fill="#fff" opacity="0.45" transform="rotate(-18 74 78)" />
    </g>
  );
  return (
    <svg viewBox="0 0 200 240" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} data-egg-state={state}>
      <defs>
        <linearGradient id={`${g}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.25" stopColor={c.top} />
          <stop offset="1" stopColor={c.bottom} />
        </linearGradient>
        <radialGradient id={`${g}-shade`} cx="35%" cy="30%" r="80%">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#1d2a22" stopOpacity="0.28" />
        </radialGradient>
        <radialGradient id={`${g}-halo`}>
          <stop offset="0" stopColor={cracked ? "#f8d48a" : c.halo} stopOpacity={state === "dormant" ? 0.35 : 0.7} />
          <stop offset="1" stopColor={c.halo} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${g}-shell`}>
          <path d={SHELL} />
        </clipPath>
        <clipPath id={`${g}-top`}>
          <path d={TOP_CLIP} />
        </clipPath>
        <clipPath id={`${g}-bottom`}>
          <path d={BOTTOM_CLIP} />
        </clipPath>
        <filter id={`${g}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {halo && (
        <circle
          cx="100"
          cy="120"
          r="100"
          fill={`url(#${g}-halo)`}
          className={cn(state !== "dormant" && "lab-glow")}
          style={{ transition: "opacity .6s ease", opacity: split ? 0.5 : 1 }}
        />
      )}
      {nest && (
        <g>
          <ellipse cx="100" cy="222" rx="74" ry="9" fill="#1d2a22" opacity="0.15" />
          <ellipse cx="100" cy="204" rx="74" ry="20" fill="#7a5a3a" />
          <ellipse cx="100" cy="198" rx="66" ry="14" fill="#5d4129" />
          {[-60, -40, -18, 6, 28, 50].map((x, i) => (
            <path key={x} d={`M${100 + x} ${208 + (i % 2) * 4} q 14 -8 30 -2`} stroke="#a3784e" strokeWidth="3" strokeLinecap="round" fill="none" />
          ))}
          <ellipse cx="62" cy="196" rx="12" ry="5" fill="#7fa257" />
          <ellipse cx="140" cy="198" rx="10" ry="4" fill="#7fa257" />
        </g>
      )}
      <g className={cn(state === "reactive" && "lab-egg-breathe", state === "hatching" && "lab-egg-shake")} style={{ transformOrigin: "100px 196px" }}>
        {split ? (
          <>
            <g clipPath={`url(#${g}-bottom)`}>{shell}</g>
            <g clipPath={`url(#${g}-top)`} className="lab-egg-lid">
              {shell}
            </g>
          </>
        ) : (
          shell
        )}
        {cracked && !split && (
          <g>
            <path d={CRACK} stroke="#f8d48a" strokeWidth="7" fill="none" opacity="0.7" filter={`url(#${g}-soft)`} className="lab-glow" />
            <path d={CRACK} stroke="#fff3cf" strokeWidth="2.2" fill="none" strokeLinejoin="round" pathLength={1} className={cn(state === "hatching" ? "lab-crack-draw" : "")} />
          </g>
        )}
      </g>
      {state !== "dormant" &&
        [
          [40, 70, 2.5],
          [164, 90, 2],
          [150, 40, 1.8],
          [52, 150, 2],
          [172, 160, 1.6],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#f8d48a" className="lab-glow lab-float" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
    </svg>
  );
}
