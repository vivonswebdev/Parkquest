import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[transform,background-color,box-shadow,opacity] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:size-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-[0_10px_30px_-12px_var(--ring)]",
        forest: "bg-forest text-white hover:bg-green",
        secondary: "glass text-foreground hover:bg-surface-elevated",
        outline: "border border-border bg-transparent text-foreground hover:bg-primary-soft",
        ghost: "bg-transparent text-foreground hover:bg-primary-soft",
        danger: "bg-danger/15 text-danger hover:bg-danger/25",
      },
      size: {
        sm: "h-10 rounded-[14px] px-4 text-sm",
        md: "h-12 rounded-[var(--radius-button)] px-5 text-[15px]",
        lg: "h-14 rounded-[18px] px-6 text-base",
        icon: "size-12 rounded-full",
        "icon-sm": "size-10 rounded-full [&_svg]:size-[18px]",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, block, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}

export { buttonVariants };
