import { cn } from "../../utils/cn";

/**
 * Reusable Badge Component (Pill Status Terpusat)
 * Sesuai PRD Bagian 3A & 5:
 * Varian: success, warning, danger, neutral, brand, info
 */
export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className,
  ...props
}) {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    brand: "bg-emerald-950 text-emerald-100 border-emerald-800",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  };

  const dotColors = {
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    danger: "bg-rose-600",
    neutral: "bg-slate-400",
    brand: "bg-emerald-400",
    info: "bg-sky-600",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border tabular-nums select-none",
        variants[variant] || variants.neutral,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotColors[variant] || "bg-current"
          )}
        />
      )}
      {children}
    </span>
  );
}
