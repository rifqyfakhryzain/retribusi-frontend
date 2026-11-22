import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Reusable Button Component - Institutional & Utilitarian with Green Accent
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
      "bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white shadow-xs focus:ring-emerald-700 border border-emerald-900",
    gov:
      "bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white shadow-xs focus:ring-emerald-700 border border-emerald-900",
    secondary:
      "bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 border border-emerald-200 focus:ring-emerald-300",
    danger:
      "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs focus:ring-red-500 border border-red-700",
    outline:
      "border border-slate-300 bg-white hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 focus:ring-emerald-400",
    ghost:
      "bg-transparent hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 focus:ring-emerald-300",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs font-medium gap-1.5",
    md: "px-3.5 py-2 text-xs font-semibold gap-2",
    lg: "px-5 py-2.5 text-sm font-semibold gap-2.5",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-all duration-100 select-none cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.99]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
}
