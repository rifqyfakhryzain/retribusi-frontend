import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Reusable Button Component - Modern GovTech (Nuansa Hijau Instansi)
 * Menggunakan radius presisi 6px (rounded-md), tinggi konsisten, border tipis, dan tanpa shadow mencolok.
 */
export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  type = "button",
  icon: Icon,
  ...props
}) {
  const variants = {
    primary:
      "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 border border-emerald-800 shadow-2xs focus-visible:ring-emerald-600/30",
    gov:
      "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 border border-emerald-800 shadow-2xs focus-visible:ring-emerald-600/30",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 focus-visible:ring-slate-400/30",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-emerald-600/30 shadow-2xs",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-rose-700 shadow-2xs focus-visible:ring-rose-500/30",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-400/30",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs font-medium gap-1.5",
    md: "h-10 px-4 text-sm font-medium gap-2",
    lg: "h-11 px-5 text-sm font-semibold gap-2.5",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-sans transition-colors duration-150 select-none cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.99]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4 shrink-0 stroke-[1.75]" />}
          {children}
        </>
      )}
    </button>
  );
}
