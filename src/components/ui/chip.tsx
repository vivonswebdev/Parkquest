import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Pastille de filtre (design system) : état sélectionné annoncé via aria-pressed. */
export function Chip({ active, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors [&_svg]:size-4",
        active ? "bg-primary text-primary-foreground" : "glass-strong text-foreground hover:border-primary/40",
        className,
      )}
      {...props}
    />
  );
}
