import { useId } from "react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * Le « I » de TYLIA : une feuille coupée en deux (moitié foncée, moitié claire) prolongée par sa tige.
 * Couleurs via variables CSS (--brand-*) pour rester lisible en thème sombre comme en clair.
 */
function LeafI({ className, wordmark }: { className?: string; wordmark?: boolean }) {
  // id unique : plusieurs logos peuvent coexister sur la page.
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 200" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`var(--brand-leaf-light, ${brand.colors.leafLight})`} />
          <stop offset="1" stopColor={`var(--brand-leaf-mid, ${brand.colors.leafMid})`} />
        </linearGradient>
        <mask id={`${id}v`}>
          <rect width="100" height="200" fill="#fff" />
          <path d="M14 62C28 70 40 84 47 100" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
        </mask>
      </defs>
      <g transform={wordmark ? "translate(50 118) scale(1.1) translate(-50 -108)" : undefined}>
      <path d="M48.5 4C32 20 4 40 5 66c1 24 21 40 43.5 42z" fill={`var(--brand-leaf-dark, ${brand.colors.leafDark})`} mask={`url(#${id}v)`} />
      <path d="M51.5 4C68 20 96 40 95 66c-1 22-19 36-33 40-6 2-10 4-10.5 6z" fill={`url(#${id}l)`} />
      </g>
      {/* Dans le logotype, la tige a la hauteur des capitales et l'épaisseur des lettres. */}
      {wordmark ? (
        <rect x="43" y="116" width="15" height="84" rx="1.5" fill="var(--brand-ink, currentColor)" />
      ) : (
        <rect x="44.5" y="106" width="13" height="94" rx="1.5" fill="var(--brand-ink, currentColor)" />
      )}
    </svg>
  );
}

/** Symbole seul (icône d'application) : le « I » en feuille sur une tuile claire. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-[23%] shadow-sm", className)}
      style={{ background: brand.colors.iconBackground, ["--brand-ink" as string]: brand.colors.forest, ["--brand-leaf-dark" as string]: brand.colors.leafDark, ["--brand-leaf-light" as string]: brand.colors.leafLight, ["--brand-leaf-mid" as string]: brand.colors.leafMid }}
      aria-hidden
    >
      <LeafI className="h-[70%] w-auto" />
    </span>
  );
}

/** Logotype complet : T Y L [feuille] A. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-end font-display text-xl font-semibold leading-none tracking-[0.2em] text-[var(--brand-ink)]", className)}>
      <span className="sr-only">{brand.name}</span>
      <span aria-hidden className="inline-flex items-end">
        TYL
        <LeafI wordmark className="mb-[0.02em] mr-[0.2em] h-[1.75em] w-auto" />
        A
      </span>
    </span>
  );
}
