import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Reusable Button Component
 * @param {string} variant 
 * @param {string} size 
 * @param {boolean} isLoading 
 * @param {React.ReactNode} icon 
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
      "bg-pasar-600 hover:bg-pasar-700 active:bg-pasar-800 text-white shadow-sm focus:ring-pasar-500",
    secondary:
      "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 focus:ring-gray-400",
    danger:
      "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm focus:ring-red-500",
    outline:
      "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-pasar-500",
    ghost:
      "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-medium gap-1.5",
    md: "px-4 py-2.5 text-sm font-semibold gap-2",
    lg: "px-6 py-3.5 text-base font-semibold gap-2.5",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-150 select-none",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
}
