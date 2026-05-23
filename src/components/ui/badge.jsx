import * as React from "react"
import { cn } from "@/lib/utils"

const BASE = "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3";
const VARIANTS = {
  default:     "bg-primary text-primary-foreground",
  secondary:   "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-white",
  outline:     "border-border text-foreground",
  ghost:       "text-foreground",
  link:        "text-primary underline-offset-4",
};

function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(BASE, VARIANTS[variant] ?? VARIANTS.default, className)}
      {...props}
    />
  );
}

export { Badge }
