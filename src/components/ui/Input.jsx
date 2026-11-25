import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Reusable Input Component
 * Presisi 6px (rounded-md), border tipis slate-300, focus emerald-700 dengan ring halus.
 */
export default function Input({
  label,
  id,
  name,
  type = "text",
  error,
  helperText,
  icon: Icon,
  className,
  required,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
  const inputId = id || name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-2xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4 stroke-[1.75]" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={inputType}
          required={required}
          className={cn(
            "block w-full rounded-md border text-sm text-slate-900 bg-white placeholder-slate-400 transition-colors duration-150 h-10 py-2",
            "focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15",
            Icon ? "pl-9" : "pl-3",
            isPassword ? "pr-9" : "pr-3",
            error
              ? "border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-200"
              : "border-slate-300",
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 stroke-[1.75]" />
            ) : (
              <Eye className="h-4 w-4 stroke-[1.75]" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
