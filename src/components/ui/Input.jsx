import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Reusable Input Component
 * Mendukung Label, Helper Text, Error Feedback, Ikon Sisi Kiri, dan Toggle Show/Hide Password.
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
          className="block text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={inputType}
          required={required}
          className={cn(
            "block w-full rounded-lg border text-sm transition-colors duration-150 py-2.5",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            Icon ? "pl-10" : "pl-3.5",
            isPassword ? "pr-10" : "pr-3.5",
            error
              ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 text-gray-900 placeholder-gray-400 focus:border-pasar-600 focus:ring-pasar-100",
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
