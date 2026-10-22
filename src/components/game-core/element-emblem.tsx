import type { Element } from "@/lib/game-core/elements";
import { cn } from "@/lib/utils";

/**
 * ILLUSTRATION PROVISOIRE — emblèmes vectoriels originaux des 7 éléments, en attendant l'art final
 * (illustrateur ou artiste 3D avec cession écrite de droits). Aucune image générée n'est utilisée.
 */
export const ELEMENT_COLOR: Record<Element, string> = {
  leaf: "#5fa877",
  water: "#4aa3c7",
  flower: "#e27fa8",
  air: "#9fb8d9",
  forest: "#a0703f",
  moon: "#7d74c9",
  sun: "#e8b33c",
};

const PATHS: Record<Element, React.ReactNode> = {
  // Feuille : limbe et nervure
  leaf: (
    <>
      <path d="M24 6C12 12 8 22 10 34c12 2 22-4 26-16C36 12 30 7 24 6z" fill="currentColor" />
      <path d="M12 34C18 26 24 20 32 14" fill="none" stroke="var(--emblem-bg)" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  // Eau : goutte et reflet
  water: (
    <>
      <path d="M24 6c-6 9-12 16-12 23a12 12 0 0 0 24 0c0-7-6-14-12-23z" fill="currentColor" />
      <path d="M18 30a6 6 0 0 0 5 6" fill="none" stroke="var(--emblem-bg)" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  // Fleur : cinq pétales et cœur
  flower: (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="24" cy="14" rx="6" ry="8" fill="currentColor" transform={`rotate(${a} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="5" fill="var(--emblem-bg)" />
    </>
  ),
  // Air : trois souffles
  air: (
    <g fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
      <path d="M8 17h20a5 5 0 1 0-5-5" />
      <path d="M8 25h28a5 5 0 1 1-5 5" />
      <path d="M8 33h14" />
    </g>
  ),
  // Forêt : champignon (chapeau et pied)
  forest: (
    <>
      <path d="M8 24c0-9 7-15 16-15s16 6 16 15z" fill="currentColor" />
      <path d="M19 24h10l-1.5 14h-7z" fill="currentColor" opacity="0.75" />
      <circle cx="18" cy="17" r="2" fill="var(--emblem-bg)" />
      <circle cx="28" cy="15" r="1.6" fill="var(--emblem-bg)" />
    </>
  ),
  // Lunaire : croissant et étoile
  moon: (
    <>
      <path d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z" fill="currentColor" />
      <path d="M36 10l1.2 2.8 2.8 1.2-2.8 1.2L36 18l-1.2-2.8L32 14l2.8-1.2z" fill="currentColor" />
    </>
  ),
  // Solaire : disque et rayons
  sun: (
    <>
      <circle cx="24" cy="24" r="8" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M24 7v5" transform={`rotate(${a} 24 24)`} />
        ))}
      </g>
    </>
  ),
};

/** Emblème d'élément ; `found = false` → silhouette sobre (créature pas encore découverte). */
export function ElementEmblem({ element, found = true, className }: { element: Element; found?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={cn("size-8", className)}
      style={{ color: found ? ELEMENT_COLOR[element] : "var(--muted-foreground)", opacity: found ? 1 : 0.45, ["--emblem-bg" as string]: "var(--surface)" }}
    >
      {PATHS[element]}
    </svg>
  );
}
