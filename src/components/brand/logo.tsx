import { useId } from "react";
import { cn } from "@/lib/utils";

/** Marque ParkQuest : un repère de carte dont l'intérieur est une feuille (création originale). */
export function LogoMark({ className }: { className?: string }) {
  // id unique : un dégradé défini dans un SVG masqué (display:none) ne s'affiche pas ailleurs.
  const gid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 512 512" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8AF4C9" />
          <stop offset="1" stopColor="#19E6A2" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="#0D3428" />
      <path
        d="M256 92c-78 0-138 60-138 136 0 98 110 180 131 195a12 12 0 0 0 14 0c21-15 131-97 131-195 0-76-60-136-138-136z"
        fill={`url(#${gid})`}
      />
      <path
        d="M256 160c-40 22-62 58-62 92 0 26 14 44 36 52 10-38 26-70 52-96-20 34-32 66-36 104 36 2 72-22 72-64 0-34-22-66-62-88z"
        fill="#031711"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight">
        Park<span className="text-primary">Quest</span>
      </span>
    </span>
  );
}
