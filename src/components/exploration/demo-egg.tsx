import { useId } from "react";
import { cn } from "@/lib/utils";

/** Œuf spécial de démonstration (illustration originale, vectorielle). */
export function DemoEgg({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 150" className={cn("h-28 w-auto", className)} aria-hidden>
      <defs>
        <radialGradient id={`${id}s`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#FBF6E9" />
          <stop offset="0.55" stopColor="#E7DDBF" />
          <stop offset="1" stopColor="#B9A77A" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="138" rx="34" ry="7" fill="#000" opacity="0.18" />
      <path d="M60 14C34 14 16 58 16 88c0 28 20 46 44 46s44-18 44-46C104 58 86 14 60 14z" fill={`url(#${id}s)`} />
      {/* motif d'écorce de séquoia : stries verticales douces */}
      <g fill="none" stroke="#9C6B45" strokeOpacity="0.45" strokeWidth="2.4" strokeLinecap="round">
        <path d="M40 60c-4 16-4 34 0 52" />
        <path d="M60 48c-2 22-2 46 0 76" />
        <path d="M80 60c4 16 4 34 0 52" />
      </g>
      {/* pousse */}
      <path d="M60 16c0-6 0-10 1-13" stroke="#3E7D55" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M61 6c6-6 15-6 19-2-6 5-13 6-19 2z" fill="#5FA877" />
      <path d="M60 8c-5-6-13-7-17-4 5 5 12 7 17 4z" fill="#3E7D55" />
      <ellipse cx="45" cy="50" rx="8" ry="13" fill="#fff" opacity="0.35" transform="rotate(20 45 50)" />
    </svg>
  );
}
