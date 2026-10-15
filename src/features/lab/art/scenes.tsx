import { useId } from "react";

/* Illustrations originales du laboratoire (SVG, sans asset externe). */

function Tree({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: number }) {
  const greens = ["#4f7d50", "#6f9a4f", "#3f6b46"];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="22" ry="5" fill="#1d2a22" opacity="0.12" />
      <rect x="-3.5" y="-26" width="7" height="28" rx="3" fill="#8a6446" />
      <circle cx="0" cy="-40" r="22" fill={greens[tone % 3]} />
      <circle cx="-12" cy="-32" r="14" fill={greens[(tone + 1) % 3]} />
      <circle cx="10" cy="-50" r="11" fill="#a9c77f" opacity="0.55" />
    </g>
  );
}

function Conifer({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="16" ry="4" fill="#1d2a22" opacity="0.12" />
      <rect x="-3" y="-14" width="6" height="16" fill="#9b5a3a" />
      <path d="M0 -70 L 18 -36 H 10 L 22 -12 H -22 L -10 -36 H -18 Z" fill="#3f6b46" />
      <path d="M0 -70 L 18 -36 H 10 L 14 -28 L 0 -30 Z" fill="#5f8f5a" opacity="0.7" />
    </g>
  );
}

/** Parc accueillant : sentier sinueux, arbres, banc, petits détails à découvrir, point de départ. */
export function ParkScene({ className, withStart = false, title }: { className?: string; withStart?: boolean; title?: string }) {
  const g = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 360 300" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${g}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f9e7c4" />
          <stop offset="1" stopColor="#fbf3e2" />
        </linearGradient>
        <linearGradient id={`${g}-hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9d38f" />
          <stop offset="1" stopColor="#8fb36a" />
        </linearGradient>
      </defs>
      <rect width="360" height="300" fill={`url(#${g}-sky)`} />
      <circle cx="276" cy="70" r="34" fill="#f4c56a" opacity="0.9" />
      <circle cx="276" cy="70" r="56" fill="#f4c56a" opacity="0.18" />
      <path d="M0 150 C 60 120, 120 130, 180 140 S 300 110, 360 130 V300 H0 Z" fill="#cfe0ab" />
      <path d="M0 180 C 80 150, 160 170, 230 160 S 330 150, 360 160 V300 H0 Z" fill={`url(#${g}-hill)`} />
      <Conifer x={40} y={160} s={0.9} />
      <Conifer x={330} y={150} s={0.8} />
      <Tree x={84} y={170} s={0.8} tone={1} />
      <Tree x={292} y={176} s={0.9} tone={2} />
      {/* étang */}
      <ellipse cx="262" cy="226" rx="56" ry="16" fill="#86c3d8" />
      <ellipse cx="262" cy="222" rx="40" ry="8" fill="#bfe4f2" opacity="0.7" />
      {/* sentier */}
      <path d="M150 300 C 150 260, 210 250, 196 220 C 186 196, 140 196, 160 176 C 172 164, 200 160, 210 150" stroke="#f3e2bd" strokeWidth="26" strokeLinecap="round" fill="none" />
      <path d="M150 300 C 150 260, 210 250, 196 220 C 186 196, 140 196, 160 176 C 172 164, 200 160, 210 150" stroke="#e5cf9f" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" fill="none" />
      <Tree x={110} y={236} s={1.15} tone={0} />
      <Tree x={60} y={262} s={1.3} tone={2} />
      <Tree x={318} y={274} s={1.2} tone={1} />
      {/* banc */}
      <g transform="translate(232 196)">
        <rect x="0" y="0" width="34" height="5" rx="2" fill="#a46d42" />
        <rect x="0" y="-8" width="34" height="4" rx="2" fill="#a46d42" />
        <rect x="3" y="5" width="3" height="8" fill="#7a5233" />
        <rect x="28" y="5" width="3" height="8" fill="#7a5233" />
      </g>
      {/* petits secrets : champignon, papillon, fleurs */}
      <g transform="translate(140 262)">
        <rect x="-3" y="-6" width="6" height="8" rx="2" fill="#f6eedb" />
        <path d="M-10 -5 Q 0 -18 10 -5 Z" fill="#cf6d4f" />
        <circle cx="-3" cy="-9" r="1.5" fill="#fff" />
      </g>
      <g transform="translate(206 120)" className="lab-float">
        <path d="M0 0 C -8 -10, -14 -2, -6 4 Z M0 0 C 8 -10, 14 -2, 6 4 Z" fill="#e9a23b" />
      </g>
      {[
        [30, 286, "#f2c46b"],
        [96, 290, "#f8f2e4"],
        [250, 288, "#e9a8b8"],
        [282, 252, "#f2c46b"],
      ].map(([x, y, f]) => (
        <g key={`${x}`}>
          <circle cx={x as number} cy={y as number} r="3.2" fill={f as string} />
          <circle cx={x as number} cy={y as number} r="1.2" fill="#e9a23b" />
        </g>
      ))}
      {/* petite famille suggérée */}
      <g transform="translate(176 232)">
        <ellipse cx="6" cy="22" rx="16" ry="3" fill="#1d2a22" opacity="0.15" />
        <rect x="-4" y="0" width="10" height="20" rx="5" fill="#1f5a3d" />
        <circle cx="1" cy="-6" r="6" fill="#d9a27f" />
        <rect x="10" y="8" width="8" height="13" rx="4" fill="#e9a23b" />
        <circle cx="14" cy="3" r="4.5" fill="#c98e6a" />
      </g>
      {withStart && (
        <g transform="translate(206 146)">
          <circle r="16" fill="#e9a23b" opacity="0.25" className="lab-ping" />
          <path d="M0 0 V -30" stroke="#1f5a3d" strokeWidth="3" strokeLinecap="round" />
          <path d="M0 -30 L 18 -24 L 0 -16 Z" fill="#e9a23b" />
          <circle r="4" fill="#1f5a3d" />
        </g>
      )}
    </svg>
  );
}

/** Petites vitrines de trouvailles (pomme de pin, plume, feuille) et une place pour un gardien. */
export function ShowcaseScene({ className }: { className?: string }) {
  const cases = [
    { x: 20, label: "pine" },
    { x: 130, label: "feather" },
    { x: 240, label: "leaf" },
  ];
  return (
    <svg viewBox="0 0 360 300" className={className} aria-hidden>
      <rect width="360" height="300" rx="28" fill="#f3ead2" />
      <rect x="10" y="236" width="340" height="16" rx="8" fill="#a46d42" />
      <rect x="10" y="132" width="340" height="12" rx="6" fill="#a46d42" opacity="0.85" />
      {cases.map(({ x, label }, i) => (
        <g key={label} transform={`translate(${x} 150)`}>
          <rect x="6" y="4" width="88" height="82" rx="18" fill="#fffaf0" opacity="0.9" />
          <rect x="6" y="4" width="88" height="82" rx="18" fill="none" stroke="#e5d8b8" strokeWidth="2" />
          <path d="M16 12 L 30 12 L 16 34 Z" fill="#fff" opacity="0.7" />
          <ellipse cx="50" cy="76" rx="26" ry="5" fill="#d4c29c" />
          {label === "pine" && (
            <g transform="translate(50 50)">
              {[0, 1, 2, 3].map((r) => (
                <ellipse key={r} cx="0" cy={-14 + r * 9} rx={8 + r * 2} ry="6" fill={r % 2 ? "#8a6446" : "#a3784e"} />
              ))}
            </g>
          )}
          {label === "feather" && (
            <g transform="translate(50 50) rotate(25)">
              <path d="M0 -26 C 12 -14, 12 10, 0 24 C -12 10, -12 -14, 0 -26 Z" fill="#7cc1da" />
              <path d="M0 -24 V 30" stroke="#2f7fa3" strokeWidth="2" />
            </g>
          )}
          {label === "leaf" && (
            <g transform="translate(50 52) rotate(-20)">
              <path d="M0 24 C 16 10, 16 -14, 0 -26 C -16 -14, -16 10, 0 24 Z" fill="#e9a23b" />
              <path d="M0 22 V -22" stroke="#b86f12" strokeWidth="2" />
            </g>
          )}
          <rect x="22" y="92" width="56" height="12" rx="6" fill={["#8fb36a", "#6fb3cf", "#e9a23b"][i]} opacity="0.85" />
        </g>
      ))}
      {/* Étagère du haut : places de gardiens (silhouettes) */}
      {[60, 180, 300].map((x, i) => (
        <g key={x} transform={`translate(${x} 128)`}>
          <ellipse cx="0" cy="0" rx="34" ry="7" fill="#7a5233" opacity="0.5" />
          {/* Places vides (la place du milieu reçoit l'image du compagnon, posée par-dessus) */}
          {i !== 1 && <ellipse cx="0" cy="-30" rx="24" ry="22" fill="#1d2a22" opacity="0.14" />}
        </g>
      ))}
      <text x="180" y="40" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f5a3d">
        Ma collection
      </text>
      <text x="180" y="62" textAnchor="middle" fontSize="12" fill="#55625a">
        1 gardien · 3 trouvailles
      </text>
    </svg>
  );
}

/** Gros plan d'écorce pour la première découverte ; `revealed` éclaire le détail caché. */
export function BarkClue({ revealed, className }: { revealed: boolean; className?: string }) {
  const g = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${g}-bark`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a3f26" />
          <stop offset="0.5" stopColor="#a8613d" />
          <stop offset="1" stopColor="#7a3f26" />
        </linearGradient>
        <radialGradient id={`${g}-spot`} cx="58%" cy="46%" r="40%">
          <stop offset="0" stopColor="#fff3cf" stopOpacity={revealed ? 0.55 : 0} />
          <stop offset="1" stopColor="#fff3cf" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" rx="26" fill={`url(#${g}-bark)`} />
      {Array.from({ length: 11 }, (_, i) => (
        <path
          key={i}
          d={`M${14 + i * 28} 0 C ${6 + i * 28} 60, ${24 + i * 28} 120, ${12 + i * 28} 240`}
          stroke="#5e2e1a"
          strokeWidth={4 + (i % 3)}
          fill="none"
          opacity="0.55"
        />
      ))}
      <rect width="320" height="240" rx="26" fill={`url(#${g}-spot)`} style={{ transition: "opacity .6s" }} />
      <g style={{ opacity: revealed ? 1 : 0.18, transition: "opacity .7s ease" }}>
        <path d="M168 90 C 188 100, 196 126, 184 146" stroke="#f8d48a" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="186" cy="110" r="22" fill="none" stroke="#fff3cf" strokeWidth="2.5" strokeDasharray="4 6" />
        {/* petite plume d'oiseau coincée dans l'écorce */}
        <g transform="translate(186 112) rotate(30)">
          <path d="M0 -16 C 8 -8, 8 6, 0 16 C -8 6, -8 -8, 0 -16 Z" fill="#f3ead2" />
          <path d="M0 -14 V 18" stroke="#b86f12" strokeWidth="1.4" />
        </g>
      </g>
    </svg>
  );
}
