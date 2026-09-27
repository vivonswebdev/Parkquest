import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const pillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium leading-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        mint: "bg-primary-soft text-primary",
        glass: "glass text-foreground",
        gold: "bg-gold/15 text-gold",
        muted: "bg-muted text-muted-foreground",
        demo: "border border-gold/40 bg-gold/10 text-gold",
        dark: "bg-black/55 text-white backdrop-blur-md",
      },
      size: {
        sm: "px-2.5 py-1 text-[11px]",
        md: "px-3 py-1.5 text-xs",
      },
    },
    defaultVariants: { tone: "mint", size: "md" },
  },
);

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pillVariants> {}

export function Pill({ className, tone, size, ...props }: PillProps) {
  return <span className={cn(pillVariants({ tone, size }), className)} {...props} />;
}
