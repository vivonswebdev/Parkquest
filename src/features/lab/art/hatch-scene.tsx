import { useId } from "react";
import type { CreatureId, EggId } from "../creatures";
import { EggArt } from "./egg";
import { GuardianFigure } from "./guardians";
import { MossyFigure } from "./mossy";

/*
 * Scène d'éclosion : l'œuf et le compagnon partagent le même sol (même ombre portée).
 * L'œuf est découpé en quatre morceaux le long de fissures qui se dessinent une à une ;
 * une lumière chaude, placée derrière la coquille, apparaît dans les fissures puis dans les écarts.
 */

export const HATCH_PHASES = ["dormant", "reactive", "ready", "wobble", "crack1", "crack2", "crack3", "glow", "split", "appear", "blink", "lookL", "lookR", "joy", "done"] as const;
export type HatchPhase = (typeof HATCH_PHASES)[number];

/** Chronologie après « Ouvrir l'œuf » (ms) : courte et douce, environ 6,5 s */
export const HATCH_TIMELINE: [HatchPhase, number][] = [
  ["wobble", 0],
  ["crack1", 1500],
  ["crack2", 1900],
  ["crack3", 2300],
  ["glow", 2700],
  ["split", 3200],
  ["appear", 3500],
  ["blink", 4300],
  ["lookL", 4650],
  ["lookR", 5150],
  ["joy", 5650],
  ["done", 6500],
];

const at = (phase: HatchPhase, from: HatchPhase) => HATCH_PHASES.indexOf(phase) >= HATCH_PHASES.indexOf(from);

/* Fissures (coordonnées de l'œuf, 200 × 240) */
const CRACKS: { d: string; from: HatchPhase }[] = [
  { d: "M34 122 L50 112 L62 124 L78 106 L92 120 L106 102", from: "crack1" },
  { d: "M106 102 L120 118 L134 104 L148 118 L166 110", from: "crack2" },
  { d: "M106 102 L102 80 L110 62 L104 40 L106 22", from: "crack3" },
  { d: "M134 104 L150 136 L170 140", from: "crack3" },
];

const RIM = "L106 20 L104 40 L110 62 L102 80 L106 102";
/* Morceaux : calotte gauche, calotte droite, éclat latéral, coupe du bas */
const PIECES: { id: string; clip: string; to: string }[] = [
  { id: "tl", clip: `M0 0 H106 ${RIM} L92 120 L78 106 L62 124 L50 112 L34 122 L0 122 Z`, to: "translate(-34px, -46px) rotate(-26deg)" },
  { id: "tr", clip: `M106 0 H200 V110 L166 110 L148 118 L134 104 L120 118 L106 102 L102 80 L110 62 L104 40 L106 20 Z`, to: "translate(34px, -40px) rotate(24deg)" },
  { id: "chip", clip: "M134 104 L148 118 L166 110 L200 110 V140 L170 140 L150 136 Z", to: "translate(30px, 16px) rotate(40deg)" },
  { id: "cup", clip: "M0 240 H200 V140 L170 140 L150 136 L134 104 L120 118 L106 102 L92 120 L78 106 L62 124 L50 112 L34 122 L0 122 Z", to: "translateY(8px)" },
];

const LEAVES = [
  { x: 96, y: 150, dx: "-38px", rot: "-160deg", c: "#9fca6c", delay: 0 },
  { x: 128, y: 146, dx: "30px", rot: "140deg", c: "#c3df8a", delay: 0.15 },
  { x: 110, y: 140, dx: "-8px", rot: "200deg", c: "#f6c76a", delay: 0.3 },
  { x: 140, y: 156, dx: "46px", rot: "-120deg", c: "#86ad55", delay: 0.1 },
];

export function HatchScene({
  egg,
  creature,
  phase,
  reduced,
  hop = 0,
  squish = 0,
  className,
  title,
}: {
  egg: EggId;
  creature: CreatureId;
  phase: HatchPhase;
  reduced?: boolean;
  /** Rejoue la joie / le toucher une fois éclos */
  hop?: number;
  squish?: number;
  className?: string;
  title?: string;
}) {
  const g = useId().replace(/:/g, "");
  const split = at(phase, "split");
  const born = at(phase, "appear");
  const glow = at(phase, "glow") ? 1 : at(phase, "crack1") ? 0.55 : phase === "ready" ? 0.25 : 0;
  const swayClass = reduced
    ? undefined
    : phase === "dormant" || phase === "reactive" || phase === "ready"
      ? "hatch-sway"
      : phase === "wobble"
        ? "hatch-wobble"
        : !split
          ? "hatch-shake"
          : undefined;

  const mossyMood = phase === "joy" || phase === "done" ? "happy" : phase === "appear" ? "surprised" : "rest";
  const look = phase === "lookL" ? -1 : phase === "lookR" ? 1 : 0;

  return (
    <svg viewBox="0 0 240 290" className={className} role="img" aria-label={title}>
      <defs>
        <radialGradient id={`${g}-inner`}>
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="0.45" stopColor="#ffd98a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f6b54a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${g}-halo`}>
          <stop offset="0" stopColor="#fbe3a6" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fbe3a6" stopOpacity="0" />
        </radialGradient>
        <filter id={`${g}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <filter id={`${g}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        {PIECES.map((pc) => (
          <clipPath key={pc.id} id={`${g}-${pc.id}`}>
            <path d={pc.clip} />
          </clipPath>
        ))}
      </defs>

      {/* Halo d'ambiance, plus chaud à mesure que l'œuf s'éveille */}
      <circle cx="120" cy="150" r="118" fill={`url(#${g}-halo)`} style={{ opacity: 0.35 + glow * 0.5, transition: "opacity .8s ease" }} />

      {/* Sol commun : petite clairière + ombre portée qui passe de l'œuf au compagnon */}
      <ellipse cx="120" cy="226" rx="96" ry="16" fill="#e7dcbc" opacity="0.7" />
      <ellipse cx="120" cy="224" rx="74" ry="10" fill="#cfe0a8" opacity="0.7" />
      <ellipse
        cx="120"
        cy="221"
        rx={born ? 44 : 52}
        ry="7"
        fill="#2b2a1e"
        opacity="0.28"
        filter={`url(#${g}-shadow)`}
        style={{ transition: "rx .6s ease" }}
      />

      {/* Lumière intérieure : visible dans les fissures et les écarts */}
      <ellipse cx="120" cy="140" rx="64" ry="78" fill={`url(#${g}-inner)`} style={{ opacity: split ? 1 : glow * 0.85, transition: "opacity .6s ease" }} />

      {/* Œuf en morceaux : calottes et éclat derrière le compagnon… */}
      {!(reduced && born) && (
        <g transform="translate(20 20)" style={reduced && split ? { opacity: 0, transition: "opacity .6s ease" } : undefined}>
          <g className={swayClass} style={{ transformOrigin: "100px 198px" }}>
            {PIECES.filter((pc) => pc.id !== "cup").map((pc) => (
              <Piece key={pc.id} pc={pc} g={g} egg={egg} split={split} reduced={reduced} hidden={split} />
            ))}
          </g>
        </g>
      )}
      {/* Éclat de lumière à l'ouverture (unique, doux) */}
      {split && !reduced && <circle cx="120" cy="140" r="70" fill={`url(#${g}-inner)`} className="hatch-bloom" style={{ transformOrigin: "120px 140px" }} />}

      {/* Quelques feuilles qui s'envolent (4 seulement) */}
      {split &&
        !reduced &&
        LEAVES.map((l, i) => (
          <path
            key={i}
            d="M0 0 C 4 -5, 4 -12, 0 -16 C -4 -12, -4 -5, 0 0 Z"
            transform={`translate(${l.x} ${l.y})`}
            fill={l.c}
            className="hatch-leaf"
            style={{ ["--dx" as string]: l.dx, ["--rot" as string]: l.rot, animationDelay: `${l.delay}s` } as React.CSSProperties}
          />
        ))}

      {/* Compagnon, au même emplacement que l'œuf */}
      {born && (
        <g className={reduced ? "lab-fade-up" : "hatch-pop"} style={{ transformOrigin: "120px 220px" }}>
          {creature === "mossy" ? (
            <MossyFigure
              mood={mossyMood}
              look={look}
              eyesClosed={phase === "blink"}
              idle={phase === "done"}
              hop={(phase === "joy" ? 1 : 0) + hop}
              squish={squish}
              className="overflow-visible"
              frame={{ x: 20, y: 37, width: 200, height: 200 }}
            />
          ) : (
            <svg x="20" y="30" width="200" height="200" viewBox="0 0 200 200">
              <GuardianFigure id={creature} halo={false} socle={false} />
            </svg>
          )}
        </g>
      )}
      {/* …et coupe du bas devant lui : il sort de la coquille, puis elle s'efface */}
      {!(reduced && born) && (
        <g transform="translate(20 20)" style={reduced && split ? { opacity: 0, transition: "opacity .6s ease" } : undefined}>
          <g className={swayClass} style={{ transformOrigin: "100px 198px" }}>
            <Piece pc={PIECES[3]} g={g} egg={egg} split={split} reduced={reduced} hidden={at(phase, "blink")} />
            {!split &&
              CRACKS.filter((c) => at(phase, c.from)).map((c) => (
                <g key={c.d}>
                  <path d={c.d} stroke="#f8c860" strokeWidth="7" fill="none" strokeLinejoin="round" filter={`url(#${g}-soft)`} style={{ opacity: glow, transition: "opacity .6s" }} />
                  <path d={c.d} pathLength={1} className={reduced ? undefined : "hatch-crack"} stroke="#fff3cf" strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                </g>
              ))}
          </g>
        </g>
      )}
    </svg>
  );
}

function Piece({ pc, g, egg, split, reduced, hidden }: { pc: (typeof PIECES)[number]; g: string; egg: EggId; split: boolean; reduced?: boolean; hidden: boolean }) {
  return (
    <g className="hatch-piece" style={{ transformOrigin: "100px 120px", transform: split && !reduced ? pc.to : "none", opacity: hidden ? 0 : 1 }}>
      <g clipPath={`url(#${g}-${pc.id})`}>
        <EggArt egg={egg} state="dormant" nest={false} halo={false} frame={{ x: 0, y: 0, width: 200, height: 240 }} />
      </g>
    </g>
  );
}

export const isHatched = (phase: HatchPhase) => at(phase, "appear");
export const isOpening = (phase: HatchPhase) => at(phase, "wobble") && !at(phase, "done");
export { at as phaseAtLeast };
