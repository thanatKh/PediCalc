import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const VARIANTS = {
  default:     "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  outline:     "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
  secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost:       "hover:bg-accent hover:text-accent-foreground",
  link:        "text-primary underline-offset-4 hover:underline",
};

const SIZES = {
  default: "h-9 px-4 py-2",
  xs:      "h-6 gap-1 rounded-md px-2 text-xs",
  sm:      "h-8 gap-1.5 rounded-md px-3",
  lg:      "h-10 rounded-md px-6",
  icon:    "size-9",
};

const BASE = "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

function buttonVariants({ variant = "default", size = "default", className } = {}) {
  return cn(BASE, VARIANTS[variant] ?? VARIANTS.default, SIZES[size] ?? SIZES.default, className);
}

function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}

export { Button, buttonVariants }
