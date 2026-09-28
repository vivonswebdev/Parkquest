import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tuile de statistique : grand chiffre lisible + libellé (design system). */
export function StatTile({ icon: Icon, value, label, className }: { icon?: LucideIcon; value: React.ReactNode; label: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-inset p-3", className)}>
      {Icon && <Icon className="size-4 text-primary" aria-hidden />}
      <p className="mt-1 font-display text-2xl font-extrabold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
