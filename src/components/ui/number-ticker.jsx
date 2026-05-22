import { cn } from "@/lib/utils"

export function NumberTicker({
  value,
  decimalPlaces = 0,
  className,
  ...props
}) {
  const formatted = Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(Number(value).toFixed(decimalPlaces)))

  return (
    <span
      className={cn(
        "inline-block tracking-wider tabular-nums",
        className
      )}
      {...props}
    >
      {formatted}
    </span>
  )
}
