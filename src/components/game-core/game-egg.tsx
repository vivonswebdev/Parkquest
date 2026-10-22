import type { Element } from "@/lib/game-core/elements";
import { cn } from "@/lib/utils";
import { ELEMENT_COLOR, ElementEmblem } from "./element-emblem";

/** Œuf TYLIA (ILLUSTRATION PROVISOIRE, vectorielle et originale), teinté par son élément. */
export function GameEgg({ theme, className }: { theme: Element; className?: string }) {
  const c = ELEMENT_COLOR[theme];
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)} aria-hidden>
      <svg viewBox="0 0 100 124" className="h-full w-auto">
        <defs>
          <radialGradient id={`egg-${theme}`} cx="0.36" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#fbf8ef" />
            <stop offset="0.6" stopColor={c} stopOpacity="0.55" />
            <stop offset="1" stopColor={c} />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="118" rx="28" ry="5" fill="#000" opacity="0.15" />
        <path d="M50 4C28 4 12 44 12 72c0 26 17 42 38 42s38-16 38-42C88 44 72 4 50 4z" fill={`url(#egg-${theme})`} />
        <ellipse cx="37" cy="38" rx="7" ry="12" fill="#fff" opacity="0.35" transform="rotate(20 37 38)" />
      </svg>
      <span className="absolute inset-x-0 bottom-[22%] flex justify-center">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#fbf8ef]/85 shadow-sm">
          <ElementEmblem element={theme} className="size-6" />
        </span>
      </span>
    </span>
  );
}
